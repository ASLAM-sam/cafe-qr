# Café QR Ordering SaaS Platform

A multi-tenant, web-first QR ordering SaaS platform for cafés built with Next.js 16 (App Router), FastAPI, and MongoDB Atlas.

```text
                    ┌─────────────────────┐
                    │   Next.js Frontend  │
                    │   (App Router, TS)  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │ (Pydantic v2, Motor)│
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐          ┌─────────────────┐
        │  MongoDB Atlas  │          │    Cloudinary   │
        └─────────────────┘          └─────────────────┘
```

---

## Architectural Principles

1. **Strict Multi-Tenancy**: A single shared database serves multiple cafés cleanly. Tenant isolation is enforced through `current_user.cafe_id` (for authenticated admin routes) and validated subdomains/cryptographic table tokens (for public customer menus).
2. **Server-Authoritative Pricing**: Customers submit only `product_id` and `quantity`. Prices, subtotals, tax, and order totals are computed purely server-side from current database records.
3. **No Fake Data**: Clean production schemas and empty states (`[]`, `0`). No mock café names, demo timers, or synthetic metrics in production code.
4. **Focused Scope**: Specifically tailored for cafés. No kitchen display systems (KDS), waiter roles, multi-branch, or complex restaurant ERP baggage.

---

## Repository Structure

```text
cafe-qr-ordering/
├── frontend/                     # Next.js 16 App Router frontend
│   ├── src/
│   │   ├── app/                  # Customer /t/[token] & Admin SaaS routes
│   │   ├── components/ui/        # Reusable component library
│   │   ├── context/              # Multi-tenant & cart context providers
│   │   ├── services/             # Type-safe API client
│   │   └── types/                # Canonical TypeScript domain definitions
│   └── ...
├── backend/                      # Production FastAPI backend
│   ├── app/
│   │   ├── core/                 # Config, Security, Database, Auth Dependencies
│   │   ├── models/ & schemas/    # Pydantic v2 domain schemas
│   │   ├── repositories/         # Scoped MongoDB collections via Motor
│   │   ├── services/             # Business logic (Order state machine, QR gen, etc.)
│   │   ├── api/                  # FastAPI routers (auth, cafes, menu, tables, orders)
│   │   └── utils/                # Cryptographic IDs, pagination, validation
│   ├── tests/                    # Automated pytest test suite
│   ├── requirements.txt
│   ├── vercel.json               # Vercel serverless deployment config
│   └── .env.example
├── pytest.ini
└── PROJECT_SPEC.md
```

---

## Environment Configuration

Copy `backend/.env.example` to `backend/.env` for local backend development:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=cafe_qr_prod

JWT_SECRET=replace_with_a_secure_random_hex_key_at_least_32_chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,https://*.yourdomain.com

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Running the Automated Test Suite

The automated test suite uses an in-memory mock database that tests 100% of FastAPI route handlers, authorization checks, idempotency, order calculations, and cross-tenant isolation without requiring external network connectivity:

```bash
# Run backend tests
python -m pytest backend/tests -v
```

---

## Running Locally

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

FastAPI interactive OpenAPI docs will be available at `http://localhost:8000/docs`.

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Production Deployment

- **Frontend**: Deploy `frontend/` as a Next.js project on Vercel.
- **Backend**: Deploy `backend/` as a Python serverless FastAPI function on Vercel using `backend/vercel.json`.
