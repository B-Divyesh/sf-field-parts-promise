# Database migrations

`202608290001_accounts_sync.up.sql` is the reversible PostgreSQL production migration.
It creates the organization-owned account, sync, audit, seat, and billing
tables, then enables tenant row-level security.

`202608290002_rls_identity.up.sql` lets the validated Entra object ID discover
only its own membership. The API then sets the firm ID inside each database
transaction before reading or writing tenant rows. Its paired down migration
restores the original firm-only policy.

`sqlite/0001_accounts_sync.sql` carries the same application constraints for
the no-configuration container and clean-clone tests. Production selects
PostgreSQL when `DATABASE_URL` is supplied or obtained from the factory Key
Vault through the container's managed identity.
`202608290003_deletion_hold` adds the owner-controlled 14-day firm-deletion
hold. Its down migration removes only those nullable scheduling columns.
