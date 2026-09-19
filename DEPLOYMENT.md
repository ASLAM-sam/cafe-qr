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

## 6. Custom Domain & Wildcard DNS Configuration

To enable multi-tenant cafés (`cafe.yourdomain.com`) on a single frontend:

1. In Vercel Project Settings > **Domains**, add:
   - `yourdomain.com` (Root platform domain)
   - `*.yourdomain.com` (Wildcard domain for all café subdomains)
2. In your DNS Provider (e.g. Cloudflare, Route 53, Namecheap), add:

| Type | Name / Host | Target / Value | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` (or Vercel CNAME) | Auto |
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto |
| `CNAME` | `*` | `cname.vercel-dns.com` | Auto |
| `CNAME` | `api` | Points to Vercel Backend Project | Auto |

---

## 7. Production Verification Checklist

- [ ] **Platform Website**: `https://yourdomain.com` renders the platform landing page.
- [ ] **Platform Admin**: `https://yourdomain.com/admin` renders the platform admin dashboard.
- [ ] **Café Customer Menu**: `https://cafe.yourdomain.com` loads the café's branding and active menu.
- [ ] **Café Admin**: `https://cafe.yourdomain.com/admin` prompts for login and opens the café dashboard.
- [ ] **Product Photo Upload**: Uploading an image in Menu > Products uploads to Cloudinary and displays properly.
- [ ] **QR Code Generation**: Table QR code generates and opens `https://cafe.yourdomain.com/t/<token>`.
- [ ] **Order Placement**: Placing a customer order computes prices server-side and persists to MongoDB.
- [ ] **Live Notification**: Café Admin orders page updates via Ably in real-time with zero page refresh.
- [ ] **Status Transition**: Changing order status updates customer's order tracking modal live.
- [ ] **Tenant Isolation**: Café A credentials cannot view or mutate Café B's products, tables, or orders.

---

## 8. Security Checklist

- [ ] Never commit `.env` or `.env.local` files to Git.
- [ ] Ensure `CLOUDINARY_API_SECRET`, `ABLY_API_KEY`, `MONGODB_URI`, and `JWT_SECRET` are only present in backend environment variables.
- [ ] Confirm CORS settings restrict API requests to your domains.
- [ ] Check that all customer inputs are validated on the server.
