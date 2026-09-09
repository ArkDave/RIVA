# RIVA Frontend

React + Vite frontend — fully wired to the RIVA Spring Boot backend.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| HTTP Client | Axios (JWT interceptors) |
| Charts | Recharts |
| Notifications | React Hot Toast |
| Excel Export | SheetJS (xlsx) |

---

## Project Structure
```
src/
├── api/
│   ├── client.js          # Axios instance — auto-attaches JWT, handles 401
│   └── services.js        # All API functions mapped to Java endpoints
├── components/
│   ├── common/index.jsx   # Avatar, Badge, Modal, Spinner, Field, Select, Input, Confirm
│   └── layout/
│       ├── AppLayout.jsx  # Shell — sidebar + topbar + outlet
│       ├── Sidebar.jsx    # Role-filtered navigation
│       └── Topbar.jsx     # Page title + user chip + logout
├── context/
│   └── AuthContext.jsx    # JWT login state, hasRole(), login(), logout()
├── hooks/
│   └── useApi.js          # useApi() + useSubmit() hooks
├── pages/
│   ├── auth/LoginPage.jsx
│   ├── npc/NPCPage.jsx         # Token raising, deal flow, cashier billing
│   ├── npc/NpcReportPage.jsx   # Consolidated + staff NPC reports
│   ├── orders/OrdersPage.jsx   # Order pipeline management
│   ├── performance/PerformancePage.jsx
│   ├── incentives/IncentivesPage.jsx
│   ├── incentives/IncrementPage.jsx
│   ├── customers/CustomerVisitsPage.jsx
│   ├── telecalling/TelecallingPage.jsx
│   ├── achievements/AchievementsPage.jsx
│   └── admin/AdminPage.jsx
├── styles/global.css      # All CSS — variables, layout, components
├── utils/helpers.js       # Formatters, Excel export, constants
├── App.jsx                # Router + protected routes by role
└── main.jsx               # Entry point
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- RIVA Spring Boot backend running on `http://localhost:8080`

### Install & Run
```bash
cd riva-frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

### Build for Production
```bash
npm run build
# Output in /dist — deploy to Nginx, Apache, or any static host
```

---

## API Proxy
Vite proxies all `/api/*` requests to `http://localhost:8080` during development.
For production, configure your web server (Nginx example below):

```nginx
server {
  listen 80;
  root /var/www/riva/dist;
  index index.html;

  location /api/ {
    proxy_pass http://localhost:8080/api/;
    proxy_set_header Authorization $http_authorization;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## Role-Based Access

| Role | Pages accessible |
|---|---|
| ADMIN | Everything |
| FLOOR_INCHARGE | NPC, NPC Reports, Performance, Customer Visits, Achievements |
| SALES_EXECUTIVE | NPC (start/close deals) |
| CASHIER | NPC (enter bill), Orders |
| ORDER_DEPARTMENT | Orders |
| TELECALLER | Telecalling |

Login redirects automatically to the correct landing page based on role.
Attempting to access a restricted page redirects to `/npc`.

---

## JWT Flow
1. User logs in → `POST /api/auth/login` → receives `accessToken`
2. Token stored in `localStorage` as `riva_token`
3. Every Axios request auto-attaches `Authorization: Bearer <token>`
4. On 401 response → token cleared → redirect to `/login`

---

## Default Credentials
```
Username: admin
Password: admin123
```
(Set in Spring Boot schema.sql seed data)

---

## Pages Summary

### NPC Process (`/npc`)
- Floor incharge raises tokens (alpha-numeric: SJ1011)
- Up to 5 tokens per counter, displayed in real-time columns
- Live deal timer (MM:SS) for IN_DEAL tokens
- Close deal as Sale (Direct/Order) or Non-Sale (with mandatory reason)
- Cashier enters bill number to close
- Day-End button generates daily NPC report

### NPC Reports (`/npc/reports`)
- Consolidated monthly report: counter-wise walk-in/walkout/ratio/amount
- Top 3 non-sale reasons + top 3 salesmen by NPC
- Approximate financial loss calculation
- Staff monthly NPC report with NPC ratio per executive
- Excel export for both reports

### Orders & Repair (`/orders`)
- Status pipeline: RECEIVED → IN PROCESS → READY → DELIVERED
- Order dept fills karigar name, dates, gramage
- Delivered status requires bill number
- Summary: count + grams per status

### Performance Evaluation (`/performance`)
- Admin scores each staff 1–5 on 5 categories daily
- Green row = >75%, Red row = <50%
- Monthly report with progress bars
- Top 5 / Bottom 5 panels

### Incentives (`/incentives`)
- Admin sets target given + target achieved + incentive amount per staff per month
- Incentive earned only if achieved ≥ given
- Total incentives calculated

### Increment (`/increment`)
- Per-staff annual increment cards
- 4 criteria auto-fetched: Sales (3%), Scheme (3%), NPC <30% (2%), Performance >75% (2%)
- Max 10% increment

### Customer Visits (`/customers`)
- 5 frequency buckets (1–4 visits, Above 4)
- Click any bucket → drill-down modal with full customer list
- Excel download per bucket

### Telecalling (`/telecalling`)
- CSV paste import of customer contacts
- Status dropdown per contact (10 statuses)
- Call Busy / Did not Pick = Active; others = Ended
- Day-End generates consolidated status report

### Staff Achievements (`/achievements`)
- Annual award cards: Grooming, Punctuality, Discipline, Presentation, Sales, Conversion
- Employee of the Year banner
- Winners auto-derived from Performance and Report data

### Admin (`/admin`)
- Create/deactivate users with role + counter assignment
- Add/remove counters
- Set ticket sizes per metal type (Gold/Silver/Diamond)
