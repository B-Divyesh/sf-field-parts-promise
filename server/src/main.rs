use std::{env, fs, net::SocketAddr, path::PathBuf};

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

    let (sqlite_url, database_source) = sqlite_connection_uri()?;
    let database = parts_promise_api::db::Database::connect(&sqlite_url).await?;
    let auth = parts_promise_api::auth::AuthVerifier::from_environment().await;
    let auth_source = if auth.is_available() {
        "supplied_defaults_discovered"
    } else {
        "discovery_unavailable"
    };
    let (metrics_token, metrics_token_source, data_dir_source) = load_or_create_metrics_token()?;
    let (billing_base_url, billing_base_url_source) = billing_base_url();
    let (billing_acceptance_enabled, billing_acceptance_source) = billing_acceptance();

    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(address).await?;

    info!(
        port,
        port_source,
        build_sha,
        build_sha_source,
        database_source,
        metrics_token_source,
        data_dir_source,
        billing_base_url_source,
        billing_acceptance_source,
        billing_acceptance_enabled,
        auth_source,
        "Parts Promise is listening"
    );

    axum::serve(
        listener,
        parts_promise_api::app(
            build_sha,
            database,
            auth,
            metrics_token,
            billing_base_url,
            billing_acceptance_enabled,
        )
        .await
        .into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;

    Ok(())
}

fn billing_base_url() -> (String, &'static str) {
    match env::var("SOCIOBOT_BILLING_BASE_URL").as_deref() {
        Ok("https://pilot-api.sociobot.in") => {
            ("https://pilot-api.sociobot.in".to_owned(), "supplied_pilot")
        }
        Ok("https://api.sociobot.in") => {
            ("https://api.sociobot.in".to_owned(), "supplied_production")
        }
        _ => ("https://api.sociobot.in".to_owned(), "production_default"),
    }
}

fn billing_acceptance() -> (bool, &'static str) {
    match env::var("SOCIOBOT_BILLING_ACCEPTANCE").as_deref() {
        // This value is deliberately narrow. An operator may set it only after
        // confirming the target gateway has the enabled `factory_products` row
        // and its linked Dodo recurring product.
        Ok("registered") => (true, "operator_enabled_after_registration"),
        _ => (false, "operator_gate"),
    }
}

fn sqlite_connection_uri() -> Result<(String, &'static str), Box<dyn std::error::Error>> {
    let (data_dir, source) = data_dir();
    fs::create_dir_all(&data_dir)?;
    let path = PathBuf::from(data_dir).join("field-parts-promise.sqlite3");
    Ok((format!("sqlite://{}?mode=rwc", path.display()), source))
}

fn load_or_create_metrics_token(
) -> Result<(String, &'static str, &'static str), Box<dyn std::error::Error>> {
    if let Ok(token) = env::var("METRICS_TOKEN") {
        return Ok((token, "supplied", "not_used"));
    }
    let (data_dir, data_dir_source) = data_dir();
    let path = PathBuf::from(data_dir).join("metrics.token");
    if let Ok(token) = fs::read_to_string(&path) {
        if !token.trim().is_empty() {
            return Ok((token.trim().to_owned(), "persisted", data_dir_source));
        }
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let token = format!(
        "{}{}",
        uuid::Uuid::new_v4().simple(),
        uuid::Uuid::new_v4().simple()
    );
    fs::write(path, &token)?;
    Ok((token, "generated", data_dir_source))
}

fn data_dir() -> (String, &'static str) {
    if let Ok(value) = env::var("DATA_DIR") {
        return (value, "supplied");
    }
    if PathBuf::from("/data").is_dir() {
        return ("/data".to_owned(), "durable_default");
    }
    let local_dir = env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|parent| parent.join("data")))
        .unwrap_or_else(|| PathBuf::from("data"));
    (local_dir.display().to_string(), "local_fallback")
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
