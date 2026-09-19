# Production Deployment Guide — Multi-Tenant Café QR Ordering SaaS

This guide explains how to deploy the unified **Next.js Frontend** and **FastAPI Backend** to production on **Vercel**, with **MongoDB Atlas**, **Cloudinary**, and **Ably**.

---

## 1. MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com) and create or select a project.
2. Deploy a Production Cluster (M10+ recommended for production, M0 for staging).
3. Under **Database Access**, create a database user:
   - Role: `readWriteAnyDatabase` or scoped to `cafe_qr_ordering`.
   - Use a strong, random password.
4. Under **Network Access**, configure IP access:
   - For Vercel serverless deployments, allow access from anywhere (`0.0.0.0/0`).
5. Retrieve your connection string from **Clusters > Connect > Drivers (Python 3.11+)**:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 2. Cloudinary Setup

1. Sign up or log in to [Cloudinary](https://cloudinary.com).
2. From the Cloudinary Dashboard, copy:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)
3. Under **Settings > Upload**, ensure:
   - Unsigned uploads are **disabled** (all uploads in this project are authenticated backend-mediated uploads).
   - Delivery format is set to auto/WebP for optimized performance.

---

## 3. Ably Setup

1. Log in to [Ably](https://ably.com) and create an app (e.g. `Cafe-QR-Production`).
2. Under **API Keys**, locate the Root API key:
   - Format: `appId.keyId:keySecret`
   - Copy this key as `ABLY_API_KEY` for the backend.
3. (Optional) Create a restricted client-side key with **Subscribe**-only capabilities if configuring `NEXT_PUBLIC_ABLY_CLIENT_KEY`, or allow the backend `/api/realtime/token` endpoint to issue scoped token requests automatically.

---

## 4. Vercel Backend Deployment

1. In Vercel, create a new project importing the repository.
2. Configure the Root Directory as `backend`.
3. Set the following **Environment Variables**:

| Variable | Description | Example / Placeholder |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DATABASE` | Database Name | `cafe_qr_ordering` |
| `JWT_SECRET` | 64+ Character Hex Secret | `generate_random_64_char_secret_key` |
| `JWT_ALGORITHM` | JWT Signing Algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token Expiry | `1440` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_api_secret` |
| `ABLY_API_KEY` | Ably API Key | `appId.keyId:keySecret` |
| `FRONTEND_URL` | Root Frontend Domain URL | `https://yourdomain.com` |
| `API_URL` | Production API URL | `https://api.yourdomain.com` |
| `APP_DOMAIN` | Root Domain for Subdomain Matching | `yourdomain.com` |
| `CORS_ORIGINS` | Allowed CORS Origins | `["https://yourdomain.com", "https://*.yourdomain.com"]` |
| `ENVIRONMENT` | Runtime Environment | `production` |

---

## 5. Vercel Frontend Deployment

1. In Vercel, create a second project (or root project) with Root Directory set to `frontend`.
2. Framework Preset: **Next.js**.
3. Set the following **Environment Variables**:

| Variable | Description | Example / Placeholder |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Public URL of Backend API | `https://api.yourdomain.com/api` |
| `NEXT_PUBLIC_APP_URL` | Public Base Frontend URL | `https://yourdomain.com` |
| `NEXT_PUBLIC_DOMAIN` | Base Domain for Subdomain Parsing | `yourdomain.com` |
| `NEXT_PUBLIC_ABLY_CLIENT_KEY` | (Optional) Public Subscribe Key | `appId.keyId:subscribeKey` |

---

## 6. Vercel Environment Separation

| Environment | Purpose | Configuration Notes |
|---|---|---|
| **Development** | Local testing on developer machine | Configured via `frontend/.env.local` and `backend/.env` (both git-ignored). Connects to local mock or development DB. |
| **Preview** | Vercel PR / branch previews | Set in Vercel project settings. Uses staging MongoDB database and staging domain `*.vercel.app`. |
| **Production** | Live SaaS traffic | Set in Vercel project settings. Uses production MongoDB Atlas cluster, production Cloudinary cloud, and production Ably app. |

---

## 7. Custom Domain & Wildcard DNS Configuration

*(MANUAL ACTION REQUIRED)*

To enable multi-tenant cafés (`cafe.yourdomain.com`) on a single frontend:

1. In Vercel Project Settings > **Domains**, add:
   - `yourdomain.com` (Root platform domain)
   - `*.yourdomain.com` (Wildcard domain for all café subdomains)
2. In your DNS Provider (e.g. Cloudflare, Route 53, Namecheap), add:

| Type | Name / Host | Target / Value | TTL | Note |
|---|---|---|---|---|
| `A` | `@` | `76.76.21.21` | Auto | Points apex domain to Vercel |
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto | Alias for www |
| `CNAME` | `*` | `cname.vercel-dns.com` | Auto | Wildcard routing for all cafe subdomains |
| `CNAME` | `api` | Points to Vercel Backend Project | Auto | Backend API endpoint |

---

## 8. Production Route Matrix

| URL | Purpose | Access Level | Tenant Resolution |
|---|---|---|---|
| `https://yourdomain.com/` | Platform Landing Website | Public | Platform Root (`isPlatform: true`) |
| `https://yourdomain.com/admin` | Platform Owner Admin Dashboard | Platform Admin (`PLATFORM_ADMIN` role) | Platform Root (`isPlatform: true`) |
| `https://cafe.yourdomain.com/` | Public Café Digital Menu & Ordering | Public Customer | Subdomain (`subdomain: "cafe"`) |
| `https://cafe.yourdomain.com/admin` | Private Café Owner/Manager Dashboard | Authenticated Café Admin (`OWNER`/`ADMIN`) | Subdomain (`subdomain: "cafe"`) |
| `https://cafe.yourdomain.com/t/<token>` | Table QR Code Entry & Session Bind | Public Customer (via secure QR token) | Table Token -> Café Subdomain |

---

## 9. Production Smoke Test Script

Follow this 16-step checklist to verify production health once live credentials are provided:

- [ ] **TEST 1: Open Platform Domain (`https://yourdomain.com`)**  
  *Expected:* HTTP 200 / renders Platform Landing Page with feature highlights and onboarding CTA.
- [ ] **TEST 2: Open Platform Admin (`https://yourdomain.com/admin`)**  
  *Expected:* Requires platform admin authentication; regular café owners receive 403 Forbidden.
- [ ] **TEST 3: Open Café Subdomain (`https://cafe.yourdomain.com`)**  
  *Expected:* HTTP 200 / renders café branding, categories, and products for that specific café.
- [ ] **TEST 4: Open Café Admin (`https://cafe.yourdomain.com/admin`)**  
  *Expected:* Redirects to `/login` if unauthenticated; opens café dashboard upon login.
- [ ] **TEST 5: Login as Café Owner**  
  *Expected:* Dashboard opens displaying live metrics (0s when empty, strictly no fake data).
- [ ] **TEST 6: Create Category in Menu > Categories**  
  *Expected:* Category persists immediately and remains after page refresh.
- [ ] **TEST 7: Create Product in Menu > Products**  
  *Expected:* Product persists with price and availability toggles.
- [ ] **TEST 8: Upload Product Photo (Cloudinary)**  
  *Expected:* File uploads to `cafes/<cafe_id>/products/` in Cloudinary; secure URL saved to MongoDB. *(Pending live Cloudinary credentials)*.
- [ ] **TEST 9: Create Table in Tables**  
  *Expected:* Table persists with automatically generated cryptographically unguessable QR token.
- [ ] **TEST 10: Generate & View Table QR Code**  
  *Expected:* High-res QR code renders, points to `https://cafe.yourdomain.com/t/<token>`, and downloads as PNG.
- [ ] **TEST 11: Open Table QR URL (`/t/<token>`) on Mobile**  
  *Expected:* Resolves to correct café and table number; redirects to digital menu with table bound.
- [ ] **TEST 12: Place Customer Order from Cart**  
  *Expected:* Order prices, taxes, and subtotals calculated server-side; order persists in MongoDB Atlas.
- [ ] **TEST 13: Admin Receives Order Notification via Ably**  
  *Expected:* Real-time `NEW_ORDER` card appears in Café Admin `/orders` without manual browser refresh. *(Pending live Ably credentials)*.
- [ ] **TEST 14: Admin Advances Status (`PLACED` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `COMPLETED`)**  
  *Expected:* Status change persists in MongoDB; Ably publishes status event.
- [ ] **TEST 15: Customer Sees Status Updates Live**  
  *Expected:* Customer order tracking modal updates in real-time. *(Pending live Ably credentials)*.
- [ ] **TEST 16: Cross-Tenant Isolation Verification**  
  *Expected:* Café A credentials attempting to access Café B's products, categories, tables, or orders receives HTTP 403 / HTTP 404.

---

## 10. Database Indexes & Verification

The application automatically creates and verifies indexes on startup via `create_indexes()` in `backend/app/core/database.py`:

| Collection | Index Fields | Properties | Purpose |
|---|---|---|---|
| `cafes` | `subdomain` (ASC) | Unique | Fast tenant resolution by subdomain |
| `cafes` | `cafe_id` (ASC) | Unique | Fast lookup and primary tenant key |
| `users` | `email` (ASC) | Unique | Uniqueness constraint on user accounts |
| `users` | `cafe_id` (ASC) | Standard | Fast user lookup per tenant |
| `categories` | `cafe_id` (ASC) | Standard | Multi-tenant category queries |
| `categories` | `cafe_id` + `name` (ASC) | Standard | Category lookup and duplicate prevention |
| `categories` | `cafe_id` + `display_order` (ASC) | Standard | Ordered category menu queries |
| `products` | `cafe_id` (ASC) | Standard | Multi-tenant product queries |
| `products` | `cafe_id` + `category_id` (ASC) | Standard | Filter products by category |
| `products` | `cafe_id` + `is_available` (ASC) | Standard | Filter available menu items |
| `tables` | `cafe_id` + `table_number` (ASC) | Unique | Prevent duplicate table numbers within café |
| `tables` | `qr_token` (ASC) | Unique | Fast, cryptographically secure QR table resolution |
| `tables` | `cafe_id` (ASC) | Standard | Multi-tenant table queries |
| `orders` | `cafe_id` (ASC) | Standard | Multi-tenant order queries |
| `orders` | `cafe_id` + `order_status` (ASC) | Standard | Filter active/pending/completed orders |
| `orders` | `cafe_id` + `created_at` (ASC) | Standard | Chronological order history queries |
| `orders` | `order_reference` (ASC) | Unique | Secure unguessable order tracking lookup |
| `orders` | `cafe_id` + `idempotency_key` (ASC) | Sparse | Prevent duplicate order submission |

---

## 11. CORS & Hostname Security Configuration

The FastAPI backend dynamically computes CORS origins based on `APP_DOMAIN` and `ENVIRONMENT`:

- **Development (`ENVIRONMENT=development`)**:
  - `cors_origin_regex = r"^https?://([a-zA-Z0-9-]+\.)?(localhost|127\.0\.0\.1)(:[0-9]+)?$"`
  - Allows `localhost:3000`, `127.0.0.1:3000`, `cafe1.localhost:3000`, etc.
- **Production (`ENVIRONMENT=production`)**:
  - `cors_origin_regex = rf"^https://([a-zA-Z0-9-]+\.)?{re.escape(clean_domain)}$"`
  - Allows `https://yourdomain.com` and all subdomains `https://*.yourdomain.com`.
  - Rejects untrusted third-party domains (e.g., `attacker.com`).

---

## 12. Troubleshooting Guide

### Issue 1: CORS Error on Subdomain API Calls
- **Symptom:** Browser blocks fetch request with `No 'Access-Control-Allow-Origin' header is present`.
- **Cause:** `APP_DOMAIN` in backend environment does not match the apex domain (e.g. `APP_DOMAIN` set to `localhost` in production).
- **Fix:** Ensure backend Vercel project has `APP_DOMAIN=yourdomain.com` (without `https://` and without port). Ensure `ENVIRONMENT=production`.

### Issue 2: MongoDB Connection Timeout (`ServerSelectionTimeoutError`)
- **Symptom:** Backend returns 500 or health check reports `"database": "unreachable"`.
- **Cause:** Atlas Network Access IP whitelist is blocking Vercel serverless functions.
- **Fix:** In MongoDB Atlas > Network Access, add `0.0.0.0/0` (Allow Access from Anywhere) and verify database user credentials in `MONGODB_URI`.

### Issue 3: Subdomain Not Resolving to Café Menu
- **Symptom:** `cafe1.yourdomain.com` shows Platform Landing Page instead of Café Menu.
- **Cause:** `NEXT_PUBLIC_DOMAIN` in frontend environment is missing or does not match `yourdomain.com`.
- **Fix:** Set `NEXT_PUBLIC_DOMAIN=yourdomain.com` in frontend Vercel project settings and redeploy.

### Issue 4: Cloudinary Upload Fails (HTTP 502 / 503)
- **Symptom:** Uploading product image returns `Cloudinary image service is not configured` or `Failed to upload image`.
- **Cause:** Missing or incorrect `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, or `CLOUDINARY_API_SECRET` in backend Vercel project.
- **Fix:** Check backend Vercel environment variables and verify credentials in Cloudinary dashboard.

### Issue 5: Real-time Order Events Not Received in Admin
- **Symptom:** Café Admin `/orders` page requires manual refresh to see new orders.
- **Cause:** `ABLY_API_KEY` is missing or invalid in backend, preventing token generation or publishing.
- **Fix:** Set valid `ABLY_API_KEY` in backend Vercel project. Check browser DevTools network tab for `/api/realtime/token` response.

---

## 13. External Service Status

| Service | Status | Verification Detail |
|---|---|---|
| **Code Implementation** | `CODE VERIFIED` | Next.js build passed (0 errors), 35 backend tests passed (100%), full end-to-end typing. |
| **MongoDB Atlas** | `CODE VERIFIED` | Connection handling, multi-tenant queries, and compound indexes configured and verified. Live connection pending production URI. |
| **Cloudinary** | `CODE VERIFIED` | Service abstraction, MIME/size validation, replacement, and deletion code verified. Live upload pending user credentials. |
| **Ably Realtime** | `CODE VERIFIED` | Scoped token generation, channel subscriptions, reconnect reconciliation, and fallbacks code verified. Live stream pending user credentials. |
| **Vercel Frontend** | `CODE VERIFIED` | App Router, Turbopack, and dynamic proxy routing verified via `npm run build`. Live deployment pending user action. |
| **Vercel Backend** | `CODE VERIFIED` | `vercel.json` configured for `@vercel/python`, entrypoint `app/main.py` verified. Live deployment pending user action. |
| **Custom Domain & DNS** | `CODE VERIFIED` | Hostname parsing and wildcard regex verified. A and CNAME records must be configured in DNS by user. |

---

## 14. Security Checklist

- [x] Zero secrets committed to Git (`.gitignore` covers `.env`, `.env.local`, `backend/.env`).
- [x] `CLOUDINARY_API_SECRET`, `ABLY_API_KEY`, `MONGODB_URI`, and `JWT_SECRET` are backend-only.
- [x] Hostname resolution rejects arbitrary domains (`attacker.com`).
- [x] CORS rejects unauthorized third-party origins.
- [x] Server calculates all prices, subtotals, and taxes authoritative from database.
- [x] Orders are idempotent via `idempotency_key`.
- [x] Order references use unguessable tokens preventing enumeration.
- [x] Public endpoints have sliding-window rate limiting.
- [x] Production security headers injected on frontend and backend responses.

