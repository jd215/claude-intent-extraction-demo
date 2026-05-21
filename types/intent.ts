/**
 * The structured shape Claude extracts from a free-text yacht-charter query.
 * This mirrors the `input_schema` of the `extract_yacht_search_intent` tool
 * defined in server/api/extract.post.ts — the tool schema is what guarantees
 * the API response conforms to this type.
 */
export type YachtSearchIntent = {
  destination: string | null // e.g. "Caribbean", "Mediterranean", "Greece"
  region_specific: string | null // e.g. "Bahamas", "Sardinia"
  vessel_type: 'sailing' | 'motor' | 'catamaran' | 'explorer' | null
  guests: number | null
  cabins: number | null
  start_date: string | null // ISO 8601 or month name
  duration_days: number | null
  budget_max: number | null
  budget_currency: 'EUR' | 'USD' | 'GBP' | null
  amenities: string[] // e.g. ["chef", "water toys", "stabilizers"]
  vibe: string | null // e.g. "family-friendly", "quiet", "luxury"
  confidence: number // 0.0 - 1.0, Claude's self-assessed confidence
  reasoning: string // 1-sentence summary of what Claude understood
}

/** Successful response from POST /api/extract. */
export type ExtractSuccess = {
  intent: YachtSearchIntent
  latency_ms: number
  model: string
}

/** Error response from POST /api/extract. */
export type ExtractError = {
  error: string
  code: 'invalid_input' | 'rate_limited' | 'api_error'
}

export type ExtractResponse = ExtractSuccess | ExtractError
