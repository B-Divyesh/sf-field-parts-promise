ALTER TABLE fpp_organizations DROP CONSTRAINT IF EXISTS fpp_deletion_hold_order;
ALTER TABLE fpp_organizations
    DROP COLUMN IF EXISTS deletion_scheduled_for,
    DROP COLUMN IF EXISTS deletion_requested_at;
