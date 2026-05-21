<script setup lang="ts">
const emit = defineEmits<{ select: [query: string] }>()

defineProps<{ disabled?: boolean }>()

const examples = [
  'Caribbean catamaran for 8 guests in February under €80k',
  'Quiet motor yacht, Mediterranean, July, 4 cabins, with a chef',
  'Sailing yacht for two weeks in the Bahamas, max budget $150,000',
  'Family-friendly charter in Greece, August, 10 people, water toys',
]
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="example in examples"
      :key="example"
      type="button"
      :disabled="disabled"
      class="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-left text-xs text-neutral-600 transition hover:border-ocean-900 hover:text-ocean-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-ocean-400 dark:hover:text-ocean-300"
      @click="emit('select', example)"
    >
      {{ example }}
    </button>
  </div>
</template>
