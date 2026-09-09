# RIVA Backend — Spring Boot REST API

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.2.5 |
| Language | Java 17 |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL |
| Auth | Spring Security + JWT (HS256) |
| Build | Maven |
| Excel Export | Apache POI |

---

## Project Structure
```
src/main/java/com/riva/
├── RivaApplication.java
├── config/
│   └── SecurityConfig.java          # CORS, JWT filter chain, role rules
├── controllers/
│   ├── AuthController.java
│   ├── TokenController.java          # NPC Process
│   ├── OrderController.java          # Order & Repair
│   ├── PerformanceController.java
│   ├── IncentiveController.java
│   ├── TelecallingController.java
│   ├── ReportController.java         # All report endpoints
│   └── AdminController.java          # User/Counter/Config mgmt
├── services/
│   ├── AuthService.java
│   ├── TokenService.java
│   ├── OrderService.java
│   ├── PerformanceService.java
│   ├── IncentiveService.java
│   ├── TelecallingService.java
│   └── ReportService.java
├── repositories/                     # Spring Data JPA interfaces
├── models/                           # JPA entities
├── dto/
│   ├── request/                      # Inbound JSON payloads
│   └── response/                     # Outbound JSON responses
├── security/
│   ├── JwtUtils.java
│   ├── JwtAuthFilter.java
│   └── UserDetailsServiceImpl.java
├── enums/
│   ├── UserRole.java
│   ├── MetalType.java
│   ├── TokenStatus.java
│   ├── OrderStatus.java
│   └── SaleType.java
└── exception/
    ├── GlobalExceptionHandler.java
    ├── ResourceNotFoundException.java
    └── BusinessException.java
```

---

## Quick Start

### 1. Prerequisites
- Java 17+
- Maven 3.8+
- PostgreSQL 14+

### 2. Create Database
```sql
CREATE DATABASE riva_db;
CREATE USER riva_user WITH PASSWORD 'riva_password';
GRANT ALL PRIVILEGES ON DATABASE riva_db TO riva_user;
```

### 3. Run Schema
```bash
psql -U riva_user -d riva_db -f src/main/resources/db/schema.sql
```

### 4. Configure
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/riva_db
spring.datasource.username=riva_user
spring.datasource.password=riva_password
riva.jwt.secret=YOUR_256BIT_SECRET_KEY_HERE
riva.cors.allowed-origins=http://localhost:5173
```

### 5. Run
```bash
mvn spring-boot:run
```
API available at: `http://localhost:8080/api`

---

## Role-Based Access Control

| Role | Access |
|---|---|
| `ADMIN` | Full access — all endpoints |
| `FLOOR_INCHARGE` | Raise tokens, view reports, day-end |
| `SALES_EXECUTIVE` | Start/close deals on assigned counter |
| `CASHIER` | Enter bill numbers, view billing queue |
| `ORDER_DEPARTMENT` | View + update orders only |
| `TELECALLER` | Import contacts, update call status, day-end |

Default admin: `username=admin` / `password=admin123`

---

## API Reference

All endpoints require `Authorization: Bearer <token>` except `/api/auth/login`.

All responses follow:
```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

---

### 🔐 Auth

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login, returns JWT |

**Request:**
```json
{ "username": "admin", "password": "admin123" }
```

---

### 🪙 NPC Process (Tokens)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/tokens/raise` | FLOOR_INCHARGE | Raise new token |
| GET | `/tokens/counter/{counterId}` | All | Active tokens for a counter |
| GET | `/tokens/number/{tokenNumber}` | All | Look up by token number |
| PUT | `/tokens/{id}/start-deal` | SALES_EXECUTIVE | Start deal (enter customer info) |
| PUT | `/tokens/{id}/close-deal` | SALES_EXECUTIVE | Close deal (sale or non-sale) |
| PUT | `/tokens/{id}/bill` | CASHIER | Enter bill number |

**Raise Token:**
```json
{
  "metalType": "GOLD",
  "counterId": 1,
  "salesExecutiveId": 2,
  "productName": "Ring"
}
```

**Start Deal:**
```json
{ "customerName": "Meera Shah", "customerPhone": "9876543210" }
```

**Close Deal — Non Sale:**
```json
{ "isSale": false, "nonSaleReason": "Design pasand nhi aaye" }
```

**Close Deal — Direct Sale:**
```json
{ "isSale": true, "saleType": "DIRECT_SALE" }
```

**Close Deal — Order:**
```json
{
  "isSale": true,
  "saleType": "ORDER",
  "productDetail": "22KT gold solitaire, size 16",
  "deliveryDate": "2026-06-20"
}
```

**Enter Bill:**
```json
{ "billNumber": "BILL-2026-001" }
```

---

### 📦 Orders & Repair

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/orders` | ORDER_DEPT, CASHIER | All orders |
| GET | `/orders/{id}` | ORDER_DEPT | Single order |
| GET | `/orders/status/{status}` | ORDER_DEPT | Filter: RECEIVED/IN_PROCESS/READY/DELIVERED |
| PUT | `/orders/{id}` | ORDER_DEPT | Update pipeline stage |
| GET | `/orders/summary` | ADMIN | Count + grams by status |

**Update Order:**
```json
{
  "karigarName": "Ramesh",
  "karigarAllottedDate": "2026-06-10",
  "productReceivedDate": "2026-06-14",
  "deliveredDate": "2026-06-16",
  "billNumber": "BILL-2026-008",
  "gramage": 18.5
}
```

---

### 📊 Performance Evaluation

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/performance` | ADMIN | Save daily evaluation |
| GET | `/performance/monthly?month=6&year=2026` | ADMIN | Monthly avg per staff |
| GET | `/performance/top-bottom?month=6&year=2026` | ADMIN | Top 5 / Bottom 5 |
| GET | `/performance/winners?year=2026` | ADMIN | Annual category winners |

**Save Evaluation:**
```json
{
  "userId": 1,
  "evalDate": "2026-06-09",
  "grooming": 4,
  "punctuality": 5,
  "discipline": 3,
  "upSaleCrossSale": 4,
  "presentation": 5
}
```

---

### 💰 Incentives

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/incentives` | ADMIN | Set/update monthly target |
| GET | `/incentives/report?month=6&year=2026` | ADMIN | Monthly incentive report |

---

### 📞 Telecalling

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/telecalling/{telecallerId}/import` | TELECALLER | Import contact list |
| GET | `/telecalling/{telecallerId}/contacts` | TELECALLER | Get all contacts |
| PUT | `/telecalling/contacts/{contactId}/status?status=Will+Visit+soon` | TELECALLER | Update call status |
| POST | `/telecalling/{telecallerId}/day-end` | TELECALLER | Generate day-end report |
| GET | `/telecalling/{telecallerId}/report?date=2026-06-09` | ADMIN | View report |

---

### 📈 Reports

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/reports/npc/daily?date=2026-06-09` | ADMIN, FLOOR_INCHARGE | Daily NPC report |
| GET | `/reports/npc/consolidated?month=6&year=2026` | ADMIN | Consolidated NPC + financial loss |
| GET | `/reports/npc/staff?month=6&year=2026` | ADMIN | Staff monthly NPC |
| GET | `/reports/customer-visits?year=2026` | ADMIN | Customer visit frequency buckets |
| GET | `/reports/increment/{userId}?year=2026` | ADMIN | Annual increment report per staff |

---

### ⚙️ Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | All active users |
| POST | `/admin/users` | Create user |
| DELETE | `/admin/users/{id}` | Deactivate user |
| GET | `/admin/counters` | All counters |
| POST | `/admin/counters?name=Counter D` | Add counter |
| DELETE | `/admin/counters/{id}` | Remove counter |
| GET | `/admin/ticket-sizes` | All ticket sizes |
| PUT | `/admin/ticket-sizes/{metalType}?amount=30000` | Update ticket size |

---

## React Integration Example

```javascript
// Login
const res = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});
const { data } = await res.json();
const token = data.accessToken;

// Raise a token
await fetch('http://localhost:8080/api/tokens/raise', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    metalType: 'GOLD',
    counterId: 1,
    salesExecutiveId: 2,
    productName: 'Ring'
  })
});
```
