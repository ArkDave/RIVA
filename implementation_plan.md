# Multi-Tenant Architecture Plan (Approach B: Schema-per-Store)

## Overview
This plan implements **Approach B: Schema-per-Store Multi-Tenancy** for the RIVA backend.
Under this model:
- A central `public` PostgreSQL schema contains global metadata (store registry `public.stores`).
- Each store gets its own isolated PostgreSQL schema (`store_001`, `store_002`, etc.) containing all business domain tables (`users`, `counters`, `tokens`, `orders`, `incentive_targets`, `performance_evaluations`, `telecalling_contacts`, `ticket_size_config`).
- Spring Boot & Hibernate automatically route database operations to the correct store schema using PostgreSQL `SET search_path TO store_schema, public` based on the request's JWT token or headers.

---

## Technical Architecture & Components

```
                     ┌─────────────────────────────────────────┐
                     │            Inbound HTTP Request         │
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │   JwtAuthFilter / TenantContextFilter   │
                     │  (Extracts tenant/store from JWT header)│
                     └────────────────────┬────────────────────┘
                                          │ Sets ThreadLocal
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │             TenantContext               │
                     │       (Current Schema: store_001)       │
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Hibernate Multi-Tenancy                           │
│  - CurrentTenantIdentifierResolver -> Gets tenant schema from TenantContext  │
│  - MultiTenantConnectionProvider   -> SET search_path TO store_001, public   │
└─────────────────────────────────────────┬────────────────────────────────────┘
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │          PostgreSQL Database            │
                     │ ├── public (stores, central users)     │
                     │ ├── store_001 (tokens, orders...)       │
                     │ └── store_002 (tokens, orders...)       │
                     └─────────────────────────────────────────┘
```

---

## Proposed Changes

### 1. Database Schema Files (`src/main/resources/db/`)

#### [MODIFY] [schema.sql](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/resources/db/schema.sql)
- Defines the `public` schema tables (central store registry `public.stores` and initial seed data).

#### [NEW] [store-schema.sql](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/resources/db/store-schema.sql)
- Contains DDL for store-specific domain tables (`users`, `counters`, `tokens`, `orders`, `incentive_targets`, `performance_evaluations`, `telecalling_contacts`, `ticket_size_config`).

---

### 2. Multi-Tenant Infrastructure (`com.riva.security` & `com.riva.config`)

#### [NEW] [TenantContext.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/security/TenantContext.java)
- ThreadLocal context holding current tenant schema name (`store_001`, `store_002`, `public`).

#### [NEW] [CurrentTenantIdentifierResolverImpl.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/config/CurrentTenantIdentifierResolverImpl.java)
- Hibernate `CurrentTenantIdentifierResolver` implementation that fetches active schema from `TenantContext`.

#### [NEW] [SchemaMultiTenantConnectionProvider.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/config/SchemaMultiTenantConnectionProvider.java)
- Hibernate `MultiTenantConnectionProvider` implementation that sets PostgreSQL search path:
  `SET search_path TO store_schema, public`.

#### [NEW] [HibernateConfig.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/config/HibernateConfig.java)
- Custom JPA/Hibernate configuration registering the connection provider and tenant resolver with `LocalContainerEntityManagerFactoryBean`.

---

### 3. Security & Authentication (`com.riva.security`)

#### [MODIFY] [JwtUtils.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/security/JwtUtils.java)
- Embed `tenantSchema` and `storeCode` in JWT token claims.

#### [MODIFY] [JwtAuthFilter.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/security/JwtAuthFilter.java)
- Read `tenantSchema` claim (or `X-Store-Schema` header) and populate `TenantContext`. Ensure cleanup in `finally` block.

---

### 4. Store Management & Auto-Provisioning (`com.riva.models`, `com.riva.services`, `com.riva.controllers`)

#### [NEW] [Store.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/models/Store.java)
- Master store entity stored in `public.stores`.

#### [NEW] [StoreRepository.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/repositories/StoreRepository.java) & [StoreService.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/services/StoreService.java)
- Service to create new stores dynamically:
  1. Inserts into `public.stores`.
  2. Executes `CREATE SCHEMA store_<code_or_id>`.
  3. Applies `store-schema.sql` DDL script to the new schema.
  4. Seeds default admin user for the new store schema.

#### [NEW] [StoreController.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/controllers/StoreController.java)
- REST API for store creation, listing, activation/deactivation (`/api/admin/stores`).

---

## Verification Plan

1. **Database Schema Setup Verification**:
   - Verify `schema.sql` initializes `public.stores`.
   - Verify creation of default initial store schema `store_default` with `store-schema.sql`.

2. **Isolation Test**:
   - Create Store A (`store_a`) and Store B (`store_b`).
   - Create tokens and orders in Store A.
   - Switch context to Store B and confirm Store A tokens/orders return 0 records or 404 (schema isolation verified).

3. **Dynamic Store Provisioning Test**:
   - Call `POST /api/admin/stores` to create Store C.
   - Verify PostgreSQL dynamically creates `store_c` schema and tables.
