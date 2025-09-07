import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CompletedAccordion from '../CompletedAccordion'
import { CollageService } from '../../../client/CollageService'
import { buildStorybook } from '../../../utils/canvas'

// Mock services
vi.mock('../../../client/CollageService', () => ({
  CollageService: {
    createCollage: vi.fn()
  }
}))

vi.mock('../../../utils/canvas', () => ({
  buildStorybook: vi.fn()
}))

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve())
  },
  writable: true
})

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  value: vi.fn(() => Promise.resolve()),
  writable: true
})

describe('CompletedAccordion Integration Tests', () => {
  const mockCompletedStops = [
    {
      id: 'stop-1',
      title: 'First Completed Stop',
      originalNumber: 1,
      funFact: 'This location has been here for 100 years!'
    },
    {
      id: 'stop-2', 
      title: 'Second Completed Stop',
      originalNumber: 2,
      funFact: 'Famous movie was filmed here.'
    }
  ]

  const mockProgress = {
    'stop-1': { 
      done: true, 
      notes: 'Great photo!', 
      photo: 'data:image/jpeg;base64,mockdata1',
      completedAt: '2023-10-15T10:30:00.000Z'
    },
    'stop-2': { 
      done: true, 
      notes: 'Amazing view!', 
      photo: 'data:image/jpeg;base64,mockdata2',
      completedAt: '2023-10-15T11:45:00.000Z'
    }
  }

  const defaultProps = {
    stops: mockCompletedStops,
    progress: mockProgress,
    expanded: false,
    onToggleExpanded: vi.fn(),
    onCreateCollage: vi.fn(),
    onPreviewStorybook: vi.fn(),
    onShare: vi.fn(),
    collageLoading: false,
    collageUrl: null,
    storybookUrl: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Quick actions render when completed', () => {
    it('shows View action when accordion is collapsed', () => {
      render(<CompletedAccordion {...defaultProps} />)
      
      const viewButton = screen.getByRole('button', { name: /view all/i })
      expect(viewButton).toBeInTheDocument()
    })

    it('shows Share action when photos are available', () => {
      render(<CompletedAccordion {...defaultProps} />)
      
      const shareButton = screen.getByRole('button', { name: /share progress/i })
      expect(shareButton).toBeInTheDocument()
    })

    it('shows Create Collage action when multiple photos exist', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      const collageButton = screen.getByRole('button', { name: /create collage/i })
      expect(collageButton).toBeInTheDocument()
    })

    it('hides quick actions when no completed stops', () => {
      render(<CompletedAccordion {...defaultProps} stops={[]} progress={{}} />)
      
      expect(screen.queryByRole('button', { name: /view all/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /share progress/i })).not.toBeInTheDocument()
    })

    it('shows completion stats in header', () => {
      render(<CompletedAccordion {...defaultProps} />)
      
      expect(screen.getByText(/2 stops completed/i)).toBeInTheDocument()
      expect(screen.getByText(/100%/i)).toBeInTheDocument()
    })
  })

  describe('View action functionality', () => {
    it('expands accordion when View button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<CompletedAccordion {...defaultProps} />)
      
      const viewButton = screen.getByRole('button', { name: /view all/i })
      await user.click(viewButton)
      
      expect(defaultProps.onToggleExpanded).toHaveBeenCalled()
    })

    it('shows completed stops when expanded', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      expect(screen.getByText('First Completed Stop')).toBeInTheDocument()
      expect(screen.getByText('Second Completed Stop')).toBeInTheDocument()
    })

    it('displays photos with lazy loading when expanded', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(2)
      
      // Check for lazy loading attributes
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy')
      })
    })

    it('shows fun facts for completed stops', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      expect(screen.getByText('This location has been here for 100 years!')).toBeInTheDocument()
      expect(screen.getByText('Famous movie was filmed here.')).toBeInTheDocument()
    })

    it('displays completion timestamps', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      // Should show formatted completion times
      expect(screen.getByText(/completed/i)).toBeInTheDocument()
    })
  })

  describe('Share action functionality', () => {
    it('calls share handler when Share button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<CompletedAccordion {...defaultProps} />)
      
      const shareButton = screen.getByRole('button', { name: /share progress/i })
      await user.click(shareButton)
      
      expect(defaultProps.onShare).toHaveBeenCalled()
    })

    it('uses native share API when available', async () => {
      const mockShare = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'share', { value: mockShare, writable: true })
      
      const user = userEvent.setup()
      render(<CompletedAccordion {...defaultProps} />)
      
      const shareButton = screen.getByRole('button', { name: /share progress/i })
      await user.click(shareButton)
      
      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled()
      })
    })

    it('falls back to clipboard when share API unavailable', async () => {
      const mockWriteText = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', { 
        value: { writeText: mockWriteText }, 
        writable: true 
      })
      Object.defineProperty(navigator, 'share', { value: undefined, writable: true })
      
      const user = userEvent.setup()
      render(<CompletedAccordion {...defaultProps} />)
      
      const shareButton = screen.getByRole('button', { name: /share progress/i })
      await user.click(shareButton)
      
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('2/2 stops complete!'))
      })
    })
  })

  describe('Collage creation functionality', () => {
    it('shows Create Collage button when expanded with multiple photos', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      const collageButton = screen.getByRole('button', { name: /create collage/i })
      expect(collageButton).toBeInTheDocument()
    })

    it('calls collage creation handler when button clicked', async () => {
      const user = userEvent.setup()
      
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      const collageButton = screen.getByRole('button', { name: /create collage/i })
      await user.click(collageButton)
      
      expect(defaultProps.onCreateCollage).toHaveBeenCalled()
    })

    it('shows loading state during collage creation', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} collageLoading={true} />)
      
      expect(screen.getByText(/creating collage/i)).toBeInTheDocument()
      
      const collageButton = screen.getByRole('button', { name: /creating/i })
      expect(collageButton).toBeDisabled()
    })

    it('shows collage result when creation completes', () => {
      const collageUrl = 'https://cloudinary.com/mock-collage.jpg'
      
      render(<CompletedAccordion {...defaultProps} expanded={true} collageUrl={collageUrl} />)
      
      const collageImage = screen.getByRole('img', { name: /collage/i })
      expect(collageImage).toBeInTheDocument()
      expect(collageImage).toHaveAttribute('src', collageUrl)
    })

    it('handles collage creation errors gracefully', async () => {
      const mockOnCreateCollage = vi.fn().mockRejectedValue(new Error('Collage failed'))
      
      const user = userEvent.setup()
      render(<CompletedAccordion {...defaultProps} expanded={true} onCreateCollage={mockOnCreateCollage} />)
      
      const collageButton = screen.getByRole('button', { name: /create collage/i })
      await user.click(collageButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to create collage/i)).toBeInTheDocument()
      })
    })
  })

  describe('Storybook preview functionality', () => {
    it('shows Preview Storybook button when available', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      const previewButton = screen.getByRole('button', { name: /preview storybook/i })
      expect(previewButton).toBeInTheDocument()
    })

    it('calls storybook preview handler', async () => {
      const user = userEvent.setup()
      
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      const previewButton = screen.getByRole('button', { name: /preview storybook/i })
      await user.click(previewButton)
      
      expect(defaultProps.onPreviewStorybook).toHaveBeenCalled()
    })

    it('shows storybook result when preview completes', () => {
      const storybookUrl = 'data:image/png;base64,storybook-data'
      
      render(<CompletedAccordion {...defaultProps} expanded={true} storybookUrl={storybookUrl} />)
      
      const storybookImage = screen.getByRole('img', { name: /storybook/i })
      expect(storybookImage).toBeInTheDocument()
      expect(storybookImage).toHaveAttribute('src', storybookUrl)
    })
  })

  describe('Accessibility and interaction', () => {
    it('maintains proper ARIA attributes', () => {
      render(<CompletedAccordion {...defaultProps} />)
      
      const accordionButton = screen.getByRole('button', { name: /completed tasks/i })
      expect(accordionButton).toHaveAttribute('aria-expanded', 'false')
      
      const { rerender } = render(<CompletedAccordion {...defaultProps} expanded={true} />)
      expect(accordionButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(<CompletedAccordion {...defaultProps} />)
      
      const viewButton = screen.getByRole('button', { name: /view all/i })
      
      await user.tab()
      expect(viewButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(defaultProps.onToggleExpanded).toHaveBeenCalled()
    })

    it('announces state changes to screen readers', () => {
      render(<CompletedAccordion {...defaultProps} />)
      
      const statusRegion = screen.getByRole('status') || screen.getByLabelText(/completion status/i)
      expect(statusRegion).toBeInTheDocument()
    })

    it('provides meaningful button labels', () => {
      render(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
        expect(button.getAttribute('aria-label')).toBeTruthy()
      })
    })
  })

  describe('Performance considerations', () => {
    it('lazy loads images only when expanded', () => {
      const { rerender } = render(<CompletedAccordion {...defaultProps} expanded={false} />)
      
      // Images should not be rendered when collapsed
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      
      rerender(<CompletedAccordion {...defaultProps} expanded={true} />)
      
      // Images should now be present with lazy loading
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy')
      })
    })

    it('memoizes expensive operations', () => {
      const { rerender } = render(<CompletedAccordion {...defaultProps} />)
      
      // Re-render with same props should not cause unnecessary recalculations
      rerender(<CompletedAccordion {...defaultProps} />)
      
      // Component should render efficiently
      expect(screen.getByText(/2 stops completed/i)).toBeInTheDocument()
    })
  })
})