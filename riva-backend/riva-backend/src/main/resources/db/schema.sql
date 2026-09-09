-- ============================================================
--  RIVA — Master Database Schema (Public Schema)
--  Contains store registry and bootstrap initialization
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Stores Table (Central Store Registry) ─────────────────────
CREATE TABLE IF NOT EXISTS stores (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(50)  NOT NULL UNIQUE,
    name         VARCHAR(100) NOT NULL,
    schema_name  VARCHAR(63)  NOT NULL UNIQUE,
    address      VARCHAR(255),
    phone        VARCHAR(15),
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stores_code        ON stores(code);
CREATE INDEX IF NOT EXISTS idx_stores_schema_name ON stores(schema_name);

-- ── Bootstrap Default Initial Store ──────────────────────────
INSERT INTO stores (code, name, schema_name, address) VALUES
    ('DEFAULT', 'Default Store', 'store_default', 'Main Store Branch')
ON CONFLICT (code) DO NOTHING;

-- Create initial store schema
CREATE SCHEMA IF NOT EXISTS store_default;
