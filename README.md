# Business Dashboard Demo

Full-stack inventory, sales, and analytics dashboard for small businesses.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Workflow (End-to-End)](#workflow-end-to-end)
- [API Reference](#api-reference)
- [Database Schema (Inferred)](#database-schema-inferred)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Important Notes and Current Gaps](#important-notes-and-current-gaps)

## Overview
This app helps a logged-in user:
- Manage product inventory.
- Record sales with automatic profit calculation.
- Track KPIs and trends on a dashboard.
- View a merged product table (stock + sale/profit aggregates).

The system is multi-user at the data layer: all product/sales/dashboard queries are filtered by `user_id`.

## Tech Stack

### Frontend
- React 19
- React Router DOM 7
- Vite 7
- Axios + Fetch API
- Chart.js + react-chartjs-2
- TanStack React Table
- Plain CSS modules by feature (no Tailwind/UI framework)

### Backend
- Node.js + Express 5
- PostgreSQL (`pg`)
- JWT auth (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Cookie-based session token (`cookie-parser`)
- CORS + dotenv

## Architecture
- `frontend/`: SPA with route-based pages (`/`, `/products`, `/sales`, `/login`, `/register`).
- `backend/`: REST API under `/api/*`.
- Auth model:
  - JWT is generated on login/register.
  - JWT is stored in an `httpOnly` cookie named `token`.
  - Protected routes use middleware to validate token and load `req.user`.
- Data model:
  - `users` own `product_list` and `sales` records.
  - Dashboard metrics are computed from `sales` + `product_list`.

## Core Features
- Authentication:
  - Register
  - Login
  - Session restore (`/api/auth/me`)
  - Logout
- Product management:
  - Add new product.
  - Upsert behavior: adding an existing product name (case-insensitive) updates quantity and optionally buying price.
  - Delete product.
  - Typeahead suggestions while typing product name.
- Sales:
  - Product lookup via typeahead.
  - Auto-fill buying price from selected product.
  - Record sale with:
    - selling price
    - quantity
    - optional customer name/phone
  - Stock reduction after successful sale.
  - Profit per unit + total profit computed server-side.
- Dashboard:
  - Time range filters: `1d`, `7d`, `1m`, `3m`, `6m`, `1y`, `2y`, `all`
  - KPI cards:
    - inventory value
    - total revenue
    - total profit
    - total sold units
    - total product count
  - Charts:
    - sales trend
    - profit trend
    - top products (bar chart)
  - Least sold products table.
- Product Table:
  - Merges product inventory with aggregated sales stats.
  - Sorting + simple search by product name.
  - Pagination.
  - Delete action.

## Workflow (End-to-End)

1. User registers or logs in.
2. Backend sets `token` cookie.
3. App boot calls `/api/auth/me` to restore session.
4. User adds inventory on Products page.
5. User records sales on Sales page:
   - backend validates stock
   - inserts row into `sales`
   - decrements `product_list.quantity`
6. Dashboard page reads KPI/trend endpoints and renders charts.
7. Product table refreshes after custom browser events:
   - `product:added`
   - `product:sold`

## API Reference

Base URL examples:
- Local backend: `http://localhost:3000`
- All API routes are under `/api`

Auth requirements:
- Protected routes require valid `token` cookie.
- Unprotected: register/login/logout.

### Health

#### `GET /health`
- Auth: No
- Response:
```json
{ "status": "ok", "message": "Server is running" }
```

### Auth

#### `POST /api/auth/register`
- Auth: No
- Body:
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret" }
```
- Success `201`:
```json
{
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com" }
}
```

#### `POST /api/auth/login`
- Auth: No
- Body:
```json
{ "email": "alice@example.com", "password": "secret" }
```
- Success `200`:
```json
{
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com" }
}
```

#### `GET /api/auth/me`
- Auth: Yes
- Success `200`:
```json
{ "id": 1, "name": "Alice", "email": "alice@example.com" }
```

#### `POST /api/auth/logout`
- Auth: No (clears cookie if present)
- Success `200`:
```json
{ "message": "Logged out successfully" }
```

### Products

#### `GET /api/product`
- Auth: Yes
- Purpose: list current user's products ordered by `id ASC`.
- Success `200`: array of rows from `product_list`.

#### `POST /api/product`
- Auth: Yes
- Body:
```json
{
  "productName": "Keyboard",
  "buyingPrice": 500,
  "productQty": 10
}
```
- Behavior:
  - If product name exists (case-insensitive for same user), quantity is incremented and buying price may be updated.
  - Otherwise inserts new row.
- Success:
  - `201` for new insert
  - `200` for update existing

#### `DELETE /api/product/:id`
- Auth: Yes
- Purpose: delete one product by id for current user.
- Success `200`:
```json
{
  "message": "Product deleted successfully",
  "data": { "...deleted row..." : "..." }
}
```

### Sales

#### `POST /api/sales`
- Auth: Yes
- Body:
```json
{
  "productId": 1,
  "sellingPrice": 700,
  "quantity": 2,
  "customersName": "Bob",
  "customersPhone": "9999999999"
}
```
- Validation:
  - requires `productId`, `sellingPrice`, `quantity`
  - checks product ownership
  - checks stock availability
- Server calculations:
  - `profit_per_unit = sellingPrice - buying_price`
  - `total_profit = profit_per_unit * quantity`
- Side effects:
  - inserts sale row
  - decrements product quantity
- Success `201`:
```json
{
  "message": "Sale recorded",
  "sale": { "...inserted sale..." : "..." },
  "product": { "...updated product..." : "..." }
}
```

#### `GET /api/sales`
- Auth: Yes
- Purpose: list current user's sales ordered by `sold_at DESC`.
- Success `200`: array of `sales` rows.

### Dashboard

All dashboard endpoints accept optional query param:
- `range`: one of `1d|7d|1m|3m|6m|1y|2y|all`
- default: `1m`

#### `GET /api/dashboard/summary`
- Auth: Yes
- Returns:
  - `total_revenue`
  - `total_profit`
  - `total_sold`
  - `total_products`
  - `inventory_value`

#### `GET /api/dashboard/top-products`
- Auth: Yes
- Returns top 10 products by sold quantity for selected range.

#### `GET /api/dashboard/least-products`
- Auth: Yes
- Returns least sold 10 products for selected range.

#### `GET /api/dashboard/sales-trend`
- Auth: Yes
- Returns grouped trend rows:
```json
[{ "date": "2026-03-01", "value": 14 }]
```

#### `GET /api/dashboard/profit-trend`
- Auth: Yes
- Same shape as sales trend, but for `total_profit`.

## Database Schema (Inferred)
No migration files are present in this repo. Based on queries, required tables are:

### `users`
- `id` (PK)
- `name`
- `email` (should be unique)
- `password` (hashed)

### `product_list`
- `id` (PK)
- `product_name`
- `buying_price`
- `quantity`
- `user_id` (FK -> users.id)

### `sales`
- `id` (PK)
- `product_id` (FK -> product_list.id)
- `selling_price`
- `quantity`
- `profit_per_unit`
- `total_profit`
- `customers_name` (nullable)
- `customers_phone` (nullable)
- `sold_at` (timestamp, expected default `now()`)
- `user_id` (FK -> users.id)

## Environment Variables

### Backend (`backend/.env`)
- `PORT` (default `3000`)
- `CLIENT_URL` (frontend origin for CORS)
- `JWT_SECRET`
- `NODE_ENV` (`production` enables `secure` cookie)
- `DB_USER`
- `DB_HOST`
- `DB_DATABASE`
- `DB_PASSWORD`
- `DB_PORT`
- `SALT_ROUNDS` (declared in code, but hashing currently uses hardcoded `10`)

### Frontend (`frontend/.env`)
- `VITE_API` (required in most components; should point to backend base URL)

## Local Development

### 1) Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment variables
- Create `backend/.env` with DB/auth values.
- Create `frontend/.env` with:
```env
VITE_API=http://localhost:3000
```

### 3) Run servers
Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run dev
```

### 4) Open app
- Vite usually serves at `http://localhost:5173`.

## Project Structure
```text
.
├── backend
│   ├── config
│   │   └── db.js
│   ├── dashboard
│   │   ├── dashboard.controller.js
│   │   ├── dashboard.queries.js
│   │   ├── dashboard.service.js
│   │   └── dashboard.utils.js
│   ├── middleware
│   │   └── auth.js
│   ├── routes
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── product.js
│   │   └── sales.js
│   └── server.js
└── frontend
    ├── src
    │   ├── components
    │   ├── pages
    │   ├── styles
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```

## Important Notes and Current Gaps
- No DB migration/seed scripts are included.
- `POST /api/sales` uses `SELECT ... FOR UPDATE` but does not explicitly wrap statements in `BEGIN/COMMIT`.
- Some frontend files use `VITE_API` fallback to `http://localhost:3000`, others assume `VITE_API` exists.
- `frontend/src/components/HomePage.jsx` exists but is not routed by `App.jsx`.
- Backend has no automated tests; frontend lint runs but project has known warning in `ProductTable.jsx` (`react-hooks/exhaustive-deps`).
