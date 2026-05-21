# Evaluation Results

20 hand-written queries tested against `claude-haiku-4-5` with tool_use schema enforcement.

> ⏳ **Pending a real run.** This table is a placeholder. Generate real results with
> measured latencies by running the dev server (`npm run dev`) with your
> `ANTHROPIC_API_KEY` set, then `npm run eval` in another terminal — it overwrites
> this file with actual pass/partial/fail verdicts and latency stats.

The 20 queries (a mix of clear, ambiguous, and edge-case inputs) defined in
[`scripts/eval.mjs`](../scripts/eval.mjs):

| # | Query | Type | Pass/Fail |
|---|-------|------|-----------|
| 1 | Caribbean catamaran for 8 guests in February under €80k | clear | _pending_ |
| 2 | Quiet motor yacht, Mediterranean, July, 4 cabins, with a chef | clear | _pending_ |
| 3 | Sailing yacht for two weeks in the Bahamas, max budget $150,000 | clear | _pending_ |
| 4 | Family-friendly charter in Greece, August, 10 people, water toys | clear | _pending_ |
| 5 | Explorer yacht in Norway for 12, September, with stabilizers | clear | _pending_ |
| 6 | Romantic getaway for two in Santorini | clear | _pending_ |
| 7 | Big motor yacht in Dubai for December, budget around £500k | clear | _pending_ |
| 8 | Catamaran in the BVI for 6 guests, snorkeling and paddleboards | clear | _pending_ |
| 9 | Luxury charter in the French Riviera, July, chef and jacuzzi, 8 cabins | clear | _pending_ |
| 10 | Two-week sailing trip around Croatia in June for a group of 6 | clear | _pending_ |
| 11 | Something quiet and private in the Maldives, no kids | ambiguous | _pending_ |
| 12 | Party yacht in Ibiza, August, 12 people | clear | _pending_ |
| 13 | Affordable charter around the Greek islands, flexible dates | ambiguous | _pending_ |
| 14 | Departure 2026-07-15, Sardinia, motor yacht, 5 cabins | edge: ISO date | _pending_ |
| 15 | Catamaran or sailing yacht in the Caribbean for 8 guests | ambiguous: vessel | _pending_ |
| 16 | A yacht with a gym, spa, and helipad in Monaco | clear | _pending_ |
| 17 | Charter for our company offsite, 20 people, somewhere in the Mediterranean | edge: large group | _pending_ |
| 18 | cheap sailboat bahamas | edge: terse | _pending_ |
| 19 | A Mediterranean yacht for next summer | ambiguous: vague date | _pending_ |
| 20 | asdf qwerty lorem ipsum random text | edge: gibberish | _pending_ |

**Summary:** _pending — run `npm run eval`._

**Failure modes observed:** _pending._
