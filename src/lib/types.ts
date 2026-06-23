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
