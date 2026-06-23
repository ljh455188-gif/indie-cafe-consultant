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
