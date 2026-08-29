ALTER TABLE fpp_organizations
    ADD COLUMN deletion_requested_at TIMESTAMPTZ,
    ADD COLUMN deletion_scheduled_for TIMESTAMPTZ;

ALTER TABLE fpp_organizations
    ADD CONSTRAINT fpp_deletion_hold_order
    CHECK (
        deletion_requested_at IS NULL
        OR deletion_scheduled_for >= deletion_requested_at + INTERVAL '14 days'
    );
