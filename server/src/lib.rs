pub mod api;
pub mod auth;
pub mod db;

use std::{
    sync::{atomic::Ordering, Arc},
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

use api::{ApiState, MetricsState};
use auth::AuthVerifier;
use db::Database;

#[derive(Clone)]
struct AppState {
    build_sha: String,
    metrics: Arc<MetricsState>,
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
    billing_base_url: String,
    billing_acceptance_enabled: bool,
) -> Router {
    let static_dir = std::env::var("STATIC_DIR").unwrap_or_else(|_| "dist".to_owned());
    let index_file = format!("{static_dir}/index.html");
    let metrics = Arc::new(MetricsState::default());
    let app_state = AppState {
        build_sha: build_sha.into(),
        metrics: metrics.clone(),
    };
    let database_name = "sqlite";
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
        billing_base_url: Arc::new(billing_base_url),
        billing_acceptance_enabled,
        metrics,
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
        .allow_methods([Method::GET, Method::POST, Method::DELETE, Method::OPTIONS])
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
    state.metrics.requests.fetch_add(1, Ordering::Relaxed);
    let mut response = next.run(request).await;
    if response.status().is_server_error() {
        state.metrics.failures.fetch_add(1, Ordering::Relaxed);
    }
    let status = response.status().as_u16();
    let status_counter = match status {
        200..=299 => Some(&state.metrics.status_2xx),
        400..=499 => Some(&state.metrics.status_4xx),
        500..=599 => Some(&state.metrics.status_5xx),
        _ => None,
    };
    if let Some(counter) = status_counter {
        counter.fetch_add(1, Ordering::Relaxed);
    }
    state
        .metrics
        .latency_ms_total
        .fetch_add(started.elapsed().as_millis() as u64, Ordering::Relaxed);
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
        HeaderValue::from_static("camera=(self), microphone=(), geolocation=()"),
    );
    headers.insert(HeaderName::from_static("content-security-policy"), HeaderValue::from_static(
        "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src https://sociobotcustomers.ciamlogin.com; form-action 'self' https://sociobotcustomers.ciamlogin.com; img-src 'self' data: https://*.msauthimages.net; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self' https://sociobotcustomers.ciamlogin.com https://pilot-api.sociobot.in https://api.sociobot.in; manifest-src 'self'; worker-src 'self'"
    ));
    if is_success || is_html_not_found {
        headers.insert(CACHE_CONTROL, HeaderValue::from_static(cache_policy(&path)));
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
    // Vite's default eight-character hash uses URL-safe Base64. The `-` in
    // that alphabet is valid inside a hash, so inspecting only the text after
    // the last filename separator mistakes `index-DsS9kk-o.js` for an
    // unversioned asset. Try every separator and accept an exact Vite hash.
    stem.match_indices('-').any(|(index, _)| {
        let fingerprint = &stem[index + 1..];
        fingerprint.len() == 8
            && fingerprint
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
    })
}

fn cache_policy(path: &str) -> &'static str {
    if path == "/sw.js" {
        "no-cache, max-age=0, must-revalidate"
    } else if is_fingerprinted_asset(path) {
        "public, max-age=31536000, immutable"
    } else if path == "/" || path.ends_with(".html") || !path.contains('.') {
        "no-cache, max-age=0, must-revalidate"
    } else {
        "public, max-age=3600"
    }
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
            | "/settings/data"
    ) || path
        .strip_prefix("/jobs/")
        .is_some_and(|job_id| !job_id.is_empty() && !job_id.contains('/'))
        || path.ends_with(".html")
}

#[cfg(test)]
mod tests {
    use std::sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    };

    use axum::{
        body::Body,
        http::{HeaderMap, Request, StatusCode},
    };
    use http_body_util::BodyExt;
    use serde_json::{json, Value};
    use tower::ServiceExt;

    use super::*;

    async fn test_app() -> (Router, AuthVerifier, Database) {
        test_app_with_billing_config("https://pilot-api.sociobot.in".to_owned(), false).await
    }

    async fn test_app_with_billing_config(
        billing_base_url: String,
        billing_acceptance_enabled: bool,
    ) -> (Router, AuthVerifier, Database) {
        let db = Database::connect("sqlite::memory:").await.unwrap();
        let auth = AuthVerifier::test(b"test-secret-at-least-32-bytes-long");
        (
            app(
                "test-sha",
                db.clone(),
                auth.clone(),
                "metrics-test".to_owned(),
                billing_base_url,
                billing_acceptance_enabled,
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

    #[test]
    fn vite_hashes_with_url_safe_hyphens_get_immutable_cache_policy() {
        assert_eq!(
            cache_policy("/assets/index-DsS9kk-o.js"),
            "public, max-age=31536000, immutable"
        );
        assert!(is_fingerprinted_asset("/assets/index-DsS9kk-o.js"));

        assert_eq!(
            cache_policy("/assets/blueprint-hero.svg"),
            "public, max-age=3600"
        );
    }

    #[tokio::test]
    async fn file_backed_sqlite_uses_the_network_mount_safe_journal_mode() {
        let directory = tempfile::tempdir().unwrap();
        let sqlite_url = format!(
            "sqlite://{}?mode=rwc",
            directory.path().join("mount-safe.sqlite3").display()
        );
        let database = Database::connect(&sqlite_url).await.unwrap();

        assert_eq!(database.journal_mode_for_test().await.unwrap(), "delete");
    }

    #[tokio::test]
    async fn registered_checkout_returns_the_gateway_url_without_following_its_redirect() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let billing_base_url = format!("http://{}", listener.local_addr().unwrap());
        let billing_gateway = Router::new().route(
            "/api/v1/products/field-parts-promise/checkout",
            get(|| async {
                (
                    StatusCode::SEE_OTHER,
                    [(
                        "location",
                        "https://test.checkout.dodopayments.com/session/example",
                    )],
                )
            }),
        );
        let gateway_task = tokio::spawn(async move {
            axum::serve(listener, billing_gateway).await.unwrap();
        });

        let (app, auth, _) = test_app_with_billing_config(billing_base_url.clone(), true).await;
        let token = auth.issue_test_token("checkout-owner", 600);
        let onboard = app
            .clone()
            .oneshot(request(
                "POST",
                "/api/v1/onboarding",
                Some(&token),
                json!({
                    "organization_name":"Checkout redirect firm","locale":"en-US","time_zone":"UTC",
                    "migrate_local_workspace":false,"local_item_count":0,"workspace":null
                }),
            ))
            .await
            .unwrap();
        assert_eq!(onboard.status(), StatusCode::OK);

        let response = app
            .oneshot(request(
                "POST",
                "/api/v1/billing/checkout",
                Some(&token),
                json!({}),
            ))
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            json_body(response).await,
            json!({
                "checkout_url":format!("{billing_base_url}/api/v1/products/field-parts-promise/checkout")
            })
        );
        gateway_task.abort();
    }

    #[tokio::test]
    async fn checkout_is_operator_gated_before_it_can_contact_a_registered_gateway() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let billing_base_url = format!("http://{}", listener.local_addr().unwrap());
        let gateway_requests = Arc::new(AtomicUsize::new(0));
        let observed_requests = gateway_requests.clone();
        let billing_gateway = Router::new().route(
            "/api/v1/products/field-parts-promise/checkout",
            get(move || {
                let observed_requests = observed_requests.clone();
                async move {
                    observed_requests.fetch_add(1, Ordering::Relaxed);
                    StatusCode::SEE_OTHER
                }
            }),
        );
        let gateway_task = tokio::spawn(async move {
            axum::serve(listener, billing_gateway).await.unwrap();
        });

        let (app, auth, _) = test_app_with_billing_config(billing_base_url, false).await;
        let token = auth.issue_test_token("operator-gated-owner", 600);
        let onboard = app
            .clone()
            .oneshot(request(
                "POST",
                "/api/v1/onboarding",
                Some(&token),
                json!({
                    "organization_name":"Operator gate firm","locale":"en-US","time_zone":"UTC",
                    "migrate_local_workspace":false,"local_item_count":0,"workspace":null
                }),
            ))
            .await
            .unwrap();
        assert_eq!(onboard.status(), StatusCode::OK);

        let response = app
            .oneshot(request(
                "POST",
                "/api/v1/billing/checkout",
                Some(&token),
                json!({}),
            ))
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::FAILED_DEPENDENCY);
        assert_eq!(
            json_body(response).await["code"],
            "billing_acceptance_operator_gated"
        );
        assert_eq!(gateway_requests.load(Ordering::Relaxed), 0);
        gateway_task.abort();
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
    async fn jwt_rejects_wrong_signature_audience_issuer_and_tenant() {
        let (app, auth, _) = test_app().await;
        let wrong_signer = AuthVerifier::test(b"a-different-signing-secret-for-this-test");
        let invalid_tokens = [
            wrong_signer.issue_test_token("wrong-signature", 600),
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
            assert_eq!(
                response.headers().get("www-authenticate").unwrap(),
                "Bearer"
            );
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
        let retry_after = response
            .headers()
            .get("retry-after")
            .unwrap()
            .to_str()
            .unwrap()
            .parse::<u64>()
            .unwrap();
        assert!(retry_after >= 1);
    }

    #[tokio::test]
    async fn critical_rate_limit_is_shared_by_two_independent_app_replicas() {
        let directory = tempfile::tempdir().unwrap();
        let sqlite_url = format!(
            "sqlite://{}?mode=rwc",
            directory.path().join("replica-rate-limit.db").display()
        );
        let database_a = Database::connect(&sqlite_url).await.unwrap();
        let database_b = Database::connect(&sqlite_url).await.unwrap();
        let auth = AuthVerifier::test(b"test-secret-at-least-32-bytes-long");
        let app_a = app(
            "replica-a",
            database_a,
            auth.clone(),
            "metrics-test".to_owned(),
            "https://pilot-api.sociobot.in".to_owned(),
            false,
        )
        .await;
        let app_b = app(
            "replica-b",
            database_b,
            auth.clone(),
            "metrics-test".to_owned(),
            "https://pilot-api.sociobot.in".to_owned(),
            false,
        )
        .await;
        let token = auth.issue_test_token("shared-rate-owner", 600);

        let mut onboarding = request(
            "POST",
            "/api/v1/onboarding",
            Some(&token),
            json!({
                "organization_name":"Shared rate firm","locale":"en-US","time_zone":"UTC",
                "migrate_local_workspace":false,"local_item_count":0,"workspace":null
            }),
        );
        onboarding
            .headers_mut()
            .insert("x-forwarded-for", "198.51.100.200".parse().unwrap());
        assert_eq!(
            app_a.clone().oneshot(onboarding).await.unwrap().status(),
            StatusCode::OK
        );

        for attempt in 1..=6 {
            let app = if attempt % 2 == 0 {
                app_b.clone()
            } else {
                app_a.clone()
            };
            let mut export = request("GET", "/api/v1/export", Some(&token), json!({}));
            export.headers_mut().insert(
                "x-forwarded-for",
                "198.51.100.201, 10.0.0.15".parse().unwrap(),
            );
            let response = app.oneshot(export).await.unwrap();
            if attempt <= 5 {
                assert_eq!(response.status(), StatusCode::OK);
            } else {
                assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
                assert_eq!(response.headers()["x-ratelimit-limit"], "5");
                assert!(
                    response.headers()["retry-after"]
                        .to_str()
                        .unwrap()
                        .parse::<u64>()
                        .unwrap()
                        >= 1
                );
            }
        }
    }

    #[tokio::test]
    async fn export_uses_critical_limit_and_metrics_cover_the_operating_contract() {
        let (app, auth, _) = test_app().await;
        let token = auth.issue_test_token("export-limit", 600);
        let onboard = app
            .clone()
            .oneshot(request(
                "POST",
                "/api/v1/onboarding",
                Some(&token),
                json!({
                    "organization_name":"Export limit firm","locale":"en-US","time_zone":"UTC",
                    "migrate_local_workspace":false,"local_item_count":0,"workspace":null
                }),
            ))
            .await
            .unwrap();
        assert_eq!(onboard.status(), StatusCode::OK);

        let mut limited = None;
        for _ in 0..8 {
            let response = app
                .clone()
                .oneshot(request("GET", "/api/v1/export", Some(&token), json!({})))
                .await
                .unwrap();
            if response.status() == StatusCode::TOO_MANY_REQUESTS {
                limited = Some(response);
                break;
            }
        }
        let limited = limited.expect("export must use the five-request critical bucket");
        assert!(
            limited
                .headers()
                .get("retry-after")
                .unwrap()
                .to_str()
                .unwrap()
                .parse::<u64>()
                .unwrap()
                >= 1
        );

        let metrics = app
            .oneshot(
                Request::builder()
                    .uri("/metrics")
                    .header("x-forwarded-for", "198.51.100.240")
                    .header("authorization", "Bearer metrics-test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(metrics.status(), StatusCode::OK);
        let body = String::from_utf8(
            metrics
                .into_body()
                .collect()
                .await
                .unwrap()
                .to_bytes()
                .to_vec(),
        )
        .unwrap();
        for metric in [
            "parts_promise_request_latency_ms_total",
            "parts_promise_responses_total{class=\"2xx\"}",
            "parts_promise_responses_total{class=\"4xx\"}",
            "parts_promise_sync_conflicts_total",
            "parts_promise_queue_depth",
            "parts_promise_queue_oldest_age_seconds",
            "parts_promise_notification_failures_total",
        ] {
            assert!(body.contains(metric), "missing {metric}");
        }
    }

    #[tokio::test]
    async fn owner_can_schedule_and_cancel_a_fourteen_day_deletion_hold() {
        let (app, auth, _) = test_app().await;
        let token = auth.issue_test_token("deletion-owner", 600);
        let onboard = app
            .clone()
            .oneshot(request(
                "POST",
                "/api/v1/onboarding",
                Some(&token),
                json!({
                    "organization_name":"Deletion Test Firm","locale":"en-US","time_zone":"UTC",
                    "migrate_local_workspace":false,"local_item_count":0,"workspace":null
                }),
            ))
            .await
            .unwrap();
        assert_eq!(onboard.status(), StatusCode::OK);
        let scheduled = app
            .clone()
            .oneshot(request(
                "POST",
                "/api/v1/account/deletion",
                Some(&token),
                json!({"organization_name":"Deletion Test Firm"}),
            ))
            .await
            .unwrap();
        assert_eq!(scheduled.status(), StatusCode::OK);
        let scheduled = json_body(scheduled).await;
        assert_eq!(scheduled["scheduled"], true);
        let requested =
            chrono::DateTime::parse_from_rfc3339(scheduled["requested_at"].as_str().unwrap())
                .unwrap();
        let delete_after =
            chrono::DateTime::parse_from_rfc3339(scheduled["delete_after"].as_str().unwrap())
                .unwrap();
        assert_eq!((delete_after - requested).num_days(), 14);

        let exported = app
            .clone()
            .oneshot(request("GET", "/api/v1/export", Some(&token), json!({})))
            .await
            .unwrap();
        let exported = json_body(exported).await;
        assert!(exported["audit_events"]
            .as_array()
            .unwrap()
            .iter()
            .any(|event| event["action"] == "organization.deletion_scheduled"));

        let cancelled = app
            .clone()
            .oneshot(request(
                "DELETE",
                "/api/v1/account/deletion",
                Some(&token),
                json!({}),
            ))
            .await
            .unwrap();
        assert_eq!(cancelled.status(), StatusCode::OK);
        let bootstrap = app
            .oneshot(request("GET", "/api/v1/bootstrap", Some(&token), json!({})))
            .await
            .unwrap();
        assert_eq!(json_body(bootstrap).await["deletion"]["scheduled"], false);
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

        db.invite(
            &owner,
            &db::InviteInput {
                email: "invited-viewer@example.test".to_owned(),
                role: "viewer".to_owned(),
            },
        )
        .await
        .unwrap();
        let viewer = test_identity(&auth, &auth.issue_test_token("invited-viewer", 600)).await;
        db.bootstrap(&viewer).await.unwrap();
        db.set_billing_state_for_test(&owner, "active")
            .await
            .unwrap();
        let viewer_write = db
            .sync(
                &viewer,
                &db::SyncInput {
                    idempotency_key: Uuid::new_v4().to_string(),
                    expected_version: 0,
                    workspace: json!({"schemaVersion":1,"jobs":[],"requirements":[],"sources":[],"allocations":[]}),
                },
            )
            .await;
        assert!(matches!(viewer_write, Err(db::DbError::ReadOnlyRole)));
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

    #[tokio::test]
    async fn sqlite_state_survives_a_process_restart() {
        let directory = tempfile::tempdir().unwrap();
        let sqlite_url = format!(
            "sqlite://{}?mode=rwc",
            directory
                .path()
                .join("data/field-parts-promise.sqlite3")
                .display()
        );
        std::fs::create_dir_all(directory.path().join("data")).unwrap();
        let identity = auth::Identity {
            oid: format!("restart-smoke-{}", Uuid::new_v4()),
            name: "Restart smoke".to_owned(),
            email: None,
        };
        let first = Database::connect(&sqlite_url).await.unwrap();
        first
            .onboard(
                &identity,
                &db::OnboardingInput {
                    organization_name: "Restart smoke firm".to_owned(),
                    locale: "en-US".to_owned(),
                    time_zone: "UTC".to_owned(),
                    migrate_local_workspace: false,
                    local_item_count: 0,
                    workspace: None,
                },
            )
            .await
            .unwrap();
        first
            .set_billing_state_for_test(&identity, "active")
            .await
            .unwrap();
        first
            .sync(
                &identity,
                &db::SyncInput {
                    idempotency_key: Uuid::new_v4().to_string(),
                    expected_version: 0,
                    workspace: json!({"schemaVersion":1,"jobs":[{"id":"restart-proof"}],"requirements":[],"sources":[],"allocations":[]}),
                },
            )
            .await
            .unwrap();
        drop(first);

        let restarted = Database::connect(&sqlite_url).await.unwrap();
        let bootstrap = restarted.bootstrap(&identity).await.unwrap();
        assert_eq!(bootstrap.version, Some(1));
        assert!(bootstrap
            .workspace
            .unwrap()
            .to_string()
            .contains("restart-proof"));
    }
}
