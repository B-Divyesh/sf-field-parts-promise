use std::{sync::Arc, time::Duration};

use axum::http::{header::AUTHORIZATION, HeaderMap};
use chrono::{DateTime, Utc};
use jsonwebtoken::{decode, decode_header, jwk::JwkSet, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

pub const DEFAULT_TENANT_ID: &str = "35c6fe40-0ec0-46b6-98c6-213ad4de6650";
pub const DEFAULT_TENANT_SUBDOMAIN: &str = "sociobotcustomers";
pub const DEFAULT_CLIENT_ID: &str = "25c704f4-465a-47af-80ab-2c489466b697";

#[derive(Clone, Debug, Serialize)]
pub struct Identity {
    pub oid: String,
    pub name: String,
    pub email: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Discovery {
    issuer: String,
    jwks_uri: String,
}

#[derive(Clone)]
enum AuthMode {
    Entra {
        issuer: String,
        jwks_uri: String,
        cache: Arc<RwLock<JwksCache>>,
        client: reqwest::Client,
    },
    #[cfg(any(test, debug_assertions))]
    Test {
        issuer: String,
        secret: Arc<Vec<u8>>,
    },
    Unavailable,
}

#[derive(Clone)]
pub struct AuthVerifier {
    tenant_id: String,
    client_id: String,
    mode: AuthMode,
}

#[derive(Clone, Default)]
struct JwksCache {
    keys: Option<JwkSet>,
    fetched_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Claims {
    aud: String,
    exp: usize,
    nbf: Option<usize>,
    iss: String,
    tid: String,
    oid: String,
    name: Option<String>,
    email: Option<String>,
    preferred_username: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("Sign in to use this workspace.")]
    Missing,
    #[error("Your sign-in could not be verified. Sign in again.")]
    Invalid,
    #[error("Sign-in verification is temporarily unavailable. Try again.")]
    Unavailable,
}

impl AuthVerifier {
    pub async fn from_environment() -> Self {
        let tenant_id =
            std::env::var("ENTRA_TENANT_ID").unwrap_or_else(|_| DEFAULT_TENANT_ID.to_owned());
        let tenant_subdomain = std::env::var("ENTRA_TENANT_SUBDOMAIN")
            .unwrap_or_else(|_| DEFAULT_TENANT_SUBDOMAIN.to_owned());
        let client_id =
            std::env::var("ENTRA_CLIENT_ID").unwrap_or_else(|_| DEFAULT_CLIENT_ID.to_owned());
        #[cfg(debug_assertions)]
        if let Ok(secret) = std::env::var("AUTH_TEST_SECRET") {
            return Self {
                tenant_id,
                client_id,
                mode: AuthMode::Test {
                    issuer: "https://test.parts-promise.invalid".to_owned(),
                    secret: Arc::new(secret.into_bytes()),
                },
            };
        }
        let discovery_url = format!(
            "https://{tenant_subdomain}.ciamlogin.com/{tenant_id}/v2.0/.well-known/openid-configuration"
        );
        let client = match reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .build()
        {
            Ok(client) => client,
            Err(_) => {
                return Self {
                    tenant_id,
                    client_id,
                    mode: AuthMode::Unavailable,
                }
            }
        };
        let discovery = match client.get(discovery_url).send().await {
            Ok(response) => match response.error_for_status() {
                Ok(response) => response.json::<Discovery>().await.ok(),
                Err(_) => None,
            },
            Err(_) => None,
        };
        let Some(discovery) = discovery else {
            return Self {
                tenant_id,
                client_id,
                mode: AuthMode::Unavailable,
            };
        };
        let verifier = Self {
            tenant_id,
            client_id,
            mode: AuthMode::Entra {
                issuer: discovery.issuer,
                jwks_uri: discovery.jwks_uri,
                cache: Arc::new(RwLock::new(JwksCache::default())),
                client,
            },
        };
        let _ = verifier.refresh_keys().await;
        verifier
    }

    pub fn is_available(&self) -> bool {
        !matches!(self.mode, AuthMode::Unavailable)
    }

    pub async fn from_headers(&self, headers: &HeaderMap) -> Result<Identity, AuthError> {
        let value = headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or(AuthError::Missing)?;
        let token = value.strip_prefix("Bearer ").ok_or(AuthError::Invalid)?;
        self.verify(token).await
    }

    async fn verify(&self, token: &str) -> Result<Identity, AuthError> {
        let header = decode_header(token).map_err(|_| AuthError::Invalid)?;
        match &self.mode {
            AuthMode::Unavailable => Err(AuthError::Unavailable),
            AuthMode::Entra { issuer, cache, .. } => {
                if header.alg != Algorithm::RS256 {
                    return Err(AuthError::Invalid);
                }
                let kid = header.kid.ok_or(AuthError::Invalid)?;
                let expired = cache
                    .read()
                    .await
                    .fetched_at
                    .is_none_or(|time| Utc::now() - time > chrono::Duration::hours(1));
                if expired {
                    self.refresh_keys().await?;
                }
                let key = {
                    let guard = cache.read().await;
                    guard
                        .keys
                        .as_ref()
                        .and_then(|keys| keys.find(&kid))
                        .map(DecodingKey::from_jwk)
                        .transpose()
                        .map_err(|_| AuthError::Invalid)?
                };
                let key = match key {
                    Some(key) => key,
                    None => {
                        self.refresh_keys().await?;
                        let guard = cache.read().await;
                        let jwk = guard.keys.as_ref().and_then(|keys| keys.find(&kid));
                        jwk.map(DecodingKey::from_jwk)
                            .transpose()
                            .map_err(|_| AuthError::Invalid)?
                            .ok_or(AuthError::Invalid)?
                    }
                };
                self.decode_identity(token, &key, Algorithm::RS256, issuer)
            }
            #[cfg(any(test, debug_assertions))]
            AuthMode::Test { issuer, secret } => self.decode_identity(
                token,
                &DecodingKey::from_secret(secret),
                Algorithm::HS256,
                issuer,
            ),
        }
    }

    fn decode_identity(
        &self,
        token: &str,
        key: &DecodingKey,
        algorithm: Algorithm,
        issuer: &str,
    ) -> Result<Identity, AuthError> {
        let mut validation = Validation::new(algorithm);
        validation.set_audience(&[self.client_id.as_str()]);
        validation.set_issuer(&[issuer]);
        validation.validate_nbf = true;
        let claims = decode::<Claims>(token, key, &validation)
            .map_err(|_| AuthError::Invalid)?
            .claims;
        if claims.tid != self.tenant_id || claims.oid.trim().is_empty() {
            return Err(AuthError::Invalid);
        }
        Ok(Identity {
            oid: claims.oid,
            name: claims
                .name
                .unwrap_or_else(|| "Parts Promise user".to_owned()),
            email: claims.email.or(claims.preferred_username),
        })
    }

    async fn refresh_keys(&self) -> Result<(), AuthError> {
        let AuthMode::Entra {
            jwks_uri,
            cache,
            client,
            ..
        } = &self.mode
        else {
            return Err(AuthError::Unavailable);
        };
        let keys = client
            .get(jwks_uri)
            .send()
            .await
            .map_err(|_| AuthError::Unavailable)?
            .error_for_status()
            .map_err(|_| AuthError::Unavailable)?
            .json::<JwkSet>()
            .await
            .map_err(|_| AuthError::Unavailable)?;
        *cache.write().await = JwksCache {
            keys: Some(keys),
            fetched_at: Some(Utc::now()),
        };
        Ok(())
    }

    #[cfg(any(test, debug_assertions))]
    pub fn test(secret: &[u8]) -> Self {
        Self {
            tenant_id: DEFAULT_TENANT_ID.to_owned(),
            client_id: DEFAULT_CLIENT_ID.to_owned(),
            mode: AuthMode::Test {
                issuer: "https://test.parts-promise.invalid".to_owned(),
                secret: Arc::new(secret.to_vec()),
            },
        }
    }

    #[cfg(any(test, debug_assertions))]
    pub fn issue_test_token(&self, oid: &str, expires_in_seconds: i64) -> String {
        use jsonwebtoken::{encode, EncodingKey, Header};
        let AuthMode::Test { issuer, secret } = &self.mode else {
            panic!("test verifier required")
        };
        let now = Utc::now().timestamp();
        let claims = Claims {
            aud: self.client_id.clone(),
            exp: (now + expires_in_seconds) as usize,
            nbf: Some((now - 1) as usize),
            iss: issuer.clone(),
            tid: self.tenant_id.clone(),
            oid: oid.to_owned(),
            name: Some(format!("User {oid}")),
            email: Some(format!("{oid}@example.test")),
            preferred_username: None,
        };
        encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(secret),
        )
        .unwrap()
    }

    #[cfg(test)]
    pub fn issue_test_token_with(
        &self,
        oid: &str,
        expires_in_seconds: i64,
        audience: &str,
        issuer: &str,
        tenant_id: &str,
    ) -> String {
        use jsonwebtoken::{encode, EncodingKey, Header};
        let AuthMode::Test { secret, .. } = &self.mode else {
            panic!("test verifier required")
        };
        let now = Utc::now().timestamp();
        let claims = Claims {
            aud: audience.to_owned(),
            exp: (now + expires_in_seconds) as usize,
            nbf: Some((now - 1) as usize),
            iss: issuer.to_owned(),
            tid: tenant_id.to_owned(),
            oid: oid.to_owned(),
            name: Some("Invalid test identity".to_owned()),
            email: None,
            preferred_username: None,
        };
        encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(secret),
        )
        .unwrap()
    }
}
