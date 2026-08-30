use std::time::{Duration, SystemTime, UNIX_EPOCH};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx_core::{row::Row, transaction::Transaction};
use sqlx_sqlite::{Sqlite, SqlitePool, SqlitePoolOptions};
use uuid::Uuid;

use crate::auth::Identity;

mod sqlx {
    pub use sqlx_core::query::query;
    pub use sqlx_core::raw_sql::raw_sql;
    pub use sqlx_core::Error;
}

const SQLITE_SCHEMA: &str = include_str!("../migrations/sqlite/0001_accounts_sync.sql");
#[derive(Clone)]
pub struct Database {
    pool: SqlitePool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct RateLimitDecision {
    pub allowed: bool,
    pub remaining: i64,
    pub retry_after_seconds: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum DbError {
    #[error("The shared workspace is temporarily unavailable.")]
    Sql(#[from] sqlx::Error),
    #[error("This account already belongs to a firm.")]
    AlreadyOnboarded,
    #[error("Finish firm setup before using team sync.")]
    NotOnboarded,
    #[error("This record belongs to another firm or no longer exists.")]
    NotFound,
    #[error("This workspace changed on another device. Reload it before saving again.")]
    VersionConflict,
    #[error("Subscribe before sending more changes. Existing records and export stay available.")]
    EntitlementRequired,
    #[error("Only an owner can make this change.")]
    OwnerRequired,
    #[error("This team role can view records but cannot change them.")]
    ReadOnlyRole,
    #[error("That invitation is already on this team.")]
    DuplicateMember,
    #[error("The workspace payload is not valid.")]
    InvalidWorkspace,
}

#[derive(Clone, Debug, Serialize)]
pub struct BillingStatus {
    pub state: String,
    pub plan: String,
    pub seat_quantity: i64,
    pub period_end: Option<String>,
    pub cloud_writes_allowed: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct Member {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub role: String,
    pub status: String,
    pub consumes_seat: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct Bootstrap {
    pub onboarding_required: bool,
    pub user_name: String,
    pub organization_id: Option<String>,
    pub organization_name: Option<String>,
    pub role: Option<String>,
    pub locale: Option<String>,
    pub time_zone: Option<String>,
    pub workspace: Option<Value>,
    pub version: Option<i64>,
    pub billing: Option<BillingStatus>,
    pub members: Vec<Member>,
    pub deletion: Option<DeletionStatus>,
}

#[derive(Clone, Debug, Serialize)]
pub struct DeletionStatus {
    pub scheduled: bool,
    pub requested_at: Option<String>,
    pub delete_after: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct OnboardingInput {
    pub organization_name: String,
    pub locale: String,
    pub time_zone: String,
    pub migrate_local_workspace: bool,
    pub local_item_count: usize,
    pub workspace: Option<Value>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct SyncInput {
    pub idempotency_key: String,
    pub expected_version: i64,
    pub workspace: Value,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub version: i64,
    pub workspace: Value,
    pub replayed: bool,
}

#[derive(Clone, Debug, Deserialize)]
pub struct InviteInput {
    pub email: String,
    pub role: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct DeletionInput {
    pub organization_name: String,
}

#[derive(Clone, Debug)]
struct Membership {
    user_id: String,
    organization_id: String,
    role: String,
}

impl Database {
    pub async fn connect(sqlite_url: &str) -> Result<Self, DbError> {
        let max_connections = if sqlite_url.contains(":memory:") {
            1
        } else {
            8
        };
        let pool = SqlitePoolOptions::new()
            .max_connections(max_connections)
            .acquire_timeout(Duration::from_secs(8))
            .connect(sqlite_url)
            .await?;
        sqlx::raw_sql("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 8000;")
            .execute(&pool)
            .await?;
        sqlx::raw_sql(SQLITE_SCHEMA).execute(&pool).await?;
        for statement in [
            "ALTER TABLE fpp_organizations ADD COLUMN deletion_requested_at TEXT",
            "ALTER TABLE fpp_organizations ADD COLUMN deletion_scheduled_for TEXT",
        ] {
            let _ = sqlx::query(statement).execute(&pool).await;
        }
        Ok(Self { pool })
    }

    /// Takes one request from this product's persisted fixed window.
    pub async fn take_shared_rate_limit(
        &self,
        bucket_key: &str,
        limit: i64,
        window: Duration,
    ) -> Result<RateLimitDecision, DbError> {
        let now_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
            .min(i64::MAX as u128) as i64;
        let window_ms = window.as_millis().max(1).min(i64::MAX as u128) as i64;
        let reset_before_ms = now_ms.saturating_sub(window_ms);
        let sql = "INSERT INTO fpp_rate_limits(bucket_key,window_started_at_ms,request_count) VALUES(?,?,1) \
             ON CONFLICT(bucket_key) DO UPDATE SET \
             window_started_at_ms=CASE WHEN fpp_rate_limits.window_started_at_ms<=? THEN excluded.window_started_at_ms ELSE fpp_rate_limits.window_started_at_ms END, \
             request_count=CASE WHEN fpp_rate_limits.window_started_at_ms<=? THEN 1 ELSE fpp_rate_limits.request_count+1 END \
             RETURNING window_started_at_ms,request_count";
        let row = sqlx::query(sql)
            .bind(bucket_key)
            .bind(now_ms)
            .bind(reset_before_ms)
            .bind(reset_before_ms)
            .fetch_one(&self.pool)
            .await?;
        let window_started_at_ms: i64 = row.get("window_started_at_ms");
        let request_count: i64 = row.get("request_count");
        let elapsed_ms = now_ms.saturating_sub(window_started_at_ms);
        let remaining_ms = window_ms.saturating_sub(elapsed_ms);
        let retry_after_seconds = ((remaining_ms.saturating_add(999)) / 1_000).max(1) as u64;

        Ok(RateLimitDecision {
            allowed: request_count <= limit,
            remaining: (limit - request_count).max(0),
            retry_after_seconds,
        })
    }

    fn sql<'a>(&self, source: &'a str) -> &'a str {
        source
    }

    async fn membership<'a>(
        &self,
        tx: &mut Transaction<'a, Sqlite>,
        identity: &Identity,
    ) -> Result<Option<Membership>, DbError> {
        let query = self.sql("SELECT u.id AS user_id, m.organization_id, m.role FROM fpp_users u JOIN fpp_memberships m ON m.user_id=u.id WHERE u.external_oid=? AND m.status='active' LIMIT 1");
        let row = sqlx::query(query)
            .bind(&identity.oid)
            .fetch_optional(&mut **tx)
            .await?;
        Ok(row.map(|row| Membership {
            user_id: row.get("user_id"),
            organization_id: row.get("organization_id"),
            role: row.get("role"),
        }))
    }

    async fn resolve_membership<'a>(
        &self,
        tx: &mut Transaction<'a, Sqlite>,
        identity: &Identity,
    ) -> Result<Option<Membership>, DbError> {
        if let Some(membership) = self.membership(tx, identity).await? {
            return Ok(Some(membership));
        }
        let Some(email) = identity
            .email
            .as_deref()
            .map(str::trim)
            .filter(|email| !email.is_empty())
        else {
            return Ok(None);
        };
        let pending_oid = format!("pending:{}", email.to_lowercase());
        let row = sqlx::query(self.sql("SELECT u.id AS user_id,m.id AS membership_id,m.organization_id,m.role FROM fpp_users u JOIN fpp_memberships m ON m.user_id=u.id WHERE u.external_oid=? AND lower(u.email)=? AND m.status='invited' LIMIT 1"))
            .bind(&pending_oid)
            .bind(email.to_lowercase())
            .fetch_optional(&mut **tx)
            .await?;
        let Some(row) = row else {
            return Ok(None);
        };
        let membership = Membership {
            user_id: row.get("user_id"),
            organization_id: row.get("organization_id"),
            role: row.get("role"),
        };
        let membership_id: String = row.get("membership_id");
        let now = Utc::now().to_rfc3339();
        let user_update = self.sql(
            "UPDATE fpp_users SET external_oid=?,display_name=?,email=?,updated_at=? WHERE id=? AND external_oid=?",
        );
        sqlx::query(user_update)
            .bind(&identity.oid)
            .bind(&identity.name)
            .bind(&identity.email)
            .bind(&now)
            .bind(&membership.user_id)
            .bind(&pending_oid)
            .execute(&mut **tx)
            .await?;
        let membership_update =
            self.sql("UPDATE fpp_memberships SET status='active',updated_at=? WHERE id=?");
        sqlx::query(membership_update)
            .bind(&now)
            .bind(&membership_id)
            .execute(&mut **tx)
            .await?;
        if membership.role == "technician" {
            let seat_sql = self.sql(
                "INSERT INTO fpp_technician_seats(id,organization_id,membership_id,active_from,created_at) VALUES(?,?,?,?,?)",
            );
            sqlx::query(seat_sql)
                .bind(Uuid::new_v4().to_string())
                .bind(&membership.organization_id)
                .bind(&membership_id)
                .bind(&now)
                .bind(&now)
                .execute(&mut **tx)
                .await?;
            sqlx::query(self.sql("UPDATE fpp_billing_accounts SET seat_quantity=seat_quantity+1 WHERE organization_id=?"))
                .bind(&membership.organization_id)
                .execute(&mut **tx)
                .await?;
        }
        let audit_sql = self.sql(
            "INSERT INTO fpp_audit_events(id,organization_id,actor_user_id,action,object_type,object_id,summary,created_at) VALUES(?,?,?,'membership.accepted','membership',?,?,?)",
        );
        sqlx::query(audit_sql)
            .bind(Uuid::new_v4().to_string())
            .bind(&membership.organization_id)
            .bind(&membership.user_id)
            .bind(&membership_id)
            .bind(json!({"role":membership.role.clone()}).to_string())
            .bind(&now)
            .execute(&mut **tx)
            .await?;
        Ok(Some(membership))
    }

    async fn upsert_user<'a>(
        &self,
        tx: &mut Transaction<'a, Sqlite>,
        identity: &Identity,
    ) -> Result<String, DbError> {
        let now = Utc::now().to_rfc3339();
        let existing = sqlx::query(self.sql("SELECT id FROM fpp_users WHERE external_oid=?"))
            .bind(&identity.oid)
            .fetch_optional(&mut **tx)
            .await?;
        if let Some(row) = existing {
            let id: String = row.get("id");
            let update_user_sql =
                self.sql("UPDATE fpp_users SET display_name=?, email=?, updated_at=? WHERE id=?");
            sqlx::query(update_user_sql)
                .bind(&identity.name)
                .bind(&identity.email)
                .bind(&now)
                .bind(&id)
                .execute(&mut **tx)
                .await?;
            return Ok(id);
        }
        let id = Uuid::new_v4().to_string();
        let insert_user_sql = self.sql(
            "INSERT INTO fpp_users(id,external_oid,display_name,email,created_at,updated_at) VALUES(?,?,?,?,?,?)",
        );
        sqlx::query(insert_user_sql)
            .bind(&id)
            .bind(&identity.oid)
            .bind(&identity.name)
            .bind(&identity.email)
            .bind(&now)
            .bind(&now)
            .execute(&mut **tx)
            .await?;
        Ok(id)
    }

    pub async fn bootstrap(&self, identity: &Identity) -> Result<Bootstrap, DbError> {
        let mut tx = self.pool.begin().await?;
        let Some(membership) = self.resolve_membership(&mut tx, identity).await? else {
            tx.commit().await?;
            return Ok(Bootstrap {
                onboarding_required: true,
                user_name: identity.name.clone(),
                organization_id: None,
                organization_name: None,
                role: None,
                locale: None,
                time_zone: None,
                workspace: None,
                version: None,
                billing: None,
                members: vec![],
                deletion: None,
            });
        };
        let query = self.sql(
            "SELECT o.name,o.locale,o.time_zone,o.deletion_requested_at,o.deletion_scheduled_for,w.version,w.workspace FROM fpp_organizations o JOIN fpp_workspaces w ON w.organization_id=o.id WHERE o.id=?",
        );
        let row = sqlx::query(query)
            .bind(&membership.organization_id)
            .fetch_one(&mut *tx)
            .await?;
        let workspace_text: String = row.get("workspace");
        let billing = self
            .billing_for(&mut tx, &membership.organization_id)
            .await?;
        let members = self
            .members_for(&mut tx, &membership.organization_id)
            .await?;
        let deletion_requested_at: Option<String> = row.try_get("deletion_requested_at")?;
        let deletion_scheduled_for: Option<String> = row.try_get("deletion_scheduled_for")?;
        tx.commit().await?;
        Ok(Bootstrap {
            onboarding_required: false,
            user_name: identity.name.clone(),
            organization_id: Some(membership.organization_id.clone()),
            organization_name: Some(row.get("name")),
            role: Some(membership.role),
            locale: Some(row.get("locale")),
            time_zone: Some(row.get("time_zone")),
            workspace: serde_json::from_str(&workspace_text).ok(),
            version: Some(row.get("version")),
            billing: Some(billing),
            members,
            deletion: Some(DeletionStatus {
                scheduled: deletion_scheduled_for.is_some(),
                requested_at: deletion_requested_at,
                delete_after: deletion_scheduled_for,
            }),
        })
    }

    pub async fn onboard(
        &self,
        identity: &Identity,
        input: &OnboardingInput,
    ) -> Result<Bootstrap, DbError> {
        if input.organization_name.trim().len() < 2
            || input.organization_name.trim().len() > 120
            || input.locale.trim().is_empty()
            || input.time_zone.trim().is_empty()
            || input.local_item_count > 10_000
        {
            return Err(DbError::InvalidWorkspace);
        }
        let workspace = if input.migrate_local_workspace {
            input.workspace.clone().ok_or(DbError::InvalidWorkspace)?
        } else {
            if input.local_item_count != 0 {
                return Err(DbError::InvalidWorkspace);
            }
            empty_workspace()
        };
        validate_workspace(&workspace)?;
        if input.migrate_local_workspace {
            let item_count = ["jobs", "requirements", "sources", "allocations"]
                .into_iter()
                .map(|key| workspace[key].as_array().map_or(0, Vec::len))
                .sum::<usize>();
            let contains_demo = workspace["jobs"]
                .as_array()
                .is_some_and(|jobs| jobs.iter().any(|job| job["id"] == "job-rd-1042"));
            if item_count != input.local_item_count || contains_demo {
                return Err(DbError::InvalidWorkspace);
            }
        }
        let workspace_text =
            serde_json::to_string(&workspace).map_err(|_| DbError::InvalidWorkspace)?;
        if workspace_text.len() > 256 * 1024 {
            return Err(DbError::InvalidWorkspace);
        }
        let org_id = Uuid::new_v4().to_string();
        let mut tx = self.pool.begin().await?;
        if self.resolve_membership(&mut tx, identity).await?.is_some() {
            return Err(DbError::AlreadyOnboarded);
        }
        let user_id = self.upsert_user(&mut tx, identity).await?;
        let membership_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let organization_sql = self.sql(
            "INSERT INTO fpp_organizations(id,name,locale,time_zone,buffer_days,evidence_stale_hours,created_at,updated_at) VALUES(?,?,?,?,1,72,?,?)",
        );
        sqlx::query(organization_sql)
            .bind(&org_id)
            .bind(input.organization_name.trim())
            .bind(input.locale.trim())
            .bind(input.time_zone.trim())
            .bind(&now)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        let membership_sql = self.sql(
            "INSERT INTO fpp_memberships(id,organization_id,user_id,role,status,created_at,updated_at) VALUES(?,?,?,'owner','active',?,?)",
        );
        sqlx::query(membership_sql)
            .bind(&membership_id)
            .bind(&org_id)
            .bind(&user_id)
            .bind(&now)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        let workspace_sql = self.sql(
            "INSERT INTO fpp_workspaces(organization_id,version,workspace,updated_by,updated_at) VALUES(?,0,?,?,?)",
        );
        sqlx::query(workspace_sql)
            .bind(&org_id)
            .bind(&workspace_text)
            .bind(&user_id)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        let billing_sql = self.sql(
            "INSERT INTO fpp_billing_accounts(organization_id,plan,seat_quantity,state,updated_at) VALUES(?,'workshop',0,'pending',?)",
        );
        sqlx::query(billing_sql)
            .bind(&org_id)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        let summary = json!({"migrated": input.migrate_local_workspace, "item_count": input.local_item_count}).to_string();
        let audit_sql = self.sql(
            "INSERT INTO fpp_audit_events(id,organization_id,actor_user_id,action,object_type,object_id,summary,created_at) VALUES(?,?,?,'organization.created','organization',?,?,?)",
        );
        sqlx::query(audit_sql)
            .bind(Uuid::new_v4().to_string())
            .bind(&org_id)
            .bind(&user_id)
            .bind(&org_id)
            .bind(summary)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        self.bootstrap(identity).await
    }

    pub async fn sync(
        &self,
        identity: &Identity,
        input: &SyncInput,
    ) -> Result<SyncResult, DbError> {
        Uuid::parse_str(&input.idempotency_key).map_err(|_| DbError::InvalidWorkspace)?;
        validate_workspace(&input.workspace)?;
        let workspace_text =
            serde_json::to_string(&input.workspace).map_err(|_| DbError::InvalidWorkspace)?;
        if workspace_text.len() > 256 * 1024 {
            return Err(DbError::InvalidWorkspace);
        }
        let mut tx = self.pool.begin().await?;
        let membership = self
            .resolve_membership(&mut tx, identity)
            .await?
            .ok_or(DbError::NotOnboarded)?;
        if membership.role == "viewer" {
            return Err(DbError::ReadOnlyRole);
        }
        let billing = self
            .billing_for(&mut tx, &membership.organization_id)
            .await?;
        if !billing.cloud_writes_allowed {
            return Err(DbError::EntitlementRequired);
        }
        let replay_query = self.sql(
            "SELECT response FROM fpp_sync_operations WHERE organization_id=? AND idempotency_key=?",
        );
        let replay = sqlx::query(replay_query)
            .bind(&membership.organization_id)
            .bind(&input.idempotency_key)
            .fetch_optional(&mut *tx)
            .await?;
        if let Some(row) = replay {
            let response_text: String = row.get("response");
            let mut result: SyncResult =
                serde_json::from_str(&response_text).map_err(|_| DbError::InvalidWorkspace)?;
            result.replayed = true;
            tx.commit().await?;
            return Ok(result);
        }
        let current =
            sqlx::query(self.sql("SELECT version FROM fpp_workspaces WHERE organization_id=?"))
                .bind(&membership.organization_id)
                .fetch_optional(&mut *tx)
                .await?
                .ok_or(DbError::NotFound)?;
        let version: i64 = current.get("version");
        if version != input.expected_version {
            return Err(DbError::VersionConflict);
        }
        let next_version = version + 1;
        let now = Utc::now().to_rfc3339();
        let update_sql = self.sql(
            "UPDATE fpp_workspaces SET version=?,workspace=?,updated_by=?,updated_at=? WHERE organization_id=? AND version=?",
        );
        let updated = sqlx::query(update_sql)
            .bind(next_version)
            .bind(&workspace_text)
            .bind(&membership.user_id)
            .bind(&now)
            .bind(&membership.organization_id)
            .bind(version)
            .execute(&mut *tx)
            .await?;
        if updated.rows_affected() != 1 {
            return Err(DbError::VersionConflict);
        }
        let result = SyncResult {
            version: next_version,
            workspace: input.workspace.clone(),
            replayed: false,
        };
        let response_text =
            serde_json::to_string(&result).map_err(|_| DbError::InvalidWorkspace)?;
        let op_sql = self.sql(
            "INSERT INTO fpp_sync_operations(id,organization_id,user_id,idempotency_key,expected_version,applied_version,response,created_at) VALUES(?,?,?,?,?,?,?,?)",
        );
        sqlx::query(op_sql)
            .bind(Uuid::new_v4().to_string())
            .bind(&membership.organization_id)
            .bind(&membership.user_id)
            .bind(&input.idempotency_key)
            .bind(version)
            .bind(next_version)
            .bind(response_text)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        let audit_sql = self.sql(
            "INSERT INTO fpp_audit_events(id,organization_id,actor_user_id,action,object_type,object_id,summary,created_at) VALUES(?,?,?,'workspace.synced','workspace',?,?,?)",
        );
        sqlx::query(audit_sql)
            .bind(Uuid::new_v4().to_string())
            .bind(&membership.organization_id)
            .bind(&membership.user_id)
            .bind(&membership.organization_id)
            .bind(
                json!({"version":next_version,"idempotency_key":input.idempotency_key}).to_string(),
            )
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(result)
    }

    pub async fn export(&self, identity: &Identity) -> Result<Value, DbError> {
        let mut tx = self.pool.begin().await?;
        let membership = self
            .resolve_membership(&mut tx, identity)
            .await?
            .ok_or(DbError::NotOnboarded)?;
        let workspace_query =
            "SELECT version,workspace,updated_at FROM fpp_workspaces WHERE organization_id=?";
        let workspace_row = sqlx::query(self.sql(workspace_query))
            .bind(&membership.organization_id)
            .fetch_one(&mut *tx)
            .await?;
        let text: String = workspace_row.get("workspace");
        let workspace: Value =
            serde_json::from_str(&text).map_err(|_| DbError::InvalidWorkspace)?;
        let organization =
            sqlx::query(self.sql("SELECT name,locale,time_zone FROM fpp_organizations WHERE id=?"))
                .bind(&membership.organization_id)
                .fetch_one(&mut *tx)
                .await?;
        let members = self
            .members_for(&mut tx, &membership.organization_id)
            .await?;
        let audit_query =
            "SELECT action,object_type,object_id,summary,created_at FROM fpp_audit_events WHERE organization_id=? ORDER BY created_at,id";
        let audit_rows = sqlx::query(self.sql(audit_query))
            .bind(&membership.organization_id)
            .fetch_all(&mut *tx)
            .await?;
        let audit_events = audit_rows
            .into_iter()
            .map(|row| {
                let summary: String = row.get("summary");
                json!({
                    "action":row.get::<String,_>("action"),
                    "object_type":row.get::<String,_>("object_type"),
                    "object_id":row.get::<String,_>("object_id"),
                    "summary":serde_json::from_str::<Value>(&summary).unwrap_or_else(|_| json!({})),
                    "created_at":row.get::<String,_>("created_at")
                })
            })
            .collect::<Vec<_>>();
        let billing = self
            .billing_for(&mut tx, &membership.organization_id)
            .await?;
        tx.commit().await?;
        Ok(json!({
            "schema_version":1,
            "organization":{
                "name":organization.get::<String,_>("name"),
                "locale":organization.get::<String,_>("locale"),
                "time_zone":organization.get::<String,_>("time_zone")
            },
            "workspace_version":workspace_row.get::<i64,_>("version"),
            "workspace_updated_at":workspace_row.get::<String,_>("updated_at"),
            "workspace":workspace,
            "members":members,
            "billing":billing,
            "audit_events":audit_events
        }))
    }

    pub async fn schedule_deletion(
        &self,
        identity: &Identity,
        input: &DeletionInput,
    ) -> Result<DeletionStatus, DbError> {
        let mut tx = self.pool.begin().await?;
        let membership = self
            .resolve_membership(&mut tx, identity)
            .await?
            .ok_or(DbError::NotOnboarded)?;
        if membership.role != "owner" {
            return Err(DbError::OwnerRequired);
        }
        let organization: String =
            sqlx::query(self.sql("SELECT name FROM fpp_organizations WHERE id=?"))
                .bind(&membership.organization_id)
                .fetch_one(&mut *tx)
                .await?
                .get("name");
        if input.organization_name.trim() != organization {
            return Err(DbError::InvalidWorkspace);
        }
        let requested_at = Utc::now();
        let delete_after = requested_at + chrono::Duration::days(14);
        let requested_text = requested_at.to_rfc3339();
        let delete_text = delete_after.to_rfc3339();
        let update_sql = self.sql(
            "UPDATE fpp_organizations SET deletion_requested_at=?,deletion_scheduled_for=?,updated_at=? WHERE id=?",
        );
        sqlx::query(update_sql)
            .bind(&requested_text)
            .bind(&delete_text)
            .bind(&requested_text)
            .bind(&membership.organization_id)
            .execute(&mut *tx)
            .await?;
        let audit_sql = self.sql(
            "INSERT INTO fpp_audit_events(id,organization_id,actor_user_id,action,object_type,object_id,summary,created_at) VALUES(?,?,?,'organization.deletion_scheduled','organization',?,?,?)",
        );
        sqlx::query(audit_sql)
            .bind(Uuid::new_v4().to_string())
            .bind(&membership.organization_id)
            .bind(&membership.user_id)
            .bind(&membership.organization_id)
            .bind(json!({"delete_after":delete_text}).to_string())
            .bind(&requested_text)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(DeletionStatus {
            scheduled: true,
            requested_at: Some(requested_text),
            delete_after: Some(delete_text),
        })
    }

    pub async fn cancel_deletion(&self, identity: &Identity) -> Result<(), DbError> {
        let mut tx = self.pool.begin().await?;
        let membership = self
            .resolve_membership(&mut tx, identity)
            .await?
            .ok_or(DbError::NotOnboarded)?;
        if membership.role != "owner" {
            return Err(DbError::OwnerRequired);
        }
        let now = Utc::now().to_rfc3339();
        let update_sql = self.sql(
            "UPDATE fpp_organizations SET deletion_requested_at=NULL,deletion_scheduled_for=NULL,updated_at=? WHERE id=?",
        );
        sqlx::query(update_sql)
            .bind(&now)
            .bind(&membership.organization_id)
            .execute(&mut *tx)
            .await?;
        let audit_sql = self.sql(
            "INSERT INTO fpp_audit_events(id,organization_id,actor_user_id,action,object_type,object_id,summary,created_at) VALUES(?,?,?,'organization.deletion_cancelled','organization',?,?,?)",
        );
        sqlx::query(audit_sql)
            .bind(Uuid::new_v4().to_string())
            .bind(&membership.organization_id)
            .bind(&membership.user_id)
            .bind(&membership.organization_id)
            .bind("{}")
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn invite(
        &self,
        identity: &Identity,
        input: &InviteInput,
    ) -> Result<Vec<Member>, DbError> {
        let mut tx = self.pool.begin().await?;
        let membership = self
            .resolve_membership(&mut tx, identity)
            .await?
            .ok_or(DbError::NotOnboarded)?;
        if membership.role != "owner" {
            return Err(DbError::OwnerRequired);
        }
        let email = input.email.trim().to_lowercase();
        if !email.contains('@')
            || email.len() > 254
            || !matches!(input.role.as_str(), "technician" | "coordinator" | "viewer")
        {
            return Err(DbError::InvalidWorkspace);
        }
        let existing = sqlx::query(self.sql("SELECT m.id FROM fpp_memberships m JOIN fpp_users u ON u.id=m.user_id WHERE m.organization_id=? AND lower(u.email)=?"))
            .bind(&membership.organization_id).bind(&email).fetch_optional(&mut *tx).await?;
        if existing.is_some() {
            return Err(DbError::DuplicateMember);
        }
        let now = Utc::now().to_rfc3339();
        let user_id = Uuid::new_v4().to_string();
        let member_id = Uuid::new_v4().to_string();
        let invite_user_sql = self.sql(
            "INSERT INTO fpp_users(id,external_oid,display_name,email,created_at,updated_at) VALUES(?,?,?,?,?,?)",
        );
        sqlx::query(invite_user_sql)
            .bind(&user_id)
            .bind(format!("pending:{email}"))
            .bind(&email)
            .bind(&email)
            .bind(&now)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        let invite_membership_sql = self.sql(
            "INSERT INTO fpp_memberships(id,organization_id,user_id,role,status,created_at,updated_at) VALUES(?,?,?,?,'invited',?,?)",
        );
        sqlx::query(invite_membership_sql)
            .bind(&member_id)
            .bind(&membership.organization_id)
            .bind(&user_id)
            .bind(&input.role)
            .bind(&now)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        let audit_sql = self.sql(
            "INSERT INTO fpp_audit_events(id,organization_id,actor_user_id,action,object_type,object_id,summary,created_at) VALUES(?,?,?,'membership.invited','membership',?,?,?)",
        );
        sqlx::query(audit_sql)
            .bind(Uuid::new_v4().to_string())
            .bind(&membership.organization_id)
            .bind(&membership.user_id)
            .bind(&member_id)
            .bind(json!({"role":input.role}).to_string())
            .bind(&now)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        let mut tx = self.pool.begin().await?;
        let members = self
            .members_for(&mut tx, &membership.organization_id)
            .await?;
        tx.commit().await?;
        Ok(members)
    }

    pub async fn billing(&self, identity: &Identity) -> Result<BillingStatus, DbError> {
        let mut tx = self.pool.begin().await?;
        let membership = self
            .resolve_membership(&mut tx, identity)
            .await?
            .ok_or(DbError::NotOnboarded)?;
        let billing = self
            .billing_for(&mut tx, &membership.organization_id)
            .await?;
        tx.commit().await?;
        Ok(billing)
    }

    pub async fn require_owner(&self, identity: &Identity) -> Result<(), DbError> {
        let mut tx = self.pool.begin().await?;
        let membership = self
            .resolve_membership(&mut tx, identity)
            .await?
            .ok_or(DbError::NotOnboarded)?;
        if membership.role != "owner" {
            return Err(DbError::OwnerRequired);
        }
        tx.commit().await?;
        Ok(())
    }

    async fn billing_for<'a>(
        &self,
        tx: &mut Transaction<'a, Sqlite>,
        organization_id: &str,
    ) -> Result<BillingStatus, DbError> {
        let billing_select = self.sql(
            "SELECT plan,state,seat_quantity,period_end FROM fpp_billing_accounts WHERE organization_id=?",
        );
        let row = sqlx::query(billing_select)
            .bind(organization_id)
            .fetch_one(&mut **tx)
            .await?;
        let state: String = row.get("state");
        Ok(BillingStatus {
            plan: row.get("plan"),
            seat_quantity: row.get("seat_quantity"),
            period_end: row.try_get("period_end").ok(),
            cloud_writes_allowed: matches!(state.as_str(), "active" | "grace"),
            state,
        })
    }

    async fn members_for<'a>(
        &self,
        tx: &mut Transaction<'a, Sqlite>,
        organization_id: &str,
    ) -> Result<Vec<Member>, DbError> {
        let rows = sqlx::query(self.sql("SELECT m.id,u.display_name,u.email,m.role,m.status FROM fpp_memberships m JOIN fpp_users u ON u.id=m.user_id WHERE m.organization_id=? ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END,u.display_name"))
            .bind(organization_id).fetch_all(&mut **tx).await?;
        Ok(rows
            .into_iter()
            .map(|row| {
                let role: String = row.get("role");
                let status: String = row.get("status");
                Member {
                    id: row.get("id"),
                    name: row.get("display_name"),
                    email: row.try_get("email").ok(),
                    consumes_seat: role == "technician" && status == "active",
                    role,
                    status,
                }
            })
            .collect())
    }

    #[cfg(any(test, debug_assertions))]
    pub async fn set_billing_state_for_test(
        &self,
        identity: &Identity,
        state: &str,
    ) -> Result<(), DbError> {
        let mut tx = self.pool.begin().await?;
        let membership = self
            .resolve_membership(&mut tx, identity)
            .await?
            .ok_or(DbError::NotOnboarded)?;
        let seats: i64 = sqlx::query(self.sql("SELECT COUNT(*) AS count FROM fpp_memberships WHERE organization_id=? AND role='technician' AND status='active'"))
            .bind(&membership.organization_id).fetch_one(&mut *tx).await?.get("count");
        sqlx::query(self.sql(
            "UPDATE fpp_billing_accounts SET state=?,seat_quantity=? WHERE organization_id=?",
        ))
        .bind(state)
        .bind(seats)
        .bind(&membership.organization_id)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(())
    }

    #[cfg(test)]
    pub async fn delete_test_identity(&self, identity: &Identity) -> Result<(), DbError> {
        let mut tx = self.pool.begin().await?;
        if let Some(membership) = self.resolve_membership(&mut tx, identity).await? {
            sqlx::query(self.sql("DELETE FROM fpp_organizations WHERE id=?"))
                .bind(&membership.organization_id)
                .execute(&mut *tx)
                .await?;
            sqlx::query(self.sql("DELETE FROM fpp_users WHERE id=?"))
                .bind(&membership.user_id)
                .execute(&mut *tx)
                .await?;
        }
        tx.commit().await?;
        Ok(())
    }
}

fn empty_workspace() -> Value {
    json!({"schemaVersion":1,"jobs":[],"requirements":[],"sources":[],"allocations":[]})
}

fn validate_workspace(workspace: &Value) -> Result<(), DbError> {
    let object = workspace.as_object().ok_or(DbError::InvalidWorkspace)?;
    if object.get("schemaVersion").and_then(Value::as_i64) != Some(1) {
        return Err(DbError::InvalidWorkspace);
    }
    for key in ["jobs", "requirements", "sources", "allocations"] {
        if !object.get(key).is_some_and(Value::is_array) {
            return Err(DbError::InvalidWorkspace);
        }
    }
    Ok(())
}
