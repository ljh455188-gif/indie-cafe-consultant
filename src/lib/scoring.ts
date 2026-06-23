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
