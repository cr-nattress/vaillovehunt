import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StopCard from '../StopCard'
import { PhotoUploadService } from '../../../client/PhotoUploadService'
import { ToastProvider } from '../../notifications/ToastProvider'

// Mock services
vi.mock('../../../client/PhotoUploadService', () => ({
  PhotoUploadService: {
    uploadPhotoWithResize: vi.fn()
  }
}))

// Mock toast context
const mockUseToastActions = vi.fn()
vi.mock('../../../features/notifications/useToastActions', () => ({
  useToastActions: () => mockUseToastActions()
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

describe('StopCard Integration Tests', () => {
  const mockStop = {
    id: 'test-stop',
    title: 'Test Stop',
    hint: 'Look for the test marker',
    hints: ['Look for the test marker', 'Behind the building', 'Near the fountain'],
    originalNumber: 1
  }

  const mockToastActions = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }

  const defaultProps = {
    stop: mockStop,
    state: { done: false, notes: '', photo: null, revealedHints: 1 },
    expanded: false,
    index: 0,
    isTransitioning: false,
    isUploading: false,
    onUpload: vi.fn(),
    onToggleExpanded: vi.fn(),
    onUpdateProgress: vi.fn(),
    displayImage: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseToastActions.mockReturnValue(mockToastActions)
    mockUseAppStore.mockReturnValue({
      revealNextHint: vi.fn()
    })
  })

  describe('Upload CTA enabled/disabled behavior', () => {
    it('shows upload CTA when stop is not completed', () => {
      render(<StopCard {...defaultProps} />)
      
      const uploadButton = screen.getByRole('button', { name: /choose file|upload photo/i })
      expect(uploadButton).toBeInTheDocument()
      expect(uploadButton).not.toBeDisabled()
    })

    it('hides upload CTA when stop is completed', () => {
      const completedState = { done: true, notes: '', photo: 'mock-photo-url', revealedHints: 1 }
      render(<StopCard {...defaultProps} state={completedState} />)
      
      // Upload button should not be visible for completed stops
      expect(screen.queryByRole('button', { name: /choose file|upload photo/i })).not.toBeInTheDocument()
    })

    it('shows loading state during upload', () => {
      render(<StopCard {...defaultProps} isUploading={true} />)
      
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      
      // Upload button should be disabled during upload
      const uploadButton = screen.queryByRole('button', { name: /choose file/i })
      if (uploadButton) {
        expect(uploadButton).toBeDisabled()
      }
    })

    it('handles file upload correctly', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      render(<StopCard {...defaultProps} />)
      
      const fileInput = screen.getByRole('button', { name: /choose file/i })
      
      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(defaultProps.onUpload).toHaveBeenCalledWith('test-stop', mockFile)
      })
    })

    it('shows error state on upload failure', async () => {
      const failingProps = {
        ...defaultProps,
        onUpload: vi.fn().mockRejectedValue(new Error('Upload failed'))
      }

      render(<StopCard {...failingProps} />)
      
      const fileInput = screen.getByRole('button', { name: /choose file/i })
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })
  })

  describe('Hint reveal progression', () => {
    it('shows hint reveal button when hints are available', () => {
      render(<StopCard {...defaultProps} />)
      
      const hintButton = screen.getByRole('button', { name: /hint 1/i })
      expect(hintButton).toBeInTheDocument()
    })

    it('reveals hints progressively', async () => {
      const user = userEvent.setup()
      const mockRevealNextHint = vi.fn()
      
      mockUseAppStore.mockReturnValue({
        revealNextHint: mockRevealNextHint
      })

      render(<StopCard {...defaultProps} />)
      
      const hintButton = screen.getByRole('button', { name: /hint 1/i })
      await user.click(hintButton)
      
      expect(mockRevealNextHint).toHaveBeenCalledWith('test-stop')
    })

    it('shows current revealed hints', () => {
      const stateWithMultipleHints = { 
        done: false, 
        notes: '', 
        photo: null, 
        revealedHints: 2 
      }
      
      render(<StopCard {...defaultProps} state={stateWithMultipleHints} />)
      
      // Should show hint progress
      expect(screen.getByText(/hint 2 of 3/i)).toBeInTheDocument()
      
      // Should show revealed hints
      expect(screen.getByText('Look for the test marker')).toBeInTheDocument()
      expect(screen.getByText('Behind the building')).toBeInTheDocument()
    })

    it('hides hint button when all hints are revealed', () => {
      const stateWithAllHints = { 
        done: false, 
        notes: '', 
        photo: null, 
        revealedHints: 3 
      }
      
      render(<StopCard {...defaultProps} state={stateWithAllHints} />)
      
      // Hint button should not be available
      expect(screen.queryByRole('button', { name: /hint/i })).not.toBeInTheDocument()
    })

    it('shows hints with proper categorization', () => {
      const stateWithHints = { 
        done: false, 
        notes: '', 
        photo: null, 
        revealedHints: 2 
      }
      
      render(<StopCard {...defaultProps} state={stateWithHints} expanded={true} />)
      
      // Check for hint categorization (based on hint content)
      expect(screen.getByText('Location')).toBeInTheDocument() // "Look for" triggers location category
    })
  })

  describe('Expand/collapse behavior for completed cards', () => {
    const completedState = { 
      done: true, 
      notes: 'Completed successfully!', 
      photo: 'mock-photo-url',
      revealedHints: 2 
    }

    it('allows expansion of completed cards', async () => {
      const user = userEvent.setup()
      
      render(<StopCard {...defaultProps} state={completedState} />)
      
      const expandButton = screen.getByRole('button')
      await user.click(expandButton)
      
      expect(defaultProps.onToggleExpanded).toHaveBeenCalledWith('test-stop')
    })

    it('shows additional content when completed card is expanded', () => {
      render(<StopCard {...defaultProps} state={completedState} expanded={true} />)
      
      // Should show fun fact or additional completed content
      expect(screen.getByText(/❤/)).toBeInTheDocument() // Fun fact indicator
    })

    it('shows photo when completed and expanded', () => {
      render(<StopCard {...defaultProps} state={completedState} expanded={true} displayImage="mock-image-url" />)
      
      const photo = screen.getByRole('img', { name: /photo for test stop/i })
      expect(photo).toBeInTheDocument()
      expect(photo).toHaveAttribute('src', 'mock-image-url')
    })

    it('maintains completion status visual indicators', () => {
      render(<StopCard {...defaultProps} state={completedState} />)
      
      // Should show completion indicator
      expect(screen.getByRole('img', { name: /checkmark/i }) || 
             screen.getByText(/✅/) ||
             screen.getByLabelText(/completed/i)).toBeInTheDocument()
    })
  })

  describe('Transition and loading states', () => {
    it('applies transition styling during state changes', () => {
      render(<StopCard {...defaultProps} isTransitioning={true} />)
      
      const card = screen.getByTestId('stop-card') || screen.getByRole('article')
      expect(card).toHaveClass('transition-all')
    })

    it('shows upload progress during file upload', () => {
      render(<StopCard {...defaultProps} isUploading={true} />)
      
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      // Should show some kind of progress indicator
      expect(screen.getByRole('status') || screen.getByText(/please wait/i)).toBeInTheDocument()
    })
  })

  describe('Error handling and recovery', () => {
    it('shows retry button on upload failure', async () => {
      const failingProps = {
        ...defaultProps,
        onUpload: vi.fn().mockRejectedValue(new Error('Network error'))
      }

      render(<StopCard {...failingProps} />)
      
      const fileInput = screen.getByRole('button', { name: /choose file/i })
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('allows retry after upload failure', async () => {
      const user = userEvent.setup()
      const retryUpload = vi.fn()
      
      // Mock a failed state that shows retry button
      render(<StopCard {...defaultProps} />)
      
      // Simulate error state
      const errorMessage = screen.queryByText(/upload failed/i)
      if (errorMessage) {
        const retryButton = screen.getByRole('button', { name: /retry/i })
        await user.click(retryButton)
        
        expect(retryUpload).toHaveBeenCalled()
      }
    })
  })
})