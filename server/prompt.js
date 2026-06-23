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
