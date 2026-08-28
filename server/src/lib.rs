use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;

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
    Router::new()
        .route("/health", get(health))
        .with_state(AppState {
            build_sha: build_sha.into(),
        })
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
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["status"], "ok");
        assert_eq!(json["build_sha"], "test-sha");
    }
}
