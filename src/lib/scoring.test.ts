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
