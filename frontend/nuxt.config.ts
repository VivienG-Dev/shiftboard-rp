// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },

  modules: ["shadcn-nuxt"],
  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },

  runtimeConfig: {
    public: {
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000",
      authBasePath: process.env.NUXT_PUBLIC_AUTH_BASE_PATH ?? "/api/auth",
    },
  },

  nitro: {
    devProxy: {
      "/api": {
        target: process.env.NUXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
