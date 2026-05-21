<script setup lang="ts">
const query = ref('')
const { result, error, loading, extract } = useIntentExtraction()

function onSubmit() {
  extract(query.value)
}

function onSelectExample(example: string) {
  query.value = example
  extract(example)
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Left: input -->
    <section class="flex flex-col gap-5">
      <div>
        <h2 class="text-lg font-semibold">Describe a charter in plain English</h2>
        <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Claude parses it into typed JSON via a forced
          <code class="font-mono text-ocean-900 dark:text-ocean-300">tool_use</code>
          call — the schema is enforced by the API.
        </p>
      </div>

      <QueryInput v-model="query" :loading="loading" @submit="onSubmit" />

      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
          Try an example
        </p>
        <ExampleChips :disabled="loading" @select="onSelectExample" />
      </div>
    </section>

    <!-- Right: output -->
    <section
      class="min-h-[24rem] rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
    >
      <!-- Error -->
      <div
        v-if="error"
        class="flex h-full flex-col items-center justify-center gap-2 text-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-7 w-7 text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <p class="text-sm font-medium text-red-500">{{ error }}</p>
      </div>

      <!-- Loading skeleton (pulsing, not a spinner) -->
      <div v-else-if="loading" class="space-y-2.5">
        <div
          v-for="i in 9"
          :key="i"
          class="h-3.5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"
          :style="{ width: `${[42, 70, 64, 38, 58, 74, 48, 62, 30][i - 1]}%` }"
        />
      </div>

      <!-- Result -->
      <JsonOutput
        v-else-if="result"
        :intent="result.intent"
        :latency-ms="result.latency_ms"
        :model="result.model"
      />

      <!-- Empty -->
      <div
        v-else
        class="flex h-full flex-col items-center justify-center gap-2 text-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-8 w-8 text-neutral-300 dark:text-neutral-700"
        >
          <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
        </svg>
        <p class="text-sm text-neutral-400 dark:text-neutral-600">
          Your structured JSON will appear here.
        </p>
      </div>
    </section>
  </div>
</template>
