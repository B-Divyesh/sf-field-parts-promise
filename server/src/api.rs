use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};
use std::{net::IpAddr, time::Duration};

use axum::{
    extract::{DefaultBodyLimit, Request, State},
    http::{HeaderMap, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
use serde_json::{json, Value};

use crate::{
    auth::{AuthError, AuthVerifier, Identity},
    db::{Database, DbError, DeletionInput, InviteInput, OnboardingInput, SyncInput},
};

const CHECKOUT_PATH: &str = "/api/v1/products/field-parts-promise/checkout";

#[derive(Clone)]
pub struct ApiState {
    pub database: Database,
    pub auth: AuthVerifier,
    pub metrics_token: Arc<String>,
    pub billing_base_url: Arc<String>,
    pub billing_acceptance_enabled: bool,
    pub metrics: Arc<MetricsState>,
    pub client: reqwest::Client,
}

#[derive(Default)]
pub struct MetricsState {
    pub requests: AtomicU64,
    pub failures: AtomicU64,
    pub latency_ms_total: AtomicU64,
    pub status_2xx: AtomicU64,
    pub status_4xx: AtomicU64,
    pub status_5xx: AtomicU64,
    pub sync_conflicts: AtomicU64,
    pub queue_depth: AtomicU64,
    pub queue_oldest_age_seconds: AtomicU64,
    pub notification_failures: AtomicU64,
}

#[derive(Debug)]
pub struct ApiError {
    status: StatusCode,
    code: &'static str,
    message: String,
    action: String,
}

impl ApiError {
    fn new(
        status: StatusCode,
        code: &'static str,
        message: impl Into<String>,
        action: impl Into<String>,
    ) -> Self {
        Self {
            status,
            code,
            message: message.into(),
            action: action.into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let request_id = uuid::Uuid::new_v4().to_string();
        let mut response = (self.status, Json(json!({"code":self.code,"message":self.message,"action":self.action,"request_id":request_id}))).into_response();
        if self.status == StatusCode::UNAUTHORIZED {
            response
                .headers_mut()
                .insert("www-authenticate", "Bearer".parse().expect("valid header"));
        }
        response
    }
}

impl From<AuthError> for ApiError {
    fn from(error: AuthError) -> Self {
        let (status, code) = match error {
            AuthError::Unavailable => (StatusCode::SERVICE_UNAVAILABLE, "auth_unavailable"),
            _ => (StatusCode::UNAUTHORIZED, "unauthorized"),
        };
        Self::new(
            status,
            code,
            error.to_string(),
            "Sign in again, then retry this action.",
        )
    }
}

impl From<DbError> for ApiError {
    fn from(error: DbError) -> Self {
        let (status, code, action) = match error {
            DbError::AlreadyOnboarded => {
                (StatusCode::CONFLICT, "already_onboarded", "Open your jobs.")
            }
            DbError::NotOnboarded => (
                StatusCode::CONFLICT,
                "onboarding_required",
                "Finish firm setup.",
            ),
            DbError::NotFound => (StatusCode::NOT_FOUND, "not_found", "Reload and try again."),
            DbError::VersionConflict => (
                StatusCode::CONFLICT,
                "version_conflict",
                "Reload the shared workspace before saving.",
            ),
            DbError::EntitlementRequired => (
                StatusCode::PAYMENT_REQUIRED,
                "subscription_required",
                "Open Billing to subscribe. Export remains available.",
            ),
            DbError::OwnerRequired => (
                StatusCode::FORBIDDEN,
                "owner_required",
                "Ask the firm owner to make this change.",
            ),
            DbError::ReadOnlyRole => (
                StatusCode::FORBIDDEN,
                "read_only_role",
                "Ask the firm owner for an update role.",
            ),
            DbError::DuplicateMember => (
                StatusCode::CONFLICT,
                "duplicate_member",
                "Review the existing team member.",
            ),
            DbError::InvalidWorkspace => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "invalid_input",
                "Check the form values and try again.",
            ),
            DbError::Sql(_) => (
                StatusCode::SERVICE_UNAVAILABLE,
                "storage_unavailable",
                "Try again shortly.",
            ),
        };
        Self::new(status, code, error.to_string(), action)
    }
}

pub fn router(state: ApiState) -> Router {
    let reads = Router::new()
        .route("/bootstrap", get(bootstrap))
        .route("/members", get(members))
        .route("/billing", get(billing));
    let operational = Router::new().route("/metrics", get(metrics));
    let writes = Router::new().route("/sync", post(sync));
    let critical = Router::new()
        .route("/onboarding", post(onboard))
        .route("/members", post(invite))
        .route("/billing/checkout", post(checkout))
        .route("/export", get(export_workspace))
        .route(
            "/account/deletion",
            post(schedule_deletion).delete(cancel_deletion),
        );

    let router = Router::new()
        .nest("/api/v1", reads.merge(writes).merge(critical))
        .merge(operational);
    #[cfg(debug_assertions)]
    let router = router.route("/api/v1/test/billing", post(test_billing));
    router
        .layer(DefaultBodyLimit::max(256 * 1024))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            shared_rate_limit,
        ))
        .with_state(state)
}

#[derive(Clone, Copy)]
enum RateLimitBucket {
    Read,
    Write,
    Critical,
}

impl RateLimitBucket {
    fn name(self) -> &'static str {
        match self {
            Self::Read => "read",
            Self::Write => "write",
            Self::Critical => "critical",
        }
    }

    fn limit(self) -> i64 {
        match self {
            Self::Read => 40,
            Self::Write => 10,
            Self::Critical => 5,
        }
    }

    fn window(self) -> Duration {
        match self {
            Self::Read => Duration::from_secs(2),
            Self::Write => Duration::from_secs(2),
            Self::Critical => Duration::from_secs(60),
        }
    }
}

fn route_rate_limit(method: &Method, path: &str) -> Option<RateLimitBucket> {
    match (method, path) {
        (&Method::GET, "/api/v1/bootstrap" | "/api/v1/members" | "/api/v1/billing")
        | (&Method::GET, "/metrics") => Some(RateLimitBucket::Read),
        (&Method::POST, "/api/v1/sync") => Some(RateLimitBucket::Write),
        (&Method::POST, "/api/v1/onboarding" | "/api/v1/members" | "/api/v1/billing/checkout")
        | (&Method::GET, "/api/v1/export")
        | (&Method::POST | &Method::DELETE, "/api/v1/account/deletion") => {
            Some(RateLimitBucket::Critical)
        }
        #[cfg(debug_assertions)]
        (&Method::POST, "/api/v1/test/billing") => Some(RateLimitBucket::Critical),
        _ if path.starts_with("/api/v1/") => Some(RateLimitBucket::Read),
        _ => None,
    }
}

fn forwarded_client_ip(headers: &HeaderMap) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .and_then(|value| value.parse::<IpAddr>().ok())
        .map(|value| value.to_string())
        .unwrap_or_else(|| "unknown".to_owned())
}

async fn shared_rate_limit(
    State(state): State<ApiState>,
    request: Request,
    next: Next,
) -> Response {
    let Some(bucket) = route_rate_limit(request.method(), request.uri().path()) else {
        return next.run(request).await;
    };
    let client_ip = forwarded_client_ip(request.headers());
    let key = format!("{}:{client_ip}", bucket.name());
    let decision = match state
        .database
        .take_shared_rate_limit(&key, bucket.limit(), bucket.window())
        .await
    {
        Ok(decision) => decision,
        Err(error) => return ApiError::from(error).into_response(),
    };
    if !decision.allowed {
        return rate_limit_response(bucket.limit(), decision.retry_after_seconds);
    }

    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        "x-ratelimit-limit",
        bucket
            .limit()
            .to_string()
            .parse()
            .expect("valid rate limit"),
    );
    headers.insert(
        "x-ratelimit-remaining",
        decision
            .remaining
            .to_string()
            .parse()
            .expect("valid rate limit"),
    );
    headers.insert(
        "x-ratelimit-reset",
        decision
            .retry_after_seconds
            .to_string()
            .parse()
            .expect("valid rate limit"),
    );
    response
}

async fn identity(state: &ApiState, headers: &HeaderMap) -> Result<Identity, ApiError> {
    state.auth.from_headers(headers).await.map_err(Into::into)
}

async fn bootstrap(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    Ok(Json(
        serde_json::to_value(state.database.bootstrap(&identity).await?)
            .expect("serializable bootstrap"),
    ))
}

async fn onboard(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(input): Json<OnboardingInput>,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    Ok(Json(
        serde_json::to_value(state.database.onboard(&identity, &input).await?)
            .expect("serializable bootstrap"),
    ))
}

async fn sync(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(input): Json<SyncInput>,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    match state.database.sync(&identity, &input).await {
        Ok(result) => Ok(Json(
            serde_json::to_value(result).expect("serializable sync"),
        )),
        Err(error) => {
            if matches!(error, DbError::VersionConflict) {
                state.metrics.sync_conflicts.fetch_add(1, Ordering::Relaxed);
            }
            Err(error.into())
        }
    }
}

async fn export_workspace(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    Ok(Json(state.database.export(&identity).await?))
}

async fn members(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    let bootstrap = state.database.bootstrap(&identity).await?;
    if bootstrap.onboarding_required {
        return Err(DbError::NotOnboarded.into());
    }
    Ok(Json(json!({"members":bootstrap.members})))
}

async fn invite(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(input): Json<InviteInput>,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    Ok(Json(
        json!({"members":state.database.invite(&identity, &input).await?}),
    ))
}

async fn schedule_deletion(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(input): Json<DeletionInput>,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    Ok(Json(
        serde_json::to_value(state.database.schedule_deletion(&identity, &input).await?)
            .expect("serializable deletion status"),
    ))
}

async fn cancel_deletion(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    state.database.cancel_deletion(&identity).await?;
    Ok(Json(json!({"scheduled":false})))
}

async fn billing(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    Ok(Json(
        serde_json::to_value(state.database.billing(&identity).await?)
            .expect("serializable billing"),
    ))
}

#[derive(Serialize)]
struct CheckoutUnavailable {
    code: &'static str,
    message: &'static str,
    action: &'static str,
    checkout_url: String,
}

fn checkout_unavailable(
    code: &'static str,
    message: &'static str,
    action: &'static str,
    checkout_url: String,
) -> Response {
    (
        StatusCode::FAILED_DEPENDENCY,
        Json(CheckoutUnavailable {
            code,
            message,
            action,
            checkout_url,
        }),
    )
        .into_response()
}

async fn checkout(State(state): State<ApiState>, headers: HeaderMap) -> Result<Response, ApiError> {
    let identity = identity(&state, &headers).await?;
    state.database.require_owner(&identity).await?;
    let _billing = state.database.billing(&identity).await?;
    let checkout_url = format!("{}{}", state.billing_base_url, CHECKOUT_PATH);
    if !state.billing_acceptance_enabled {
        return Ok(checkout_unavailable(
            "billing_acceptance_operator_gated",
            "Checkout is not available yet.",
            "No charge was made. Try again after Parts Promise announces checkout.",
            checkout_url,
        ));
    }
    let response = state.client.get(&checkout_url).send().await.map_err(|_| {
        ApiError::new(
            StatusCode::BAD_GATEWAY,
            "billing_gateway_unavailable",
            "Billing could not be reached.",
            "Try again shortly.",
        )
    })?;
    if response.status() == StatusCode::NOT_FOUND {
        return Ok(checkout_unavailable(
            "billing_product_not_registered",
            "Checkout is not available yet.",
            "No charge was made. Try again after Parts Promise announces checkout.",
            checkout_url,
        ));
    }
    if response.status().is_redirection() {
        return Ok(Json(json!({"checkout_url":checkout_url})).into_response());
    }
    Err(ApiError::new(
        StatusCode::BAD_GATEWAY,
        "billing_contract_unexpected",
        "Billing returned an unexpected response.",
        "No charge was made. Try again later.",
    ))
}

async fn metrics(State(state): State<ApiState>, headers: HeaderMap) -> Result<String, ApiError> {
    let supplied = headers
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));
    if supplied != Some(state.metrics_token.as_str()) {
        return Err(ApiError::new(
            StatusCode::UNAUTHORIZED,
            "metrics_unauthorized",
            "Metrics access is restricted.",
            "Use the ingress metrics credential.",
        ));
    }
    Ok(format!(
        concat!(
            "parts_promise_requests_total {}\n",
            "parts_promise_failures_total {}\n",
            "parts_promise_request_latency_ms_total {}\n",
            "parts_promise_responses_total{{class=\"2xx\"}} {}\n",
            "parts_promise_responses_total{{class=\"4xx\"}} {}\n",
            "parts_promise_responses_total{{class=\"5xx\"}} {}\n",
            "parts_promise_sync_conflicts_total {}\n",
            "parts_promise_queue_depth {}\n",
            "parts_promise_queue_oldest_age_seconds {}\n",
            "parts_promise_notification_failures_total {}\n"
        ),
        state.metrics.requests.load(Ordering::Relaxed),
        state.metrics.failures.load(Ordering::Relaxed),
        state.metrics.latency_ms_total.load(Ordering::Relaxed),
        state.metrics.status_2xx.load(Ordering::Relaxed),
        state.metrics.status_4xx.load(Ordering::Relaxed),
        state.metrics.status_5xx.load(Ordering::Relaxed),
        state.metrics.sync_conflicts.load(Ordering::Relaxed),
        state.metrics.queue_depth.load(Ordering::Relaxed),
        state
            .metrics
            .queue_oldest_age_seconds
            .load(Ordering::Relaxed),
        state.metrics.notification_failures.load(Ordering::Relaxed)
    ))
}

fn rate_limit_response(limit: i64, retry_after: u64) -> Response {
    let retry_after = retry_after.max(1).to_string();
    let mut response = (
        StatusCode::TOO_MANY_REQUESTS,
        Json(json!({
            "code":"rate_limited",
            "message":"Too many requests were sent.",
            "action":format!("Wait {retry_after} second before retrying.")
        })),
    )
        .into_response();
    response.headers_mut().insert(
        "retry-after",
        retry_after.parse().expect("positive retry header"),
    );
    response.headers_mut().insert(
        "x-ratelimit-limit",
        limit.to_string().parse().expect("valid rate limit"),
    );
    response
}

#[cfg(debug_assertions)]
async fn test_billing(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ApiError> {
    let identity = identity(&state, &headers).await?;
    let billing_state = body
        .get("state")
        .and_then(Value::as_str)
        .unwrap_or("active");
    if !matches!(
        billing_state,
        "active" | "grace" | "unpaid" | "cancelled" | "refunded"
    ) {
        return Err(DbError::InvalidWorkspace.into());
    }
    state
        .database
        .set_billing_state_for_test(&identity, billing_state)
        .await?;
    Ok(Json(json!({ "state": billing_state })))
}
