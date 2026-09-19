# System Architecture — Multi-Tenant Café QR Ordering SaaS

This document outlines the end-to-end production architecture of the **Café QR Ordering SaaS Platform**.

---

## High-Level Architecture Diagram

```text
                                 [ CUSTOMER ]               [ CAFÉ ADMIN ]              [ PLATFORM ADMIN ]
                                      |                           |                             |
                                      | (Scans QR / Orders)       | (Manages Orders/Menu)       | (Manages Platform)
                                      v                           v                             v
                        +-------------------------------------------------------------------------------+
                        |                    Next.js App Router (Vercel Frontend)                       |
                        |                                                                               |
                        |   - Hostname / Subdomain Tenant Resolution (TenantContext)                    |
                        |   - mydomain.com (Platform Landing) & mydomain.com/admin (Platform Admin)    |
                        |   - cafe.mydomain.com (Customer Menu) & cafe.mydomain.com/admin (Café Admin)  |
                        |   - Mobile-First Cart & Checkout (CartContext)                                |
                        |   - Real-Time Customer Order Tracking (useCustomerOrderRealtime)              |
                        |   - Real-Time Café Order Dashboard (useCafeOrderRealtime)                     |
                        +-------------------------------------------------------------------------------+
                                                              |
                                                              | HTTPS / REST API
                                                              v
                        +-------------------------------------------------------------------------------+
                        |                       FastAPI Backend (Python 3.11)                           |
                        |                                                                               |
                        |   - Authentication & JWT Session Management (HTTP-only Cookies)               |
                        |   - Multi-Tenant Scoping (cafe_id enforced on every query & mutation)         |
                        |   - Server-Authoritative Price, Tax, & Subtotal Calculation                   |
                        |   - Order State Machine (PLACED -> ACCEPTED -> PREPARING -> READY -> DONE)   |
                        |   - Order Idempotency Engine                                                  |
                        |   - Cloudinary Backend Service (MIME/Size Validation, Scoped Folders)         |
                        |   - Ably Real-Time Publisher (Authoritative DB Write First, Scoped Channels)  |
                        +-------------------------------------------------------------------------------+
                                          |                           |                     |
                   Authoritative Storage  |        Image Assets / CDN |  Real-Time Events   |
                                          v                           v                     v
                             +-------------------------+   +-------------------+   +--------------------+
                             |      MongoDB Atlas      |   |    Cloudinary     |   |    Ably Realtime   |
                             |                         |   |                   |   |                    |
                             | - cafes                 |   | - Product Photos  |   | - cafe:{id}:orders |
                             | - users                 |   | - Café Logos      |   | - order:{ref}      |
                             | - categories            |   | - Optimized WebP/ |   |                    |
                             | - products              |   |   JPEG Delivery   |   |                    |
                             | - tables                |   |                   |   |                    |
                             | - orders                |   |                   |   |                    |
                             +-------------------------+   +-------------------+   +--------------------+
```

---

## 1. Multi-Tenancy & Routing

- **Unified Single Codebase**: One frontend, one backend, one database cluster, one Cloudinary account, and one Ably account.
- **Tenant Scoping**: All café data is strictly scoped by `cafe_id`.
- **Hostname-Based Routing**:
  - `mydomain.com` -> Platform Landing Website.
  - `mydomain.com/admin` -> Platform Owner Dashboard.
  - `cafe.mydomain.com` -> Public Café Customer Ordering Website.
  - `cafe.mydomain.com/admin` -> Private Café Owner/Manager Dashboard.
  - `cafe.mydomain.com/t/<token>` -> Direct Table QR Code entry.

---

## 2. Real-Time Order Stream (Ably)

- **Channel Structure**:
  - Café Admin Channel: `cafe:{cafe_id}:orders`
  - Customer Order Tracking Channel: `order:{order_reference}`
- **Security & Scoped Tokens**:
  - Admin clients authenticate via `/api/realtime/token` which grants subscribe capabilities restricted strictly to `cafe:{cafe_id}:orders`.
  - Customer tracking clients authenticate via `/api/realtime/customer-token/{order_reference}` which grants subscribe capability restricted strictly to `order:{order_reference}`.
  - Backend API secrets (`ABLY_API_KEY`) are never exposed to browsers.
- **Persistence First**:
  - Every order creation or status change is **persisted authoritatively to MongoDB Atlas** before publishing to Ably.
  - If Ably is temporarily unreachable, the database order succeeds without failing the customer or admin request.
- **Event Deduplication & State Reconciliation**:
  - Frontend uses `order_id` as the stable identity to prevent duplicate entries.
  - When the Ably connection reconnects, the frontend automatically re-fetches authoritative data from the REST API to reconcile any missed events.

---

## 3. Media & Image Architecture (Cloudinary)

- **Backend-Mediated Uploads**:
  - Browser uploads files directly to FastAPI endpoints (`POST /api/products/{id}/image` or `POST /api/products/upload-image`).
  - The backend validates MIME type (`image/jpeg`, `image/png`, `image/webp`), extension, and file size (≤ 5MB).
  - The backend uses the official Cloudinary Python SDK to store images in tenant-isolated folders: `cafes/{cafe_id}/products/`.
  - Cloudinary credentials (`CLOUDINARY_API_SECRET`) remain strictly backend-only.
- **Replacement & Deletion Safety**:
  - When replacing a product photo, the new image is uploaded and database record updated before the old Cloudinary asset is removed.
  - When a product is deleted, the associated Cloudinary asset is safely cleaned up.
  - Tenant boundary validation prevents any café from deleting another café's assets.

---

## 4. Security & Isolation Matrix

| Layer | Enforcement Mechanism | Failure Mode |
|---|---|---|
| **Multi-Tenancy** | Database queries scoped by authenticated `cafe_id` | HTTP 403 Forbidden / HTTP 404 Not Found |
| **Pricing & Taxes** | Calculated authoritatively on backend from MongoDB; client totals ignored | Tampered client prices overwritten |
| **Order Idempotency** | `idempotency_key` unique index and retrieval check | Duplicate order creation rejected |
| **Image Uploads** | Server-side MIME/magic byte inspection + 5MB size limit | HTTP 400 Bad Request |
| **Secrets** | Zero private credentials in `NEXT_PUBLIC_*` or git | Strictly enforced in `.gitignore` |
