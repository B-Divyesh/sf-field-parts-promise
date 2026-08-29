DROP POLICY fpp_memberships_tenant ON fpp_memberships;
CREATE POLICY fpp_memberships_tenant ON fpp_memberships
USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')
    OR user_id IN (
        SELECT id
        FROM fpp_users
        WHERE external_oid = NULLIF(current_setting('app.user_oid', true), '')
           OR external_oid = 'pending:' || lower(NULLIF(current_setting('app.user_email', true), ''))
    )
)
WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')
    OR user_id IN (
        SELECT id
        FROM fpp_users
        WHERE external_oid = NULLIF(current_setting('app.user_oid', true), '')
    )
);
