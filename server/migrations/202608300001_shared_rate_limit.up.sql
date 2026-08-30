CREATE TABLE fpp_rate_limits (
    bucket_key TEXT PRIMARY KEY,
    window_started_at_ms BIGINT NOT NULL,
    request_count BIGINT NOT NULL
);

CREATE INDEX fpp_rate_limits_window_idx ON fpp_rate_limits(window_started_at_ms);
