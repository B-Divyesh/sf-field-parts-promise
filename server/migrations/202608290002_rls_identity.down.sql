DROP POLICY fpp_memberships_tenant ON fpp_memberships;
CREATE POLICY fpp_memberships_tenant ON fpp_memberships
USING (organization_id = NULLIF(current_setting('app.organization_id', true), ''))
WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), ''));
