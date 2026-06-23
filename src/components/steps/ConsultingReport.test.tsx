import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ConsultingReport from './ConsultingReport'
import type { IntakeData, DiscoveryResult, MoatResult, NeighborhoodBenchmark } from '../../lib/types'

vi.mock('react-markdown', () => ({ default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div> }))
vi.mock('remark-gfm', () => ({ default: () => {} }))

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

  it('shows error message when SSE stream contains an error event', async () => {
    const ssePayload = 'data: {"error":"Failed to generate report"}\n\ndata: [DONE]\n\n'
    const encoder = new TextEncoder()
    const encoded = encoder.encode(ssePayload)

    let offset = 0
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (offset < encoded.length) {
          const chunk = encoded.slice(offset)
          offset = encoded.length
          return Promise.resolve({ done: false, value: chunk })
        }
        return Promise.resolve({ done: true, value: undefined })
      }),
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    }))

    render(<ConsultingReport intake={mockIntake} discoveryResult={mockDiscovery} moatResult={mockMoat} neighborhood={mockNeighborhood} onNext={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to generate report')).toBeInTheDocument()
    })
  })
})
