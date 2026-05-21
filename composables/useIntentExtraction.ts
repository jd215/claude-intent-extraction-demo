import type { ExtractSuccess, ExtractError } from '~/types/intent'

/**
 * Client-side wrapper around POST /api/extract. Tracks loading and error state
 * and exposes the last successful extraction (intent + measured latency).
 */
export function useIntentExtraction() {
  const result = ref<ExtractSuccess | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function extract(query: string) {
    const trimmed = query.trim()
    if (trimmed.length < 5) {
      error.value = 'Please enter a longer query (at least 5 characters).'
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<ExtractSuccess>('/api/extract', {
        method: 'POST',
        body: { query: trimmed },
      })
      result.value = data
    } catch (err: unknown) {
      // $fetch throws on non-2xx; the structured body is on err.data.
      const data = (err as { data?: ExtractError })?.data
      error.value =
        data?.error ?? 'Something went wrong. Please try again in a moment.'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    result.value = null
    error.value = null
  }

  return { result, error, loading, extract, reset }
}
