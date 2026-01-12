# ShiftBoard RP — API Endpoints (MVP Draft)

REST API draft for the ShiftBoard RP multi‑tenant bar management app.  
All routes are **company‑scoped** and protected by JWT + membership RBAC.

---

## Conventions

### Base URL

- `/api` (adjust to your NestJS global prefix)

### Auth

- Bearer JWT: `Authorization: Bearer <token>`
- JWT includes: `sub` (userId), `email`, and optional `defaultCompanyId`.
- MVP auth uses **better-auth in JWT mode** with refresh-token rotation (refresh token in HttpOnly cookie).
- Server uses membership guards to validate access to `:companyId`.

### Multi‑Tenancy Guard

For any route containing `:companyId`:

1. Validate JWT
2. Load membership for `(userId, companyId)`
3. Enforce role rules

### Roles & Permissions

- `OWNER` is fixed (system role) and implicitly has all permissions.
- All other roles are defined per company (`CompanyRole`) and attached to memberships via `MembershipRole`.
- Endpoints below list required **permission keys**; roles are just named bundles of permissions.

**Important**

- The backend recognizes a fixed set of permission keys (server-side allowlist).
- Custom roles created in the admin UI can only grant permissions from that allowlist.

### Permission allowlist (current)

- Company: `company.read`, `company.update`, `company.archive`
- Members: `members.read`, `members.invite`, `members.updateRole`
- Roles: `roles.manage`
- Inventory: `inventory.read`, `inventory.write`, `inventory.snapshot.create`
- Shift cards: `salesCards.read`, `salesCards.create`, `salesCards.edit.ownDraft`, `salesCards.edit.anyUnlocked`, `salesCards.stop.ownDraft`, `salesCards.stop.anyDraft`, `salesCards.lock`
- Stats: `stats.read`

### Status enums

- Sales card: `DRAFT` → `SUBMITTED` → `LOCKED`
- Invite: `PENDING` → `ACCEPTED` / `EXPIRED`

### Standard response shapes

```json
// Success
{ "data": { ... }, "meta": { ...optional } }

// Error
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": { ...optional }
  }
}
```

### Pagination (list endpoints)

Query:

- `page` (default 1)
- `pageSize` (default 20, max 100)

Meta:

```json
{ "meta": { "page": 1, "pageSize": 20, "total": 123 } }
```

---

## 1. Auth

Note: this repo currently uses **Better Auth** mounted at `backend/lib/auth.ts` with `basePath: /api/auth`.
So the working auth routes are Better Auth routes like:

### POST `/api/auth/sign-in/email`

Sign in with email + password (cookie-based session).

**Body**

```json
{ "email": "user@example.com", "password": "string" }
```

### POST `/api/auth/sign-up/email`

Create a user account.

**Body**

```json
{ "name": "Display name", "email": "user@example.com", "password": "string" }
```

### GET `/api/auth/get-session`

Get current session (user + session metadata).

### POST `/api/auth/sign-out`

Sign out and clear session cookies.

> Legacy endpoints in this doc (`/auth/register`, `/auth/login`, `/auth/me`) are not used in this repo right now.

---

## 2. Companies

### POST `/companies`

Create a company and make requester `OWNER`.

**Auth**: any authenticated user  

**Body**

```json
{ "name": "Nightclub Name", "slug": "optional-slug" }
```

**Response**

```json
{
  "company": { "id": "uuid", "name": "...", "slug": "...", "ownerId": "uuid", "locations": [] },
  "membership": { "id": "uuid", "companyId": "uuid", "userId": "uuid" },
  "ownerRole": { "id": "uuid", "companyId": "uuid", "key": "owner", "name": "Owner" }
}
```

### GET `/companies`

List companies the user belongs to.

**Auth**: any authenticated user

**Response**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "...",
      "slug": "...",
      "ownerId": "uuid",
      "locations": [{ "id": "uuid", "companyId": "uuid", "name": "Paris" }]
    }
  ]
}
```

### GET `/companies/:companyId`

Company details.

**Auth**: membership required + `company.read` (or `OWNER`)

**Response**

```json
{
  "data": {
    "id": "uuid",
    "name": "...",
    "slug": "...",
    "ownerId": "uuid",
    "locations": [{ "id": "uuid", "companyId": "uuid", "name": "New York" }]
  }
}
```

### PATCH `/companies/:companyId`

Update company settings.

**Auth**: `company.update` (or `OWNER`)

**Body** (partial)

```json
{ "name": "string", "slug": "string|null", "type": "BAR|CLUB|FAST_FOOD|OTHER" }
```

Notes:

- `slug: null` (or empty string) removes the slug.
- `slug` is slugified server-side.

**Response**

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "slug": "string|null",
    "type": "BAR|CLUB|FAST_FOOD|OTHER",
    "ownerId": "uuid",
    "locations": [{ "id": "uuid", "companyId": "uuid", "name": "Paris" }]
  }
}
```

### POST `/companies/:companyId/archive`

Archive a company.

**Auth**: `company.archive` (or `OWNER`)

**Response**

```json
{
  "data": {
    "id": "uuid",
    "archivedAt": "iso"
  }
}
```

---

## 2.5 Company Locations

Locations are branches/places under a company (e.g. “New York”, “Paris”).  
Company = brand/org; shifts/sales cards can later be attached to a specific `locationId`.

### POST `/companies/:companyId/locations`

Create a location for a company.

**Auth**: membership required + `company.update` (or `OWNER`)

**Body**

```json
{ "name": "Paris" }
```

**Response**

```json
{ "data": { "id": "uuid", "companyId": "uuid", "name": "Paris" } }
```

### GET `/companies/:companyId/locations`

List locations for a company.

**Auth**: membership required + `company.read` (or `OWNER`)

---

## 3. Memberships & Invites

### GET `/companies/:companyId/members`

List members and roles.

**Auth**: membership required + `members.read` (or `OWNER`)

### PATCH `/companies/:companyId/members/:memberId`

Deprecated (active role is no longer used). Keep for backward compatibility only.

**Auth**: `members.updateRole` (or `OWNER`)

### POST `/companies/:companyId/members/:memberId/roles`

Assign an additional role to a member.

**Auth**: `members.updateRole` (or `OWNER`)

**Body**

```json
{ "roleId": "uuid" }
```

### DELETE `/companies/:companyId/members/:memberId/roles/:roleId`

Remove a role from a member.

**Auth**: `members.updateRole` (or `OWNER`)

### POST `/companies/:companyId/invites`

Create an invite.

**Auth**: `members.invite` (or `OWNER`)

**Body**

```json
{
  "type": "EMAIL_CODE",
  "email": "invitee@example.com",
  "roleId": "uuid",
  "expiresInHours": 72
}
```

**Response**

```json
{
  "data": {
    "id": "uuid",
    "code": "ABC123",
    "status": "PENDING",
    "roleId": "uuid",
    "expiresAt": "iso"
  }
}
```

### GET `/companies/:companyId/invites`

List invites.

**Auth**: `members.invite` (or `OWNER`)

### POST `/invites/:code/accept`

Accept an invite and create membership.

**Roles**: authenticated user

**Rule (MVP)**

- The accepting user’s `email` **must match** the invite’s `email`.

**Response**

```json
{ "data": { "companyId": "uuid", "roleId": "uuid" } }
```

### GET `/companies/:companyId/me`

Return the caller’s membership + assigned roles for a company.

**Auth**: any company member

### PATCH `/companies/:companyId/me`

Deprecated (active role is no longer used). Keep for backward compatibility only.

**Auth**: any company member

### POST `/companies/:companyId/members/:memberId/archive`

Archive (remove) a member from company.

**Auth**: `members.updateRole` (or `OWNER`); cannot remove `OWNER`

---

## 3.5 Company Roles (Custom Role Names + Permissions)

These endpoints manage `CompanyRole` definitions. `OWNER` is system-defined and not removable.

### GET `/companies/:companyId/roles`

List roles for a company.

**Auth**: membership required + `roles.manage` (or `OWNER`)

### POST `/companies/:companyId/roles`

Create a role.

**Auth**: `roles.manage` (or `OWNER`)

**Body**

```json
{ "name": "Security", "permissions": ["salesCards.read", "salesCards.create"] }
```

### PATCH `/companies/:companyId/roles/:roleId`

Rename role / update permissions.

**Auth**: `roles.manage` (or `OWNER`)

### POST `/companies/:companyId/roles/:roleId/archive`

Archive a role.

**Auth**: `roles.manage` (or `OWNER`)

---

## 4. Items (Inventory Catalog)

### GET `/companies/:companyId/items`

List items.

**Auth**: membership required + `inventory.read` (or `OWNER`)

Query:

- `category` optional (`DRINK|BOTTLE|FOOD|OTHER`)
- `activeOnly` default `true`
- `includeArchived` default `false` (set to `true` to include archived items; combine with `activeOnly=false` to list archives)
- `search` optional

### POST `/companies/:companyId/items`

Create item.

**Auth**: `inventory.write` (or `OWNER`)

**Body**

```json
{
  "name": "Vodka",
  "category": "BOTTLE",
  "unit": "bottle",
  "basePrice": 250,
  "lowStockThreshold": 3
}
```

### PATCH `/companies/:companyId/items/:itemId`

Update item.

**Auth**: `inventory.write` (or `OWNER`)

**Body** (partial) same shape as create.

### POST `/companies/:companyId/items/:itemId/archive`

Archive item.

**Auth**: `inventory.write` (or `OWNER`)

---

## 5. Inventory Snapshots

Snapshots are **full stock‑takes**. Latest snapshot is baseline for current stock.

**Important**

- We do **not** store a separate “stock movement” row per sale for MVP.
- Instead, stock is **derived** as:  
  `currentStock = latestSnapshot.quantity - soldSinceBaseline + restockedSinceBaseline`
  - `soldSinceBaseline` = sum of `SalesCardLine.quantitySold` for cards in `SUBMITTED|LOCKED` with `startAt >= latestSnapshot.createdAt`
  - `restockedSinceBaseline` = sum of `RestockLine.quantityAdded` for restocks with `createdAt >= latestSnapshot.createdAt`
  So every submitted/locked sales card reduces computed stock, and every restock increases it.

### POST `/companies/:companyId/snapshots`

Create a snapshot.

**Auth**: `inventory.snapshot.create` (or `OWNER`)

**Body**

```json
{
  "note": "After restock",
  "lines": [
    { "itemId": "uuid", "quantity": 12 },
    { "itemId": "uuid", "quantity": 4 }
  ]
}
```

**Response**

```json
{
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "createdById": "uuid",
    "createdAt": "iso",
    "note": "After restock",
    "lines": [
      { "id": "uuid", "snapshotId": "uuid", "itemId": "uuid", "quantity": 12, "item": { "id": "uuid", "name": "Vodka", "unit": "bottle", "category": "BOTTLE" } }
    ]
  }
}
```

### GET `/companies/:companyId/snapshots`

List snapshots (latest first).

**Auth**: membership required + `inventory.read` (or `OWNER`)

**Response**

```json
{
  "data": [
    { "id": "uuid", "companyId": "uuid", "createdById": "uuid", "createdAt": "iso", "note": "After restock", "_count": { "lines": 12 } }
  ]
}
```

### GET `/companies/:companyId/snapshots/:snapshotId`

Snapshot detail with lines.

**Auth**: membership required + `inventory.read` (or `OWNER`)

---

## 5.5 Restocks

Restocks are additive inventory movements (e.g. deliveries, supply runs).

### POST `/companies/:companyId/restocks`

Create a restock.

**Auth**: `inventory.write` (or `OWNER`)

**Body**

```json
{
  "note": "Delivered by supplier",
  "lines": [
    { "itemId": "uuid", "quantityAdded": 12 },
    { "itemId": "uuid", "quantityAdded": 4 }
  ]
}
```

**Rules**

- `lines` must contain at least 1 entry
- `quantityAdded` must be an integer >= 1
- each `itemId` must exist in the company and be active (not archived)
- duplicate `itemId` in `lines` is rejected

**Response**

```json
{
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "createdById": "uuid",
    "createdAt": "iso",
    "note": "Delivered by supplier",
    "lines": [
      {
        "id": "uuid",
        "restockId": "uuid",
        "itemId": "uuid",
        "quantityAdded": 12,
        "item": { "id": "uuid", "name": "Vodka", "unit": "bottle", "category": "BOTTLE" }
      }
    ]
  }
}
```

### GET `/companies/:companyId/restocks`

List restocks (latest first).

**Auth**: membership required + `inventory.read` (or `OWNER`)

**Response**

```json
{
  "data": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "createdById": "uuid",
      "createdAt": "iso",
      "note": "Delivered by supplier",
      "_count": { "lines": 2 }
    }
  ]
}
```

### GET `/companies/:companyId/restocks/:restockId`

Restock detail with lines.

**Auth**: membership required + `inventory.read` (or `OWNER`)

---

## 5.6 Stock

### GET `/companies/:companyId/stock`

Computed current stock for all items.

**Auth**: membership required + `inventory.read` (or `OWNER`)

**Response**

```json
{
  "data": [
    {
      "itemId": "uuid",
      "name": "Vodka",
      "unit": "bottle",
      "category": "BOTTLE",
      "lowStockThreshold": 50,
      "baselineSnapshotId": "uuid",
      "baselineQuantity": 12,
      "soldSinceBaseline": 5,
      "restockedSinceBaseline": 2,
      "currentStock": 9,
      "isLowStock": true
    }
  ]
}
```

---

## 6. Sales Cards (Shift Reports)

Sales cards use the “stamp” flow:

- Start shift creates card with `startAt` and status `DRAFT`.
- Stop shift sets `endAt` and transitions to `SUBMITTED`.
- Cards become immutable for the staff member after stop; admins can optionally lock them for finalization.
- **Concurrency (MVP)**: a user can have only one active (`DRAFT`) shift card at a time per company.

### GET `/companies/:companyId/sales-cards`

List sales cards.

**Auth**: membership required + `salesCards.read` (or `OWNER`)

Query:

- `from` / `to` (iso date/time)
- `status`
- `userId`

### GET `/companies/:companyId/sales-cards/active`

Return the caller’s current active (`DRAFT`) shift card (or `null` if none).

**Auth**: membership required + `salesCards.read` (or `OWNER`)

### POST `/companies/:companyId/sales-cards/start`

Start a shift card for current user.

**Auth**: `salesCards.create` (or `OWNER`)

**Body** (optional)

```json
{ "note": "string", "roleId": "optional-uuid", "locationId": "optional-uuid", "startAt": "optional-iso" }
```

**Rules**

- If omitted, `roleId` is auto-selected from the user’s assigned roles (first role with `salesCards.create` permission).
- `roleId` must be one of the roles assigned to the user’s membership (`MembershipRole`).
- `locationId` (if provided) must belong to the company (and not be archived).

**Response**

```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "roleId": "uuid",
    "status": "DRAFT",
    "startAt": "iso",
    "endAt": null
  }
}
```

### PATCH `/companies/:companyId/sales-cards/:cardId`

Edit an active card (note + lines).  

**Auth** (via permissions)

- `salesCards.edit.anyUnlocked`: any card unless `LOCKED`
- `salesCards.edit.ownDraft`: own card while `DRAFT`
- `OWNER`: always allowed

**Body**

```json
{
  "note": "string",
  "lines": [
    { "itemId": "uuid", "quantitySold": 2 },
    { "itemId": "uuid", "quantitySold": 1 }
  ]
}
```

**Notes**

- Roles like Security/Hostess can still have shift cards, but typically do **not** have `salesCards.lines.write`, so they can’t edit `lines` and therefore cannot affect inventory.

### POST `/companies/:companyId/sales-cards/:cardId/stop`

Stop (submit) a shift.  
Server sets `endAt`, copies prices, computes totals, transitions to `SUBMITTED`.  
Submitted quantities are included in stock computation and reduce “current stock” relative to the latest snapshot.

**Auth** (via permissions)

- `salesCards.stop.ownDraft`: stop own `DRAFT`
- `salesCards.stop.anyDraft`: stop others’ `DRAFT`
- Optional: allow `salesCards.edit.anyUnlocked` to stop others’ `DRAFT` (decide later)
- `OWNER`: always allowed

**Body** (optional)

```json
{ "endAt": "optional-iso" }
```

### GET `/companies/:companyId/sales-cards/:cardId`

Card detail with lines.

**Auth**: membership required + `salesCards.read` (or `OWNER`)  
(Optionally restrict `salesCards.read` to own-only unless a separate `salesCards.read.any` permission is granted.)

### POST `/companies/:companyId/sales-cards/:cardId/lock`

Lock a submitted card; immutable for everyone.

**Auth**: `salesCards.lock` (or `OWNER`)

---

## 7. Dashboard / Analytics (Optional MVP+)

### GET `/companies/:companyId/kpis`

Aggregate KPIs for date range.

**Auth**: membership required + `stats.read` (or `OWNER`)

Query:

- `from` / `to` (iso)

**Response**

```json
{
  "data": {
    "from": "iso|null",
    "to": "iso|null",
    "revenue": 12345,
    "activeStaff": 4,
    "itemsSold": 321
  }
}
```

### GET `/companies/:companyId/charts/sales-by-hour`

Sales histogram for range, bucketed per hour (0–23).

**Auth**: membership required + `stats.read` (or `OWNER`)

Query:

- `from` / `to` (iso)
- `tzOffsetMinutes` (optional integer; defaults to `0`)
  - Use this to render charts in a specific timezone without the backend needing DB timezone features.
  - Example: Paris winter = `60`, Paris summer = `120`.

**Response**

```json
{
  "data": [
    { "hour": 0, "revenue": 0, "itemsSold": 0 },
    { "hour": 1, "revenue": 1200, "itemsSold": 8 }
  ]
}
```

### GET `/companies/:companyId/charts/sales-by-day`

Sales aggregation by day (`YYYY-MM-DD`), zero-filled for missing days in the range.

**Auth**: membership required + `stats.read` (or `OWNER`)

Query:

- `from` / `to` (iso)
- `tzOffsetMinutes` (optional integer; defaults to `0`)

**Response**

```json
{
  "data": [
    { "day": "2025-12-01", "revenue": 2400, "itemsSold": 15 },
    { "day": "2025-12-02", "revenue": 0, "itemsSold": 0 }
  ]
}
```

### GET `/companies/:companyId/charts/sales-by-month`

Sales aggregation by month (`YYYY-MM`), zero-filled for missing months in the range.

**Auth**: membership required + `stats.read` (or `OWNER`)

Query:

- `from` / `to` (iso)
- `tzOffsetMinutes` (optional integer; defaults to `0`)

**Response**

```json
{
  "data": [
    { "month": "2025-01", "revenue": 81200, "itemsSold": 540 },
    { "month": "2025-02", "revenue": 91300, "itemsSold": 604 }
  ]
}
```

### GET `/companies/:companyId/charts/sales`

Single endpoint variant. Choose the bucket via query param.

**Auth**: membership required + `stats.read` (or `OWNER`)

Query:

- `bucket` = `hour|day|month` (default `hour`)
- `from` / `to` (iso)
- `tzOffsetMinutes` (optional integer; defaults to `0`)

**Response**: same shape as the corresponding endpoint (`sales-by-hour`, `sales-by-day`, `sales-by-month`).

### GET `/companies/:companyId/charts/sales-timeseries`

Chronological time series for the selected interval (recommended for line/area charts).

This differs from `sales-by-hour`: it buckets on an actual timeline (e.g. `2025-01-01T00:00` then `01:00` then `02:00`), so data around midnight doesn’t “overlap” into the same `00h` bucket across different days.

**Auth**: membership required + `stats.read` (or `OWNER`)

Query:

- `interval` = `hour` (currently supported)
- `from` / `to` (iso, required)
- `tzOffsetMinutes` (optional integer; defaults to `0`)

**Response**

```json
{
  "data": [
    { "ts": "2025-01-01T00:00:00.000Z", "revenue": 0, "itemsSold": 0 },
    { "ts": "2025-01-01T01:00:00.000Z", "revenue": 1200, "itemsSold": 8 }
  ]
}
```

---

## Notes / Open Questions

- Whether managers can stop other users’ shifts can be toggled by guard rules.
- MVP uses email‑bound invites (stored `email` + match check on accept). Optional delivery can be added later.
- If you want a “current company” context later, you can add:
  - `POST /auth/select-company` to set `defaultCompanyId` in JWT refresh.
