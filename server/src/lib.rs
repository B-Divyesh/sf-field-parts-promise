use axum::{
    extract::{Request, State},
    http::{HeaderName, HeaderValue},
    middleware::{self, Next},
    response::Response,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use tower_http::services::{ServeDir, ServeFile};

#[derive(Clone)]
struct AppState {
    build_sha: String,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    build_sha: String,
}

pub fn app(build_sha: impl Into<String>) -> Router {
    let static_dir = std::env::var("STATIC_DIR").unwrap_or_else(|_| "dist".to_owned());
    let index_file = format!("{static_dir}/index.html");
    Router::new()
        .route("/health", get(health))
        .fallback_service(ServeDir::new(static_dir).fallback(ServeFile::new(index_file)))
        .layer(middleware::from_fn(security_headers))
        .with_state(AppState {
            build_sha: build_sha.into(),
        })
}

async fn security_headers(request: Request, next: Next) -> Response {
    let mut response = next.run(request).await;
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
        HeaderName::from_static("content-security-policy"),
        HeaderValue::from_static(
            "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'",
        ),
    );
    response
}

async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        build_sha: state.build_sha,
    })
}

#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use http_body_util::BodyExt;
    use serde_json::Value;
    use tower::ServiceExt;

    use super::app;

    #[tokio::test]
    async fn health_reports_the_build_identity() {
        let response = app("test-sha")
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers().get("x-content-type-options").unwrap(),
            "nosniff"
        );
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["status"], "ok");
        assert_eq!(json["build_sha"], "test-sha");
    }
}
