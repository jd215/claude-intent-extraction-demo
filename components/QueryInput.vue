<script setup lang="ts">
const model = defineModel<string>({ default: '' })

const props = defineProps<{ loading?: boolean }>()
const emit = defineEmits<{ submit: [] }>()

const MAX = 500

function onKeydown(e: KeyboardEvent) {
  // Enter submits; Shift+Enter inserts a newline.
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (!props.loading) emit('submit')
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="relative">
      <textarea
        v-model="model"
        :maxlength="MAX"
        rows="3"
        placeholder="Describe the charter you're looking for…"
        class="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-ocean-900 focus:ring-2 focus:ring-ocean-900/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-ocean-400 dark:focus:ring-ocean-400/20"
        @keydown="onKeydown"
      />
      <span
        class="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-neutral-400 dark:text-neutral-600"
      >
        {{ model.length }}/{{ MAX }}
      </span>
    </div>

    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-neutral-500 dark:text-neutral-500">
        Press <kbd class="font-mono text-[11px]">Enter</kbd> to extract ·
        <kbd class="font-mono text-[11px]">Shift</kbd> +
        <kbd class="font-mono text-[11px]">Enter</kbd> for a new line
      </p>
      <button
        type="button"
        :disabled="loading || model.trim().length < 5"
        class="inline-flex items-center gap-2 rounded-lg bg-ocean-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ocean-600 dark:hover:bg-ocean-500"
        @click="emit('submit')"
      >
        <span
          v-if="loading"
          class="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
        />
        {{ loading ? 'Extracting…' : 'Extract' }}
      </button>
    </div>
  </div>
</template>
