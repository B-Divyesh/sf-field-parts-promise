CREATE TABLE fpp_users (
    id TEXT PRIMARY KEY,
    external_oid TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE fpp_organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
    locale TEXT NOT NULL DEFAULT 'en-US',
    time_zone TEXT NOT NULL DEFAULT 'UTC',
    buffer_days INTEGER NOT NULL DEFAULT 1 CHECK (buffer_days BETWEEN 0 AND 14),
    evidence_stale_hours INTEGER NOT NULL DEFAULT 72 CHECK (evidence_stale_hours BETWEEN 24 AND 168),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE fpp_memberships (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES fpp_organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES fpp_users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'coordinator', 'technician', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, user_id)
);
CREATE TABLE fpp_workspaces (
    organization_id TEXT PRIMARY KEY REFERENCES fpp_organizations(id) ON DELETE CASCADE,
    version BIGINT NOT NULL DEFAULT 0 CHECK (version >= 0), workspace JSONB NOT NULL,
    updated_by TEXT NOT NULL REFERENCES fpp_users(id), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE fpp_sync_operations (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES fpp_organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES fpp_users(id), idempotency_key TEXT NOT NULL,
    expected_version BIGINT NOT NULL, applied_version BIGINT NOT NULL, response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (organization_id, idempotency_key)
);
CREATE TABLE fpp_audit_events (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES fpp_organizations(id) ON DELETE CASCADE,
    actor_user_id TEXT REFERENCES fpp_users(id), action TEXT NOT NULL, object_type TEXT NOT NULL,
    object_id TEXT NOT NULL, summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE fpp_technician_seats (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES fpp_organizations(id) ON DELETE CASCADE,
    membership_id TEXT NOT NULL UNIQUE REFERENCES fpp_memberships(id) ON DELETE CASCADE,
    active_from TIMESTAMPTZ NOT NULL DEFAULT now(), active_to TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE fpp_billing_accounts (
    organization_id TEXT PRIMARY KEY REFERENCES fpp_organizations(id) ON DELETE CASCADE,
    external_customer_id TEXT, external_subscription_id TEXT, plan TEXT NOT NULL DEFAULT 'workshop',
    seat_quantity INTEGER NOT NULL DEFAULT 0 CHECK (seat_quantity >= 0),
    state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'active', 'grace', 'unpaid', 'cancelled', 'refunded')),
    period_end TIMESTAMPTZ, last_event_id TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE fpp_billing_events (
    event_id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES fpp_organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, payload JSONB NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fpp_memberships_user_idx ON fpp_memberships (user_id, status);
CREATE INDEX fpp_sync_operations_org_created_idx ON fpp_sync_operations (organization_id, created_at);
CREATE INDEX fpp_audit_events_org_created_idx ON fpp_audit_events (organization_id, created_at);

ALTER TABLE fpp_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpp_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpp_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpp_sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpp_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpp_technician_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpp_billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpp_billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY fpp_organizations_tenant ON fpp_organizations USING (id = NULLIF(current_setting('app.organization_id', true), '')) WITH CHECK (id = NULLIF(current_setting('app.organization_id', true), ''));
CREATE POLICY fpp_memberships_tenant ON fpp_memberships USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), ''));
CREATE POLICY fpp_workspaces_tenant ON fpp_workspaces USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), ''));
CREATE POLICY fpp_sync_operations_tenant ON fpp_sync_operations USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), ''));
CREATE POLICY fpp_audit_events_tenant ON fpp_audit_events USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), ''));
CREATE POLICY fpp_technician_seats_tenant ON fpp_technician_seats USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), ''));
CREATE POLICY fpp_billing_accounts_tenant ON fpp_billing_accounts USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), ''));
CREATE POLICY fpp_billing_events_tenant ON fpp_billing_events USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), ''));
