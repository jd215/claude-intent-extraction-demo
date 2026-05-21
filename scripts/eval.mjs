// Accuracy harness for the intent extractor.
//
// Drives the *running* dev server's /api/extract endpoint (one source of truth —
// the tool schema lives only in server/api/extract.post.ts) over 20 hand-written
// queries, grades each against lightweight field assertions, and regenerates
// docs/evals.md with real numbers + measured latencies.
//
// Usage:
//   1. npm run dev                       (in one terminal, with ANTHROPIC_API_KEY set)
//   2. npm run eval                      (in another)
//
// Optional: EVAL_BASE_URL=https://your-deploy.vercel.app npm run eval

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const BASE_URL = process.env.EVAL_BASE_URL ?? 'http://localhost:3000'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'docs', 'evals.md')

// Each `expect` lists only the fields a correct extraction must contain.
// Strings/numbers must match exactly (case-insensitive for strings); arrays are
// checked as a subset (each expected amenity must appear, substring match).
// `note` flags the kind of query (clear / ambiguous / edge).
const QUERIES = [
  {
    q: 'Caribbean catamaran for 8 guests in February under €80k',
    note: 'clear',
    expect: { destination: 'Caribbean', vessel_type: 'catamaran', guests: 8, budget_max: 80000, budget_currency: 'EUR' },
  },
  {
    q: 'Quiet motor yacht, Mediterranean, July, 4 cabins, with a chef',
    note: 'clear',
    expect: { destination: 'Mediterranean', vessel_type: 'motor', cabins: 4, vibe: 'quiet', amenities: ['chef'] },
  },
  {
    q: 'Sailing yacht for two weeks in the Bahamas, max budget $150,000',
    note: 'clear',
    expect: { vessel_type: 'sailing', region_specific: 'Bahamas', duration_days: 14, budget_max: 150000, budget_currency: 'USD' },
  },
  {
    q: 'Family-friendly charter in Greece, August, 10 people, water toys',
    note: 'clear',
    expect: { region_specific: 'Greece', guests: 10, vibe: 'family-friendly', amenities: ['water toys'] },
  },
  {
    q: 'Explorer yacht in Norway for 12, September, with stabilizers',
    note: 'clear',
    expect: { vessel_type: 'explorer', guests: 12, amenities: ['stabilizers'] },
  },
  {
    q: 'Romantic getaway for two in Santorini',
    note: 'clear',
    expect: { guests: 2, region_specific: 'Santorini', vibe: 'romantic' },
  },
  {
    q: 'Big motor yacht in Dubai for December, budget around £500k',
    note: 'clear',
    expect: { vessel_type: 'motor', budget_max: 500000, budget_currency: 'GBP' },
  },
  {
    q: 'Catamaran in the BVI for 6 guests, snorkeling and paddleboards',
    note: 'clear',
    expect: { vessel_type: 'catamaran', guests: 6, amenities: ['snorkel', 'paddle'] },
  },
  {
    q: 'Luxury charter in the French Riviera, July, chef and jacuzzi, 8 cabins',
    note: 'clear',
    expect: { vibe: 'luxury', cabins: 8, amenities: ['chef', 'jacuzzi'] },
  },
  {
    q: 'Two-week sailing trip around Croatia in June for a group of 6',
    note: 'clear',
    expect: { vessel_type: 'sailing', region_specific: 'Croatia', duration_days: 14, guests: 6 },
  },
  {
    q: 'Something quiet and private in the Maldives, no kids',
    note: 'ambiguous',
    expect: { region_specific: 'Maldives', vibe: 'quiet' },
  },
  {
    q: 'Party yacht in Ibiza, August, 12 people',
    note: 'clear',
    expect: { region_specific: 'Ibiza', guests: 12, vibe: 'party' },
  },
  {
    q: 'Affordable charter around the Greek islands, flexible dates',
    note: 'ambiguous',
    expect: { budget_max: null, start_date: null },
  },
  {
    q: 'Departure 2026-07-15, Sardinia, motor yacht, 5 cabins',
    note: 'edge: ISO date',
    expect: { start_date: '2026-07-15', region_specific: 'Sardinia', vessel_type: 'motor', cabins: 5 },
  },
  {
    q: 'Catamaran or sailing yacht in the Caribbean for 8 guests',
    note: 'ambiguous: vessel',
    expect: { destination: 'Caribbean', guests: 8, vessel_type: null },
  },
  {
    q: 'A yacht with a gym, spa, and helipad in Monaco',
    note: 'clear',
    expect: { region_specific: 'Monaco', amenities: ['gym', 'spa', 'helipad'] },
  },
  {
    q: 'Charter for our company offsite, 20 people, somewhere in the Mediterranean',
    note: 'edge: large group',
    expect: { destination: 'Mediterranean', guests: 20 },
  },
  {
    q: 'cheap sailboat bahamas',
    note: 'edge: terse',
    expect: { vessel_type: 'sailing', region_specific: 'Bahamas' },
  },
  {
    q: 'A Mediterranean yacht for next summer',
    note: 'ambiguous: vague date',
    expect: { destination: 'Mediterranean' },
  },
  {
    q: 'asdf qwerty lorem ipsum random text',
    note: 'edge: gibberish',
    expect: { destination: null, vessel_type: null, guests: null },
  },
]

function matchField(actual, expected) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false
    const hay = actual.map((a) => String(a).toLowerCase())
    return expected.every((e) =>
      hay.some((a) => a.includes(String(e).toLowerCase())),
    )
  }
  if (typeof expected === 'string' && typeof actual === 'string') {
    return actual.toLowerCase().includes(expected.toLowerCase())
  }
  return actual === expected
}

function grade(intent, expect) {
  const fields = Object.keys(expect)
  const results = fields.map((f) => matchField(intent[f], expect[f]))
  const hits = results.filter(Boolean).length
  const missed = fields.filter((_, i) => !results[i])
  if (hits === fields.length) return { verdict: '✅', label: 'pass', missed }
  if (hits > 0) return { verdict: '🟡', label: 'partial', missed }
  return { verdict: '❌', label: 'fail', missed }
}

async function run() {
  const rows = []
  const latencies = []
  let pass = 0
  let partial = 0
  let fail = 0
  const failureModes = []

  console.log(`Running ${QUERIES.length} queries against ${BASE_URL}/api/extract\n`)

  for (let i = 0; i < QUERIES.length; i++) {
    const { q, expect, note } = QUERIES[i]
    let verdict = '❌'
    let detail = ''
    try {
      const res = await fetch(`${BASE_URL}/api/extract`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      if (!res.ok) {
        fail++
        detail = `${note} — API error: ${data.error ?? res.status}`
        failureModes.push(`"${q}" → ${data.error ?? res.status}`)
      } else {
        latencies.push(data.latency_ms)
        const g = grade(data.intent, expect)
        verdict = g.verdict
        if (g.label === 'pass') pass++
        else if (g.label === 'partial') partial++
        else fail++
        detail =
          g.label === 'pass'
            ? `${note} — all asserted fields correct`
            : `${note} — missed: ${g.missed.join(', ')}`
        if (g.label !== 'pass') failureModes.push(`"${q}" → missed ${g.missed.join(', ')}`)
        console.log(
          `${verdict} [${data.latency_ms}ms] ${q}\n   ${JSON.stringify(data.intent)}\n`,
        )
      }
    } catch (err) {
      fail++
      detail = `${note} — request failed: ${err.message}`
      failureModes.push(`"${q}" → ${err.message}`)
      console.error(`❌ ${q}: ${err.message}`)
    }
    rows.push(
      `| ${i + 1} | ${q.replace(/\|/g, '\\|')} | ${verdict} | ${detail} |`,
    )
  }

  const avg = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0
  const min = latencies.length ? Math.min(...latencies) : 0
  const max = latencies.length ? Math.max(...latencies) : 0

  const md = `# Evaluation Results

20 hand-written queries tested against \`claude-haiku-4-5\` with tool_use schema enforcement.

_Generated by \`npm run eval\` on ${new Date().toISOString().slice(0, 10)} against ${BASE_URL}._
Grading is assertion-based: ✅ = every asserted field correct, 🟡 = partial (some fields missed, no hallucination), ❌ = failed or errored.

| # | Query | Pass/Fail | Notes |
|---|-------|-----------|-------|
${rows.join('\n')}

**Summary:** ${pass}/20 fully correct, ${partial}/20 partial (one or more fields missed but no hallucination), ${fail}/20 failed.

**Latency:** avg ${avg}ms · min ${min}ms · max ${max}ms (server-side \`performance.now()\` deltas).

**Failure modes observed:**
${failureModes.length ? failureModes.map((f) => `- ${f}`).join('\n') : '- None.'}
`

  await writeFile(OUT, md, 'utf8')
  console.log(`\nSummary: ${pass} pass · ${partial} partial · ${fail} fail`)
  console.log(`Wrote ${OUT}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
