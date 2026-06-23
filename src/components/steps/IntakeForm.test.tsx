import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IntakeForm from './IntakeForm'

describe('IntakeForm', () => {
  it('renders neighborhood dropdown', () => {
    render(<IntakeForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Neighborhood')).toBeInTheDocument()
  })

  it('renders all cafe type options', () => {
    render(<IntakeForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Drip specialist')).toBeInTheDocument()
    expect(screen.getByLabelText('General espresso bar')).toBeInTheDocument()
    expect(screen.getByLabelText('Mixed menu')).toBeInTheDocument()
  })

  it('does not submit when neighborhood is not selected', async () => {
    const onSubmit = vi.fn()
    render(<IntakeForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Get My Report →'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not submit when strengths is empty', async () => {
    const onSubmit = vi.fn()
    render(<IntakeForm onSubmit={onSubmit} />)
    await userEvent.selectOptions(screen.getByLabelText('Neighborhood'), 'seongsu')
    fireEvent.click(screen.getByText('Get My Report →'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const onSubmit = vi.fn()
    render(<IntakeForm onSubmit={onSubmit} />)

    await userEvent.selectOptions(screen.getByLabelText('Neighborhood'), 'seongsu')
    await userEvent.clear(screen.getByLabelText('Number of photos on Naver Place'))
    await userEvent.type(screen.getByLabelText('Number of photos on Naver Place'), '12')
    await userEvent.clear(screen.getByLabelText('Number of reviews'))
    await userEvent.type(screen.getByLabelText('Number of reviews'), '34')
    await userEvent.clear(screen.getByLabelText('Days since last review'))
    await userEvent.type(screen.getByLabelText('Days since last review'), '45')
    await userEvent.type(screen.getByLabelText('Your biggest strengths'), 'hand pour technique')
    await userEvent.type(screen.getByLabelText('Your biggest worry'), 'franchise competition')

    fireEvent.click(screen.getByText('Get My Report →'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        neighborhood: 'seongsu',
        naver: expect.objectContaining({ photoCount: 12, reviewCount: 34, daysSinceLastReview: 45 }),
        strengths: 'hand pour technique',
        biggestWorry: 'franchise competition',
      }))
    })
  })
})
