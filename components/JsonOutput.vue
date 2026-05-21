<script setup lang="ts">
import Prism from 'prismjs'
import 'prismjs/components/prism-json'
import type { YachtSearchIntent } from '~/types/intent'

const props = defineProps<{
  intent: YachtSearchIntent
  latencyMs: number
  model: string
}>()

// Prism.highlight is pure and deterministic, so SSR and client output match.
const highlighted = computed(() => {
  const json = JSON.stringify(props.intent, null, 2)
  return Prism.highlight(json, Prism.languages.json, 'json')
})

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.intent, null, 2))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // clipboard unavailable
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-2 flex items-center justify-between">
      <span
        class="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-600"
      >
        intent.json
      </span>
      <button
        type="button"
        class="font-mono text-xs text-neutral-400 transition hover:text-ocean-900 dark:text-neutral-600 dark:hover:text-ocean-300"
        @click="copy"
      >
        {{ copied ? 'copied ✓' : 'copy' }}
      </button>
    </div>

    <pre
      class="json-output flex-1 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-[13px] leading-relaxed dark:border-neutral-800 dark:bg-neutral-950"
    ><code v-html="highlighted" /></pre>

    <!-- Latency info box -->
    <div
      class="mt-3 flex items-center gap-2 rounded-lg border border-ocean-900/20 bg-ocean-50 px-3 py-2 text-xs text-ocean-900 dark:border-ocean-400/20 dark:bg-ocean-950/40 dark:text-ocean-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-3.5 w-3.5 shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span>
        <span class="font-mono font-semibold">{{ model }}</span>
        parsed your query in
        <span class="font-mono font-semibold">{{ latencyMs }}ms</span>
      </span>

      <!-- Tooltip explaining tool_use -->
      <span class="group relative ml-auto cursor-help">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-3.5 w-3.5 opacity-60"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span
          class="pointer-events-none absolute bottom-full right-0 z-10 mb-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 text-left text-[11px] font-normal leading-relaxed text-neutral-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          This response came from Claude's <code>tool_use</code> API with a
          forced tool call — the schema is enforced by the API, so the JSON is
          guaranteed to match the type. No parsing, no fences, no hallucinated
          fields.
        </span>
      </span>
    </div>
  </div>
</template>

<style>
/* Prism JSON token colors, dual-theme via CSS variables. Non-scoped because
   Prism injects raw <span class="token …"> nodes via v-html. */
.json-output {
  --tok-property: #0369a1; /* keys */
  --tok-string: #15803d;
  --tok-number: #b45309;
  --tok-keyword: #7c3aed; /* boolean / null */
  --tok-punctuation: #94a3b8;
  color: #334155;
}
.dark .json-output {
  --tok-property: #7dd3fc;
  --tok-string: #86efac;
  --tok-number: #fcd34d;
  --tok-keyword: #d8b4fe;
  --tok-punctuation: #64748b;
  color: #cbd5e1;
}
.json-output .token.property {
  color: var(--tok-property);
}
.json-output .token.string {
  color: var(--tok-string);
}
.json-output .token.number {
  color: var(--tok-number);
}
.json-output .token.boolean,
.json-output .token.null,
.json-output .token.keyword {
  color: var(--tok-keyword);
}
.json-output .token.punctuation,
.json-output .token.operator {
  color: var(--tok-punctuation);
}
</style>
