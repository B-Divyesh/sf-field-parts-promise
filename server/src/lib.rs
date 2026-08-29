pub mod api;
pub mod auth;
pub mod db;

use std::{
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::Instant,
};

use axum::{
    extract::{Request, State},
    http::{header::CACHE_CONTROL, HeaderName, HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use tower_http::{
    cors::{AllowOrigin, CorsLayer},
    services::{ServeDir, ServeFile},
};
use uuid::Uuid;

use api::ApiState;
use auth::AuthVerifier;
use db::Database;

#[derive(Clone)]
struct AppState {
    build_sha: String,
    requests: Arc<AtomicU64>,
    failures: Arc<AtomicU64>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    build_sha: String,
    database: &'static str,
    auth: &'static str,
}

pub async fn app(
    build_sha: impl Into<String>,
    database: Database,
    auth: AuthVerifier,
    metrics_token: String,
) -> Router {
    let static_dir = std::env::var("STATIC_DIR").unwrap_or_else(|_| "dist".to_owned());
    let index_file = format!("{static_dir}/index.html");
    let requests = Arc::new(AtomicU64::new(0));
    let failures = Arc::new(AtomicU64::new(0));
    let app_state = AppState {
        build_sha: build_sha.into(),
        requests: requests.clone(),
        failures: failures.clone(),
    };
    let database_name = match database.kind() {
        db::DatabaseKind::Postgres => "postgres",
        db::DatabaseKind::Sqlite => "sqlite",
    };
    let auth_name = if auth.is_available() {
        "ready"
    } else {
        "unavailable"
    };
    let health_build_sha = app_state.build_sha.clone();
    let api_state = ApiState {
        database,
        auth,
        metrics_token: Arc::new(metrics_token),
        requests,
        failures,
        client: reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("HTTP client"),
    };
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(|origin, _| {
            origin.as_bytes() == b"https://field-parts-promise.sociobot.in"
                || origin.as_bytes().starts_with(b"http://127.0.0.1:")
                || origin.as_bytes().starts_with(b"http://localhost:")
        }))
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
        ]);

    Router::new()
        .route(
            "/health",
            get(move || {
                let build_sha = health_build_sha.clone();
                async move {
                    Json(HealthResponse {
                        status: "ok",
                        build_sha,
                        database: database_name,
                        auth: auth_name,
                    })
                }
            }),
        )
        .merge(api::router(api_state))
        .fallback_service(ServeDir::new(static_dir).fallback(ServeFile::new(index_file)))
        .layer(cors)
        .layer(middleware::from_fn_with_state(app_state, request_observer))
        .layer(middleware::from_fn(security_headers))
}

async fn request_observer(State(state): State<AppState>, request: Request, next: Next) -> Response {
    let request_id = Uuid::new_v4().to_string();
    let method = request.method().clone();
    let path = request.uri().path().to_owned();
    let started = Instant::now();
    state.requests.fetch_add(1, Ordering::Relaxed);
    let mut response = next.run(request).await;
    if response.status().is_server_error() {
        state.failures.fetch_add(1, Ordering::Relaxed);
    }
    response.headers_mut().insert(
        "x-request-id",
        request_id.parse().expect("request id header"),
    );
    tracing::info!(request_id, %method, path, status=response.status().as_u16(), latency_ms=started.elapsed().as_millis(), "request completed");
    response
}

async fn security_headers(request: Request, next: Next) -> Response {
    let path = request.uri().path().to_owned();
    let mut response = next.run(request).await;
    let is_html = response
        .headers()
        .get("content-type")
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.starts_with("text/html"));
    if response.status() == StatusCode::OK && is_html && !is_document_path(&path) {
        *response.status_mut() = StatusCode::NOT_FOUND;
    }
    let is_success = response.status() == StatusCode::OK;
    let is_html_not_found = response.status() == StatusCode::NOT_FOUND && is_html;
    let headers = response.headers_mut();
    headers.insert(
        HeaderName::from_static("x-content-type-options"),
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        HeaderName::from_static("referrer-policy"),
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        HeaderName::from_static("x-frame-options"),
        HeaderValue::from_static("DENY"),
    );
    headers.insert(
        HeaderName::from_static("strict-transport-security"),
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    );
    headers.insert(
        HeaderName::from_static("permissions-policy"),
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert(HeaderName::from_static("content-security-policy"), HeaderValue::from_static(
        "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src https://sociobotcustomers.ciamlogin.com; form-action 'self' https://sociobotcustomers.ciamlogin.com; img-src 'self' data: https://*.msauthimages.net; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self' https://sociobotcustomers.ciamlogin.com https://pilot-api.sociobot.in https://api.sociobot.in; manifest-src 'self'; worker-src 'self'"
    ));
    if is_success || is_html_not_found {
        let cache_policy = if path == "/sw.js" {
            "no-cache, max-age=0, must-revalidate"
        } else if is_fingerprinted_asset(&path) {
            "public, max-age=31536000, immutable"
        } else if path == "/" || path.ends_with(".html") || !path.contains('.') {
            "no-cache, max-age=0, must-revalidate"
        } else {
            "public, max-age=3600"
        };
        headers.insert(CACHE_CONTROL, HeaderValue::from_static(cache_policy));
    }
    response
}

fn is_fingerprinted_asset(path: &str) -> bool {
    if !path.starts_with("/assets/") {
        return false;
    }
    let Some(file_name) = path.rsplit('/').next() else {
        return false;
    };
    let Some((stem, _)) = file_name.rsplit_once('.') else {
        return false;
    };
    let Some((_, fingerprint)) = stem.rsplit_once('-') else {
        return false;
    };
    fingerprint.len() >= 8 && fingerprint.bytes().all(|byte| byte.is_ascii_alphanumeric())
}

fn is_document_path(path: &str) -> bool {
    matches!(
        path,
        "/" | "/demo"
            | "/jobs"
            | "/privacy"
            | "/terms"
            | "/auth/callback"
            | "/onboarding"
            | "/settings/team"
            | "/settings/billing"
    ) || path
        .strip_prefix("/jobs/")
        .is_some_and(|job_id| !job_id.is_empty() && !job_id.contains('/'))
        || path.ends_with(".html")
}

#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{HeaderMap, Request, StatusCode},
    };
    use http_body_util::BodyExt;
    use serde_json::{json, Value};
    use tower::ServiceExt;

    use super::*;

    async fn test_app() -> (Router, AuthVerifier, Database) {
        let db = Database::connect("sqlite::memory:", None).await.unwrap();
        let auth = AuthVerifier::test(b"test-secret-at-least-32-bytes-long");
        (
            app(
                "test-sha",
                db.clone(),
                auth.clone(),
                "metrics-test".to_owned(),
            )
            .await,
            auth,
            db,
        )
    }

    fn request(method: &str, uri: &str, token: Option<&str>, body: Value) -> Request<Body> {
        let mut builder = Request::builder()
            .method(method)
            .uri(uri)
            .header("x-forwarded-for", "203.0.113.4")
            .header("content-type", "application/json");
        if let Some(token) = token {
            builder = builder.header("authorization", format!("Bearer {token}"));
        }
        builder.body(Body::from(body.to_string())).unwrap()
    }

    async fn json_body(response: Response) -> Value {
        serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes()).unwrap()
    }

    async fn test_identity(auth: &AuthVerifier, token: &str) -> auth::Identity {
        let mut headers = HeaderMap::new();
        headers.insert("authorization", format!("Bearer {token}").parse().unwrap());
        auth.from_headers(&headers).await.unwrap()
    }

    #[tokio::test]
    async fn health_reports_build_and_runtime_readiness() {
        let (app, _, _) = test_app().await;
        let response = app
            .oneshot(request("GET", "/health", None, json!({})))
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = json_body(response).await;
        assert_eq!(body["build_sha"], "test-sha");
        assert_eq!(body["database"], "sqlite");
        assert_eq!(body["auth"], "ready");
    }

    #[tokio::test]
    async fn jwt_tenant_isolation_idempotency_and_unpaid_export_are_enforced() {
        let (app, auth, db) = test_app().await;
        let token_a = auth.issue_test_token("oid-a", 600);
        let token_b = auth.issue_test_token("oid-b", 600);
        let expired = auth.issue_test_token("oid-expired", -120);
        let unauthorized = app
            .clone()
            .oneshot(request(
                "GET",
                "/api/v1/bootstrap",
                Some(&expired),
                json!({}),
            ))
            .await
            .unwrap();
        assert_eq!(unauthorized.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(
            unauthorized.headers().get("www-authenticate").unwrap(),
            "Bearer"
        );

        for (token, name) in [(&token_a, "Firm A"), (&token_b, "Firm B")] {
            let response = app.clone().oneshot(request("POST", "/api/v1/onboarding", Some(token), json!({
                "organization_name":name,"locale":"en-US","time_zone":"America/New_York","migrate_local_workspace":false,"local_item_count":0,"workspace":null
            }))).await.unwrap();
            assert_eq!(response.status(), StatusCode::OK);
        }

        let identity_a = {
            let mut headers = HeaderMap::new();
            headers.insert(
                "authorization",
                format!("Bearer {token_a}").parse().unwrap(),
            );
            auth.from_headers(&headers).await.unwrap()
        };
        db.set_billing_state_for_test(&identity_a, "active")
            .await
            .unwrap();
        let workspace_a = json!({"schemaVersion":1,"jobs":[{"id":"a-secret"}],"requirements":[],"sources":[],"allocations":[]});
        let key = Uuid::new_v4().to_string();
        let first = app
            .clone()
            .oneshot(request(
                "POST",
                "/api/v1/sync",
                Some(&token_a),
                json!({"idempotency_key":key,"expected_version":0,"workspace":workspace_a}),
            ))
            .await
            .unwrap();
        assert_eq!(first.status(), StatusCode::OK);
        let first_body = json_body(first).await;
        assert_eq!(first_body["version"], 1);
        let replay = app
            .clone()
            .oneshot(request(
                "POST",
                "/api/v1/sync",
                Some(&token_a),
                json!({"idempotency_key":key,"expected_version":0,"workspace":workspace_a}),
            ))
            .await
            .unwrap();
        assert_eq!(json_body(replay).await["replayed"], true);
        let firm_b = app
            .clone()
            .oneshot(request(
                "GET",
                "/api/v1/bootstrap",
                Some(&token_b),
                json!({}),
            ))
            .await
            .unwrap();
        assert!(!json_body(firm_b).await["workspace"]
            .to_string()
            .contains("a-secret"));

        db.set_billing_state_for_test(&identity_a, "unpaid")
            .await
            .unwrap();
        let blocked = app.clone().oneshot(request("POST", "/api/v1/sync", Some(&token_a), json!({"idempotency_key":Uuid::new_v4(),"expected_version":1,"workspace":workspace_a}))).await.unwrap();
        assert_eq!(blocked.status(), StatusCode::PAYMENT_REQUIRED);
        let export = app
            .oneshot(request("GET", "/api/v1/export", Some(&token_a), json!({})))
            .await
            .unwrap();
        assert_eq!(export.status(), StatusCode::OK);
        assert!(json_body(export).await.to_string().contains("a-secret"));
    }

    #[tokio::test]
    async fn jwt_rejects_wrong_audience_issuer_and_tenant() {
        let (app, auth, _) = test_app().await;
        let invalid_tokens = [
            auth.issue_test_token_with(
                "wrong-audience",
                600,
                "another-client",
                "https://test.parts-promise.invalid",
                auth::DEFAULT_TENANT_ID,
            ),
            auth.issue_test_token_with(
                "wrong-issuer",
                600,
                auth::DEFAULT_CLIENT_ID,
                "https://issuer.invalid",
                auth::DEFAULT_TENANT_ID,
            ),
            auth.issue_test_token_with(
                "wrong-tenant",
                600,
                auth::DEFAULT_CLIENT_ID,
                "https://test.parts-promise.invalid",
                "00000000-0000-0000-0000-000000000000",
            ),
        ];
        for (index, token) in invalid_tokens.iter().enumerate() {
            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .method("GET")
                        .uri("/api/v1/bootstrap")
                        .header("x-forwarded-for", format!("203.0.113.{}", index + 20))
                        .header("authorization", format!("Bearer {token}"))
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        }
    }

    #[tokio::test]
    async fn one_hundred_request_burst_is_rate_limited_by_forwarded_ip() {
        let (app, auth, _) = test_app().await;
        let token = auth.issue_test_token("rate-user", 600);
        let mut requests = tokio::task::JoinSet::new();
        for _ in 0..100 {
            let app = app.clone();
            let token = token.clone();
            requests.spawn(async move {
                app.oneshot(request("GET", "/api/v1/bootstrap", Some(&token), json!({})))
                    .await
                    .unwrap()
            });
        }
        let mut limited = None;
        while let Some(response) = requests.join_next().await {
            let response = response.unwrap();
            if response.status() == StatusCode::TOO_MANY_REQUESTS {
                limited = Some(response);
            }
        }
        let response = limited.expect("rate limit should be enforced");
        assert!(response.headers().get("retry-after").is_some());
    }

    #[tokio::test]
    async fn invited_email_claims_membership_and_technicians_count_as_seats() {
        let (_, auth, db) = test_app().await;
        let owner_token = auth.issue_test_token("invite-owner", 600);
        let invitee_token = auth.issue_test_token("invited-tech", 600);
        let owner = test_identity(&auth, &owner_token).await;
        db.onboard(
            &owner,
            &db::OnboardingInput {
                organization_name: "Invite test".to_owned(),
                locale: "en-US".to_owned(),
                time_zone: "UTC".to_owned(),
                migrate_local_workspace: false,
                local_item_count: 0,
                workspace: None,
            },
        )
        .await
        .unwrap();
        db.invite(
            &owner,
            &db::InviteInput {
                email: "invited-tech@example.test".to_owned(),
                role: "technician".to_owned(),
            },
        )
        .await
        .unwrap();
        let invitee = test_identity(&auth, &invitee_token).await;
        let bootstrap = db.bootstrap(&invitee).await.unwrap();
        assert!(!bootstrap.onboarding_required);
        assert_eq!(bootstrap.role.as_deref(), Some("technician"));
        assert_eq!(bootstrap.billing.unwrap().seat_quantity, 1);
        assert!(bootstrap
            .members
            .iter()
            .all(|member| member.status == "active"));
    }

    #[tokio::test]
    async fn onboarding_rejects_demo_data_and_an_incorrect_confirmation_count() {
        let (_, auth, db) = test_app().await;
        let demo_identity = test_identity(&auth, &auth.issue_test_token("demo-copy", 600)).await;
        let demo_result = db
            .onboard(
                &demo_identity,
                &db::OnboardingInput {
                    organization_name: "No demo copy".to_owned(),
                    locale: "en-US".to_owned(),
                    time_zone: "UTC".to_owned(),
                    migrate_local_workspace: true,
                    local_item_count: 1,
                    workspace: Some(json!({"schemaVersion":1,"jobs":[{"id":"job-rd-1042"}],"requirements":[],"sources":[],"allocations":[]})),
                },
            )
            .await;
        assert!(matches!(demo_result, Err(db::DbError::InvalidWorkspace)));

        let count_identity = test_identity(&auth, &auth.issue_test_token("wrong-count", 600)).await;
        let count_result = db
            .onboard(
                &count_identity,
                &db::OnboardingInput {
                    organization_name: "Count check".to_owned(),
                    locale: "en-US".to_owned(),
                    time_zone: "UTC".to_owned(),
                    migrate_local_workspace: true,
                    local_item_count: 2,
                    workspace: Some(json!({"schemaVersion":1,"jobs":[{"id":"one-job"}],"requirements":[],"sources":[],"allocations":[]})),
                },
            )
            .await;
        assert!(matches!(count_result, Err(db::DbError::InvalidWorkspace)));
    }

    #[tokio::test]
    async fn grace_allows_sync_while_cancel_and_refund_keep_export_only() {
        let (_, auth, db) = test_app().await;
        let identity = test_identity(&auth, &auth.issue_test_token("billing-states", 600)).await;
        db.onboard(
            &identity,
            &db::OnboardingInput {
                organization_name: "Billing states".to_owned(),
                locale: "en-US".to_owned(),
                time_zone: "UTC".to_owned(),
                migrate_local_workspace: false,
                local_item_count: 0,
                workspace: None,
            },
        )
        .await
        .unwrap();
        db.set_billing_state_for_test(&identity, "grace")
            .await
            .unwrap();
        let workspace = json!({"schemaVersion":1,"jobs":[{"id":"grace-job"}],"requirements":[],"sources":[],"allocations":[]});
        db.sync(
            &identity,
            &db::SyncInput {
                idempotency_key: Uuid::new_v4().to_string(),
                expected_version: 0,
                workspace: workspace.clone(),
            },
        )
        .await
        .unwrap();
        for state in ["cancelled", "refunded"] {
            db.set_billing_state_for_test(&identity, state)
                .await
                .unwrap();
            let write = db
                .sync(
                    &identity,
                    &db::SyncInput {
                        idempotency_key: Uuid::new_v4().to_string(),
                        expected_version: 1,
                        workspace: workspace.clone(),
                    },
                )
                .await;
            assert!(matches!(write, Err(db::DbError::EntitlementRequired)));
            assert!(db
                .export(&identity)
                .await
                .unwrap()
                .to_string()
                .contains("grace-job"));
        }
    }

    #[test]
    fn postgres_migration_is_reversible_and_tenant_scoped() {
        let up = include_str!("../migrations/202608290001_accounts_sync.up.sql");
        let down = include_str!("../migrations/202608290001_accounts_sync.down.sql");
        let identity_up = include_str!("../migrations/202608290002_rls_identity.up.sql");
        let identity_down = include_str!("../migrations/202608290002_rls_identity.down.sql");
        assert!(up.contains("ENABLE ROW LEVEL SECURITY"));
        assert!(up.contains("current_setting('app.organization_id'"));
        assert!(identity_up.contains("current_setting('app.user_oid'"));
        assert!(identity_up.contains("current_setting('app.user_email'"));
        assert!(identity_down.contains("CREATE POLICY fpp_memberships_tenant"));
        for table in [
            "fpp_users",
            "fpp_organizations",
            "fpp_memberships",
            "fpp_workspaces",
            "fpp_sync_operations",
            "fpp_audit_events",
            "fpp_technician_seats",
            "fpp_billing_accounts",
            "fpp_billing_events",
        ] {
            assert!(up.contains(&format!("CREATE TABLE {table}")));
            assert!(down.contains(&format!("DROP TABLE IF EXISTS {table}")));
        }
    }

    #[tokio::test]
    #[ignore = "requires DATABASE_URL pointing to an isolated or factory PostgreSQL database"]
    async fn postgres_round_trip_uses_the_real_migration_and_queries() {
        let url = std::env::var("DATABASE_URL").expect("DATABASE_URL is required");
        let db = Database::connect(&url, Some(&url)).await.unwrap();
        assert_eq!(db.kind(), db::DatabaseKind::Postgres);
        db.delete_postgres_smoke_records().await.unwrap();
        let identity = auth::Identity {
            oid: format!("postgres-smoke-{}", Uuid::new_v4()),
            name: "PostgreSQL smoke".to_owned(),
            email: None,
        };
        db.onboard(
            &identity,
            &db::OnboardingInput {
                organization_name: "PostgreSQL smoke firm".to_owned(),
                locale: "en-US".to_owned(),
                time_zone: "UTC".to_owned(),
                migrate_local_workspace: false,
                local_item_count: 0,
                workspace: None,
            },
        )
        .await
        .unwrap();
        db.set_billing_state_for_test(&identity, "active")
            .await
            .unwrap();
        let result = db
            .sync(
                &identity,
                &db::SyncInput {
                    idempotency_key: Uuid::new_v4().to_string(),
                    expected_version: 0,
                    workspace: json!({"schemaVersion":1,"jobs":[{"id":"pg-round-trip"}],"requirements":[],"sources":[],"allocations":[]}),
                },
            )
            .await
            .unwrap();
        assert_eq!(result.version, 1);
        assert!(db
            .export(&identity)
            .await
            .unwrap()
            .to_string()
            .contains("pg-round-trip"));
        db.delete_test_identity(&identity).await.unwrap();
        db.delete_postgres_smoke_records().await.unwrap();
    }
}
