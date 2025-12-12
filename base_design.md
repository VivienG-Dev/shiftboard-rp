## Overview

This document describes the visual design and layout for a GTA-style bar management dashboard (“Night Shift in Los Santos”) built with Nuxt, Tailwind, and shadcn-vue.

- Global visual theme (colors, vibe, fonts)
- Public/auth page design
- Dashboard layout (with shadcn-vue components)
- Nuxt + shadcn-vue layout structure

---

## 1. Global Visual Theme – “Night Shift in Los Santos”

Think: neo-noir GTA nightclub dashboard.

### 1.1 Color Palette (Dark by Default)

- **Backgrounds**
  - `#020617` (slate/near-black) for main app background
  - Vertical gradient: `#020617 → #0f172a`
- **Accent 1 (neon / primary)**
  - Cyan / teal: `#22d3ee`
- **Accent 2 (warning / bar money vibe)**
  - Neon pink / magenta: `#e11d48`
- **Accent 3 (success / “good sales”)**
  - Lime: `#a3e635`

### 1.2 Surfaces & Glows

Use lots of subtle borders, translucency, and glows:

```css
.card {
  @apply bg-slate-900/70 border border-slate-800/80 rounded-xl backdrop-blur;
}

.neon-text {
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.7);
}
```

### 1.3 Typography

- **Main UI font**: Inter or Satoshi-like (clean sans)
- **Logo / Title**: slightly blocky / GTA-ish, but not overdone  
  (you can fake it with uppercase + increased letter spacing)

---

## 2. Public / Auth Pages

You can go visually heavier here; the dashboard itself will be more “practical”.

### 2.1 Sign-in / Sign-up Page

#### Layout Idea

Split screen:

- **Left**: dark blurred cityscape (Los Santos at night style), slight parallax on mouse move
- **Right**: login card

#### Structure (Fullscreen)

- **Background**
  - Gradient: `bg-gradient-to-b from-slate-950 to-slate-900`
  - Optional: very low opacity noise texture overlay
- **Top-left**
  - Floating logo text: e.g. “ShiftBoard RP”, “BarShift”, “Los Santos Barboard”
- **Top-right**
  - “Have a code? Join a company” link
- **Center-right**
  - Card using shadcn `Card`:
    - Title: “Sign in to your bar”
    - Subtitle: “Manage your stock, shifts and staff in one place.”
    - Inputs with subtle glowing focus ring (`focus:ring-cyan-500/70`)
  - **Primary CTA button**
    - Gradient background from cyan → pink
    - Tiny animated shine on hover (pseudo-element)

#### Example (Nuxt + shadcn-vue)

```vue
<!-- app/(auth)/login.vue or pages/login.vue -->
<template>
  <div class="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
    <!-- Left visual -->
    <div class="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
      <div class="absolute inset-0 bg-[url('/images/ls-skyline-blur.jpg')] bg-cover bg-center opacity-40" />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      <div class="relative z-10 px-10">
        <h1 class="text-5xl font-bold tracking-tight text-slate-50 neon-text">
          ShiftBoard RP
        </h1>
        <p class="mt-4 text-slate-300 max-w-md">
          Track every bottle, every drink, every shift.
          Keep your GTA bar running like a real business.
        </p>
      </div>
    </div>

    <!-- Right auth card -->
    <div class="flex-1 flex items-center justify-center px-6">
      <Card class="w-full max-w-md bg-slate-950/80 border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle class="text-2xl text-slate-50">Sign in</CardTitle>
          <CardDescription class="text-slate-400">
            Welcome back, bartender. Time to cash out the night.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- your shadcn-vue input components here -->
        </CardContent>
      </Card>
    </div>
  </div>
</template>
```

#### Motion Ideas

- Use `@nuxtjs/motion`, Framer Motion for Vue, or simple Tailwind transitions
- Slow hover/floating effect on the title text

---

## 3. Dashboard Design

Use:

- **shadcn-vue** for structure and primitives
- **Tailwind** for styling
- **Nuxt** layouts for consistent chrome

### 3.1 Global Layout

- **Left sidebar**
  - Company logo
  - Navigation with icons:
    - Dashboard
    - Inventory
    - Shifts
    - Staff
    - Settings
  - Bottom: “Switch company” dropdown or button
- **Top navbar**
  - Current company name + quick-switch
  - Date range selector (for stats)
  - User avatar (with role badge)
- **Main content area**
  - Top row: cards with KPIs
  - Middle: charts
  - Bottom: tables (latest shifts, low stock items)

### 3.2 Sidebar Vibe

Make it feel like an in-game menu:

- Slight neon border on active item
- Small colored dot for “online staff”

#### Example (Dashboard Layout)

```vue
<!-- layouts/dashboard.vue -->
<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur flex flex-col">
      <div class="px-4 py-4 flex items-center gap-2 border-b border-slate-800">
        <div class="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center text-xs font-black">
          SB
        </div>
        <div>
          <p class="font-semibold tracking-tight">ShiftBoard RP</p>
          <p class="text-xs text-slate-400">GTA Bar Manager</p>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1">
        <!-- use your shadcn-vue button/asChild or custom NavItem -->
        <NuxtLink
          to="/app/dashboard"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-900/80 transition group"
        >
          <span class="i-lucide-home w-4 h-4 group-hover:text-cyan-400" />
          <span>Overview</span>
        </NuxtLink>
        <NuxtLink
          to="/app/inventory"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-900/80 transition group"
        >
          <span class="i-lucide-wine w-4 h-4 group-hover:text-cyan-400" />
          <span>Inventory</span>
        </NuxtLink>
        <NuxtLink
          to="/app/shifts"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-900/80 transition group"
        >
          <span class="i-lucide-clipboard-list w-4 h-4 group-hover:text-cyan-400" />
          <span>Shifts & Cards</span>
        </NuxtLink>
        <NuxtLink
          to="/app/staff"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-900/80 transition group"
        >
          <span class="i-lucide-users w-4 h-4 group-hover:text-cyan-400" />
          <span>Staff</span>
        </NuxtLink>
      </nav>

      <div class="p-4 border-t border-slate-800 space-y-2">
        <!-- Company switcher, user stuff -->
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Top bar -->
      <header class="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/60 backdrop-blur">
        <!-- Company + date range etc. -->
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4">
        <slot />
      </main>
    </div>
  </div>
</template>
```

> Every page inside `/app` can just use `layout="dashboard"`.

---

## 4. Page-by-Page Dashboard Ideas

### 4.1 Overview / Dashboard

- **Top hero row (KPIs)**
  - Tonight’s revenue (or last shift revenue)
  - Total drinks sold
  - Active staff on duty
  - Low stock items
- Each KPI in a `Card` with:
  - Small icon (glass/bottle/money)
  - Big, bold value
  - Subtext like “+18% vs yesterday”
- **Middle**
  - Chart (bar or line) for:
    - Drinks sold by hour of the night, or
    - Top 5 items of the night
- **Bottom**
  - Two columns:
    - Latest 5 shift cards with status (draft/submitted/locked)
    - Low stock items (`<= threshold`)

### 4.2 Inventory Page

- Tabs: “All items”, “Drinks”, “Bottles”, “Food”
- Search bar + filters
- Table columns:
  - Item name
  - Category
  - Current stock
  - Last restock
  - Average nightly sales
- Button “New stock snapshot”
  - Opens a Sheet/Drawer (shadcn) sliding from the right
  - Allows quick entry of new quantities for selected items

### 4.3 Shifts & Cards

This is the heart of the app.

- **List view**
  - Filters:
    - By date
    - By staff
    - By status (draft / submitted / locked)
  - Table columns:
    - Date
    - Staff
    - Total drinks sold
    - Revenue
    - Status badge (Draft = gray, Submitted = cyan, Locked = emerald)
- **Detail view (on row click)**
  - Split layout:
    - Left: card info (date, staff, notes, status) + actions (Submit, Lock)
    - Right: table of items with quantity sold
- **For the seller**
  - Big button “+ New shift card”
  - Wizard-like flow:
    - Step 1: select date/time / shift
    - Step 2: pick items & quantities
    - Step 3: confirm

### 4.4 Staff / Company Members

- Grid of staff cards:
  - Avatar (or initials)
  - Role badge (OWNER / MANAGER / BARTENDER)
  - Stats: last shift, total drinks sold this week
- “Invite” button → modal with:
  - Email
  - Role dropdown
  - Generated invitation code for RP (paste in Discord, etc.)

---

## 5. Nuxt + shadcn-vue Wiring

### 5.1 Basic Structure

- `layouts/dashboard.vue` → global app chrome (sidebar + top bar)
- `pages/login.vue` → auth page
- `pages/app/dashboard.vue`
- `pages/app/inventory.vue`
- `pages/app/shifts/index.vue`
- `pages/app/shifts/[id].vue`
- `pages/app/staff.vue`

Use `definePageMeta({ layout: 'dashboard' })` in the `/app/*` pages.

### 5.2 Example Page

```vue
<!-- pages/app/dashboard.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth'], // your auth middleware later
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold tracking-tight">Tonight overview</h1>
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      <!-- KPI cards -->
    </div>
    <!-- charts & tables -->
  </div>
</template>
```
