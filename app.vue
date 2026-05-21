<script setup lang="ts">
// Single-page showcase. Header + footer live here; the two-panel UI is the page.
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100"
  >
    <header
      class="border-b border-neutral-200 bg-white/70 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70"
    >
      <div
        class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
      >
        <div class="flex items-center gap-2.5">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean-900 text-white dark:bg-ocean-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4"
            >
              <path d="M3 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1" />
              <path d="M19 5v6.5M5 11l7-8 7 8M5 11v3.5" />
            </svg>
          </span>
          <div class="leading-tight">
            <h1 class="text-sm font-semibold">Claude Intent Extraction</h1>
            <p class="font-mono text-[11px] text-neutral-400 dark:text-neutral-600">
              natural language → structured JSON
            </p>
          </div>
        </div>
        <DarkModeToggle />
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <NuxtPage />
    </main>

    <footer
      class="border-t border-neutral-200 px-6 py-5 text-center text-xs text-neutral-400 dark:border-neutral-800 dark:text-neutral-600"
    >
      Built by
      <a
        href="https://xplor.io/jd"
        target="_blank"
        rel="noopener"
        class="font-medium text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
        >Johnny Drummond</a
      >
      ·
      <a
        href="https://xplor.io"
        target="_blank"
        rel="noopener"
        class="hover:underline"
        >xplor.io</a
      >
    </footer>
  </div>
</template>
