# Indie Cafe Consultant — Design Spec
**Date:** 2026-06-22
**Status:** Approved

---

## Overview

A free standalone web tool for independent (non-franchise) coffee shop owners in Korea. The owner fills out a short form about their cafe and gets back a personalized consulting report — the kind of analysis big franchise chains pay data teams for, made free for small owners.

**Core thesis:** Independents don't lose on coffee quality. They lose on discovery (being found online) and on not knowing where their competitive strengths actually lie. This tool quantifies both.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts (radar chart for moat scores) |
| Markdown | `react-markdown` + `remark-gfm` (renders streaming report) |
| Backend | Express (Node.js) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Data | Hardcoded JSON (neighborhood benchmarks) |
| Dev runner | `concurrently` (Vite + Express in one command) |
| Language | English UI throughout |

---

## Project Structure

```
Thumbs Up Coffee Antigravity/
├── src/
│   ├── components/
│   │   ├── steps/
│   │   │   ├── IntakeForm.tsx            # Step 1 — cafe situation form
│   │   │   ├── DiscoveryDiagnostic.tsx   # Step 2 — findability score
│   │   │   ├── MoatDiagnostic.tsx        # Step 3 — radar chart
│   │   │   ├── ConsultingReport.tsx      # Step 4 — streaming AI report
│   │   │   └── LimitationsNotice.tsx     # Step 5 — honesty screen
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── ProgressBar.tsx
│   ├── data/
│   │   └── neighborhoods.json            # Benchmark data per neighborhood
│   ├── lib/
│   │   ├── scoring.ts                    # Discovery + moat score computation
│   │   └── types.ts                      # Shared TypeScript interfaces
│   ├── App.tsx                           # Wizard state machine
│   └── main.tsx
├── server/
│   ├── index.js                          # Express server — /api/report endpoint
│   └── prompt.js                         # Builds Claude prompt from diagnostic data
├── index.html
├── vite.config.ts                        # Proxies /api/* → Express:3001 in dev
├── package.json
├── tsconfig.json
└── .env                                  # ANTHROPIC_API_KEY (never in frontend bundle)
```

---

## User Flow (5 Steps)

### Step 1 — Intake Form
The owner answers:
- **Neighborhood** — dropdown of 7 supported Seoul neighborhoods
- **Cafe type** — Drip specialist / General espresso bar / Mixed menu
- **Size** — Small (<15 seats) / Medium (15–30) / Large (30+)
- **Naver Place stats** — photo count, review count, days since last review, menu listed (checkbox), hours listed (checkbox)
- **Instagram** — yes/no
- **Strengths** — free text (e.g. "hand-pour technique, single origin beans")
- **Biggest worry** — free text (e.g. "new franchise opening next door")

CTA: "Get My Report →"

---

### Step 2 — Discovery Diagnostic (Module 1)
Scores how findable the cafe is online vs. the neighborhood average.

**Score formula (0–100):**

| Factor | Max pts | Logic |
|---|---|---|
| Photos vs. avg | 30 | `min(userCount / avgCount, 1.5) × 30` |
| Reviews vs. avg | 25 | `min(userCount / avgCount, 1.5) × 25` |
| Review recency | 20 | `max(0, 1 − (userDays / (avgDays × 3))) × 20` |
| Menu listed | 10 | binary |
| Hours listed | 10 | binary |
| Has Instagram | 5 | binary |

**Output displayed:**
- Large score circle (e.g. "34 / 100")
- Label: Struggling / Below Average / On Par / Strong / Exceptional
- Comparison table: each factor with user value vs. neighborhood average and gap
- Example: "You have 8 fewer photos than the Seongsu average (12 vs. 48)"

---

### Step 3 — Moat Diagnostic (Module 2)
Scores the cafe's competitive strengths across four moats, displayed on a radar chart.

**Moat scores (0–100 each):**

| Moat | Scoring logic |
|---|---|
| Experience | Base by cafe type: drip=80, mixed=60, general=45. +10 if strengths mention "hand", "single origin", "pour over", "roast" |
| Community | `(reviewScore × 0.5) + (recencyScore × 0.3) + (instagram ? 20 : 0)` where scores are proportional to neighborhood avg |
| Discovery | Reuses the discovery score from Step 2 |
| Menu/Margin | Base by cafe type: drip=70, mixed=55, general=40. +10 if strengths mention "seasonal", "unique", "signature", "specialty" |

**Output displayed:**
- Recharts `RadarChart` with four labeled axes
- Score cards below the chart for each moat (label + number)
- "Where to focus" — identifies weakest moat and explains why it's the high-leverage target
- Neighborhood pressure note: e.g. "Seongsu has a high franchise ratio (31%) and above-average closure rate — standing out matters more here than in lower-pressure neighborhoods."

CTA: "Generate My AI Report →"

---

### Step 4 — Consulting Report (Module 3)
Streams a personalized report from Claude in real time.

**Request:** Single `POST /api/report` with body:
```json
{
  "intake": { ...IntakeData },
  "discoveryResult": { "score": 34, "gaps": [...] },
  "moatResult": { "experience": 80, "community": 42, "discovery": 34, "menuMargin": 70 },
  "neighborhood": { ...NeighborhoodBenchmark }
}
```

**Response:** SSE stream — each event is `data: {"text": "...chunk..."}`, terminated by `data: [DONE]`.

**Report sections Claude writes:**
1. **Diagnosis** — 2–3 sentence plain-language read of the cafe's situation
2. **Priority Actions** — ranked list, most impactful first
3. **This Week** — 3 small, concrete to-dos the owner can do immediately
4. **This Month** — 2–3 bigger moves
5. **A Peer's Experience** — Claude writes an illustrative example framed as "A cafe owner in a similar situation found that…" — clearly presented as an illustrative analogy, not a real named person

**UX during streaming:**
- Spinner + "Analyzing your cafe..." while first token loads
- Text appears word-by-word as tokens arrive
- Sections render with headers as markdown is parsed
- `react-markdown` renders `reportText` as the stream accumulates — headers and lists appear formatted as sections complete
- "Copy to Clipboard" button appears once stream ends (copies raw markdown text)

---

### Step 5 — Limitations Notice
A plain, honest screen — part of the product's integrity.

Content:
> "This tool can help you get found online, sharpen your positioning, and compete smarter on the things you control. What it cannot do is solve rising rents or reverse gentrification. Those are structural problems that require policy — not a better Naver profile. We believe you deserve honesty about that."

Footer note: restates the tool's mission and links back to start.

CTA: "Start Over →" (resets wizard state)

---

## Neighborhood Benchmark Data

Seven Seoul neighborhoods, synthesized from public knowledge of each area's cafe scene:

```json
{
  "seongsu": {
    "name": "Seongsu (성수동)",
    "avgPhotoCount": 48,
    "avgReviewCount": 135,
    "avgDaysSinceLastReview": 11,
    "franchiseRatio": 0.31,
    "closureRate": 0.16,
    "rentPressure": "high"
  },
  "yeonnam": {
    "name": "Yeonnam (연남동)",
    "avgPhotoCount": 42,
    "avgReviewCount": 98,
    "avgDaysSinceLastReview": 14,
    "franchiseRatio": 0.27,
    "closureRate": 0.18,
    "rentPressure": "high"
  },
  "mangwon": {
    "name": "Mangwon (망원동)",
    "avgPhotoCount": 31,
    "avgReviewCount": 74,
    "avgDaysSinceLastReview": 18,
    "franchiseRatio": 0.22,
    "closureRate": 0.13,
    "rentPressure": "medium"
  },
  "hapjeong": {
    "name": "Hapjeong (합정)",
    "avgPhotoCount": 38,
    "avgReviewCount": 110,
    "avgDaysSinceLastReview": 15,
    "franchiseRatio": 0.29,
    "closureRate": 0.15,
    "rentPressure": "medium"
  },
  "euljiro": {
    "name": "Euljiro (을지로)",
    "avgPhotoCount": 27,
    "avgReviewCount": 61,
    "avgDaysSinceLastReview": 22,
    "franchiseRatio": 0.14,
    "closureRate": 0.11,
    "rentPressure": "low"
  },
  "seochon": {
    "name": "Seochon (서촌)",
    "avgPhotoCount": 29,
    "avgReviewCount": 67,
    "avgDaysSinceLastReview": 19,
    "franchiseRatio": 0.16,
    "closureRate": 0.12,
    "rentPressure": "low"
  },
  "hongdae": {
    "name": "Hongdae (홍대)",
    "avgPhotoCount": 55,
    "avgReviewCount": 180,
    "avgDaysSinceLastReview": 8,
    "franchiseRatio": 0.44,
    "closureRate": 0.21,
    "rentPressure": "very high"
  }
}
```

---

## Wizard State (App.tsx)

```typescript
type Step = 1 | 2 | 3 | 4 | 5

interface WizardState {
  step: Step
  intake: IntakeData | null
  discoveryResult: DiscoveryResult | null
  moatResult: MoatResult | null
  reportText: string            // accumulated streaming text
  reportDone: boolean
  reportError: string | null    // set if /api/report call fails; shown as inline error with retry button
}
```

State transitions:
- Step 1 → 2: form submitted, intake saved, discovery score computed
- Step 2 → 3: user clicks Next, moat scores computed
- Step 3 → 4: user clicks Generate, POST /api/report fires, streaming begins
- Step 4 → 5: user clicks Next (enabled once reportDone = true)
- Step 5 → 1: user clicks Start Over, state reset

---

## Key Types (lib/types.ts)

```typescript
export interface IntakeData {
  neighborhood: string
  cafeType: 'drip' | 'general' | 'mixed'
  sizeSeats: 'small' | 'medium' | 'large'
  naver: {
    photoCount: number
    reviewCount: number
    daysSinceLastReview: number
    hasMenu: boolean
    hasHours: boolean
  }
  hasInstagram: boolean
  strengths: string
  biggestWorry: string
}

export interface NeighborhoodBenchmark {
  name: string
  avgPhotoCount: number
  avgReviewCount: number
  avgDaysSinceLastReview: number
  franchiseRatio: number
  closureRate: number
  rentPressure: 'low' | 'medium' | 'high' | 'very high'
}

export interface DiscoveryResult {
  score: number
  label: 'Struggling' | 'Below Average' | 'On Par' | 'Strong' | 'Exceptional'
  gaps: Array<{ factor: string; yours: string | number; avg: string | number; delta: string }>
}

export interface MoatResult {
  experience: number
  community: number
  discovery: number
  menuMargin: number
  focusRecommendation: string
}
```

---

## Express Server (server/index.js)

```javascript
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt } from './prompt.js'

const app = express()
app.use(express.json())

app.post('/api/report', async (req, res) => {
  const { intake, discoveryResult, moatResult, neighborhood } = req.body

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const client = new Anthropic()
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: buildPrompt(intake, discoveryResult, moatResult, neighborhood) }]
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
    }
  }

  res.write('data: [DONE]\n\n')
  res.end()
})

app.listen(3001, () => console.log('API server running on :3001'))
```

---

## Vite Config (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

---

## What This Tool Explicitly Cannot Do

Stated on Step 5 and in the site footer:
- Cannot solve rising rents or displacement from gentrification
- Cannot manufacture foot traffic in a declining neighborhood
- Cannot replace a full business consultant for complex legal/financial decisions

This honesty is intentional and a core part of the product's identity.
