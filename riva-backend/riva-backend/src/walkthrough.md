# Schema-per-Store Multi-Tenant Architecture Walkthrough

## Summary of Changes

We transformed the RIVA application into a **Schema-per-Store Multi-Tenant Backend Architecture** capable of serving multiple store locations from a single Spring Boot application and single PostgreSQL database cluster.

```
PostgreSQL Database: riva_db
 ├── public schema (Central Store Registry: stores table)
 ├── store_default schema (Default store domain tables)
 ├── store_mumbai schema (Mumbai store domain tables)
 └── store_delhi schema (Delhi store domain tables)
```

---

## Key Components Implemented

### 1. Database Schema Files
- [schema.sql](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/resources/db/schema.sql): Initializes `public.stores` (central store registry) and bootstraps default initial schema `store_default`.
- [store-schema.sql](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/resources/db/store-schema.sql): DDL for all store-level tables (`users`, `counters`, `tokens`, `orders`, `incentive_targets`, `performance_evaluations`, `telecalling_contacts`, `ticket_size_config`).

### 2. Multi-Tenancy Architecture Core
- [TenantContext.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/security/TenantContext.java): ThreadLocal context for holding active store schema name per HTTP request thread.
- [CurrentTenantIdentifierResolverImpl.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/config/CurrentTenantIdentifierResolverImpl.java): Integrates with Hibernate 6 to resolve active tenant identifier.
- [SchemaMultiTenantConnectionProvider.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/config/SchemaMultiTenantConnectionProvider.java): Dynamically executes PostgreSQL `SET search_path TO store_schema, public` when obtaining database connections.
- [HibernateConfig.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/config/HibernateConfig.java): Configures `EntityManagerFactory` with multi-tenant connection provider and identifier resolver.

### 3. Security & Authentication
- [JwtUtils.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/security/JwtUtils.java): Includes `tenantSchema` and `storeCode` claims in generated JWT tokens.
- [JwtAuthFilter.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/security/JwtAuthFilter.java): Extracts tenant information from headers (`X-Store-Schema`) or JWT tokens and manages `TenantContext` lifecycle.
- [AuthService.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/services/AuthService.java): Authenticates users against their designated store schema.

### 4. Dynamic Store Provisioning API
- [Store.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/models/Store.java): Master entity in `public.stores`.
- [StoreService.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/services/StoreService.java): Provisions new store database schemas (`CREATE SCHEMA store_xxx`) and executes `store-schema.sql` dynamically.
- [StoreController.java](file:///c:/Users/amitk/Downloads/riva-backend/riva-backend/src/main/java/com/riva/controllers/StoreController.java): REST endpoints under `/api/admin/stores`.

---

## API Usage Examples

### 1. Create a New Store & Auto-Provision Database Schema
`POST /api/admin/stores`
```json
{
  "code": "MUMBAI-01",
  "name": "Mumbai Main Branch",
  "address": "Bandra West, Mumbai",
  "phone": "+919876543210"
}
```
*Effect*: Automatically creates database schema `store_mumbai_01` in PostgreSQL and populates all domain tables and seed data.

### 2. Login to Specific Store
`POST /api/auth/login`
```json
{
  "username": "admin",
  "password": "admin123",
  "storeCode": "MUMBAI-01"
}
```
*Response*:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "username": "admin",
    "storeCode": "MUMBAI-01",
    "tenantSchema": "store_mumbai_01"
  }
}
```

### 3. Making Store-Isolated Requests
Include `Authorization: Bearer <token>` in subsequent requests. The backend automatically routes all database queries to `store_mumbai_01`.

Or specify header `X-Store-Schema: store_mumbai_01`.
