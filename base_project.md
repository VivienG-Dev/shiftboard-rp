# ShiftBoard RP — Project Overview & Base Documentation

A multi-tenant bar management web app for GTA V Roleplay.

## 1. Purpose of the Application

ShiftBoard RP is a web application designed for GTA V RP communities to manage:

- Bar inventory (drinks, bottles, food, custom items)
- Shift reports (“shift cards”) filled by staff (bartenders, hostesses, security, etc.)
- Staff roles & permissions (customizable per company)
- Multi-company system (each real RP business has its own private space)
- Invite system to add staff members to a company

The goal is to provide a simple, stylish, RP-friendly dashboard to track stocks, sales, and team activity.

## 2. High-Level Features

### User Accounts

- Register / login
- Belong to multiple companies
- Company roles/permissions determine access level

### Company Management

- Create a company (bar / nightclub / restaurant)
- Add and manage company locations (branches), e.g. “New York”, “Paris”
- Invite members by email-bound invite code (MVP)
- Manage company roles (custom role names + permissions; `OWNER` is fixed)

### Inventory Management

- CRUD for items (drinks, food, bottles…)
- Categories, units, prices
- Stock tracking with snapshots
- Restock entries (additive stock movements)
- Low-stock detection

### Shift Cards (Sales Reports)

Each staff member fills a “card” per shift:

- Item → quantity sold
- Automatic totals
- Status: `DRAFT`, `SUBMITTED`, `LOCKED`
- Only card owner + managers/admins can edit

### Admin Tools

- View all staff reports
- Lock submitted cards
- Configure roles & permissions per company (MVP)
- (Optional) Configure shift card types per company (e.g., Sales / Hostess / Security)
- Dashboard with KPIs & charts

## 3. Recommended Tech Stack

### Backend

- NestJS (Express adapter)
- Node.js 20 LTS
- Prisma ORM
- PostgreSQL
- JWT Auth + RBAC system

**Why Nest?**

- Structured modules
- Easy guards/interceptors for permissions
- Perfect for multi-tenant apps
- Prisma fits like a glove

### Frontend

- Nuxt 3
- TailwindCSS
- shadcn-vue library for clean components
- Optional animations with GSAP, Motion, or custom CSS

**Why Nuxt?**

- Ideal for dashboards
- Perfect DX for you (and fast to build)
- SSR optional; SPA-like experience for the app

## 3.5 Final Tech Stack (Locked)

This is the intended MVP stack. Any changes should be deliberate.

### Backend

- **NestJS** (adapter **TBD: Fastify vs Express**, see Auth section)
- **Node.js 20 LTS**
- **Prisma ORM**
- **PostgreSQL**
- **RBAC + multi‑tenancy guards** at the API layer
- **Package manager**: `pnpm`

### Frontend

- **Nuxt 3**
- **TailwindCSS**
- **shadcn-vue**
- Optional: light motion/animation layer
- **Package manager**: `pnpm` (workspace root)

---

## 3.6 Auth System Choice (Locked for MVP)

Goal: keep auth simple, reliable, and easy to integrate with RBAC/multi‑tenant guards.

### Preferred Library

- **better-auth** is preferred for MVP because it reduces boilerplate compared to Passport.

### Nest Adapter Consideration

better-auth support for Nest:

- **Express adapter**: feels safer because it aligns with official docs and common Nest patterns.
- **Fastify adapter**: currently supported through community integration; likely fine, but you’re cautious about relying on non‑official support for core auth.

**Decision for MVP**: start with **Express** unless Fastify support becomes officially documented or you feel confident in the community adapter. Performance is not a bottleneck for MVP; reliability wins.

### JWT vs Session Mode (Locked)

better-auth can run in:

- **JWT mode** (stateless)
  - Pros: simplest deployment, no session store needed, good for APIs.
  - Cons: token revocation is harder; need refresh strategy.
- **Session mode** (stateful)
  - Pros: easy logout/revoke, good security story.
  - Cons: requires session storage (DB/Redis) and more infra.

**Decision for MVP**: **better-auth in JWT mode** with refresh-token rotation.

- Access token: short‑lived JWT for API calls.
- Refresh token: long‑lived, stored as HttpOnly cookie; rotated on use.
- Logout/revoke: invalidate refresh token; access expires naturally.

---

## 4. Core Data Model (Conceptual)

### User

- `id`
- `email`
- `passwordHash`
- `displayName`
- `timestamps`

### Company

- `id`
- `name`
- `slug`
- `ownerId`
- `type` (`BAR`, `CLUB`, `FAST_FOOD`, `OTHER`)
- `timestamps`

### CompanyLocation (Branch / Place)

Company represents the brand/org. Locations represent places/branches under that company.

- `id`
- `companyId`
- `name` (e.g. “New York”, “Paris”)
- `archivedAt` (optional)
- `timestamps`

### Membership

Defines a user’s membership within a company.

- `id`
- `userId`
- `companyId`
- `activeRoleId` (optional) → `CompanyRole.id` (default role for UI convenience)
- `timestamps`

### CompanyRole

Per-company roles with customizable names and permissions.

- `id`
- `companyId`
- `name` (display label, e.g. “Bartender”, “Hostess”, “Security”, “Co-Owner”)
- `key` (stable identifier, e.g. `owner`, `bartender`, `hostess`)
- `permissions` (string array, e.g. `["salesCards.create", "salesCards.edit.ownDraft"]`)
- `isSystem` (true for fixed roles like `OWNER`)
- `archivedAt` (optional)
- `timestamps`

> `OWNER` is a system role that always exists and cannot be deleted. Other roles are company-defined.

### MembershipRole

Allows a single user to have **multiple roles** inside the same company (e.g., bartender most days, security on special nights).

- `id`
- `membershipId`
- `roleId` → `CompanyRole.id`
- `timestamps`

**Effective permissions** for a request = union of permissions from all roles assigned to the membership (plus implicit `OWNER` full access).

### Inventory

#### Item

- `id`
- `companyId`
- `name`
- `category` (`DRINK`, `BOTTLE`, `FOOD`, `OTHER`)
- `unit`
- `basePrice`
- `isActive`

#### InventorySnapshot

- `id`
- `companyId`
- `createdAt`
- `createdById`
- `note` (optional)

#### InventorySnapshotLine

- `id`
- `snapshotId`
- `itemId`
- `quantity`

#### Restock

- `id`
- `companyId`
- `createdAt`
- `createdById`
- `note` (optional)

#### RestockLine

- `id`
- `restockId`
- `itemId`
- `quantityAdded`

### Shift Cards

#### SalesCard (Shift Report)

- `id`
- `companyId`
- `locationId` (optional; links the shift to a specific `CompanyLocation`)
- `userId`
- `roleId` → `CompanyRole.id` (the role the user is acting as for this shift card)
- `startAt`
- `endAt` (nullable until stop)
- `status` (`DRAFT`, `SUBMITTED`, `LOCKED`)
- `note`

**Workflow**

- `DRAFT`: staff is still working; lines can be edited.
- `SUBMITTED`: shift ended; totals/prices are frozen (but admin can still review/edit if you allow it).
- `LOCKED`: finalized; immutable for everyone.

#### SalesCardLine

- `id`
- `salesCardId`
- `itemId`
- `quantitySold`
- `unitPrice` (optional)
- `total` (optional or computed)

#### (Optional) ShiftCardType (for non-sales roles)

If you want Hostess/Security/etc. to submit different kinds of “shift cards”, define card types per company.

- `id`
- `companyId`
- `name` (e.g. “Hostess Report”, “Security Report”)
- `key` (e.g. `hostess`, `security`)
- `kind` (`SALES`, `FORM`)
- `schema` (JSON; fields for `FORM` kinds)
- `archivedAt` (optional)
- `timestamps`

For MVP, you can ship only `SALES` cards and add `FORM` cards later without changing the core membership system.

## 4.5 Key Decisions / Clarifications

These are the “set in stone” rules for the MVP unless changed later.

### Multi‑Tenancy Scoping

- All API reads/writes are scoped to a `companyId`.
- We will include `companyId` in routes (e.g. `/companies/:companyId/items`, `/companies/:companyId/sales-cards`).
- Even if someone guesses a company id, they cannot access or mutate anything without an active `Membership` for that company and the required permissions. Every request is guarded by membership + RBAC.

### Invites

- Invite lifecycle: `PENDING` → `ACCEPTED` or `EXPIRED`.
- For MVP, only company admins (permissioned roles; typically `OWNER` + “admin-like” roles) can generate invites/codes.
- **MVP uses email‑bound invites for safety**:
  - Admin provides the invitee’s email when generating the invite.
  - Only a user logged in with that exact email can accept the invite.
  - (Optional email delivery can be added later; for MVP the admin can share the code privately.)

### SalesCard Time Rules (“Stamp System”)

- A staff member starts a shift card by pressing “Start shift”; the system sets `startAt` (date/time).
- While the card is active, they can update the report (e.g. sold quantities for sales cards).
- The shift ends when they press “Stop/Done”; the system sets `endAt` and the card becomes immutable for the staff member.
- After `endAt`, no further edits are allowed (managers/admins may still lock/validate).
- Status flow remains: `DRAFT` (active) → `SUBMITTED` (stopped) → `LOCKED` (admin final).
- Timezone handling should follow server‑stored UTC with user‑local display.
- **Concurrency rule (MVP)**: a user can have **only one active (`DRAFT`) shift card at a time per company**. Starting a new shift is blocked until the previous one is stopped/submitted.

### Archival Policy (No Hard Deletes)

- Items, sales cards, companies, and memberships are never hard‑deleted.
- We archive instead (e.g. `isActive`/`archivedAt`) so historical reports remain available.

### Pricing

- `SalesCardLine.unitPrice` is copied from `Item.basePrice` at submit/stop time.
- This preserves historical pricing even if item prices change later.

### Inventory Snapshots (Definition + Stock Computation)

**What a snapshot is**

- An `InventorySnapshot` is a full stock‑take at a point in time (like a real‑world count).
- Each `InventorySnapshotLine` records the quantity **on hand** for an item when the snapshot is created.

**How current stock is computed**

- The latest snapshot is the baseline.
- “Current stock” for an item is:
  - `latestSnapshot.quantity`
  - minus `sum(quantitySold)` from all `SalesCardLine`s **after** that snapshot’s `createdAt`.
- Restocks after the baseline snapshot are additive:
  - plus `sum(quantityAdded)` from all `RestockLine`s **after** that snapshot’s `createdAt`.
- If an item has no snapshot yet, current stock is `0` until the first count.

## 5. Permission Rules

### Role System (Custom Names + Permissions)

- `OWNER` is fixed (system role).
- All other roles are **defined per company**:
  - The *name* is customizable (“Bartender” vs “Hostess” vs “Security” vs “Co-Owner”).
  - What the role can do is defined by a set of **permission keys**.

This avoids “bar-specific” role names being hardcoded and lets each business (club/fast-food/etc.) match their RP org structure.

### Recommended Permission Keys (MVP)

You can store permissions as strings on `CompanyRole.permissions`:

- `company.read`
- `company.update`
- `company.archive`
- `stats.read` (KPIs, charts, admin analytics)
- `members.read`
- `members.invite`
- `members.updateRole`
- `inventory.read`
- `inventory.write`
- `inventory.snapshot.create`
- `salesCards.read`
- `salesCards.create`
- `salesCards.edit.ownDraft` (own card while `DRAFT`)
- `salesCards.edit.anyUnlocked` (any card unless `LOCKED`)
- `salesCards.stop.ownDraft`
- `salesCards.stop.anyDraft` (stop other users’ `DRAFT` cards)
- `salesCards.lock`
- `roles.manage` (create/rename roles, edit permissions)

**Important**

- The backend only recognizes a fixed “universe” of permission keys (like the list above).
- When an admin creates a new role, they are only selecting from these keys (checkboxes).  
  This is what makes custom roles safe and easy to manage.

### Guard Rules (MVP)

- If `salesCards.edit.ownDraft`: user can edit own card only while `DRAFT`.
- If `salesCards.edit.anyUnlocked`: user can edit any card unless `LOCKED`.
- If `salesCards.stop.ownDraft`: user can stop (submit) own `DRAFT` card.
- If `salesCards.stop.anyDraft`: user can stop (submit) other users’ `DRAFT` cards.
- If `roles.manage`: user can manage roles/permissions (except removing `OWNER`).
- `OWNER` implicitly has all permissions.

### Multi-Role Note (Same User, Different Nights)

- A user can hold multiple roles in the same company via `MembershipRole`.
- When starting a shift card, the user selects which role they’re acting as; the chosen `roleId` is stored on the `SalesCard`.
- Permission checks for actions can use:
  - **union** of all assigned roles (simplest), and/or
  - the **roleId on the SalesCard** for shift-specific rules (useful when different roles have different report types).

### Example Role Presets (Seeded by Company Type)

When a company is created, seed a sensible default set that the owner can later rename/tweak:

- **BAR**
  - Owner (system)
  - Co-Owner (admin-like)
  - Bartender (creates sales cards + edits item lines; affects inventory)
  - Viewer (read-only)
- **CLUB**
  - Owner (system)
  - Co-Owner (admin-like)
  - Hostess (creates shift cards but does not edit item lines)
  - Security (creates shift cards but does not edit item lines)
  - Bartender (optional, if the club has a bar)
- **FAST_FOOD**
  - Owner (system)
  - Co-Owner (admin-like)
  - Cashier / Staff (creates sales cards + edits item lines; affects inventory)
  - Viewer

## 6. Page Structure (Nuxt)

### Public

- `/login`
- `/register`
- `/invite/:code` (optional)

### App (Dashboard)

Using layout: `dashboard.vue`

- `/app/dashboard`
- `/app/inventory`
- `/app/inventory/snapshots`
- `/app/shifts`
- `/app/shifts/:id`
- `/app/staff`
- `/app/settings`
- `/app/settings/roles` (manage role names + permissions)
- `/app/settings/shift-cards` (optional: manage shift card types/templates)

## 7. Design Direction

**Theme**: Neo-Noir GTA Nightclub Dashboard

- Dark base: `#020617` → `#0f172a`
- Neon accents: cyan `#22d3ee` & magenta `#e11d48`
- Blurred panels, subtle glows, gradients
- GTA-ish vibe without copying the style directly

### Login Page

- Split-screen layout
- Left: blurred neon cityscape (Los Santos vibe)
- Right: auth card with glowing accents

### Dashboard

- Sidebar with neon hover effects
- KPI cards
- Charts for sales
- Tables for staff & inventory
- Sliding drawers (shadcn Sheet) for editing items / cards

## 8. MVP Milestones

### Phase 1 — Foundation

- Auth system
- Create company
- Invite members
- Basic dashboard layout
- CRUD items

### Phase 2 — Inventory System

- Item categories
- Stock snapshots
- Stock table w/ low stock warnings

### Phase 3 — Shift Cards

- Create/edit cards
- Admin validations
- Stats per day/per seller (KPIs + charts)
  - `GET /companies/:companyId/kpis`
  - `GET /companies/:companyId/charts/sales-by-hour`
  - `GET /companies/:companyId/charts/sales-by-day`
  - `GET /companies/:companyId/charts/sales-by-month`
  - `GET /companies/:companyId/charts/sales?bucket=hour|day|month`
  - `GET /companies/:companyId/charts/sales-timeseries?interval=hour&from=...&to=...`

### Phase 4 — Polish

- Animations
- Better charts
- Multi-company switcher
- RP-themed visual enhancements

## 9. Next Steps

Suggested next deliverables:

- Prisma schema (`.prisma`) file
- NestJS module directory structure
- Nuxt routing structure with layout & components boilerplate
- Optional: UI mockups in Figma/markdown

## 10. MVP Non‑Goals / Notes

- No realtime sync (refresh/polling is enough for MVP).
- No automated email sending in MVP (even though invites are email‑bound; admins share codes privately).
- Analytics beyond basic KPIs can come after Phase 3.
- Add audit logging later (who archived items, who locked cards), but not required for MVP launch.
