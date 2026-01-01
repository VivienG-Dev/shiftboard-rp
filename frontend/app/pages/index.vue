<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";
import { Button } from "@/components/ui/button";

definePageMeta({
  layout: "blank",
  ssr: false,
});

const { isAuthenticated, session, signOut } = useAuth();
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-muted/40 to-background text-foreground">
    <div
      class="pointer-events-none absolute inset-0 [background:radial-gradient(1000px_circle_at_15%_10%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_35%,rgba(225,29,72,0.14),transparent_55%)]" />

    <header
      class="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <div class="flex items-center gap-3">
        <div
          class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950">
          SB
        </div>
        <div>
          <div class="text-sm font-semibold tracking-tight">ShiftBoard RP</div>
          <div class="text-xs text-muted-foreground">
            Night shift ops, organized.
          </div>
        </div>
      </div>

      <div v-if="isAuthenticated" class="flex items-center gap-2">
        <NuxtLink to="/companies">
          <Button variant="ghost">Dashboard</Button>
        </NuxtLink>
        <NuxtLink to="/me">
          <Button variant="ghost">Profile</Button>
        </NuxtLink>
        <Button variant="ghost" @click="signOut">Sign out</Button>
      </div>

      <div v-else class="flex items-center gap-2">
        <NuxtLink to="/sign-in">
          <Button variant="ghost">Sign in</Button>
        </NuxtLink>
        <NuxtLink to="/sign-up">
          <Button
            class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
            Create account
          </Button>
        </NuxtLink>
      </div>
    </header>

    <main class="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-10">
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <div class="space-y-6">
          <h1 class="text-4xl font-bold tracking-tight md:text-5xl">
            Run your bar like a business.
          </h1>
          <p class="max-w-xl text-muted-foreground">
            Track inventory, shifts, and staff across multiple companies—built
            for GTA V RP communities.
          </p>

          <div class="flex flex-wrap items-center gap-3">
            <NuxtLink to="/sign-in">
              <Button
                class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
                Sign in
              </Button>
            </NuxtLink>
            <NuxtLink to="/sign-up">
              <Button variant="outline"> Create account </Button>
            </NuxtLink>
          </div>

          <div
            v-if="isAuthenticated"
            class="rounded-xl border border-border bg-card/60 p-4">
            <div class="text-xs text-muted-foreground">Signed in</div>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <NuxtLink to="/me">
                <Button variant="secondary">Go to profile</Button>
              </NuxtLink>
              <Button variant="ghost" @click="signOut">Sign out</Button>
            </div>
            <pre
              class="mt-3 max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground"
              >{{ session }}</pre
            >
          </div>
        </div>

        <div class="relative hidden lg:block">
          <div
            class="absolute -inset-8 rounded-[2rem] bg-gradient-to-tr from-cyan-400/20 via-slate-950/10 to-pink-500/20 blur-2xl" />
          <div
            class="relative overflow-hidden rounded-2xl border border-border bg-card/50">
            <div
              class="absolute inset-0 bg-[url('/images/ls-skyline.svg')] bg-cover bg-center opacity-70" />
            <div
              class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div class="relative p-8">
              <div class="text-sm font-semibold tracking-wide text-slate-200">
                Los Santos Night Shift
              </div>
              <div class="mt-2 text-xs text-muted-foreground">
                Keep bottles counted, shifts logged, and cash moving.
              </div>
            </div>
            <div class="relative px-8 pb-8 pt-2">
              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-xl border border-border bg-card/60 p-4">
                  <div class="text-xs text-muted-foreground">Inventory</div>
                  <div class="mt-1 text-lg font-semibold">Snapshots</div>
                </div>
                <div class="rounded-xl border border-border bg-card/60 p-4">
                  <div class="text-xs text-muted-foreground">Shifts</div>
                  <div class="mt-1 text-lg font-semibold">Cards</div>
                </div>
                <div class="rounded-xl border border-border bg-card/60 p-4">
                  <div class="text-xs text-muted-foreground">Staff</div>
                  <div class="mt-1 text-lg font-semibold">Roles</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
