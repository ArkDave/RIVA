-- ============================================================
--  RIVA — Store-Level Database Schema
--  Executed for each individual store schema (e.g. store_001)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Counters ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS counters (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(200),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,           -- BCrypt hash
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(15),
    photo_url   VARCHAR(255),
    role        VARCHAR(30)  NOT NULL,           -- UserRole enum
    counter_id  BIGINT REFERENCES counters(id) ON DELETE SET NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role       ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_counter_id ON users(counter_id);

-- ── Tokens (NPC Process) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS tokens (
    id                   BIGSERIAL PRIMARY KEY,
    token_number         VARCHAR(20)  NOT NULL UNIQUE,   -- e.g. SJ1011
    metal_type           VARCHAR(10)  NOT NULL,           -- GOLD / SILVER / DIAMOND
    counter_id           BIGINT       NOT NULL REFERENCES counters(id),
    sales_executive_id   BIGINT       NOT NULL REFERENCES users(id),
    product_name         VARCHAR(100) NOT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'RAISED',
    customer_name        VARCHAR(150),
    customer_phone       VARCHAR(15),
    deal_start_time      TIMESTAMP,
    deal_end_time        TIMESTAMP,
    sale_type            VARCHAR(15),                     -- DIRECT_SALE / ORDER
    non_sale_reason      VARCHAR(300),
    bill_number          VARCHAR(50),
    token_date           DATE         NOT NULL DEFAULT CURRENT_DATE,
    raised_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tokens_date           ON tokens(token_date);
CREATE INDEX IF NOT EXISTS idx_tokens_counter        ON tokens(counter_id);
CREATE INDEX IF NOT EXISTS idx_tokens_sales_exec     ON tokens(sales_executive_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status         ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_customer_phone ON tokens(customer_phone);

-- ── Orders (Order & Repair Process) ──────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                    BIGSERIAL PRIMARY KEY,
    order_number          VARCHAR(20)  NOT NULL UNIQUE,   -- e.g. ORD1001
    token_id              BIGINT       NOT NULL UNIQUE REFERENCES tokens(id),
    customer_name         VARCHAR(150) NOT NULL,
    customer_phone        VARCHAR(15)  NOT NULL,
    product_name          VARCHAR(100) NOT NULL,
    product_detail        TEXT,
    product_photo_url     VARCHAR(255),
    delivery_date         DATE         NOT NULL,
    sales_executive_id    BIGINT       NOT NULL REFERENCES users(id),
    bill_number           VARCHAR(50),
    status                VARCHAR(15)  NOT NULL DEFAULT 'RECEIVED',
    karigar_name          VARCHAR(150),
    karigar_allotted_date DATE,
    product_received_date DATE,
    delivered_date        DATE,
    gramage               NUMERIC(10,3),
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_sales_exec    ON orders(sales_executive_id);

-- ── Incentive Targets ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incentive_targets (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month            SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year             SMALLINT NOT NULL,
    target_given     INT     NOT NULL DEFAULT 0,
    target_achieved  INT     NOT NULL DEFAULT 0,
    incentive_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    earned_incentive NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    UNIQUE (user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_incentive_month_year ON incentive_targets(month, year);

-- ── Performance Evaluations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_evaluations (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    eval_date         DATE    NOT NULL,
    grooming          SMALLINT NOT NULL DEFAULT 0 CHECK (grooming BETWEEN 0 AND 5),
    punctuality       SMALLINT NOT NULL DEFAULT 0 CHECK (punctuality BETWEEN 0 AND 5),
    discipline        SMALLINT NOT NULL DEFAULT 0 CHECK (discipline BETWEEN 0 AND 5),
    up_sale_cross_sale SMALLINT NOT NULL DEFAULT 0 CHECK (up_sale_cross_sale BETWEEN 0 AND 5),
    presentation      SMALLINT NOT NULL DEFAULT 0 CHECK (presentation BETWEEN 0 AND 5),
    total_score       SMALLINT NOT NULL DEFAULT 0,
    percentage        NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP,
    UNIQUE (user_id, eval_date)
);

CREATE INDEX IF NOT EXISTS idx_perf_eval_date    ON performance_evaluations(eval_date);
CREATE INDEX IF NOT EXISTS idx_perf_eval_user_id ON performance_evaluations(user_id);

-- ── Telecalling Contacts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS telecalling_contacts (
    id                  BIGSERIAL PRIMARY KEY,
    telecaller_id       BIGINT      NOT NULL REFERENCES users(id),
    customer_name       VARCHAR(150) NOT NULL,
    customer_phone      VARCHAR(15)  NOT NULL,
    call_status         VARCHAR(100),
    call_active         BOOLEAN NOT NULL DEFAULT TRUE,
    data_provided_date  DATE    NOT NULL DEFAULT CURRENT_DATE,
    report_date         DATE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tele_telecaller_id ON telecalling_contacts(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_tele_report_date   ON telecalling_contacts(report_date);

-- ── Ticket Size Config ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_size_config (
    id          BIGSERIAL PRIMARY KEY,
    metal_type  VARCHAR(10)   NOT NULL UNIQUE,
    ticket_size NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);

-- ── Seed Data for Store ───────────────────────────────────────

-- Default counters
INSERT INTO counters (name, description) VALUES
    ('Counter A', 'Gold & Diamond Counter'),
    ('Counter B', 'Silver Counter'),
    ('Counter C', 'Mixed Counter')
ON CONFLICT (name) DO NOTHING;

-- Default ticket sizes
INSERT INTO ticket_size_config (metal_type, ticket_size) VALUES
    ('GOLD',    25000),
    ('SILVER',   5000),
    ('DIAMOND', 100000),
    ('PLATINUM', 75000)
ON CONFLICT (metal_type) DO NOTHING;

-- Default admin user  (password = "admin123" BCrypt hash)
INSERT INTO users (username, password, full_name, role) VALUES
    ('admin', '$2a$12$oCPh1YfGvDvXtjNfJSLdQeknP4BUUxIQmQn7tAP1Z6GqJDWNhEtOa', 'System Admin', 'ADMIN')
ON CONFLICT (username) DO NOTHING;
