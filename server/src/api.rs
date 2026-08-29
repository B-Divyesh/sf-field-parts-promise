use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};

use axum::{
    extract::{DefaultBodyLimit, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
use serde_json::{json, Value};
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::SmartIpKeyExtractor, GovernorError,
    GovernorLayer,
};

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
    let read_config = Arc::new(
        GovernorConfigBuilder::default()
            .per_millisecond(50)
            .burst_size(40)
            .key_extractor(SmartIpKeyExtractor)
            .use_headers()
            .finish()
            .expect("read rate limit"),
    );
    let write_config = Arc::new(
        GovernorConfigBuilder::default()
            .per_millisecond(200)
            .burst_size(10)
            .key_extractor(SmartIpKeyExtractor)
            .use_headers()
            .finish()
            .expect("write rate limit"),
    );
    let critical_config = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(12)
            .burst_size(5)
            .key_extractor(SmartIpKeyExtractor)
            .use_headers()
            .finish()
            .expect("critical rate limit"),
    );

    let reads = Router::new()
        .route("/bootstrap", get(bootstrap))
        .route("/members", get(members))
        .route("/billing", get(billing))
        .layer(GovernorLayer::new(read_config.clone()).error_handler(rate_limit_response));
    let operational = Router::new()
        .route("/metrics", get(metrics))
        .layer(GovernorLayer::new(read_config.clone()).error_handler(rate_limit_response));
    let writes = Router::new()
        .route("/sync", post(sync))
        .layer(GovernorLayer::new(write_config).error_handler(rate_limit_response));
    let critical = Router::new()
        .route("/onboarding", post(onboard))
        .route("/members", post(invite))
        .route("/billing/checkout", post(checkout))
        .route("/export", get(export_workspace))
        .route(
            "/account/deletion",
            post(schedule_deletion).delete(cancel_deletion),
        )
        .layer(GovernorLayer::new(critical_config).error_handler(rate_limit_response));

    let router = Router::new()
        .nest("/api/v1", reads.merge(writes).merge(critical))
        .merge(operational)
        .layer(DefaultBodyLimit::max(256 * 1024))
        .with_state(state.clone());
    #[cfg(debug_assertions)]
    let router = router.route("/api/v1/test/billing", post(test_billing).with_state(state));
    router
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

async fn checkout(State(state): State<ApiState>, headers: HeaderMap) -> Result<Response, ApiError> {
    let identity = identity(&state, &headers).await?;
    state.database.require_owner(&identity).await?;
    let _billing = state.database.billing(&identity).await?;
    let checkout_url = format!("{}{}", state.billing_base_url, CHECKOUT_PATH);
    let response = state.client.get(&checkout_url).send().await.map_err(|_| {
        ApiError::new(
            StatusCode::BAD_GATEWAY,
            "billing_gateway_unavailable",
            "Billing could not be reached.",
            "Try again shortly.",
        )
    })?;
    if response.status() == StatusCode::NOT_FOUND {
        return Ok((StatusCode::FAILED_DEPENDENCY, Json(CheckoutUnavailable {
            code: "billing_product_not_registered",
            message: "Checkout is not available because the recurring product is not registered in this Sociobot gateway.",
            action: "No charge was made. Try again after the product operator completes registration.",
            checkout_url,
        })).into_response());
    }
    if response.status().is_redirection() {
        return Ok(
            Json(json!({"checkout_url":checkout_url,"merchant":"Sociobot/Dodo"})).into_response(),
        );
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

fn rate_limit_response(error: GovernorError) -> Response {
    match error {
        GovernorError::TooManyRequests { wait_time, .. } => {
            let retry_after = wait_time.max(1).to_string();
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
            response
        }
        other => {
            let source = other.into_response();
            let (parts, body) = source.into_parts();
            Response::from_parts(parts, axum::body::Body::from(body))
        }
    }
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
