import Anthropic from '@anthropic-ai/sdk'
import { kv } from '@vercel/kv'
import type { YachtSearchIntent } from '~/types/intent'

// Fast and cheap — intent extraction doesn't need Sonnet or Opus.
const MODEL = 'claude-haiku-4-5-20251001'

const MIN_QUERY_LENGTH = 5
const MAX_QUERY_LENGTH = 500
const RATE_LIMIT_MAX = 10 // requests
const RATE_LIMIT_WINDOW = 60 // seconds

const SYSTEM_PROMPT = `You are an intent extraction engine for a luxury yacht charter search platform.

Given a natural-language query, call extract_yacht_search_intent with the structured filters you've identified.

Rules:
- Use null for any field not mentioned in the query.
- amenities is an empty array if nothing is mentioned.
- Be conservative — if a value is ambiguous, return null and lower confidence.
- For budget, "$150k" means 150000 USD; "€80k" means 80000 EUR.
- "two weeks" means duration_days: 14.
- "family-friendly", "romantic", "luxury", "quiet", "party" → vibe field.
- reasoning is a single sentence describing what you understood from the query.`

/**
 * The schema is defined as a tool. With tool_choice forcing this exact tool,
 * the API guarantees the response matches input_schema — no markdown fences,
 * no trailing commas, no hallucinated fields, no parsing.
 *
 * To adapt this demo to another domain (real estate, e-commerce, restaurants),
 * replace this input_schema with your own and the same pattern applies.
 */
const tools: Anthropic.Tool[] = [
  {
    name: 'extract_yacht_search_intent',
    description:
      'Extract structured filters from a natural-language yacht charter search query.',
    input_schema: {
      type: 'object',
      properties: {
        destination: {
          type: ['string', 'null'],
          description: "High-level region (e.g. 'Caribbean', 'Mediterranean')",
        },
        region_specific: {
          type: ['string', 'null'],
          description: "Specific country or area (e.g. 'Bahamas', 'Sardinia')",
        },
        vessel_type: {
          type: ['string', 'null'],
          enum: ['sailing', 'motor', 'catamaran', 'explorer', null],
        },
        guests: { type: ['number', 'null'] },
        cabins: { type: ['number', 'null'] },
        start_date: {
          type: ['string', 'null'],
          description: 'ISO 8601 (YYYY-MM-DD) if specific, otherwise month name',
        },
        duration_days: { type: ['number', 'null'] },
        budget_max: { type: ['number', 'null'] },
        budget_currency: {
          type: ['string', 'null'],
          enum: ['EUR', 'USD', 'GBP', null],
        },
        amenities: { type: 'array', items: { type: 'string' } },
        vibe: {
          type: ['string', 'null'],
          description: "e.g. 'family-friendly', 'quiet', 'luxury', 'romantic'",
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reasoning: {
          type: 'string',
          description: 'One-sentence summary of what was understood.',
        },
      },
      required: [
        'destination',
        'region_specific',
        'vessel_type',
        'guests',
        'cabins',
        'start_date',
        'duration_days',
        'budget_max',
        'budget_currency',
        'amenities',
        'vibe',
        'confidence',
        'reasoning',
      ],
    } as Anthropic.Tool.InputSchema,
  },
]

const kvConfigured = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
)

/**
 * Fixed-window rate limit via Vercel KV (INCR + EXPIRE). Serverless functions
 * don't share memory, so an in-memory map would not work across invocations.
 * Degrades gracefully when KV is not configured (local dev).
 *
 * @returns true if the request is allowed, false if it should be blocked.
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  if (!kvConfigured) {
    console.warn(
      '[extract] Vercel KV not configured — skipping rate limiting. ' +
        'Set KV_REST_API_URL and KV_REST_API_TOKEN to enable it.',
    )
    return true
  }

  try {
    const key = `ratelimit:extract:${ip}`
    const count = await kv.incr(key)
    if (count === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW)
    }
    return count <= RATE_LIMIT_MAX
  } catch (err) {
    // Never let a rate-limiter outage take down the endpoint.
    console.error('[extract] Rate limit check failed, allowing request:', err)
    return true
  }
}

export default defineEventHandler(async (event) => {
  // --- Input validation ---
  const body = await readBody<{ query?: unknown }>(event)
  const query = typeof body?.query === 'string' ? body.query.trim() : ''

  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    setResponseStatus(event, 400)
    return {
      error: `Query must be between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`,
      code: 'invalid_input',
    }
  }

  // --- Rate limiting ---
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    setResponseStatus(event, 429)
    return {
      error: `Rate limit exceeded — max ${RATE_LIMIT_MAX} requests per minute. Try again shortly.`,
      code: 'rate_limited',
    }
  }

  // --- Claude API call (tool_use, forced) ---
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[extract] ANTHROPIC_API_KEY is not set.')
    setResponseStatus(event, 500)
    return {
      error: 'Server is missing its Anthropic API key.',
      code: 'api_error',
    }
  }

  const anthropic = new Anthropic({ apiKey })

  try {
    // Measure real wall-clock latency around the API call only.
    const startedAt = performance.now()
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM_PROMPT,
      tools,
      tool_choice: { type: 'tool', name: 'extract_yacht_search_intent' },
      messages: [{ role: 'user', content: query }],
    })
    const latency_ms = Math.round(performance.now() - startedAt)

    // Pull the structured result from the tool_use block — not from text.
    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )

    if (!toolUse) {
      setResponseStatus(event, 502)
      return {
        error: 'Claude did not return a tool call.',
        code: 'api_error',
      }
    }

    return {
      intent: toolUse.input as YachtSearchIntent,
      latency_ms,
      model: MODEL,
    }
  } catch (err) {
    const detail =
      err instanceof Anthropic.APIError
        ? `${err.status ?? ''} ${err.message}`.trim()
        : err instanceof Error
          ? err.message
          : 'Unknown error'
    console.error('[extract] Anthropic API call failed:', detail)
    setResponseStatus(event, 502)
    return {
      error: 'Failed to reach the Claude API. Please try again.',
      code: 'api_error',
    }
  }
})
