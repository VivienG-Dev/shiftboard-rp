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

### POST `/auth/register`

Create a user account.

**Body**

```json
{
  "email": "user@example.com",
  "password": "string",
  "displayName": "string"
}
```

**Response**

```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "displayName": "..." },
    "token": "jwt"
  }
}
```

### POST `/auth/login`

**Body**

```json
{ "email": "user@example.com", "password": "string" }
```

**Response** same as register.

### GET `/auth/me`

Return current user + their companies.

**Response**

```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "displayName": "..." },
    "companies": [{ "companyId": "uuid", "name": "...", "role": "OWNER" }]
  }
}
```

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
{ "name": "string", "slug": "string" }
```

### POST `/companies/:companyId/archive`

Archive a company.

**Auth**: `company.archive` (or `OWNER`)

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

Change role.

**Auth**: `members.updateRole` (or `OWNER`); cannot demote/remove `OWNER`

**Body**

```json
{ "roleId": "uuid" }
```

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
  `currentStock = latestSnapshot.quantity - sum(quantitySold after snapshot)`  
  So every submitted/locked sales card automatically reduces computed stock.

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
{ "data": { "id": "uuid", "createdAt": "iso" } }
```

### GET `/companies/:companyId/snapshots`

List snapshots (latest first).

**Auth**: membership required + `inventory.read` (or `OWNER`)

### GET `/companies/:companyId/snapshots/:snapshotId`

Snapshot detail with lines.

**Auth**: membership required + `inventory.read` (or `OWNER`)

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
      "currentStock": 7,
      "baselineSnapshotId": "uuid",
      "baselineQuantity": 12
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

### POST `/companies/:companyId/sales-cards/start`

Start a shift card for current user.

**Auth**: `salesCards.create` (or `OWNER`)

**Body** (optional)

```json
{ "note": "string", "roleId": "uuid", "locationId": "optional-uuid", "startAt": "optional-iso" }
```

**Rules**

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
- `salesCards.lines.write`: required to add/update item `lines` (quantities sold)
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
    "revenue": 12345,
    "drinksSold": 321,
    "activeStaff": 4,
    "lowStockCount": 7
  }
}
```

### GET `/companies/:companyId/charts/sales-by-hour`

Sales histogram for range.

**Auth**: membership required + `stats.read` (or `OWNER`)

---

## Notes / Open Questions

- Whether managers can stop other users’ shifts can be toggled by guard rules.
- MVP uses email‑bound invites (stored `email` + match check on accept). Optional delivery can be added later.
- If you want a “current company” context later, you can add:
  - `POST /auth/select-company` to set `defaultCompanyId` in JWT refresh.
