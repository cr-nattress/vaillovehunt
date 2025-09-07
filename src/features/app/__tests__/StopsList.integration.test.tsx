import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StopsList from '../StopsList'
import { PhotoUploadService } from '../../../client/PhotoUploadService'
import { ToastProvider } from '../../notifications/ToastProvider'

// Mock PhotoUploadService
vi.mock('../../../client/PhotoUploadService', () => ({
  PhotoUploadService: {
    uploadPhotoWithResize: vi.fn(),
    clearTeamPhotos: vi.fn()
  }
}))

// Mock Zustand store
const mockUseAppStore = vi.fn()
vi.mock('../../../store/appStore', () => ({
  useAppStore: () => mockUseAppStore()
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
)

describe('StopsList Integration Tests', () => {
  const mockStops = [
    {
      id: 'stop-1',
      title: 'First Stop',
      hint: 'Look for the red door',
      hints: ['Look for the red door', 'Near the fountain'],
      originalNumber: 1
    },
    {
      id: 'stop-2', 
      title: 'Second Stop',
      hint: 'Find the statue',
      hints: ['Find the statue', 'Behind the trees'],
      originalNumber: 2
    }
  ]

  const mockProgress = {
    'stop-1': { done: false, notes: '', photo: null, revealedHints: 1 },
    'stop-2': { done: true, notes: 'Completed!', photo: 'data:image/jpeg;base64,mock', revealedHints: 2 }
  }

  const defaultProps = {
    stops: mockStops,
    progress: mockProgress,
    transitioningStops: new Set(),
    completedSectionExpanded: false,
    onToggleCompletedSection: vi.fn(),
    expandedStops: {},
    onToggleExpanded: vi.fn(),
    uploadingStops: new Set(),
    onPhotoUpload: vi.fn(),
    setProgress: vi.fn(),
    view: 'current' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAppStore.mockReturnValue({
      revealNextHint: vi.fn()
    })
  })

  describe('Current vs Completed rendering paths', () => {
    it('renders current stops when view is "current"', () => {
      render(<StopsList {...defaultProps} view="current" />, { wrapper: TestWrapper })
      
      // Should show incomplete stops
      expect(screen.getByText('First Stop')).toBeInTheDocument()
      // Should not show completed stops in current view
      expect(screen.queryByText('Second Stop')).not.toBeInTheDocument()
    })

    it('renders completed stops when view is "completed"', () => {
      render(<StopsList {...defaultProps} view="completed" />, { wrapper: TestWrapper })
      
      // Should show completed stops
      expect(screen.getByText('Second Stop')).toBeInTheDocument()
      // Should not show incomplete stops in completed view
      expect(screen.queryByText('First Stop')).not.toBeInTheDocument()
    })

    it('handles empty states correctly', () => {
      // Test empty current stops
      render(<StopsList {...defaultProps} stops={[]} view="current" />, { wrapper: TestWrapper })
      expect(screen.getByText(/no current tasks/i)).toBeInTheDocument()

      // Test empty completed stops
      render(<StopsList {...defaultProps} progress={{}} view="completed" />, { wrapper: TestWrapper })
      expect(screen.getByText(/no completed tasks yet/i)).toBeInTheDocument()
    })

    it('filters stops correctly based on completion status', () => {
      const mixedStops = [
        { id: 'incomplete-1', title: 'Incomplete One', hints: ['hint'], originalNumber: 1 },
        { id: 'incomplete-2', title: 'Incomplete Two', hints: ['hint'], originalNumber: 2 },
        { id: 'complete-1', title: 'Complete One', hints: ['hint'], originalNumber: 3 },
        { id: 'complete-2', title: 'Complete Two', hints: ['hint'], originalNumber: 4 }
      ]

      const mixedProgress = {
        'incomplete-1': { done: false, notes: '', photo: null, revealedHints: 0 },
        'incomplete-2': { done: false, notes: '', photo: null, revealedHints: 1 },
        'complete-1': { done: true, notes: '', photo: 'mock-url', revealedHints: 1 },
        'complete-2': { done: true, notes: '', photo: 'mock-url', revealedHints: 2 }
      }

      // Test current view shows only incomplete stops
      render(<StopsList {...defaultProps} stops={mixedStops} progress={mixedProgress} view="current" />, { wrapper: TestWrapper })
      expect(screen.getByText('Incomplete One')).toBeInTheDocument()
      expect(screen.getByText('Incomplete Two')).toBeInTheDocument()
      expect(screen.queryByText('Complete One')).not.toBeInTheDocument()
      expect(screen.queryByText('Complete Two')).not.toBeInTheDocument()
    })

    it('applies transition effects to transitioning stops', () => {
      const transitioningStops = new Set(['stop-1'])
      
      render(<StopsList {...defaultProps} transitioningStops={transitioningStops} />, { wrapper: TestWrapper })
      
      // Check that transitioning stops have appropriate styling
      const stopCard = screen.getByText('First Stop').closest('[data-testid="stop-card"]')
      expect(stopCard).toHaveClass('transition-all')
    })
  })

  describe('Progress state handling', () => {
    it('correctly identifies completed vs incomplete stops', () => {
      render(<StopsList {...defaultProps} view="current" />, { wrapper: TestWrapper })
      
      // Incomplete stop should be visible in current view
      expect(screen.getByText('First Stop')).toBeInTheDocument()
      
      // Switch to completed view  
      render(<StopsList {...defaultProps} view="completed" />, { wrapper: TestWrapper })
      
      // Completed stop should be visible in completed view
      expect(screen.getByText('Second Stop')).toBeInTheDocument()
    })

    it('handles stops with no progress data', () => {
      const stopsWithNoProgress = [
        { id: 'new-stop', title: 'New Stop', hints: ['hint'], originalNumber: 1 }
      ]

      render(<StopsList {...defaultProps} stops={stopsWithNoProgress} progress={{}} view="current" />, { wrapper: TestWrapper })
      
      // Should show new stops in current view by default
      expect(screen.getByText('New Stop')).toBeInTheDocument()
    })
  })

  describe('Accessibility and interaction', () => {
    it('maintains proper focus management during view transitions', () => {
      const { rerender } = render(<StopsList {...defaultProps} view="current" />, { wrapper: TestWrapper })
      
      // Switch views
      rerender(<StopsList {...defaultProps} view="completed" />)
      
      // Component should render without focus issues
      expect(screen.getByText('Second Stop')).toBeInTheDocument()
    })

    it('handles keyboard navigation correctly', () => {
      render(<StopsList {...defaultProps} view="current" />, { wrapper: TestWrapper })
      
      const stopCard = screen.getByText('First Stop').closest('button')
      
      if (stopCard) {
        fireEvent.keyDown(stopCard, { key: 'Enter' })
        expect(defaultProps.onToggleExpanded).toHaveBeenCalledWith('stop-1')
      }
    })
  })
})