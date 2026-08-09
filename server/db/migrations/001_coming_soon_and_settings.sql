-- Additive migration. Safe to run repeatedly on an existing database:
-- it never drops or rewrites anything, unlike db/schema.sql.

-- 1. Tasks can be listed in the catalogue before their lab exists.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Runtime application settings (SMTP credentials, sender identity, ...).
--    Key/value so new settings do not need a schema change.
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INT REFERENCES users(id) ON DELETE SET NULL
);
