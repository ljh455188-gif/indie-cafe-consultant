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
