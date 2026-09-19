# Cafe QR Ordering SaaS

## Master Project Specification & Development Checklist

---

# 1. PROJECT VISION

We are building a **multi-tenant SaaS platform for cafés**.

The platform allows a café owner to purchase/sign up for the service and receive their own café ordering website.

Customers sitting inside the café scan a QR code placed on their table.

The QR code opens that café's digital menu.

The customer can:

* View the menu
* View categories
* View products
* Add products to cart
* Customize basic product options if supported
* Place an order
* See their order status

The café owner/manager can:

* Log in to their dashboard
* Manage their café
* Manage menu categories
* Manage products
* Upload product images
* Manage tables
* Generate/download QR codes
* Receive new orders
* Accept/reject orders
* Update order status
* View current and previous orders
* Manage basic café settings

The system must support **many cafés from the same platform**.

Example:

```text
Our SaaS Platform

        |
        +--- Cafe A
        |
        +--- Cafe B
        |
        +--- Cafe C
        |
        +--- Cafe D
        |
        +--- Cafe 100
```

Each café must have isolated data.

---

# 2. CORE PRODUCT PHILOSOPHY

Keep the system:

* Simple
* Fast
* Mobile-first
* Easy for café owners
* Easy for customers
* Easy to maintain
* Multi-tenant
* Scalable
* Secure

Do NOT unnecessarily turn this into a complicated restaurant ERP/POS system.

---

# 3. FEATURES EXPLICITLY REMOVED

The following features are NOT part of the initial product.

Do NOT implement them unless the project specification is later changed.

⬜ Kitchen Display System / KDS

⬜ Separate Kitchen Role

⬜ Waiter Role

⬜ Cashier Role

⬜ Complex Staff Management

⬜ Room Service

⬜ Multiple Branch Management

⬜ Split Bills

⬜ Call Waiter

⬜ Request Bill

⬜ Loyalty System

⬜ Customer Rewards

⬜ Customer Reviews

⬜ Advanced Inventory

⬜ Ingredient Inventory

⬜ Low-stock ingredient tracking

⬜ AI demand forecasting

⬜ Complex restaurant POS

⬜ Accounting system

⬜ Complex audit-log system

⬜ Hotel management

⬜ Native Android application

⬜ Native iOS application

The first product is a **web-based QR ordering system**.

---

# 4. TECHNOLOGY STACK

## Frontend

Use:

* Next.js
* TypeScript
* Tailwind CSS

The frontend contains:

1. Customer ordering website
2. Café admin dashboard
3. Authentication pages
4. Café settings pages

---

## Backend

Use:

* FastAPI
* Python

Backend responsibilities:

* Authentication
* Café management
* User management
* Menu management
* Table management
* QR management
* Order management
* Order status
* Image integration
* Payment integration when implemented
* Tenant isolation
* Validation
* Security

---

## Database

Use:

**MongoDB Atlas**

MongoDB stores structured application data.

Do NOT store actual image files inside MongoDB.

---

## Image Storage

Use:

**Cloudinary**

Cloudinary stores:

* Product images
* Café logo
* Café banner
* Other allowed café assets

MongoDB stores only the Cloudinary URL/public ID and related metadata.

Example:

```text
MongoDB:

image_url:
https://res.cloudinary.com/...

Cloudinary:

actual image file
```

---

## Hosting

Use:

**Vercel**

Vercel hosts:

* Next.js frontend
* FastAPI backend/API where appropriate

---

## Domain

Use one main platform domain.

Example:

```text
ourplatform.com
```

Café websites use subdomains:

```text
cafename.ourplatform.com
```

Example:

```text
brewhouse.ourplatform.com
mochacafe.ourplatform.com
coffeebeans.ourplatform.com
```

All cafés use the same application/codebase.

---

## Payments

Online payment gateways (such as Razorpay) are intentionally removed from scope. The platform operates on direct café-to-customer ordering with pay-at-counter or pay-on-delivery managed by the café.

---

# 5. MULTI-TENANT ARCHITECTURE

This is one of the most important requirements.

We are NOT creating separate projects for every café.

Wrong:

```text
Cafe A → separate project
Cafe B → separate project
Cafe C → separate project
```

Correct:

```text
                 ONE PLATFORM
                     |
              ONE CODEBASE
                     |
              ONE BACKEND
                     |
              SHARED DATABASE
                     |
        +------------+------------+
        |            |            |
      Cafe A       Cafe B       Cafe C
```

Every café gets its own tenant.

Each café has a unique:

```text
cafe_id
```

Example:

```text
cafe_001
cafe_002
cafe_003
```

All café-specific database records must contain the appropriate `cafe_id`.

Example:

```json
{
  "name": "Cappuccino",
  "price": 160,
  "cafe_id": "cafe_001"
}
```

Another café:

```json
{
  "name": "Cappuccino",
  "price": 190,
  "cafe_id": "cafe_002"
}
```

The application must NEVER allow Cafe 001 to access Cafe 002's data.

---

# 6. CAFÉ CREATION

Each customer/business represents a café.

A café record should contain information such as:

```text
cafe_id
name
slug
subdomain
logo
description
phone
email
address
currency
tax settings
status
created_at
updated_at
```

Example:

```text
Cafe ID:
cafe_001

Name:
Brew House

Subdomain:
brewhouse

Website:
brewhouse.ourplatform.com
```

---

# 7. CUSTOMER WEBSITE

Every café gets the same application template.

The content changes based on the café.

Example:

```text
brewhouse.ourplatform.com
```

loads:

```text
Brew House
Brew House logo
Brew House categories
Brew House products
Brew House settings
```

Another:

```text
mochacafe.ourplatform.com
```

loads:

```text
Mocha Cafe
Mocha Cafe logo
Mocha Cafe categories
Mocha Cafe products
Mocha Cafe settings
```

The code remains the same.

Only the tenant data changes.

---

# 8. CUSTOMER QR FLOW

Every café table gets a unique QR code.

Example:

```text
Cafe:
Brew House

Table:
7

QR:
unique table token
```

Customer scans QR.

Flow:

```text
Scan QR
    ↓
Open café website
    ↓
Identify café
    ↓
Identify table
    ↓
Display menu
    ↓
Customer selects products
    ↓
Cart
    ↓
Customer places order
    ↓
Order saved
    ↓
Manager dashboard receives order
    ↓
Manager updates order status
    ↓
Customer sees updated status
```

---

# 9. QR CODE ARCHITECTURE

Each table needs a unique identifier/token.

Do NOT rely only on:

```text
/table/7
```

Use a secure unique table token.

Example:

```text
/t/8F72KLMQ
```

Backend maps that token to:

```text
Cafe:
cafe_001

Table:
table_007
```

QR codes should be generated by the platform.

Admin should be able to:

* Generate QR
* View QR
* Download QR
* Print QR
* Regenerate QR if necessary

---

# 10. TABLE MANAGEMENT

Each café can create its tables.

Example:

```text
Tables

Table 1
Table 2
Table 3
Table 4
Table 5
...
Table 20
```

Table record:

```text
table_id
cafe_id
table_number
qr_token
status
created_at
updated_at
```

Initial statuses can be simple:

```text
Available
Occupied
```

Do not build complicated table-state logic initially.

---

# 11. DIGITAL MENU

Every café has its own menu.

Menu structure:

```text
Cafe
   |
   +--- Categories
   |
   +--- Products
```

Example:

```text
Coffee
    Cappuccino
    Latte
    Espresso

Burgers
    Chicken Burger
    Veg Burger

Desserts
    Brownie
    Cheesecake
```

---

# 12. CATEGORY MANAGEMENT

Admin can:

* Create category
* Edit category
* Delete category
* Reorder categories
* Enable/disable category

Category fields:

```text
category_id
cafe_id
name
description
image
display_order
is_active
created_at
updated_at
```

Example:

```text
Coffee
Burgers
Pizza
Desserts
```

---

# 13. PRODUCT MANAGEMENT

Admin can:

* Add product
* Edit product
* Delete product
* Enable/disable product
* Change price
* Upload image
* Change category
* Add description

Product fields:

```text
product_id
cafe_id
category_id
name
description
price
image_url
image_public_id
is_available
display_order
created_at
updated_at
```

---

# 14. PRODUCT AVAILABILITY

Admin should have a simple availability switch.

Example:

```text
Chicken Burger

Available: ON
```

If unavailable:

```text
Chicken Burger

Available: OFF
```

Customer sees:

```text
Chicken Burger
Currently unavailable
```

Customer cannot add unavailable products to the cart.

---

# 15. PRODUCT IMAGES

Images are uploaded to Cloudinary.

Flow:

```text
Admin
   ↓
Select Image
   ↓
Backend validation
   ↓
Cloudinary
   ↓
Cloudinary returns URL
   ↓
MongoDB stores URL
```

Do NOT store binary images in MongoDB.

Images should be optimized before/while uploading where appropriate.

Recommended:

```text
WebP / optimized image
```

The system should avoid unnecessarily large images.

---

# 16. CUSTOMER MENU UI

Customer opens:

```text
brewhouse.ourplatform.com
```

They should see:

```text
Cafe Logo

Brew House

Categories:

Coffee
Burgers
Desserts
Drinks
```

Products:

```text
Cappuccino

₹160

[Image]

Freshly brewed cappuccino

[ Add ]
```

---

# 17. CUSTOMER CART

Customer can:

* Add product
* Remove product
* Increase quantity
* Decrease quantity
* View subtotal
* View total

Example:

```text
Your Cart

Cappuccino × 2       ₹320
Chicken Burger × 1   ₹249
Fries × 1            ₹129

Subtotal              ₹698

Total                 ₹698
```

Keep the first version simple.

---

# 18. CUSTOMER INFORMATION

For the initial system, do not force customers to create an account.

Customer can provide basic information when ordering if required.

Example:

```text
Name:
Aslam

Phone:
XXXXXXXXXX
```

Customer authentication should not be mandatory for basic ordering unless required by the café.

---

# 19. ORDER TYPES

Keep order types simple.

Initial supported types:

### Dine-in

```text
Table 7
```

### Takeaway

```text
Takeaway
```

### Counter order

A café admin/manager can manually create an order later if this feature is implemented.

Room service is NOT part of the initial version.

---

# 20. ORDER CREATION

When customer clicks:

```text
Place Order
```

backend must:

1. Validate café
2. Validate table/token
3. Validate products
4. Validate prices from database
5. Validate availability
6. Calculate totals server-side
7. Create order
8. Create order items
9. Assign order number
10. Save order
11. Notify dashboard
12. Return order confirmation

Never trust the customer's submitted price.

Example:

Customer sends:

```text
price: ₹1
```

for a ₹160 product.

Backend must ignore the submitted price and retrieve the real price from the database.

---

# 21. ORDER DATABASE STRUCTURE

Order:

```text
order_id
order_number
cafe_id
table_id
order_type
customer_name
customer_phone
items
subtotal
tax
discount
total
payment_status
order_status
created_at
updated_at
```

Order items:

```text
product_id
product_name
quantity
unit_price
subtotal
```

Store the product name and price at the time of order so historical orders remain accurate even if the product changes later.

---

# 22. ORDER NUMBER

Customer-facing order number should be simple.

Example:

```text
#1042
```

The internal database ID should remain separate.

Do not expose MongoDB ObjectIDs as customer order numbers.

---

# 23. ORDER STATUS

Keep the status system simple.

Initial status:

```text
PLACED
```

Manager can change to:

```text
ACCEPTED
```

Then:

```text
PREPARING
```

Then:

```text
READY
```

Then:

```text
COMPLETED
```

Cancelled orders:

```text
CANCELLED
```

Flow:

```text
PLACED
  ↓
ACCEPTED
  ↓
PREPARING
  ↓
READY
  ↓
COMPLETED
```

Cancellation:

```text
PLACED
  ↓
CANCELLED
```

Only valid status transitions should be allowed.

---

# 24. CUSTOMER ORDER TRACKING

After placing an order, customer receives an order tracking page.

Example:

```text
Order #1042

Table 7

✓ Order Placed
✓ Order Accepted
● Preparing
○ Ready
○ Completed
```

Customer should be able to refresh or receive live updates depending on the real-time implementation.

---

# 25. ADMIN / MANAGER DASHBOARD

Each café owner has a private dashboard.

Example:

```text
Brew House Dashboard

Today's Orders: 42

Pending: 4

Preparing: 6

Ready: 3

Completed: 29
```

Dashboard sections:

```text
Dashboard
Orders
Menu
Categories
Products
Tables
QR Codes
Settings
```

Keep navigation simple.

---

# 26. NEW ORDER NOTIFICATION

When an order is placed:

Manager dashboard should immediately show:

```text
🔔 NEW ORDER

#1042

Table 7

2 × Cappuccino
1 × Chicken Burger
1 × Fries

Total: ₹698

[ Accept ]
```

The manager should not have to manually refresh the page if real-time functionality is implemented.

---

# 27. REAL-TIME ORDER UPDATES

Preferred approach:

```text
WebSocket / real-time mechanism
```

Flow:

```text
Customer
    ↓
POST /orders
    ↓
FastAPI
    ↓
MongoDB
    ↓
Order event
    ↓
Manager dashboard
    ↓
New order appears
```

When manager changes status:

```text
Manager
   ↓
Update order
   ↓
Backend
   ↓
MongoDB
   ↓
Customer tracking page
   ↓
Updated status
```

The exact real-time implementation should be chosen based on Vercel's supported runtime architecture.

---

# 28. ADMIN AUTHENTICATION

Café owner must have a secure login.

Basic flow:

```text
Login
 ↓
Email/username
 ↓
Password
 ↓
Authentication
 ↓
Session/token
 ↓
Dashboard
```

Use secure authentication.

Recommended:

```text
HTTP-only cookies
```

Avoid storing sensitive authentication tokens in insecure browser storage where possible.

---

# 29. USER MODEL

A user belongs to a café.

Example:

```text
user_id
cafe_id
name
email
password_hash
role
status
created_at
updated_at
```

Initial role can simply be:

```text
OWNER / ADMIN
```

Do not build complicated staff roles initially.

---

# 30. TENANT SECURITY

This is CRITICAL.

Every authenticated dashboard request must determine:

```text
Which user is this?
Which cafe does this user belong to?
```

Then all database queries must be scoped to:

```text
cafe_id
```

Example:

```text
User:
user_123

cafe_id:
cafe_001
```

Request:

```text
GET /products
```

Backend internally performs:

```text
GET products WHERE cafe_id = cafe_001
```

Never allow:

```text
GET /products?cafe_id=cafe_002
```

to override the authenticated user's tenant.

The backend must derive tenant identity from authenticated context, not blindly trust client input.

---

# 31. PLATFORM ADMIN

There should be a platform-level admin area for the SaaS owner.

Platform admin can:

* Create café
* View cafés
* Disable café
* View basic platform information
* Manage customer/business accounts
* Manage subscriptions later

This is separate from café admin.

Architecture:

```text
Platform Admin
      |
      +--- Cafe A
      +--- Cafe B
      +--- Cafe C
```

A café owner can only access:

```text
Cafe A
```

---

# 32. CAFÉ ONBOARDING

Initially, café creation can be manual.

Example:

```text
Platform Admin

Create Café

Cafe Name:
Brew House

Owner Name:
Ahmed

Owner Email:
...

Subdomain:
brewhouse

Create
```

System generates:

```text
Cafe ID
Owner account
Subdomain
Default settings
```

Later this can be automated after payment.

---

# 33. AUTOMATED CUSTOMER PURCHASE FLOW — FUTURE

Future flow:

```text
Customer visits platform
        ↓
Selects plan
        ↓
Makes payment
        ↓
Cafe account automatically created
        ↓
Subdomain generated
        ↓
Owner receives login/setup information
        ↓
Owner logs in
        ↓
Adds menu
        ↓
Creates tables
        ↓
Downloads QR codes
        ↓
Starts accepting orders
```

This should be implemented only after the core system works.

---

# 34. SUBDOMAIN SYSTEM

Main platform:

```text
ourplatform.com
```

Café:

```text
brewhouse.ourplatform.com
```

Another:

```text
mochacafe.ourplatform.com
```

The frontend identifies the hostname.

Example:

```text
brewhouse.ourplatform.com
```

↓

```text
subdomain = brewhouse
```

↓

Backend finds:

```text
Cafe where subdomain = brewhouse
```

↓

Loads that café's data.

---

# 35. CUSTOM BRANDING

Each café should be able to have basic branding.

Settings:

```text
Cafe name
Logo
Banner
Description
Phone
Address
Theme settings
```

The same application can therefore look like:

```text
Brew House
```

for one tenant and:

```text
Mocha Cafe
```

for another.

No separate frontend codebase is required.

---

# 36. DATABASE COLLECTIONS

Keep the initial database simple.

Recommended collections:

```text
cafes
users
categories
products
tables
orders
```

Optional later:

```text
payments
subscriptions
notifications
```

Do NOT create dozens of collections without a reason.

---

# 37. DATABASE RELATIONSHIP

Conceptually:

```text
CAFE
 |
 +--- USERS
 |
 +--- CATEGORIES
 |       |
 |       +--- PRODUCTS
 |
 +--- TABLES
 |
 +--- ORDERS
         |
         +--- ORDER ITEMS
```

Every tenant-specific entity must be connected to the café.

---

# 38. DATA ISOLATION EXAMPLE

Cafe A:

```text
cafe_id = cafe_001
```

Cafe B:

```text
cafe_id = cafe_002
```

Products:

```text
Burger A → cafe_001
Burger B → cafe_002
```

When Cafe A requests products:

```text
cafe_id = cafe_001
```

Only Burger A is returned.

This is the core principle of the SaaS architecture.

---

# 39. BACKUPS

Database backups are important because one database may contain many cafés.

We must have:

* Automated MongoDB backups where supported by the selected plan
* Safe deployment practices
* Environment separation
* Database indexes
* Error monitoring
* Recovery strategy

Never assume:

```text
Database = automatically safe forever
```

---

# 40. ENVIRONMENT STRUCTURE

Use separate environments:

```text
Development
Staging
Production
```

Example:

```text
.env.local
.env.staging
Production environment variables
```

Never commit secrets to Git.

---

# 41. ENVIRONMENT VARIABLES

Examples:

```text
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Secrets must only exist in secure environment variables.

Never hardcode them into source code.

---

# 42. ERROR HANDLING

The application must not crash because of one invalid request.

Backend should return proper errors:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

Frontend should display user-friendly messages.

Example:

```text
Something went wrong.
Please try again.
```

Do not expose stack traces to customers.

---

# 43. IMAGE ERROR HANDLING

If Cloudinary upload fails:

```text
Do not create a product with a broken image reference.
```

If an image is deleted:

```text
Database reference must be handled safely.
```

Product management should not become unusable because image upload fails.

---

# 44. ORDER RELIABILITY

Order creation is one of the most important operations.

The backend must ensure:

```text
Customer clicks Place Order
        ↓
Backend validates everything
        ↓
Order saved
        ↓
Confirmation returned
```

Avoid creating duplicate orders if the customer accidentally clicks the button twice.

Use an appropriate idempotency strategy.

---

# 45. PRICE SECURITY

Never trust:

```text
Frontend price
```

Backend must calculate:

```text
Product price from database
×
Quantity
```

Then calculate:

```text
Subtotal
+
Tax if enabled
-
Discount if implemented
=
Total
```

---

# 46. BASIC TAX SUPPORT

Keep this simple.

Cafe settings can optionally contain:

```text
Tax enabled
Tax percentage
```

Example:

```text
Subtotal: ₹500
Tax: ₹25
Total: ₹525
```

Do not build a complete accounting/tax system initially.

---

# 47. ORDER HISTORY

Manager should be able to view:

```text
Today's orders
Previous orders
```

Basic filters:

```text
All
Pending
Preparing
Ready
Completed
Cancelled
```

Optional date filtering can be added.

---

# 48. SEARCH

Admin can search products.

Example:

```text
Search:
Burger
```

Customer menu can also support basic search if desired.

Do not build an advanced search engine.

---

# 49. RESPONSIVE DESIGN

The system is website-only.

Customer experience must be:

**Mobile-first.**

Customers will primarily use:

```text
Mobile phone
```

Manager dashboard should work on:

```text
Desktop
Tablet
Mobile
```

No native mobile app is required.

---

# 50. CUSTOMER EXPERIENCE PRIORITY

The customer flow should be extremely fast.

Ideal:

```text
Scan QR
 ↓
Menu opens
 ↓
Choose food
 ↓
Cart
 ↓
Place order
```

Avoid forcing:

```text
Download app
Create account
Verify email
Verify phone
Set password
```

unless specifically required.

---

# 51. ADMIN EXPERIENCE PRIORITY

Café owner should be able to understand the dashboard without technical knowledge.

Dashboard should clearly show:

```text
Orders
Menu
Tables
QR
Settings
```

Avoid unnecessary technical terminology.

---

# 52. QR PRINTING

Admin should be able to select:

```text
Table 1
Table 2
Table 3
...
```

and download printable QR codes.

Example:

```text
--------------------------------
           BREW HOUSE

             [ QR ]

          TABLE 07

       Scan to Order
--------------------------------
```

---

# 53. SECURITY REQUIREMENTS

Implement:

* Password hashing
* Secure authentication
* HTTP-only cookies where applicable
* CORS configuration
* Input validation
* Tenant isolation
* Rate limiting where appropriate
* Secure environment variables
* Server-side price validation
* Authorization checks
* Protection against unauthorized café access

Never trust frontend data.

---

# 54. PERFORMANCE

The customer menu should load quickly.

Optimize:

* Images
* API responses
* Database queries
* MongoDB indexes
* Next.js rendering/caching where appropriate

Important database indexes may include:

```text
cafe_id
cafe_id + category_id
cafe_id + order_status
cafe_id + created_at
subdomain
qr_token
```

Indexes should be added based on actual query patterns.

---

# 55. LOGGING

Backend should have useful logs.

Example:

```text
Order created
Order status changed
Cloudinary upload failed
Authentication failed
Database error
```

Do not log sensitive information such as:

```text
Passwords
Secrets
Payment credentials
Private tokens
```

---

# 56. MONITORING

Production should eventually have error monitoring.

We should know if:

```text
API is failing
Database connection fails
Order creation fails
Image upload fails
Authentication fails
```

The goal is:

```text
One café has a problem
        ↓
Detect it
        ↓
Fix it
```

rather than discovering the issue only when a café owner complains.

---

# 57. PLATFORM SCALING MODEL

Initial target:

```text
1 café
```

Then:

```text
10 cafés
```

Then:

```text
100 cafés
```

Architecture should not change just because the number of cafés increases.

Use:

```text
ONE CODEBASE
ONE BACKEND
SHARED DATABASE
SHARED IMAGE PLATFORM
TENANT ISOLATION
```

Later, infrastructure can be scaled independently.

---

# 58. IMPORTANT: DO NOT CREATE 100 CODEBASES

Never do:

```text
CafeA-project
CafeB-project
CafeC-project
```

Instead:

```text
ONE APPLICATION
```

The café identity comes from:

```text
subdomain / tenant context
```

Example:

```text
abc.ourplatform.com
```

↓

```text
tenant = abc
```

---

# 59. PLATFORM ADMIN VS CAFÉ ADMIN

Two completely different contexts.

### Platform Admin

Controls the SaaS.

Can see:

```text
All cafés
Users
Subscriptions
Platform status
```

### Café Admin

Controls only their café.

Can see:

```text
Their orders
Their menu
Their tables
Their settings
```

A café admin must NEVER be able to access another café.

---

# 60. DEVELOPMENT PHASES

The project should be developed in controlled phases.

Do NOT ask the coding agent to build everything blindly in one step.

---

# PHASE 1 — PROJECT FOUNDATION

Status:

🟢 Repository structure

🟢 Next.js setup

🟢 TypeScript configuration

🟢 Tailwind setup

⬜ FastAPI setup

⬜ MongoDB connection

⬜ Environment variable structure

⬜ Basic API structure

⬜ Basic error handling

⬜ Git configuration

⬜ Development documentation

---

# PHASE 2 — DATABASE & MULTI-TENANCY

Status:

⬜ Cafe model

⬜ User model

⬜ Category model

⬜ Product model

⬜ Table model

⬜ Order model

⬜ Database indexes

⬜ cafe_id tenant isolation

⬜ Authentication-to-café relationship

⬜ Tenant authorization middleware/dependency

⬜ Test cross-café data isolation

This phase is CRITICAL.

---

# PHASE 3 — AUTHENTICATION

Status:

⬜ Admin login page

⬜ Backend authentication

⬜ Password hashing

⬜ Secure session/token handling

⬜ Protected dashboard routes

⬜ Logout

⬜ Unauthorized handling

⬜ Authentication tests

---

# PHASE 4 — CAFÉ ADMIN

Status:

⬜ Dashboard layout

⬜ Café profile

⬜ Café settings

⬜ Logo upload

⬜ Basic branding

⬜ Admin navigation

⬜ Responsive dashboard

---

# PHASE 5 — MENU MANAGEMENT

Status:

⬜ Category CRUD

⬜ Product CRUD

⬜ Product price management

⬜ Product availability

⬜ Product description

⬜ Product image upload

⬜ Cloudinary integration

⬜ Image deletion/update handling

⬜ Category ordering

⬜ Product ordering

---

# PHASE 6 — TABLE & QR MANAGEMENT

Status:

⬜ Create table

⬜ Edit table

⬜ Delete table

⬜ Generate unique QR token

⬜ QR generation

⬜ QR preview

⬜ QR download

⬜ Printable QR layout

⬜ QR → café mapping

⬜ QR → table mapping

---

# PHASE 7 — CUSTOMER WEBSITE

Status:

⬜ Subdomain detection

⬜ Café loading

⬜ Café branding

⬜ Menu loading

⬜ Category display

⬜ Product display

⬜ Product availability

⬜ Mobile-first UI

⬜ Loading states

⬜ Error states

---

# PHASE 8 — CART

Status:

⬜ Add product

⬜ Remove product

⬜ Increase quantity

⬜ Decrease quantity

⬜ Cart total

⬜ Empty cart state

⬜ Persistent cart where appropriate

⬜ Mobile cart UI

---

# PHASE 9 — ORDER CREATION

Status:

⬜ Customer details

⬜ Table identification

⬜ Order validation

⬜ Server-side price calculation

⬜ Availability validation

⬜ Order creation

⬜ Order number generation

⬜ Duplicate-order protection

⬜ Order confirmation page

---

# PHASE 10 — MANAGER ORDERS

Status:

⬜ Orders dashboard

⬜ New order display

⬜ Order details

⬜ Accept order

⬜ Start preparing

⬜ Mark ready

⬜ Complete order

⬜ Cancel order

⬜ Order history

⬜ Order filters

---

# PHASE 11 — REAL-TIME UPDATES

Status:

⬜ Real-time architecture

⬜ New order notification

⬜ Manager live order updates

⬜ Customer order status updates

⬜ Connection handling

⬜ Reconnection handling

⬜ Failure fallback

---

# PHASE 12 — PAYMENTS (REMOVED FROM SCOPE)

Status:

Online payment gateways (including Razorpay) are intentionally removed from scope. Ordering proceeds directly from customer cart to confirmed order without third-party payment gateway dependencies.

⬜ Payment status

⬜ Webhook verification

⬜ Refund handling if required

Payment should be implemented carefully and server-side.

---

# PHASE 13 — PLATFORM ADMIN

Status:

⬜ Platform admin authentication

⬜ Café creation

⬜ Café listing

⬜ Café search

⬜ Café activation/deactivation

⬜ Owner management

⬜ Basic platform dashboard

---

# PHASE 14 — AUTOMATED ONBOARDING

Status:

⬜ Plan selection

⬜ Payment

⬜ Automatic café creation

⬜ Automatic owner creation

⬜ Automatic subdomain

⬜ Setup email

⬜ Initial dashboard setup

---

# PHASE 15 — PRODUCTION HARDENING

Status:

⬜ Production environment

⬜ Database backup strategy

⬜ Error monitoring

⬜ Logging

⬜ Rate limiting

⬜ Security review

⬜ Tenant isolation security test

⬜ API testing

⬜ Frontend testing

⬜ Load testing

⬜ Deployment rollback strategy

⬜ Production documentation

---

# 61. MVP DEFINITION

The first sellable MVP is:

```text
Café account
+
Admin login
+
Café branding
+
Menu
+
Categories
+
Products
+
Product images
+
Tables
+
QR codes
+
Customer website
+
Cart
+
Dine-in ordering
+
Manager order dashboard
+
Order status
+
Basic real-time notification
```

That is enough to start testing with real cafés.

---

# 62. WHAT THE CUSTOMER SEES

Example:

```text
                 BREW HOUSE
                  ☕ LOGO

          Welcome to Brew House

----------------------------------

Categories

Coffee | Burgers | Desserts

----------------------------------

CAPPUCCINO

[ IMAGE ]

₹160

Freshly brewed cappuccino

             [ ADD ]

----------------------------------

CHICKEN BURGER

[ IMAGE ]

₹249

             [ ADD ]

----------------------------------

             🛒 CART
```

---

# 63. WHAT THE MANAGER SEES

```text
Brew House
Dashboard

--------------------------------

TODAY

Orders          42
Pending          3
Preparing        5
Ready            2

--------------------------------

NEW ORDERS

#1042
Table 7

2 Cappuccino
1 Chicken Burger
1 Fries

₹698

[ ACCEPT ]

--------------------------------
```

---

# 64. WHAT THE ORDER SYSTEM KNOWS

Example:

```text
Customer scans:

brewhouse.ourplatform.com/t/8F72KLMQ
```

System resolves:

```text
subdomain:
brewhouse

cafe_id:
cafe_001

table:
table_007
```

Customer orders:

```text
2 Cappuccino
1 Burger
```

Backend creates:

```text
Order #1042

cafe_id:
cafe_001

table_id:
table_007

status:
PLACED
```

Manager logged into Cafe 001 receives it.

Cafe 002 cannot see it.

---

# 65. CRITICAL RULE FOR CODING AGENTS

Before modifying the project, the coding agent MUST read this specification.

The agent must:

1. Understand the architecture
2. Check completed tasks
3. Avoid implementing removed features
4. Preserve tenant isolation
5. Preserve existing functionality
6. Run tests after major changes
7. Update the checklist after completing a feature
8. Mark completed items with 🟢
9. Keep incomplete items as ⬜
10. Never claim a feature is complete without testing it

Example:

```text
PHASE 5 — MENU MANAGEMENT

🟢 Category CRUD
🟢 Product CRUD
🟢 Product price management
🟢 Product availability
⬜ Product image upload
⬜ Cloudinary integration
⬜ Image deletion/update
```

When a task is completed and tested:

```text
⬜ → 🟢
```

---

# 66. CODING AGENT RULES

The coding agent must NOT:

* Create unnecessary features
* Change the technology stack without approval
* Create separate projects for cafés
* Create separate databases for every normal café
* Store images in MongoDB
* Trust client-side prices
* Trust client-provided cafe_id
* Allow cross-tenant access
* Hardcode secrets
* Delete working functionality without reason
* Replace working architecture unnecessarily
* Add unnecessary dependencies
* Build mobile applications
* Implement removed features

---

# 67. DEFINITION OF DONE

A feature is considered complete only when:

```text
Code implemented
+
API implemented where required
+
Frontend implemented where required
+
Validation implemented
+
Error handling implemented
+
Tenant security verified
+
Tests passed
+
Manual testing completed
+
Documentation updated
+
Checklist marked 🟢
```

---

# 68. FINAL ARCHITECTURE

The intended architecture is:

```text
                         OUR PLATFORM
                              |
                     ourplatform.com
                              |
                    ┌─────────┴─────────┐
                    |                   |
             Platform Admin       Café Websites
                                        |
                    ┌───────────────────┼───────────────────┐
                    |                   |                   |
             cafeA.domain        cafeB.domain        cafeC.domain
                    |                   |                   |
                    └───────────────────┼───────────────────┘
                                        |
                                  Next.js App
                                        |
                                   FastAPI API
                                        |
                                  MongoDB Atlas
                                        |
                              ┌─────────┴─────────┐
                              |                   |
                            Cloudinary            Ably
```

---

# 69. FINAL PRODUCT FLOW

```text
                  PLATFORM OWNER
                       |
                       |
                 Creates / sells
                       |
                       ▼
                    CAFE
                       |
                 Owner Login
                       |
                       ▼
                 ADMIN DASHBOARD
                       |
          ┌────────────┼────────────┐
          |            |            |
        Menu         Tables       Settings
          |            |
      Products       QR Codes
          |
          ▼
     CUSTOMER SCANS QR
          |
          ▼
      CAFE WEBSITE
          |
          ▼
         MENU
          |
          ▼
         CART
          |
          ▼
       PLACE ORDER
          |
          ▼
       FASTAPI
          |
          ▼
       MONGODB
          |
          ▼
   MANAGER DASHBOARD
          |
          ▼
     ACCEPT / PREPARE
          |
          ▼
        READY
          |
          ▼
      CUSTOMER
     SEES STATUS
```

---

# 70. THE ONE-SENTENCE DESCRIPTION

This project is:

> **A multi-tenant, web-based QR ordering SaaS that allows cafés to have their own branded ordering website, where customers scan a table QR code, browse the café's menu, place orders, and the café owner manages those orders through a private dashboard.**

---

# 71. CURRENT BUILD PRIORITY

Build in this order:

```text
🟢 = completed
🟡 = in progress / foundation ready
⬜ = remaining

1. 🟢 Project foundation
2. 🟢 MongoDB database
3. 🟢 Multi-tenant architecture
4. 🟢 Authentication
5. 🟢 Café admin
6. 🟢 Categories
7. 🟢 Products
8. 🟡 Cloudinary (Service abstraction implemented; credentials configured in Phase 5)
9. 🟢 Tables
10. 🟢 QR generation
11. 🟢 Customer website (Foundation built and verified)
12. 🟢 Cart (Foundation built and verified)
13. 🟢 Order creation
14. 🟢 Manager order dashboard
15. 🟢 Order status
16. ⬜ Real-time notifications (Phase 11)
17. 🟢 Testing (Automated pytest suite + Next.js build verified)
18. 🟡 Production deployment (Vercel serverless configuration prepared)
19. ⬜ Platform admin
20. ⬜ Automated café onboarding
```

Do not jump randomly between phases.

Complete and test the foundation before building higher-level features.

---

# 72. PRIMARY SUCCESS CRITERIA

The system is successful when:

```text
Cafe A can register
        ↓
Cafe A gets its own subdomain
        ↓
Cafe A logs into its dashboard
        ↓
Cafe A adds products
        ↓
Cafe A uploads product images
        ↓
Cafe A creates tables
        ↓
Cafe A downloads QR codes
        ↓
Customer scans Table 5 QR
        ↓
Customer sees Cafe A menu
        ↓
Customer places order
        ↓
Cafe A receives order
        ↓
Cafe A updates order status
        ↓
Customer sees status
```

Then:

```text
Cafe B does the same
```

while:

```text
Cafe A cannot see Cafe B's data.
```

That is the core product.

---

# END OF PROJECT SPECIFICATION
