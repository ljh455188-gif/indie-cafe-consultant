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
