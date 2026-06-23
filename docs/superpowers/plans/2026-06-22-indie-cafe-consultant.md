# Indie Cafe Consultant — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React + Vite web app with an Express backend that walks independent Korean cafe owners through a 5-step diagnostic wizard and delivers a streaming AI consulting report.

**Architecture:** Single-page Vite app with wizard state in `App.tsx` renders one of five step components based on the current step number. Pure scoring functions in `src/lib/scoring.ts` compute discovery and moat scores from intake data and hardcoded JSON benchmarks. A single Express endpoint at `/api/report` streams an Anthropic Claude response back to the browser via SSE.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS v4 (Vite plugin), Recharts, react-markdown + remark-gfm, Express, `@anthropic-ai/sdk`, Vitest + @testing-library/react, concurrently

## Global Constraints

- Project root: `C:/Users/ljh45/OneDrive/Desktop/Thumbs Up Coffee Antigravity/`
- `"type": "module"` in package.json — all `.js` files use ES module `import`/`export` syntax
- Server runs on port 3001; Vite dev server proxies `/api/*` to it
- `ANTHROPIC_API_KEY` lives only in `.env` — never imported by frontend code
- Claude model: `claude-sonnet-4-6`
- English UI throughout
- All component files are `.tsx`, all library files are `.ts`, server files are `.js`
- No `prose` Tailwind plugin — use Tailwind v4 arbitrary child selectors for markdown styling
- Vitest does NOT use `globals: true` — import `describe`, `it`, `expect`, `vi` explicitly in every test file

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | All deps + dev/test/build scripts |
| `vite.config.ts` | React plugin + Tailwind plugin + `/api` proxy |
| `vitest.config.ts` | jsdom environment + setup file |
| `tsconfig.json` | TypeScript for the `src/` tree |
| `index.html` | Vite entry point |
| `src/index.css` | `@import "tailwindcss"` |
| `src/main.tsx` | ReactDOM.createRoot |
| `src/test/setup.ts` | `@testing-library/jest-dom` import |
| `src/lib/types.ts` | All shared TypeScript interfaces |
| `src/data/neighborhoods.json` | Hardcoded benchmark data for 7 Seoul neighborhoods |
| `src/lib/scoring.ts` | `computeDiscoveryScore` + `computeMoatScores` pure functions |
| `src/lib/scoring.test.ts` | Unit tests for scoring functions |
| `src/components/ui/Button.tsx` | Reusable button with primary/secondary variants |
| `src/components/ui/Card.tsx` | White bordered card wrapper |
| `src/components/ui/ProgressBar.tsx` | Step progress indicator |
| `src/App.tsx` | Wizard state machine + step routing |
| `src/App.test.tsx` | Wizard navigation tests |
| `src/components/steps/IntakeForm.tsx` | Step 1 — cafe situation form |
| `src/components/steps/IntakeForm.test.tsx` | Form validation + submission tests |
| `src/components/steps/DiscoveryDiagnostic.tsx` | Step 2 — discovery score display |
| `src/components/steps/DiscoveryDiagnostic.test.tsx` | Renders score + gaps table |
| `src/components/steps/MoatDiagnostic.tsx` | Step 3 — radar chart + moat cards |
| `src/components/steps/MoatDiagnostic.test.tsx` | Renders scores + focus recommendation |
| `server/index.js` | Express server — single `/api/report` SSE endpoint |
| `server/prompt.js` | `buildPrompt(intake, discoveryResult, moatResult, neighborhood)` |
| `src/components/steps/ConsultingReport.tsx` | Step 4 — SSE streaming + markdown render |
| `src/components/steps/ConsultingReport.test.tsx` | Loading + error states |
| `src/components/steps/LimitationsNotice.tsx` | Step 5 — honesty screen + reset |
| `src/components/steps/LimitationsNotice.test.tsx` | Renders content + reset button |
| `.env.example` | `ANTHROPIC_API_KEY=your_key_here` |
| `.gitignore` | `node_modules`, `.env`, `dist` |

---

## Task 1: Project Scaffold & Tooling

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `src/test/setup.ts`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `server/index.js` (stub)
- Create: `server/prompt.js` (stub)

**Interfaces:**
- Produces: a runnable dev environment (`npm run dev`) and a passing empty test suite (`npm test`)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "indie-cafe-consultant",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite",
    "dev:server": "node --watch server/index.js",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.36.0",
    "dotenv": "^16.4.0",
    "express": "^5.1.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-markdown": "^9.1.0",
    "recharts": "^2.15.0",
    "remark-gfm": "^4.0.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.5.0",
    "concurrently": "^9.1.0",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.8.0",
    "vite": "^6.3.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Indie Cafe Consultant</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create src/index.css**

```css
@import "tailwindcss";
```

- [ ] **Step 8: Create src/test/setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 9: Create src/main.tsx (stub — renders placeholder until App.tsx exists)**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8 text-stone-900">Loading...</div>
  </React.StrictMode>,
)
```

- [ ] **Step 10: Create .env.example**

```
ANTHROPIC_API_KEY=your_key_here
```

Copy to `.env` and fill in your key:
```
cp .env.example .env
```
Then open `.env` and replace `your_key_here` with your Anthropic API key.

- [ ] **Step 11: Create .gitignore**

```
node_modules/
.env
dist/
.next/
*.tsbuildinfo
```

- [ ] **Step 12: Create server/index.js (stub)**

```javascript
import express from 'express'

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(3001, () => console.log('API server running on :3001'))
```

- [ ] **Step 13: Create server/prompt.js (stub)**

```javascript
export function buildPrompt(_intake, _discoveryResult, _moatResult, _neighborhood) {
  return 'stub prompt'
}
```

- [ ] **Step 14: Verify test runner works**

Run: `npm test`
Expected: `No test files found` or `0 tests passed` — no errors.

- [ ] **Step 15: Commit**

```bash
git init
git add .
git commit -m "feat: project scaffold — Vite, React, Express, Tailwind v4, Vitest"
```

---

## Task 2: Shared Types + Neighborhood Data

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/data/neighborhoods.json`

**Interfaces:**
- Produces: `IntakeData`, `NeighborhoodBenchmark`, `DiscoveryResult`, `MoatResult` — consumed by Tasks 3, 6, 7, 8, 9, 10

- [ ] **Step 1: Create src/lib/types.ts**

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
  gaps: Array<{
    factor: string
    yours: string | number
    avg: string | number
    delta: string
  }>
}

export interface MoatResult {
  experience: number
  community: number
  discovery: number
  menuMargin: number
  focusRecommendation: string
}
```

- [ ] **Step 2: Create src/data/neighborhoods.json**

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

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/data/neighborhoods.json
git commit -m "feat: shared types and neighborhood benchmark data"
```

---

## Task 3: Scoring Engine (TDD)

**Files:**
- Create: `src/lib/scoring.ts`
- Create: `src/lib/scoring.test.ts`

**Interfaces:**
- Consumes: `IntakeData`, `NeighborhoodBenchmark`, `DiscoveryResult`, `MoatResult` from `src/lib/types.ts`; `neighborhoods.json` from `src/data/`
- Produces:
  - `computeDiscoveryScore(intake: IntakeData): DiscoveryResult`
  - `computeMoatScores(intake: IntakeData, discoveryScore: number): MoatResult`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/scoring.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeDiscoveryScore, computeMoatScores } from './scoring'
import type { IntakeData } from './types'

const seongsuAvg: IntakeData = {
  neighborhood: 'seongsu',
  cafeType: 'drip',
  sizeSeats: 'small',
  naver: {
    photoCount: 48,
    reviewCount: 135,
    daysSinceLastReview: 11,
    hasMenu: true,
    hasHours: true,
  },
  hasInstagram: true,
  strengths: 'hand-pour technique, single origin beans',
  biggestWorry: 'franchise competition',
}

describe('computeDiscoveryScore', () => {
  it('scores a cafe exactly at neighborhood average with all listings as 93', () => {
    // photoScore: min(48/48, 1.5)*30 = 30
    // reviewScore: min(135/135, 1.5)*25 = 25
    // recencyScore: max(0, 1 - 11/(11*3))*20 = (2/3)*20 = 13.33 -> rounds to 13 in total
    // menu: 10, hours: 10, instagram: 5
    // total raw: 93.33 -> Math.round -> 93
    const result = computeDiscoveryScore(seongsuAvg)
    expect(result.score).toBe(93)
    expect(result.label).toBe('Exceptional')
  })

  it('scores 0 for a cafe with no online presence', () => {
    const intake: IntakeData = {
      ...seongsuAvg,
      naver: { photoCount: 0, reviewCount: 0, daysSinceLastReview: 365, hasMenu: false, hasHours: false },
      hasInstagram: false,
    }
    const result = computeDiscoveryScore(intake)
    expect(result.score).toBe(0)
    expect(result.label).toBe('Struggling')
  })

  it('returns exactly 6 gap entries', () => {
    const result = computeDiscoveryScore(seongsuAvg)
    expect(result.gaps).toHaveLength(6)
    expect(result.gaps[0].factor).toBe('Photos')
  })

  it('labels score 40–59 as On Par', () => {
    // photoCount=10 (6.25), reviewCount=30 (5.56), days=11 (13.33), menu=T, hours=T, insta=F
    // total = 6.25+5.56+13.33+10+10+0 = 45.14 -> 45
    const intake: IntakeData = {
      ...seongsuAvg,
      naver: { ...seongsuAvg.naver, photoCount: 10, reviewCount: 30 },
      hasInstagram: false,
    }
    const result = computeDiscoveryScore(intake)
    expect(result.score).toBe(45)
    expect(result.label).toBe('On Par')
  })

  it('clamps total score to 100 when ratios exceed 1.5x avg', () => {
    const intake: IntakeData = {
      ...seongsuAvg,
      naver: { ...seongsuAvg.naver, photoCount: 500, reviewCount: 1000, daysSinceLastReview: 1 },
    }
    const result = computeDiscoveryScore(intake)
    expect(result.score).toBe(100)
  })

  it('negative delta for photos below average shows "below average"', () => {
    const intake: IntakeData = { ...seongsuAvg, naver: { ...seongsuAvg.naver, photoCount: 10 } }
    const result = computeDiscoveryScore(intake)
    const photoGap = result.gaps.find(g => g.factor === 'Photos')!
    expect(photoGap.delta).toContain('below average')
  })
})

describe('computeMoatScores', () => {
  it('gives drip cafe with "hand" keyword experience moat of 90', () => {
    // base drip=80, bonus "hand"=10, min(100, 90)=90
    const result = computeMoatScores(seongsuAvg, 93)
    expect(result.experience).toBe(90)
  })

  it('sets discovery moat equal to the provided discovery score', () => {
    const result = computeMoatScores(seongsuAvg, 93)
    expect(result.discovery).toBe(93)
  })

  it('includes "moat" in the focus recommendation', () => {
    const result = computeMoatScores(seongsuAvg, 93)
    expect(result.focusRecommendation).toContain('moat')
  })

  it('clamps community score to 100', () => {
    const intake: IntakeData = {
      ...seongsuAvg,
      naver: { ...seongsuAvg.naver, reviewCount: 9999, daysSinceLastReview: 1 },
    }
    const result = computeMoatScores(intake, 100)
    expect(result.community).toBeLessThanOrEqual(100)
  })

  it('boosts menuMargin by 10 when "specialty" appears in strengths', () => {
    const intake: IntakeData = { ...seongsuAvg, strengths: 'specialty drip coffee' }
    const result = computeMoatScores(intake, 50)
    expect(result.menuMargin).toBe(80) // drip base 70 + 10 bonus
  })

  it('general cafe without keywords gets low experience and menu scores', () => {
    const intake: IntakeData = { ...seongsuAvg, cafeType: 'general', strengths: 'friendly service' }
    const result = computeMoatScores(intake, 50)
    expect(result.experience).toBe(45) // base general, no bonus
    expect(result.menuMargin).toBe(40) // base general, no bonus
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test`
Expected: all tests fail with "Cannot find module './scoring'"

- [ ] **Step 3: Create src/lib/scoring.ts**

```typescript
import neighborhoodsData from '../data/neighborhoods.json'
import type { IntakeData, NeighborhoodBenchmark, DiscoveryResult, MoatResult } from './types'

const neighborhoods = neighborhoodsData as Record<string, NeighborhoodBenchmark>

export function computeDiscoveryScore(intake: IntakeData): DiscoveryResult {
  const bench = neighborhoods[intake.neighborhood]

  const photoScore = Math.min(intake.naver.photoCount / bench.avgPhotoCount, 1.5) * 30
  const reviewScore = Math.min(intake.naver.reviewCount / bench.avgReviewCount, 1.5) * 25
  const recencyScore = Math.max(0, 1 - intake.naver.daysSinceLastReview / (bench.avgDaysSinceLastReview * 3)) * 20
  const menuScore = intake.naver.hasMenu ? 10 : 0
  const hoursScore = intake.naver.hasHours ? 10 : 0
  const instagramScore = intake.hasInstagram ? 5 : 0

  const score = Math.min(100, Math.round(photoScore + reviewScore + recencyScore + menuScore + hoursScore + instagramScore))

  const label: DiscoveryResult['label'] =
    score >= 80 ? 'Exceptional'
    : score >= 60 ? 'Strong'
    : score >= 40 ? 'On Par'
    : score >= 20 ? 'Below Average'
    : 'Struggling'

  const photoDelta = intake.naver.photoCount - bench.avgPhotoCount
  const reviewDelta = intake.naver.reviewCount - bench.avgReviewCount
  const recencyDelta = intake.naver.daysSinceLastReview - bench.avgDaysSinceLastReview

  const gaps: DiscoveryResult['gaps'] = [
    {
      factor: 'Photos',
      yours: intake.naver.photoCount,
      avg: bench.avgPhotoCount,
      delta: photoDelta >= 0 ? `+${photoDelta} above average` : `${photoDelta} below average`,
    },
    {
      factor: 'Reviews',
      yours: intake.naver.reviewCount,
      avg: bench.avgReviewCount,
      delta: reviewDelta >= 0 ? `+${reviewDelta} above average` : `${reviewDelta} below average`,
    },
    {
      factor: 'Days since last review',
      yours: `${intake.naver.daysSinceLastReview} days`,
      avg: `${bench.avgDaysSinceLastReview} days`,
      delta: recencyDelta <= 0
        ? `${Math.abs(recencyDelta)} days more recent than average`
        : `${recencyDelta} days older than average`,
    },
    {
      factor: 'Menu on Naver',
      yours: intake.naver.hasMenu ? 'Yes' : 'No',
      avg: 'Best practice',
      delta: intake.naver.hasMenu ? 'Listed ✓' : 'Missing — add it today',
    },
    {
      factor: 'Hours on Naver',
      yours: intake.naver.hasHours ? 'Yes' : 'No',
      avg: 'Best practice',
      delta: intake.naver.hasHours ? 'Listed ✓' : 'Missing — add it today',
    },
    {
      factor: 'Instagram',
      yours: intake.hasInstagram ? 'Active' : 'None',
      avg: 'Best practice',
      delta: intake.hasInstagram ? 'Active ✓' : 'No account — consider starting one',
    },
  ]

  return { score, label, gaps }
}

export function computeMoatScores(intake: IntakeData, discoveryScore: number): MoatResult {
  const bench = neighborhoods[intake.neighborhood]
  const sl = intake.strengths.toLowerCase()

  const experienceBase = intake.cafeType === 'drip' ? 80 : intake.cafeType === 'mixed' ? 60 : 45
  const experienceBonus = ['hand', 'single origin', 'pour over', 'roast'].some(k => sl.includes(k)) ? 10 : 0
  const experience = Math.min(100, experienceBase + experienceBonus)

  const reviewProportion = Math.min(intake.naver.reviewCount / bench.avgReviewCount, 1.5)
  const recencyProportion = Math.max(0, 1 - intake.naver.daysSinceLastReview / (bench.avgDaysSinceLastReview * 3))
  const community = Math.min(100, Math.round(
    reviewProportion * 100 * 0.5 +
    recencyProportion * 100 * 0.3 +
    (intake.hasInstagram ? 20 : 0)
  ))

  const discovery = discoveryScore

  const menuBase = intake.cafeType === 'drip' ? 70 : intake.cafeType === 'mixed' ? 55 : 40
  const menuBonus = ['seasonal', 'unique', 'signature', 'specialty'].some(k => sl.includes(k)) ? 10 : 0
  const menuMargin = Math.min(100, menuBase + menuBonus)

  const scores = { experience, community, discovery, menuMargin } as const
  const weakestKey = (Object.keys(scores) as Array<keyof typeof scores>)
    .reduce((a, b) => scores[a] <= scores[b] ? a : b)

  const moatLabels: Record<keyof typeof scores, string> = {
    experience: 'Experience',
    community: 'Community',
    discovery: 'Discovery',
    menuMargin: 'Menu & Margin',
  }

  const focusRecommendation = `Focus on your ${moatLabels[weakestKey]} moat — it's your lowest score and likely your highest-leverage improvement opportunity.`

  return { experience, community, discovery, menuMargin, focusRecommendation }
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test`
Expected: 12 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts src/lib/scoring.test.ts
git commit -m "feat: scoring engine with full test coverage"
```

---

## Task 4: UI Primitives

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/ProgressBar.tsx`

**Interfaces:**
- Produces:
  - `Button({ variant?: 'primary' | 'secondary', ...HTMLButtonAttributes })`
  - `Card({ children: ReactNode, className?: string })`
  - `ProgressBar({ step: number, totalSteps: number })`

- [ ] **Step 1: Create src/components/ui/Button.tsx**

```typescript
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = 'w-full font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-white',
    secondary: 'bg-white hover:bg-stone-50 text-stone-900 border border-stone-300',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create src/components/ui/Card.tsx**

```typescript
import type { ReactNode } from 'react'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-stone-200 p-6 ${className}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/ui/ProgressBar.tsx**

```typescript
export default function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const percent = ((step - 1) / (totalSteps - 1)) * 100
  return (
    <div className="bg-stone-200 h-1">
      <div
        className="bg-amber-500 h-1 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat: Button, Card, ProgressBar UI primitives"
```

---

## Task 5: App Wizard Shell

**Files:**
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Modify: `src/main.tsx` (replace stub with real App import)

**Interfaces:**
- Consumes: `computeDiscoveryScore`, `computeMoatScores` from `src/lib/scoring`; `IntakeData`, `DiscoveryResult`, `MoatResult`, `NeighborhoodBenchmark` from `src/lib/types`; `neighborhoods.json`; all step components (mocked in tests)
- Produces: `<App />` — manages `WizardState`, renders the active step

- [ ] **Step 1: Write failing wizard navigation tests**

Create `src/App.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import type { IntakeData } from './lib/types'

const mockIntake: IntakeData = {
  neighborhood: 'seongsu',
  cafeType: 'drip',
  sizeSeats: 'small',
  naver: { photoCount: 10, reviewCount: 20, daysSinceLastReview: 5, hasMenu: true, hasHours: true },
  hasInstagram: false,
  strengths: 'hand pour',
  biggestWorry: 'competition',
}

vi.mock('./lib/scoring', () => ({
  computeDiscoveryScore: vi.fn().mockReturnValue({ score: 50, label: 'On Par', gaps: [] }),
  computeMoatScores: vi.fn().mockReturnValue({
    experience: 70, community: 60, discovery: 50, menuMargin: 55,
    focusRecommendation: 'Focus on Community moat.',
  }),
}))

vi.mock('./components/steps/IntakeForm', () => ({
  default: ({ onSubmit }: { onSubmit: (d: IntakeData) => void }) => (
    <button onClick={() => onSubmit(mockIntake)}>Submit Intake</button>
  ),
}))
vi.mock('./components/steps/DiscoveryDiagnostic', () => ({
  default: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>Next from Discovery</button>,
}))
vi.mock('./components/steps/MoatDiagnostic', () => ({
  default: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>Next from Moat</button>,
}))
vi.mock('./components/steps/ConsultingReport', () => ({
  default: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>Next from Report</button>,
}))
vi.mock('./components/steps/LimitationsNotice', () => ({
  default: ({ onReset }: { onReset: () => void }) => <button onClick={onReset}>Start Over</button>,
}))

describe('App wizard navigation', () => {
  it('starts at step 1 (IntakeForm)', () => {
    render(<App />)
    expect(screen.getByText('Submit Intake')).toBeInTheDocument()
  })

  it('advances to step 2 after intake submission', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Submit Intake'))
    expect(screen.getByText('Next from Discovery')).toBeInTheDocument()
  })

  it('advances through all 5 steps in order', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Submit Intake'))
    fireEvent.click(screen.getByText('Next from Discovery'))
    fireEvent.click(screen.getByText('Next from Moat'))
    fireEvent.click(screen.getByText('Next from Report'))
    expect(screen.getByText('Start Over')).toBeInTheDocument()
  })

  it('resets to step 1 from step 5', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Submit Intake'))
    fireEvent.click(screen.getByText('Next from Discovery'))
    fireEvent.click(screen.getByText('Next from Moat'))
    fireEvent.click(screen.getByText('Next from Report'))
    fireEvent.click(screen.getByText('Start Over'))
    expect(screen.getByText('Submit Intake')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- --reporter=verbose`
Expected: tests fail with "Cannot find module './App'"

- [ ] **Step 3: Create src/App.tsx**

```typescript
import { useState } from 'react'
import IntakeForm from './components/steps/IntakeForm'
import DiscoveryDiagnostic from './components/steps/DiscoveryDiagnostic'
import MoatDiagnostic from './components/steps/MoatDiagnostic'
import ConsultingReport from './components/steps/ConsultingReport'
import LimitationsNotice from './components/steps/LimitationsNotice'
import ProgressBar from './components/ui/ProgressBar'
import { computeDiscoveryScore, computeMoatScores } from './lib/scoring'
import neighborhoodsData from './data/neighborhoods.json'
import type { IntakeData, DiscoveryResult, MoatResult, NeighborhoodBenchmark } from './lib/types'

type Step = 1 | 2 | 3 | 4 | 5

interface WizardState {
  step: Step
  intake: IntakeData | null
  discoveryResult: DiscoveryResult | null
  moatResult: MoatResult | null
}

const initialState: WizardState = {
  step: 1,
  intake: null,
  discoveryResult: null,
  moatResult: null,
}

const neighborhoods = neighborhoodsData as Record<string, NeighborhoodBenchmark>

export default function App() {
  const [state, setState] = useState<WizardState>(initialState)

  function handleIntakeSubmit(intake: IntakeData) {
    const discoveryResult = computeDiscoveryScore(intake)
    setState(s => ({ ...s, step: 2, intake, discoveryResult }))
  }

  function handleDiscoveryNext() {
    const moatResult = computeMoatScores(state.intake!, state.discoveryResult!.score)
    setState(s => ({ ...s, step: 3, moatResult }))
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-stone-900">Indie Cafe Consultant</h1>
          <p className="text-sm text-stone-500">Free business consulting for independent cafe owners</p>
        </div>
      </header>
      <ProgressBar step={state.step} totalSteps={5} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {state.step === 1 && (
          <IntakeForm onSubmit={handleIntakeSubmit} />
        )}
        {state.step === 2 && state.intake && state.discoveryResult && (
          <DiscoveryDiagnostic
            intake={state.intake}
            result={state.discoveryResult}
            neighborhood={neighborhoods[state.intake.neighborhood]}
            onNext={handleDiscoveryNext}
          />
        )}
        {state.step === 3 && state.intake && state.moatResult && (
          <MoatDiagnostic
            intake={state.intake}
            result={state.moatResult}
            neighborhood={neighborhoods[state.intake.neighborhood]}
            onNext={() => setState(s => ({ ...s, step: 4 }))}
          />
        )}
        {state.step === 4 && state.intake && state.discoveryResult && state.moatResult && (
          <ConsultingReport
            intake={state.intake}
            discoveryResult={state.discoveryResult}
            moatResult={state.moatResult}
            neighborhood={neighborhoods[state.intake.neighborhood]}
            onNext={() => setState(s => ({ ...s, step: 5 }))}
          />
        )}
        {state.step === 5 && (
          <LimitationsNotice onReset={() => setState(initialState)} />
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Create stub step components so App.tsx can compile**

Create `src/components/steps/IntakeForm.tsx` (stub):
```typescript
import type { IntakeData } from '../../lib/types'
export default function IntakeForm({ onSubmit }: { onSubmit: (d: IntakeData) => void }) {
  return <div onClick={() => onSubmit({} as IntakeData)}>IntakeForm stub</div>
}
```

Create `src/components/steps/DiscoveryDiagnostic.tsx` (stub):
```typescript
export default function DiscoveryDiagnostic({ onNext }: { onNext: () => void }) {
  return <button onClick={onNext}>DiscoveryDiagnostic stub</button>
}
```

Create `src/components/steps/MoatDiagnostic.tsx` (stub):
```typescript
export default function MoatDiagnostic({ onNext }: { onNext: () => void }) {
  return <button onClick={onNext}>MoatDiagnostic stub</button>
}
```

Create `src/components/steps/ConsultingReport.tsx` (stub):
```typescript
export default function ConsultingReport({ onNext }: { onNext: () => void }) {
  return <button onClick={onNext}>ConsultingReport stub</button>
}
```

Create `src/components/steps/LimitationsNotice.tsx` (stub):
```typescript
export default function LimitationsNotice({ onReset }: { onReset: () => void }) {
  return <button onClick={onReset}>LimitationsNotice stub</button>
}
```

- [ ] **Step 5: Update src/main.tsx to render App**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: Run tests and verify they pass**

Run: `npm test`
Expected: all tests pass (scoring tests + wizard navigation tests).

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/main.tsx src/components/steps/
git commit -m "feat: App wizard shell with navigation tests"
```

---

## Task 6: IntakeForm (Step 1)

**Files:**
- Modify: `src/components/steps/IntakeForm.tsx` (replace stub)
- Create: `src/components/steps/IntakeForm.test.tsx`

**Interfaces:**
- Consumes: `IntakeData` from `src/lib/types`; `neighborhoods.json`
- Produces: `IntakeForm({ onSubmit: (data: IntakeData) => void })` — calls onSubmit with validated form data

- [ ] **Step 1: Write failing tests**

Create `src/components/steps/IntakeForm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IntakeForm from './IntakeForm'

describe('IntakeForm', () => {
  it('renders neighborhood dropdown', () => {
    render(<IntakeForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Neighborhood')).toBeInTheDocument()
  })

  it('renders all cafe type options', () => {
    render(<IntakeForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Drip specialist')).toBeInTheDocument()
    expect(screen.getByLabelText('General espresso bar')).toBeInTheDocument()
    expect(screen.getByLabelText('Mixed menu')).toBeInTheDocument()
  })

  it('does not submit when neighborhood is not selected', async () => {
    const onSubmit = vi.fn()
    render(<IntakeForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Get My Report →'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not submit when strengths is empty', async () => {
    const onSubmit = vi.fn()
    render(<IntakeForm onSubmit={onSubmit} />)
    await userEvent.selectOptions(screen.getByLabelText('Neighborhood'), 'seongsu')
    fireEvent.click(screen.getByText('Get My Report →'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const onSubmit = vi.fn()
    render(<IntakeForm onSubmit={onSubmit} />)

    await userEvent.selectOptions(screen.getByLabelText('Neighborhood'), 'seongsu')
    await userEvent.clear(screen.getByLabelText('Number of photos on Naver Place'))
    await userEvent.type(screen.getByLabelText('Number of photos on Naver Place'), '12')
    await userEvent.clear(screen.getByLabelText('Number of reviews'))
    await userEvent.type(screen.getByLabelText('Number of reviews'), '34')
    await userEvent.clear(screen.getByLabelText('Days since last review'))
    await userEvent.type(screen.getByLabelText('Days since last review'), '45')
    await userEvent.type(screen.getByLabelText('Your biggest strengths'), 'hand pour technique')
    await userEvent.type(screen.getByLabelText('Your biggest worry'), 'franchise competition')

    fireEvent.click(screen.getByText('Get My Report →'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        neighborhood: 'seongsu',
        naver: expect.objectContaining({ photoCount: 12, reviewCount: 34, daysSinceLastReview: 45 }),
        strengths: 'hand pour technique',
        biggestWorry: 'franchise competition',
      }))
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- IntakeForm`
Expected: tests fail (stub doesn't have labeled inputs)

- [ ] **Step 3: Replace IntakeForm stub with full implementation**

```typescript
import { useState, type FormEvent } from 'react'
import neighborhoodsData from '../../data/neighborhoods.json'
import type { IntakeData, NeighborhoodBenchmark } from '../../lib/types'
import Button from '../ui/Button'

const NEIGHBORHOODS = Object.entries(
  neighborhoodsData as Record<string, NeighborhoodBenchmark>
).map(([key, val]) => ({ key, label: val.name }))

const initialForm: IntakeData = {
  neighborhood: '',
  cafeType: 'drip',
  sizeSeats: 'small',
  naver: { photoCount: 0, reviewCount: 0, daysSinceLastReview: 0, hasMenu: false, hasHours: false },
  hasInstagram: false,
  strengths: '',
  biggestWorry: '',
}

export default function IntakeForm({ onSubmit }: { onSubmit: (data: IntakeData) => void }) {
  const [form, setForm] = useState<IntakeData>(initialForm)
  const [errors, setErrors] = useState<string[]>([])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs: string[] = []
    if (!form.neighborhood) errs.push('Please select your neighborhood.')
    if (!form.strengths.trim()) errs.push('Please describe your strengths.')
    if (!form.biggestWorry.trim()) errs.push('Please describe your biggest worry.')
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    onSubmit(form)
  }

  function setNaver<K extends keyof IntakeData['naver']>(key: K, value: IntakeData['naver'][K]) {
    setForm(f => ({ ...f, naver: { ...f.naver, [key]: value } }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Tell us about your cafe</h2>
        <p className="text-stone-500">Takes about 3 minutes. All fields are used to personalize your report.</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {errors.map(e => <p key={e} className="text-red-700 text-sm">{e}</p>)}
        </div>
      )}

      {/* Neighborhood */}
      <div className="space-y-1">
        <label htmlFor="neighborhood" className="block text-sm font-medium text-stone-700">Neighborhood</label>
        <select
          id="neighborhood"
          aria-label="Neighborhood"
          value={form.neighborhood}
          onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select your neighborhood…</option>
          {NEIGHBORHOODS.map(n => (
            <option key={n.key} value={n.key}>{n.label}</option>
          ))}
        </select>
      </div>

      {/* Cafe type */}
      <fieldset>
        <legend className="block text-sm font-medium text-stone-700 mb-2">Cafe type</legend>
        <div className="space-y-2">
          {([
            ['drip', 'Drip specialist'],
            ['general', 'General espresso bar'],
            ['mixed', 'Mixed menu'],
          ] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cafeType"
                value={val}
                aria-label={label}
                checked={form.cafeType === val}
                onChange={() => setForm(f => ({ ...f, cafeType: val }))}
                className="accent-amber-500"
              />
              <span className="text-stone-800">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Size */}
      <fieldset>
        <legend className="block text-sm font-medium text-stone-700 mb-2">Cafe size</legend>
        <div className="space-y-2">
          {([
            ['small', 'Small — fewer than 15 seats'],
            ['medium', 'Medium — 15 to 30 seats'],
            ['large', 'Large — more than 30 seats'],
          ] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sizeSeats"
                value={val}
                checked={form.sizeSeats === val}
                onChange={() => setForm(f => ({ ...f, sizeSeats: val }))}
                className="accent-amber-500"
              />
              <span className="text-stone-800">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Naver Place stats */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-stone-700">Your Naver Place stats <span className="text-stone-400 font-normal">(check your Naver Place page)</span></p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            ['photoCount', 'Number of photos on Naver Place', 'Photos'],
            ['reviewCount', 'Number of reviews', 'Reviews'],
            ['daysSinceLastReview', 'Days since last review', 'Days since last review'],
          ] as const).map(([key, ariaLabel, placeholder]) => (
            <div key={key} className="space-y-1">
              <label htmlFor={key} className="block text-xs text-stone-500">{placeholder}</label>
              <input
                id={key}
                type="number"
                aria-label={ariaLabel}
                min={0}
                value={form.naver[key] === 0 ? '' : form.naver[key]}
                onChange={e => setNaver(key, parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {([
            ['hasMenu', 'Menu is listed on Naver Place'],
            ['hasHours', 'Opening hours are listed on Naver Place'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.naver[key]}
                onChange={e => setNaver(key, e.target.checked)}
                className="accent-amber-500 w-4 h-4"
              />
              <span className="text-stone-800 text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Instagram */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.hasInstagram}
          onChange={e => setForm(f => ({ ...f, hasInstagram: e.target.checked }))}
          className="accent-amber-500 w-4 h-4"
        />
        <span className="text-stone-800 text-sm">My cafe has an Instagram account</span>
      </label>

      {/* Strengths */}
      <div className="space-y-1">
        <label htmlFor="strengths" className="block text-sm font-medium text-stone-700">
          Your biggest strengths <span className="text-stone-400 font-normal">(e.g. hand-pour technique, single origin beans, regulars)</span>
        </label>
        <textarea
          id="strengths"
          aria-label="Your biggest strengths"
          value={form.strengths}
          onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))}
          rows={3}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      {/* Biggest worry */}
      <div className="space-y-1">
        <label htmlFor="biggestWorry" className="block text-sm font-medium text-stone-700">
          Your biggest worry right now
        </label>
        <textarea
          id="biggestWorry"
          aria-label="Your biggest worry"
          value={form.biggestWorry}
          onChange={e => setForm(f => ({ ...f, biggestWorry: e.target.value }))}
          rows={3}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      <Button type="submit">Get My Report →</Button>
    </form>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test -- IntakeForm`
Expected: all 5 IntakeForm tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/steps/IntakeForm.tsx src/components/steps/IntakeForm.test.tsx
git commit -m "feat: IntakeForm step 1 with validation"
```

---

## Task 7: DiscoveryDiagnostic (Step 2)

**Files:**
- Modify: `src/components/steps/DiscoveryDiagnostic.tsx` (replace stub)
- Create: `src/components/steps/DiscoveryDiagnostic.test.tsx`

**Interfaces:**
- Consumes: `IntakeData`, `DiscoveryResult`, `NeighborhoodBenchmark` from `src/lib/types`
- Produces: `DiscoveryDiagnostic({ intake, result, neighborhood, onNext: () => void })`

- [ ] **Step 1: Write failing tests**

Create `src/components/steps/DiscoveryDiagnostic.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiscoveryDiagnostic from './DiscoveryDiagnostic'
import type { IntakeData, DiscoveryResult, NeighborhoodBenchmark } from '../../lib/types'

const mockIntake: IntakeData = {
  neighborhood: 'seongsu', cafeType: 'drip', sizeSeats: 'small',
  naver: { photoCount: 12, reviewCount: 34, daysSinceLastReview: 45, hasMenu: true, hasHours: false },
  hasInstagram: false, strengths: 'hand pour', biggestWorry: 'competition',
}
const mockResult: DiscoveryResult = {
  score: 34,
  label: 'Below Average',
  gaps: [
    { factor: 'Photos', yours: 12, avg: 48, delta: '-36 below average' },
    { factor: 'Reviews', yours: 34, avg: 135, delta: '-101 below average' },
  ],
}
const mockNeighborhood: NeighborhoodBenchmark = {
  name: 'Seongsu (성수동)', avgPhotoCount: 48, avgReviewCount: 135,
  avgDaysSinceLastReview: 11, franchiseRatio: 0.31, closureRate: 0.16, rentPressure: 'high',
}

describe('DiscoveryDiagnostic', () => {
  it('displays the discovery score', () => {
    render(<DiscoveryDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText('34')).toBeInTheDocument()
  })

  it('displays the score label', () => {
    render(<DiscoveryDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText('Below Average')).toBeInTheDocument()
  })

  it('renders a row for each gap entry', () => {
    render(<DiscoveryDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText('Photos')).toBeInTheDocument()
    expect(screen.getByText('Reviews')).toBeInTheDocument()
  })

  it('renders the next button', () => {
    render(<DiscoveryDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText('See Your Competitive Strengths →')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- DiscoveryDiagnostic`
Expected: tests fail (stub renders wrong content)

- [ ] **Step 3: Replace stub with full implementation**

```typescript
import type { IntakeData, DiscoveryResult, NeighborhoodBenchmark } from '../../lib/types'
import Button from '../ui/Button'

const LABEL_COLORS: Record<DiscoveryResult['label'], string> = {
  Struggling: 'text-red-600',
  'Below Average': 'text-orange-600',
  'On Par': 'text-yellow-600',
  Strong: 'text-green-600',
  Exceptional: 'text-emerald-600',
}

export default function DiscoveryDiagnostic({
  result,
  neighborhood,
  onNext,
}: {
  intake: IntakeData
  result: DiscoveryResult
  neighborhood: NeighborhoodBenchmark
  onNext: () => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Discovery Diagnostic</h2>
        <p className="text-stone-500">How easy is it for customers to find your cafe online?</p>
      </div>

      {/* Score circle */}
      <div className="flex flex-col items-center py-4">
        <div className="w-36 h-36 rounded-full border-8 border-amber-400 flex items-center justify-center mb-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-stone-900">{result.score}</div>
            <div className="text-sm text-stone-400">/ 100</div>
          </div>
        </div>
        <div className={`text-xl font-semibold ${LABEL_COLORS[result.label]}`}>{result.label}</div>
        <div className="text-sm text-stone-400 mt-1">vs. cafes in {neighborhood.name}</div>
      </div>

      {/* Gap table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Factor</th>
              <th className="text-right px-4 py-3 text-stone-500 font-medium">Yours</th>
              <th className="text-right px-4 py-3 text-stone-500 font-medium">Avg</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {result.gaps.map(gap => (
              <tr key={gap.factor}>
                <td className="px-4 py-3 text-stone-900">{gap.factor}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-900">{gap.yours}</td>
                <td className="px-4 py-3 text-right text-stone-400">{gap.avg}</td>
                <td className="px-4 py-3 text-stone-600 text-xs">{gap.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={onNext}>See Your Competitive Strengths →</Button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test -- DiscoveryDiagnostic`
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/steps/DiscoveryDiagnostic.tsx src/components/steps/DiscoveryDiagnostic.test.tsx
git commit -m "feat: DiscoveryDiagnostic step 2 — score circle and gap table"
```

---

## Task 8: MoatDiagnostic (Step 3)

**Files:**
- Modify: `src/components/steps/MoatDiagnostic.tsx` (replace stub)
- Create: `src/components/steps/MoatDiagnostic.test.tsx`

**Interfaces:**
- Consumes: `IntakeData`, `MoatResult`, `NeighborhoodBenchmark` from `src/lib/types`; `RadarChart` from `recharts`
- Produces: `MoatDiagnostic({ intake, result, neighborhood, onNext: () => void })`

- [ ] **Step 1: Write failing tests**

Create `src/components/steps/MoatDiagnostic.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MoatDiagnostic from './MoatDiagnostic'
import type { IntakeData, MoatResult, NeighborhoodBenchmark } from '../../lib/types'

// Recharts uses ResizeObserver which jsdom doesn't have
vi.mock('recharts', () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockIntake: IntakeData = {
  neighborhood: 'seongsu', cafeType: 'drip', sizeSeats: 'small',
  naver: { photoCount: 12, reviewCount: 34, daysSinceLastReview: 45, hasMenu: true, hasHours: false },
  hasInstagram: false, strengths: 'hand pour', biggestWorry: 'competition',
}
const mockResult: MoatResult = {
  experience: 90, community: 42, discovery: 34, menuMargin: 70,
  focusRecommendation: 'Focus on your Community moat — it\'s your lowest score.',
}
const mockNeighborhood: NeighborhoodBenchmark = {
  name: 'Seongsu (성수동)', avgPhotoCount: 48, avgReviewCount: 135,
  avgDaysSinceLastReview: 11, franchiseRatio: 0.31, closureRate: 0.16, rentPressure: 'high',
}

describe('MoatDiagnostic', () => {
  it('renders the radar chart', () => {
    render(<MoatDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
  })

  it('displays all four moat scores', () => {
    render(<MoatDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText('90')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('34')).toBeInTheDocument()
    expect(screen.getByText('70')).toBeInTheDocument()
  })

  it('shows the focus recommendation', () => {
    render(<MoatDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText(/Community moat/)).toBeInTheDocument()
  })

  it('shows franchise ratio in neighborhood pressure note', () => {
    render(<MoatDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText(/31%/)).toBeInTheDocument()
  })

  it('renders the generate report button', () => {
    render(<MoatDiagnostic intake={mockIntake} result={mockResult} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText('Generate My AI Report →')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- MoatDiagnostic`
Expected: tests fail (stub renders wrong content)

- [ ] **Step 3: Replace stub with full implementation**

```typescript
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import type { IntakeData, MoatResult, NeighborhoodBenchmark } from '../../lib/types'
import Button from '../ui/Button'
import Card from '../ui/Card'

const MOAT_META = [
  { key: 'experience' as const, label: 'Experience', description: 'Craft skill that chains cannot replicate at scale' },
  { key: 'community' as const, label: 'Community', description: 'Regulars, reviews, and neighborhood presence' },
  { key: 'discovery' as const, label: 'Discovery', description: 'How easy you are to find online' },
  { key: 'menuMargin' as const, label: 'Menu & Margin', description: 'Menu uniqueness and specialization' },
]

export default function MoatDiagnostic({
  result,
  neighborhood,
  onNext,
}: {
  intake: IntakeData
  result: MoatResult
  neighborhood: NeighborhoodBenchmark
  onNext: () => void
}) {
  const radarData = MOAT_META.map(m => ({ subject: m.label, value: result[m.key] }))
  const franchisePercent = Math.round(neighborhood.franchiseRatio * 100)
  const closurePercent = Math.round(neighborhood.closureRate * 100)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Competitive Strengths</h2>
        <p className="text-stone-500">Your four moats — where you're strong and where to focus.</p>
      </div>

      {/* Radar chart */}
      <div className="bg-white rounded-lg border border-stone-200 p-4">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e7e5e4" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 12 }} />
            <Radar name="Your cafe" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-3">
        {MOAT_META.map(m => (
          <Card key={m.key} className="p-4">
            <div className="text-3xl font-bold text-stone-900 mb-1">{result[m.key]}</div>
            <div className="text-sm font-semibold text-stone-700">{m.label}</div>
            <div className="text-xs text-stone-400 mt-1">{m.description}</div>
          </Card>
        ))}
      </div>

      {/* Focus recommendation */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-amber-900 mb-1">Where to focus</p>
        <p className="text-sm text-amber-800">{result.focusRecommendation}</p>
      </div>

      {/* Neighborhood pressure */}
      <div className="bg-stone-100 rounded-lg p-4">
        <p className="text-sm text-stone-600">
          <span className="font-medium">{neighborhood.name}</span> has a franchise ratio of{' '}
          <span className="font-semibold">{franchisePercent}%</span> and an annual closure rate of{' '}
          <span className="font-semibold">{closurePercent}%</span>.{' '}
          {neighborhood.rentPressure === 'very high' || neighborhood.rentPressure === 'high'
            ? 'Standing out matters more here than in lower-pressure neighborhoods.'
            : 'This is a relatively lower-pressure area, but differentiation still pays.'}
        </p>
      </div>

      <Button onClick={onNext}>Generate My AI Report →</Button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test -- MoatDiagnostic`
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/steps/MoatDiagnostic.tsx src/components/steps/MoatDiagnostic.test.tsx
git commit -m "feat: MoatDiagnostic step 3 — radar chart and score cards"
```

---

## Task 9: Express Backend + Prompt Builder

**Files:**
- Modify: `server/index.js` (replace stub with full implementation)
- Modify: `server/prompt.js` (replace stub with full implementation)

**Interfaces:**
- Consumes: `ANTHROPIC_API_KEY` from `.env`; `buildPrompt` from `server/prompt.js`
- Produces: `POST /api/report` — accepts `{ intake, discoveryResult, moatResult, neighborhood }`, responds with SSE stream of `data: {"text": "..."}` events terminated by `data: [DONE]`

- [ ] **Step 1: Replace server/prompt.js stub with full implementation**

```javascript
export function buildPrompt(intake, discoveryResult, moatResult, neighborhood) {
  const franchisePercent = Math.round(neighborhood.franchiseRatio * 100)
  const closurePercent = Math.round(neighborhood.closureRate * 100)

  const cafeTypeLabel =
    intake.cafeType === 'drip' ? 'Drip/hand-brew specialist'
    : intake.cafeType === 'general' ? 'General espresso bar'
    : 'Mixed menu cafe'

  const sizeLabel =
    intake.sizeSeats === 'small' ? 'Small (fewer than 15 seats)'
    : intake.sizeSeats === 'medium' ? 'Medium (15–30 seats)'
    : 'Large (30+ seats)'

  return `You are a cafe business consultant specializing in helping independent coffee shops compete against franchise expansion in Korea.

Write a consulting report for an independent cafe owner. Be specific, practical, and direct. Use plain English. Every recommendation must connect to their actual numbers — no generic advice.

## Cafe Profile
- Neighborhood: ${neighborhood.name} (franchise ratio: ${franchisePercent}%, annual closure rate: ${closurePercent}%, rent pressure: ${neighborhood.rentPressure})
- Type: ${cafeTypeLabel}
- Size: ${sizeLabel}

## Online Discovery (Naver Place)
- Discovery Score: ${discoveryResult.score}/100 (${discoveryResult.label})
- Photos: ${intake.naver.photoCount} (neighborhood avg: ${neighborhood.avgPhotoCount})
- Reviews: ${intake.naver.reviewCount} (neighborhood avg: ${neighborhood.avgReviewCount})
- Days since last review: ${intake.naver.daysSinceLastReview} (neighborhood avg: ${neighborhood.avgDaysSinceLastReview})
- Menu listed on Naver: ${intake.naver.hasMenu ? 'Yes' : 'No'}
- Hours listed on Naver: ${intake.naver.hasHours ? 'Yes' : 'No'}
- Instagram presence: ${intake.hasInstagram ? 'Yes' : 'No'}

## Competitive Strengths (Moat Scores, 0–100)
- Experience moat: ${moatResult.experience}/100
- Community moat: ${moatResult.community}/100
- Discovery moat: ${moatResult.discovery}/100
- Menu & Margin moat: ${moatResult.menuMargin}/100

## In the Owner's Own Words
- Their strengths: "${intake.strengths}"
- Their biggest worry: "${intake.biggestWorry}"

---

Write a consulting report with exactly these five sections using the markdown headers below. Be direct, specific, and grounded in their numbers.

## Diagnosis
2–3 sentences. Name their actual situation using their specific numbers. Don't soften reality.

## Priority Actions
A ranked list of 3–5 actions, most impactful first. Format each as: **Action name** — one sentence explaining why it matters for this specific cafe, citing their numbers.

## This Week
Exactly 3 bullet points. Small, concrete actions doable in the next 7 days. Be specific — "add 10 photos of your pour-over setup to Naver Place" not "improve your Naver presence".

## This Month
2–3 bullet points. Bigger moves requiring planning or more time.

## A Peer's Experience
Start with: "A cafe owner in a similar situation found that..." Write 3–4 sentences. Describe a realistic pattern — what they tried, what worked. This is an illustrative analogy, not a real named person.`
}
```

- [ ] **Step 2: Replace server/index.js stub with full implementation**

```javascript
import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt } from './prompt.js'

const app = express()
app.use(express.json())

app.post('/api/report', async (req, res) => {
  const { intake, discoveryResult, moatResult, neighborhood } = req.body

  if (!intake || !discoveryResult || !moatResult || !neighborhood) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const client = new Anthropic()
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: buildPrompt(intake, discoveryResult, moatResult, neighborhood) }],
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate report' })}\n\n`)
  } finally {
    res.end()
  }
})

const PORT = 3001
app.listen(PORT, () => console.log(`API server running on :${PORT}`))
```

- [ ] **Step 3: Verify the endpoint manually**

Make sure `.env` has your `ANTHROPIC_API_KEY`, then run:
```bash
node server/index.js
```
In a separate terminal:
```bash
curl -X POST http://localhost:3001/api/report \
  -H "Content-Type: application/json" \
  -d '{"intake":{"neighborhood":"seongsu","cafeType":"drip","sizeSeats":"small","naver":{"photoCount":12,"reviewCount":34,"daysSinceLastReview":45,"hasMenu":true,"hasHours":false},"hasInstagram":false,"strengths":"hand pour","biggestWorry":"franchise"},"discoveryResult":{"score":34,"label":"Below Average","gaps":[]},"moatResult":{"experience":90,"community":42,"discovery":34,"menuMargin":70,"focusRecommendation":"Focus on Community."},"neighborhood":{"name":"Seongsu (성수동)","avgPhotoCount":48,"avgReviewCount":135,"avgDaysSinceLastReview":11,"franchiseRatio":0.31,"closureRate":0.16,"rentPressure":"high"}}'
```
Expected: streaming `data: {"text":"..."}` lines appear, ending with `data: [DONE]`.

Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add server/index.js server/prompt.js
git commit -m "feat: Express SSE endpoint and Claude prompt builder"
```

---

## Task 10: ConsultingReport (Step 4)

**Files:**
- Modify: `src/components/steps/ConsultingReport.tsx` (replace stub)
- Create: `src/components/steps/ConsultingReport.test.tsx`

**Interfaces:**
- Consumes: `IntakeData`, `DiscoveryResult`, `MoatResult`, `NeighborhoodBenchmark` from `src/lib/types`; `react-markdown`, `remark-gfm`; `POST /api/report` SSE endpoint
- Produces: `ConsultingReport({ intake, discoveryResult, moatResult, neighborhood, onNext: () => void })`

- [ ] **Step 1: Write failing tests**

Create `src/components/steps/ConsultingReport.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ConsultingReport from './ConsultingReport'
import type { IntakeData, DiscoveryResult, MoatResult, NeighborhoodBenchmark } from '../../lib/types'

const mockIntake: IntakeData = {
  neighborhood: 'seongsu', cafeType: 'drip', sizeSeats: 'small',
  naver: { photoCount: 12, reviewCount: 34, daysSinceLastReview: 45, hasMenu: true, hasHours: false },
  hasInstagram: false, strengths: 'hand pour', biggestWorry: 'competition',
}
const mockDiscovery: DiscoveryResult = { score: 34, label: 'Below Average', gaps: [] }
const mockMoat: MoatResult = {
  experience: 90, community: 42, discovery: 34, menuMargin: 70,
  focusRecommendation: 'Focus on Community moat.',
}
const mockNeighborhood: NeighborhoodBenchmark = {
  name: 'Seongsu (성수동)', avgPhotoCount: 48, avgReviewCount: 135,
  avgDaysSinceLastReview: 11, franchiseRatio: 0.31, closureRate: 0.16, rentPressure: 'high',
}

describe('ConsultingReport', () => {
  beforeEach(() => { vi.restoreAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('shows loading state before first token arrives', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<ConsultingReport intake={mockIntake} discoveryResult={mockDiscovery} moatResult={mockMoat} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    expect(screen.getByText('Analyzing your cafe...')).toBeInTheDocument()
  })

  it('shows error message when fetch returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, body: null }))
    render(<ConsultingReport intake={mockIntake} discoveryResult={mockDiscovery} moatResult={mockMoat} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate report/)).toBeInTheDocument()
    })
  })

  it('shows error message when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    render(<ConsultingReport intake={mockIntake} discoveryResult={mockDiscovery} moatResult={mockMoat} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/Connection error/)).toBeInTheDocument()
    })
  })

  it('renders a Try Again button in error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, body: null }))
    render(<ConsultingReport intake={mockIntake} discoveryResult={mockDiscovery} moatResult={mockMoat} neighborhood={mockNeighborhood} onNext={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- ConsultingReport`
Expected: tests fail (stub never calls fetch)

- [ ] **Step 3: Replace stub with full implementation**

```typescript
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { IntakeData, DiscoveryResult, MoatResult, NeighborhoodBenchmark } from '../../lib/types'
import Button from '../ui/Button'

interface Props {
  intake: IntakeData
  discoveryResult: DiscoveryResult
  moatResult: MoatResult
  neighborhood: NeighborhoodBenchmark
  onNext: () => void
}

export default function ConsultingReport({ intake, discoveryResult, moatResult, neighborhood, onNext }: Props) {
  const [reportText, setReportText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchReport() {
      setReportText('')
      setDone(false)
      setError(null)

      try {
        const response = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intake, discoveryResult, moatResult, neighborhood }),
        })

        if (!response.ok || !response.body) {
          if (!cancelled) setError('Failed to generate report. Please try again.')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (!cancelled) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break

          const text = decoder.decode(value, { stream: true })
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              if (!cancelled) setDone(true)
              return
            }
            try {
              const parsed = JSON.parse(data)
              if (!cancelled && parsed.text) setReportText(prev => prev + parsed.text)
            } catch { /* skip malformed chunk */ }
          }
        }
      } catch {
        if (!cancelled) setError('Connection error. Please try again.')
      }
    }

    fetchReport()
    return () => { cancelled = true }
  }, [retryCount]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900">Your Consulting Report</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">{error}</div>
        <Button onClick={() => setRetryCount(c => c + 1)}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-900">Your Consulting Report</h2>

      {!reportText && (
        <div className="flex items-center gap-3 text-stone-500 py-12 justify-center">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing your cafe...</span>
        </div>
      )}

      {reportText && (
        <div className="bg-white rounded-lg border border-stone-200 p-6 text-stone-800 leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-2 [&_strong]:font-semibold [&_p]:mb-3 [&_p:last-child]:mb-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportText}</ReactMarkdown>
        </div>
      )}

      {done && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigator.clipboard.writeText(reportText)}
          >
            Copy to Clipboard
          </Button>
          <Button className="flex-1" onClick={onNext}>
            Continue →
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test -- ConsultingReport`
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/steps/ConsultingReport.tsx src/components/steps/ConsultingReport.test.tsx
git commit -m "feat: ConsultingReport step 4 — SSE streaming with react-markdown"
```

---

## Task 11: LimitationsNotice (Step 5)

**Files:**
- Modify: `src/components/steps/LimitationsNotice.tsx` (replace stub)
- Create: `src/components/steps/LimitationsNotice.test.tsx`

**Interfaces:**
- Produces: `LimitationsNotice({ onReset: () => void })`

- [ ] **Step 1: Write failing tests**

Create `src/components/steps/LimitationsNotice.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LimitationsNotice from './LimitationsNotice'

describe('LimitationsNotice', () => {
  it('renders the honesty statement about rent and gentrification', () => {
    render(<LimitationsNotice onReset={vi.fn()} />)
    expect(screen.getByText(/rising rents/)).toBeInTheDocument()
  })

  it('renders the mission statement', () => {
    render(<LimitationsNotice onReset={vi.fn()} />)
    expect(screen.getByText(/Our Mission/)).toBeInTheDocument()
  })

  it('renders the Start Over button', () => {
    render(<LimitationsNotice onReset={vi.fn()} />)
    expect(screen.getByText('← Start Over')).toBeInTheDocument()
  })

  it('calls onReset when Start Over is clicked', () => {
    const onReset = vi.fn()
    render(<LimitationsNotice onReset={onReset} />)
    fireEvent.click(screen.getByText('← Start Over'))
    expect(onReset).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- LimitationsNotice`
Expected: tests fail (stub doesn't contain the right text)

- [ ] **Step 3: Replace stub with full implementation**

```typescript
export default function LimitationsNotice({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">One More Thing</h2>
        <p className="text-stone-500">An honest note about what this tool can and cannot do.</p>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-stone-700 leading-relaxed space-y-4">
        <p>
          This tool can help you get found online, sharpen your positioning, and compete smarter
          on the things you control.
        </p>
        <p>
          What it cannot do is solve rising rents or reverse gentrification. Those are structural
          problems that require policy — not a better Naver profile.
        </p>
        <p className="font-medium text-stone-900">
          We believe you deserve honesty about that.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-amber-900 mb-2">Our Mission</h3>
        <p className="text-amber-800 text-sm leading-relaxed">
          Independent cafes make neighborhoods worth living in. This tool exists to give small
          owners the same analytical edge that franchise chains pay data teams for — for free.
          The playing field isn't level, but this is one way to tilt it a little.
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        ← Start Over
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test -- LimitationsNotice`
Expected: all 4 tests pass.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests pass (scoring + App + IntakeForm + DiscoveryDiagnostic + MoatDiagnostic + ConsultingReport + LimitationsNotice).

- [ ] **Step 6: Commit**

```bash
git add src/components/steps/LimitationsNotice.tsx src/components/steps/LimitationsNotice.test.tsx
git commit -m "feat: LimitationsNotice step 5 — honesty screen"
```

---

## Task 12: End-to-End Smoke Test

**Files:** No file changes — manual verification only.

**Goal:** Walk through the complete 5-step wizard in a real browser with a real Anthropic API call to verify the golden path works end-to-end.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```
Expected output includes both:
```
  VITE v6.x.x  ready in Xms
  ➜  Local:   http://localhost:5173/
API server running on :3001
```

- [ ] **Step 2: Open the browser at http://localhost:5173**

Expected: see "Indie Cafe Consultant" header, progress bar at 0%, and the IntakeForm.

- [ ] **Step 3: Complete the intake form**

Fill in:
- Neighborhood: Seongsu (성수동)
- Cafe type: Drip specialist
- Size: Small
- Photos: 12, Reviews: 34, Days since last review: 45
- Menu listed: unchecked, Hours listed: unchecked
- Instagram: unchecked
- Strengths: "hand-pour technique, single origin beans from Ethiopia"
- Biggest worry: "a new Mega Coffee franchise opening 50 meters away"

Click "Get My Report →"

Expected: progress bar advances, DiscoveryDiagnostic appears with score ~28/100 labeled "Below Average" and a comparison table.

- [ ] **Step 4: Advance through the steps**

Click "See Your Competitive Strengths →"
Expected: MoatDiagnostic with radar chart, four score cards, and neighborhood pressure note mentioning 31%.

Click "Generate My AI Report →"
Expected: spinner appears, then text begins streaming in within a few seconds, formatted as sections.

Wait for streaming to complete.
Expected: "Copy to Clipboard" and "Continue →" buttons appear.

Click "Continue →"
Expected: LimitationsNotice appears with the honesty statement and mission text.

Click "← Start Over"
Expected: returns to step 1 (IntakeForm), progress bar reset to 0%.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete 5-step indie cafe consultant wizard"
```
