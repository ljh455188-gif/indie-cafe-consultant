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
