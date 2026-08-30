use std::{env, fs, net::SocketAddr, path::PathBuf};

use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[derive(serde::Deserialize)]
struct ManagedIdentityToken {
    access_token: String,
}

#[derive(serde::Deserialize)]
struct KeyVaultSecret {
    value: String,
}

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

    let (database_url, migration_url, database_source) = load_database_config().await;
    let database =
        parts_promise_api::db::Database::connect(&database_url, migration_url.as_deref()).await?;
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

async fn load_database_config() -> (String, Option<String>, &'static str) {
    if let Ok(database_url) = env::var("DATABASE_URL") {
        return (
            database_url,
            env::var("DATABASE_MIGRATION_URL").ok(),
            "supplied",
        );
    }
    if let Some((runtime, migration)) = key_vault_database_urls().await {
        return (runtime, Some(migration), "managed_identity_key_vault");
    }
    (
        "sqlite:///tmp/field-parts-promise.db?mode=rwc".to_owned(),
        None,
        "generated_local_fallback",
    )
}

async fn key_vault_database_urls() -> Option<(String, String)> {
    let endpoint = env::var("IDENTITY_ENDPOINT").ok()?;
    let identity_header = env::var("IDENTITY_HEADER").ok()?;
    let client_id = env::var("MANAGED_IDENTITY_CLIENT_ID")
        .unwrap_or_else(|_| "ba10d5bc-6375-4325-8892-4c7a5be500ca".to_owned());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .ok()?;
    let token = client
        .get(endpoint)
        .header("X-IDENTITY-HEADER", identity_header)
        .query(&[
            ("api-version", "2019-08-01"),
            ("resource", "https://vault.azure.net"),
            ("client_id", client_id.as_str()),
        ])
        .send()
        .await
        .ok()?
        .error_for_status()
        .ok()?
        .json::<ManagedIdentityToken>()
        .await
        .ok()?;
    async fn secret(client: &reqwest::Client, token: &str, name: &str) -> Option<String> {
        client
            .get(format!(
                "https://sociobot-keyvault1.vault.azure.net/secrets/{name}?api-version=7.4"
            ))
            .bearer_auth(token)
            .send()
            .await
            .ok()?
            .error_for_status()
            .ok()?
            .json::<KeyVaultSecret>()
            .await
            .ok()
            .map(|secret| secret.value)
    }
    let runtime = secret(&client, &token.access_token, "sociobot-db-runtime-url").await?;
    let migration = secret(&client, &token.access_token, "sociobot-db-migration-url").await?;
    Some((runtime, migration))
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
    ("/tmp/parts-promise".to_owned(), "local_fallback")
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
