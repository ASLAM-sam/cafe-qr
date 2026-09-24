# System Architecture — Multi-Tenant Cafe QR Ordering SaaS

This document outlines the verified production architecture, operational limits, security guarantees, and scalability model of the **Cafe QR Ordering SaaS Platform**.

Target Workload: Initial business capacity of approximately 10 independent cafes operating concurrently.

---

## High-Level Architecture Diagram

```text
                                 [ CUSTOMER ]               [ CAFE ADMIN ]              [ PLATFORM ADMIN ]
                                      |                           |                             |
                                      | (Scans QR / Orders)       | (Manages Orders/Menu)       | (Manages Platform)
                                      v                           v                             v
                        +-------------------------------------------------------------------------------+
                        |                    Next.js 16 App Router (Vercel Frontend)                    |
                        |                                                                               |
                        |   - Hostname / Subdomain Tenant Resolution (TenantContext)                    |
                        |   - mydomain.com (Platform Landing) & mydomain.com/admin (Platform Admin)    |
                        |   - cafe.mydomain.com (Customer Menu) & cafe.mydomain.com/admin (Cafe Admin)  |
                        |   - Mobile-First Cart & Checkout (CartContext)                                |
                        |   - Real-Time Customer Order Tracking (useCustomerOrderRealtime)              |
                        |   - Real-Time Cafe Order Dashboard (useCafeOrderRealtime)                     |
                        +-------------------------------------------------------------------------------+
                                                              |
                                                              | HTTPS / REST API
                                                              v
                        +-------------------------------------------------------------------------------+
                        |                       FastAPI Backend (Python 3.11+ / 3.12)                   |
                        |                                                                               |
                        |   - Authentication & JWT Session Management (HTTP-only Cookies / Bearer)      |
                        |   - Multi-Tenant Scoping (cafe_id enforced on every query & mutation)         |
                        |   - Server-Authoritative Price, Tax, & Subtotal Calculation                   |
                        |   - Addon Availability & Selection Constraint Validation                      |
                        |   - Atomic Order Number Generation (MongoDB counters $inc sequence)           |
                        |   - Order State Machine (PLACED -> ACCEPTED -> PREPARING -> READY -> DONE)   |
                        |   - Order Idempotency Engine (Idempotency-Key header & unique index)          |
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
                             | - users                 |   | - Cafe Logos      |   | - order:{ref}      |
                             | - categories            |   | - Optimized WebP/ |   |                    |
                             | - products              |   |   AVIF Delivery   |   |                    |
                             | - tables                |   |                   |   |                    |
                             | - orders                |   |                   |   |                    |
                             | - addon_groups          |   |                   |   |                    |
                             | - counters              |   |                   |   |                    |
                             | - settings              |   |                   |   |                    |
                             +-------------------------+   +-------------------+   +--------------------+
```

---

## 1. Multi-Tenancy & Tenant Isolation

- **Tenant Isolation**: Every tenant-scoped document stores an indexed `cafe_id`. Every single query in repositories and services strictly filters by `cafe_id`.
- **Admin Authentication**: Derived from verified JWT claims (`cafe_id`, `role`, `user_id`). A cafe admin from Cafe A cannot pass or override parameters to access Cafe B.
- **Customer Context**: Derived authoritatively on the server from the cryptographically random 32-character hex `qr_token` table lookup or verified subdomain header. Tampered query parameters cannot switch tenant context.
- **Verification Status**: 🟢 `CODE VERIFIED` & 🟢 `LOCAL VERIFIED` (Confirmed by 10 security test cases in `test_production_security.py` and `test_tenant_isolation.py`).

---

## 2. Serverless MongoDB Connection Pooling

FastAPI runs on Vercel Serverless (AWS Lambda microVMs):
- **Client Caching**: `_client` is initialized at module scope and reused across warm invocations within the same container instance.
- **Pool Sizing**:
  - `maxPoolSize=10`: Restricts connection count *per serverless execution instance*.
  - `minPoolSize=1`: Keeps 1 warm connection active per container to avoid handshake latency on warm calls.
  - `maxIdleTimeMS=45000`: Automatically prunes idle connections after 45 seconds.
  - `serverSelectionTimeoutMS=5000`: Fails fast rather than hanging indefinitely during network partitions.
- **Architectural Reality**: `maxPoolSize=10` is an instance-level limit, not a global cluster-level ceiling. If Vercel spawns $N$ concurrent containers, total potential open connections = $N \times 10$. For the planned 10-cafe workload (low-concurrency operations), this is technically sound; under high-concurrency burst traffic (>50 concurrent instances), a connection gateway or proxy would be required to prevent hitting cluster connection limits.
- **Verification Status**: 🟢 `CODE VERIFIED`.

---

## 3. Database Indexes

Every critical query path is supported by compound indexes:
- `orders`:
  - `{"cafe_id": 1, "order_number": 1}` (Unique per cafe)
  - `{"cafe_id": 1, "created_at": -1}` (Admin chronological order sorting)
  - `{"cafe_id": 1, "order_status": 1}` (Status filtering)
  - `{"order_reference": 1}` (Unique customer tracking token)
  - `{"cafe_id": 1, "idempotency_key": 1}` (Sparse unique idempotency check)
- `addon_groups`:
  - `{"cafe_id": 1, "addon_group_id": 1}` (Unique per cafe)
  - `{"cafe_id": 1, "product_ids": 1}` (Fast menu pre-fetching)
  - `{"cafe_id": 1, "display_order": 1}`
- `products`:
  - `{"cafe_id": 1, "product_id": 1}` (Unique per cafe)
  - `{"cafe_id": 1, "category_id": 1, "is_available": 1}`
- `categories`:
  - `{"cafe_id": 1, "category_id": 1}` (Unique per cafe)
  - `{"cafe_id": 1, "is_active": 1, "display_order": 1}`
- `tables`:
  - `{"qr_token": 1}` (Unique public scan token)
  - `{"cafe_id": 1, "table_number": 1}` (Unique table number per cafe)
- `users`:
  - `{"username": 1}` (Sparse unique)
  - `{"email": 1}` (Sparse unique)
  - `{"cafe_id": 1, "role": 1}`
- `counters`:
  - `_id` (`order_seq_{cafe_id}`)
- **Verification Status**: 🟢 `CODE VERIFIED`.

---

## 4. Order Concurrency & Atomic Sequences

- **Atomic Sequence Counter**: Order numbers are generated using native MongoDB `find_one_and_update` with `$inc: {"seq": 1}`, `upsert=True`, and `ReturnDocument.AFTER` on `counters` documents (`_id: "order_seq_{cafe_id}"`).
- **Database-Enforced Uniqueness**: Enforced by compound unique index `{"cafe_id": 1, "order_number": 1}`. If a collision attempt occurs, MongoDB raises a `DuplicateKeyError` (E11000) rather than allowing duplicate data.
- **Local Concurrency Verification**: 100 simultaneous concurrent tasks generated 100 completely unique sequential order numbers without collisions (`test_order_number_atomic_concurrency` in `test_order_concurrency.py`).
- **Verification Status**: 🟢 `CODE VERIFIED` & 🟢 `LOCAL VERIFIED`.

---

## 5. Order Idempotency

- Supported via `idempotency_key` field in the JSON body or `Idempotency-Key` HTTP request header.
- If a customer double-clicks "Place Order" or a network retry resends the same key, the server detects the existing order and returns it with HTTP 200/201 without creating duplicate records.
- Verified in `test_order_idempotency_duplicate_protection`.
- **Verification Status**: 🟢 `CODE VERIFIED` & 🟢 `LOCAL VERIFIED`.

---

## 6. Server-Side Price & Add-on Rule Validation

- **Client Prices Ignored**: The backend fetches product base prices and add-on option prices directly from MongoDB. Client-supplied totals and prices are discarded.
- **Add-on Rule Enforcement**:
  - Validates that every selected add-on belongs to the cafe.
  - Rejects inactive add-on options (`is_available == False`) with HTTP 400.
  - Enforces `min_selections` and `max_selections` bounds per group.
  - Validates that required add-on groups (`is_required == True` or `min_selections >= 1`) attached to ordered products are satisfied.
- **Historical Snapshots**: Order documents store complete snapshots of `product_name`, `unit_price`, `quantity`, and an embedded array of `addons` (`addon_group_name`, `addon_item_name`, `price`). Deleting or updating a menu item or add-on does not alter historical orders.
- **Verification Status**: 🟢 `CODE VERIFIED` & 🟢 `LOCAL VERIFIED`.

---

## 7. Real-Time Order Updates (Ably)

- **Channel Isolation**:
  - Cafe Admin: `cafe:{cafe_id}:orders` (requires JWT authentication with capability limited to this channel).
  - Customer Tracking: `order:{order_reference}` (requires capability token limited to this single order reference).
- **Persistence First**: Orders are saved to MongoDB Atlas authoritatively before publishing to Ably. If Ably disconnects or fails, order placement succeeds and clients reconcile state via REST API endpoints.
- **Scope Note**: KDS (Kitchen Display System) is strictly out of scope; realtime channels serve Cafe Admin order views and Customer order tracking.
- **Verification Status**: 🟢 `CODE VERIFIED` & 🟢 `LOCAL VERIFIED`.

---

## 8. Media & Image Architecture (Cloudinary)

- **Upload Security**: Server-validated MIME types (`image/jpeg`, `image/png`, `image/webp`), 5MB size limit, tenant-scoped folders `cafes/{cafe_id}/products/`.
- **Delivery Optimization**: Cloudinary CDN delivers `f_auto` and `q_auto` modern formats (WebP/AVIF). Next.js `<Image>` component handles responsive `deviceSizes` and `imageSizes`.
- **Verification Status**: 🟢 `CODE VERIFIED` & 🟢 `LOCAL VERIFIED`.

---

## 9. CORS Policy

- **Strict Scoping**: Wildcard `*.vercel.app` is strictly prohibited when `allow_credentials=True`.
- **Allowed Origins**: Explicitly includes configured frontend origins, `https://cafe-qr-seven.vercel.app`, and subdomains strictly matching verified application domains (`clean_domain`, `frontend_domain`). Arbitrary third-party Vercel deployments are rejected.
- **Verification Status**: 🟢 `CODE VERIFIED` & 🟢 `LOCAL VERIFIED`.

---

## 10. Empirical Production Performance & Latency

Empirical measurements conducted directly against live Vercel deployments (`https://cafe-qr-seven.vercel.app` and `https://cafe-qr-backend.vercel.app`):

| Endpoint | Method | Samples | Average Latency | P50 Latency | P95 Latency | P99 Latency | Status |
|---|---|---|---|---|---|---|---|
| `https://cafe-qr-seven.vercel.app` | `GET` | 10 | 1,047.4 ms | 1,099.2 ms | 1,626.1 ms | 1,626.1 ms | 🟢 `PRODUCTION VERIFIED` |
| `https://cafe-qr-backend.vercel.app/api/health` | `GET` | 10 | 1,047.9 ms | 793.6 ms | 2,178.3 ms | 2,178.3 ms | 🟢 `PRODUCTION VERIFIED` |
| `https://cafe-qr-backend.vercel.app/api/public/categories` | `GET` | 10 | 1,375.4 ms | 1,470.1 ms | 2,517.9 ms | 2,517.9 ms | 🟢 `PRODUCTION VERIFIED` |
| `https://cafe-qr-backend.vercel.app/api/auth/login` | `POST` | 10 | 1,443.6 ms | 1,190.1 ms | 2,745.5 ms | 2,745.5 ms | 🟢 `PRODUCTION VERIFIED` |
| `https://cafe-qr-backend.vercel.app/api/orders` | `GET` | 10 | 845.2 ms | 755.9 ms | 1,706.2 ms | 1,706.2 ms | 🟢 `PRODUCTION VERIFIED` |

**Performance Reality**:
- Python Serverless functions on Vercel exhibit cold starts (300ms–1500ms) and warm round-trip latencies of 500ms–1500ms when making SSL-encrypted remote database calls to MongoDB Atlas across cloud regions.
- Claims of "sub-50ms execution" are unsupported and retracted.
- MongoDB Atlas M0 capacity: Theoretical operations-per-second claims (e.g. 100–1500+ ops/sec) are unverified on shared clusters; live throughput depends on cluster tier and CPU credits. 🟡 `NOT BENCHMARKED` under synthetic load.

---

## 11. Architectural Decisions

1. **Redis**: **NOT NEEDED NOW**. MongoDB atomic operations (`find_one_and_update` with `$inc`), unique indexes, and Ably real-time pub/sub satisfy all sequencing, locking, and pub/sub requirements without the operational cost and complexity of a Redis cluster.
2. **Message Queues (Celery/RabbitMQ/Kafka)**: **NOT NEEDED NOW**. Real-time notifications and image processing are asynchronous or offloaded to Cloudinary CDN and Ably. Serverless functions cannot run persistent background workers.
3. **Microservices**: **NOT NEEDED NOW**. The modular monolith structure with domain repositories and services is simpler, more reliable, and free of distributed transaction failures.
