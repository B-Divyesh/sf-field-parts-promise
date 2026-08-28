use axum::{
    extract::{Request, State},
    http::{header::CACHE_CONTROL, HeaderName, HeaderValue, StatusCode},
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
    let path = request.uri().path().to_owned();
    let mut response = next.run(request).await;
    let is_success = response.status() == StatusCode::OK;
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
        HeaderName::from_static("permissions-policy"),
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert(
        HeaderName::from_static("content-security-policy"),
        HeaderValue::from_static(
            "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'",
        ),
    );
    if is_success {
        let cache_policy = if path == "/sw.js" {
            "no-cache, max-age=0, must-revalidate"
        } else if path.starts_with("/assets/") || path.starts_with("/fonts/") {
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

async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        build_sha: state.build_sha,
    })
}

#[cfg(test)]
mod tests {
    use std::fs;

    use axum::{
        body::Body,
        http::{header::CACHE_CONTROL, Request, StatusCode},
        middleware, Router,
    };
    use http_body_util::BodyExt;
    use serde_json::Value;
    use tower::ServiceExt;
    use tower_http::services::{ServeDir, ServeFile};

    use super::{app, security_headers};

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
        assert_eq!(
            response.headers().get("permissions-policy").unwrap(),
            "camera=(), microphone=(), geolocation=()"
        );
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["status"], "ok");
        assert_eq!(json["build_sha"], "test-sha");
    }

    #[tokio::test]
    async fn production_cache_policy_keeps_assets_immutable_and_worker_fresh() {
        let root = tempfile::tempdir().unwrap();
        fs::create_dir(root.path().join("assets")).unwrap();
        fs::create_dir(root.path().join("fonts")).unwrap();
        fs::write(root.path().join("index.html"), "index").unwrap();
        fs::write(root.path().join("assets/index-a1b2c3.js"), "asset").unwrap();
        fs::write(root.path().join("assets/index-a1b2c3.css"), "asset").unwrap();
        fs::write(root.path().join("assets/blueprint-hero.svg"), "asset").unwrap();
        fs::write(root.path().join("fonts/body.woff2"), "font").unwrap();
        fs::write(root.path().join("sw.js"), "worker").unwrap();

        let app = Router::new()
            .fallback_service(
                ServeDir::new(root.path()).fallback(ServeFile::new(root.path().join("index.html"))),
            )
            .layer(middleware::from_fn(security_headers));

        for path in [
            "/assets/index-a1b2c3.js",
            "/assets/index-a1b2c3.css",
            "/assets/blueprint-hero.svg",
            "/fonts/body.woff2",
        ] {
            let asset = app
                .clone()
                .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
                .await
                .unwrap();
            assert_eq!(asset.status(), StatusCode::OK, "{path}");
            assert_eq!(
                asset.headers().get(CACHE_CONTROL).unwrap(),
                "public, max-age=31536000, immutable",
                "{path}"
            );
        }

        let worker = app
            .oneshot(
                Request::builder()
                    .uri("/sw.js")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(worker.status(), StatusCode::OK);
        assert_eq!(
            worker.headers().get(CACHE_CONTROL).unwrap(),
            "no-cache, max-age=0, must-revalidate"
        );
    }
}
