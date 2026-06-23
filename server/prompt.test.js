import { describe, it, expect } from 'vitest'
import { buildPrompt } from './prompt.js'

const baseIntake = {
  neighborhood: 'seongsu',
  cafeType: 'drip',
  sizeSeats: 'small',
  naver: {
    photoCount: 12,
    reviewCount: 34,
    daysSinceLastReview: 45,
    hasMenu: true,
    hasHours: false,
  },
  hasInstagram: false,
  strengths: 'hand pour',
  biggestWorry: 'franchise',
}

const baseDiscovery = {
  score: 34,
  label: 'Below Average',
  gaps: [],
}

const baseMoat = {
  experience: 90,
  community: 42,
  discovery: 34,
  menuMargin: 70,
  focusRecommendation: 'Focus on Community.',
}

const baseNeighborhood = {
  name: 'Seongsu (성수동)',
  avgPhotoCount: 48,
  avgReviewCount: 135,
  avgDaysSinceLastReview: 11,
  franchiseRatio: 0.31,
  closureRate: 0.16,
  rentPressure: 'high',
}

describe('buildPrompt', () => {
  it('returns a string', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(typeof result).toBe('string')
  })

  it('includes neighborhood name', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Seongsu (성수동)')
  })

  it('converts franchiseRatio to rounded percentage', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('31%')
  })

  it('converts closureRate to rounded percentage', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('16%')
  })

  it('labels drip cafe type correctly', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Drip/hand-brew specialist')
  })

  it('labels general cafe type correctly', () => {
    const intake = { ...baseIntake, cafeType: 'general' }
    const result = buildPrompt(intake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('General espresso bar')
  })

  it('labels mixed cafe type correctly', () => {
    const intake = { ...baseIntake, cafeType: 'mixed' }
    const result = buildPrompt(intake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Mixed menu cafe')
  })

  it('labels small size correctly', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Small (fewer than 15 seats)')
  })

  it('labels medium size correctly', () => {
    const intake = { ...baseIntake, sizeSeats: 'medium' }
    const result = buildPrompt(intake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Medium (15–30 seats)')
  })

  it('labels large size correctly', () => {
    const intake = { ...baseIntake, sizeSeats: 'large' }
    const result = buildPrompt(intake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Large (30+ seats)')
  })

  it('includes discovery score and label', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('34/100')
    expect(result).toContain('Below Average')
  })

  it('includes photo counts (actual and neighborhood avg)', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Photos: 12')
    expect(result).toContain('neighborhood avg: 48')
  })

  it('includes review counts', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Reviews: 34')
    expect(result).toContain('neighborhood avg: 135')
  })

  it('shows Yes for hasMenu when true', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Menu listed on Naver: Yes')
  })

  it('shows No for hasHours when false', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Hours listed on Naver: No')
  })

  it('shows No for hasInstagram when false', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Instagram presence: No')
  })

  it('shows Yes for hasInstagram when true', () => {
    const intake = { ...baseIntake, hasInstagram: true }
    const result = buildPrompt(intake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Instagram presence: Yes')
  })

  it('includes moat scores', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('Experience moat: 90/100')
    expect(result).toContain('Community moat: 42/100')
    expect(result).toContain('Discovery moat: 34/100')
    expect(result).toContain('Menu & Margin moat: 70/100')
  })

  it('includes owner strengths verbatim', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('"hand pour"')
  })

  it('includes owner biggest worry verbatim', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('"franchise"')
  })

  it('includes all five required section headers', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('## Diagnosis')
    expect(result).toContain('## Priority Actions')
    expect(result).toContain('## This Week')
    expect(result).toContain('## This Month')
    expect(result).toContain("## A Peer's Experience")
  })

  it('instructs Claude to start Peer section with the required phrase', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('A cafe owner in a similar situation found that...')
  })

  it('includes rent pressure', () => {
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, baseNeighborhood)
    expect(result).toContain('rent pressure: high')
  })

  it('rounds fractional percentages correctly', () => {
    const neighborhood = { ...baseNeighborhood, franchiseRatio: 0.315, closureRate: 0.124 }
    const result = buildPrompt(baseIntake, baseDiscovery, baseMoat, neighborhood)
    expect(result).toContain('32%')
    expect(result).toContain('12%')
  })
})
