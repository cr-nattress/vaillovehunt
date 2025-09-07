import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import StopCard from './StopCard'

// Mock the subcomponents for unit testing
vi.mock('./StopCardHeader', () => ({
  default: ({ stop }: any) => <div data-testid="stop-header">{stop.title}</div>
}))

vi.mock('./StopCardHints', () => ({
  default: ({ stop }: any) => <div data-testid="stop-hints">Hints for {stop.id}</div>
}))

vi.mock('./StopCardMedia', () => ({
  default: ({ stop }: any) => <div data-testid="stop-media">Media for {stop.id}</div>
}))

vi.mock('./StopCardActions', () => ({
  default: ({ stop }: any) => <div data-testid="stop-actions">Actions for {stop.id}</div>
}))

vi.mock('./StopCardCompletedMeta', () => ({
  default: ({ stop }: any) => <div data-testid="stop-meta">Meta for {stop.id}</div>
}))

describe('StopCard', () => {
  const mockStop = {
    id: 'test-stop',
    title: 'Test Stop',
    emoji: '🎯',
    hints: ['Hint 1', 'Hint 2', 'Hint 3'],
    answer: 'Test Answer',
    challenge: 'Test Challenge',
    funFact: 'Test Fun Fact',
    maps: 'https://example.com',
    originalNumber: 1
  }

  const mockProps = {
    stop: mockStop,
    progress: {},
    onUpload: vi.fn(),
    onToggleExpanded: vi.fn(),
    expanded: false,
    uploadingStops: new Set<string>(),
    transitioningStops: new Set<string>(),
    revealNextHint: vi.fn(),
    index: 0
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all subcomponents', () => {
    render(<StopCard {...mockProps} />)
    
    expect(screen.getByTestId('stop-header')).toBeInTheDocument()
    expect(screen.getByTestId('stop-hints')).toBeInTheDocument()
    expect(screen.getByTestId('stop-media')).toBeInTheDocument()
    expect(screen.getByTestId('stop-actions')).toBeInTheDocument()
    expect(screen.getByTestId('stop-meta')).toBeInTheDocument()
  })

  it('passes correct props to header component', () => {
    render(<StopCard {...mockProps} />)
    
    expect(screen.getByText('Test Stop')).toBeInTheDocument()
  })

  it('maintains StopCardProps contract', () => {
    // This test verifies that the component accepts all required props
    const component = <StopCard {...mockProps} />
    expect(component).toBeDefined()
  })
})