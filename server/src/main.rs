use std::{env, net::SocketAddr};

use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let (port, port_source) = match env::var("PORT") {
        Ok(value) => (value.parse::<u16>()?, "supplied"),
        Err(_) => (8080, "default"),
    };
    let build_sha = option_env!("BUILD_SHA").unwrap_or("dev");
    let build_sha_source = if option_env!("BUILD_SHA").is_some() {
        "supplied_at_build"
    } else {
        "default"
    };

    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(address).await?;

    info!(
        port,
        port_source, build_sha, build_sha_source, "Parts Promise API scaffold is listening"
    );

    axum::serve(listener, parts_promise_api::app(build_sha))
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install termination handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
