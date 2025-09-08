/**
 * Tests for RulesPanel component
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { localStorageMock } from '../../../../test/setup'
import RulesPanel from '../RulesPanel'
import type { Rules } from '../../../types/orgData.schemas'

describe('RulesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const mockRules: Rules = {
    id: 'test-rules-v1',
    version: '1.0',
    content: {
      format: 'markdown',
      body: '# Hunt Rules\n\n**Be respectful** to all participants.\n\n*Have fun* and stay safe!'
    },
    acknowledgement: {
      required: true,
      text: 'I agree to follow all hunt rules and guidelines'
    },
    categories: ['safety', 'conduct', 'respect'],
    updatedAt: '2025-08-08T12:00:00Z'
  }

  describe('rendering', () => {
    it('should render null when no rules provided', () => {
      const { container } = render(<RulesPanel />)
      expect(container.firstChild).toBeNull()
    })

    it('should render rules header with version', () => {
      render(<RulesPanel rules={mockRules} />)
      
      expect(screen.getByText('Hunt Rules')).toBeInTheDocument()
      expect(screen.getByText('v1.0')).toBeInTheDocument()
    })

    it('should show acknowledgement required badge when not acknowledged', () => {
      render(<RulesPanel rules={mockRules} />)
      
      expect(screen.getByText('Acknowledgement Required')).toBeInTheDocument()
    })

    it('should not show rules content by default', () => {
      render(<RulesPanel rules={mockRules} />)
      
      expect(screen.queryByText('Be respectful')).not.toBeInTheDocument()
    })
  })

  describe('rules content expansion', () => {
    it('should show/hide rules content when header is clicked', async () => {
      render(<RulesPanel rules={mockRules} />)
      
      const header = screen.getByText('Hunt Rules').closest('div')!
      
      // Initially collapsed
      expect(screen.queryByText('Be respectful')).not.toBeInTheDocument()
      
      // Click to expand
      fireEvent.click(header)
      await waitFor(() => {
        expect(screen.getByText('Be respectful')).toBeInTheDocument()
      })
      
      // Click to collapse
      fireEvent.click(header)
      await waitFor(() => {
        expect(screen.queryByText('Be respectful')).not.toBeInTheDocument()
      })
    })

    it('should render markdown content correctly', async () => {
      render(<RulesPanel rules={mockRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        // Check that markdown is rendered as HTML
        const content = screen.getByText('Be respectful')
        expect(content.tagName.toLowerCase()).toBe('strong')
        
        const italicContent = screen.getByText('Have fun')
        expect(italicContent.tagName.toLowerCase()).toBe('em')
        
        // Check for header
        const headerContent = screen.getByText('Hunt Rules')
        expect(headerContent.tagName.toLowerCase()).toBe('h1')
      })
    })

    it('should render plain text content', async () => {
      const textRules: Rules = {
        id: 'text-rules',
        content: {
          format: 'text',
          body: 'Simple text rules without markdown formatting'
        },
        acknowledgement: {
          required: false,
          text: ''
        }
      }

      render(<RulesPanel rules={textRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        expect(screen.getByText('Simple text rules without markdown formatting')).toBeInTheDocument()
      })
    })

    it('should display categories when provided', async () => {
      render(<RulesPanel rules={mockRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        expect(screen.getByText('safety')).toBeInTheDocument()
        expect(screen.getByText('conduct')).toBeInTheDocument()
        expect(screen.getByText('respect')).toBeInTheDocument()
      })
    })

    it('should display last updated date when provided', async () => {
      render(<RulesPanel rules={mockRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
        expect(screen.getByText(/8\/8\/2025/)).toBeInTheDocument()
      })
    })
  })

  describe('acknowledgement functionality', () => {
    it('should show acknowledgement checkbox when required', async () => {
      render(<RulesPanel rules={mockRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        expect(screen.getByRole('checkbox')).toBeInTheDocument()
        expect(screen.getByText('I agree to follow all hunt rules and guidelines')).toBeInTheDocument()
      })
    })

    it('should not show acknowledgement when not required', async () => {
      const noAckRules: Rules = {
        ...mockRules,
        acknowledgement: {
          required: false,
          text: ''
        }
      }

      render(<RulesPanel rules={noAckRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
      })
    })

    it('should handle checkbox changes and call onAcknowledge', async () => {
      const onAcknowledge = vi.fn()
      
      render(<RulesPanel rules={mockRules} onAcknowledge={onAcknowledge} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox') as HTMLInputElement
        expect(checkbox.checked).toBe(false)
        
        // Check the checkbox
        fireEvent.click(checkbox)
        
        expect(onAcknowledge).toHaveBeenCalledWith('test-rules-v1', true)
      })
    })

    it('should show acknowledged status when checked', async () => {
      render(<RulesPanel rules={mockRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox') as HTMLInputElement
        
        // Check the checkbox
        fireEvent.click(checkbox)
        
        // Should show acknowledged status
        expect(screen.getByText('Acknowledged')).toBeInTheDocument()
        expect(screen.queryByText('Acknowledgement Required')).not.toBeInTheDocument()
      })
    })
  })

  describe('localStorage integration', () => {
    it('should load acknowledgement status from localStorage', () => {
      // Pre-populate localStorage
      localStorageMock.getItem.mockReturnValue('true')
      
      render(<RulesPanel rules={mockRules} />)
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('rules-acknowledged-test-rules-v1')
      
      // Should not show "Acknowledgement Required" badge
      expect(screen.queryByText('Acknowledgement Required')).not.toBeInTheDocument()
    })

    it('should save acknowledgement status to localStorage', async () => {
      render(<RulesPanel rules={mockRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox') as HTMLInputElement
        
        // Check the checkbox
        fireEvent.click(checkbox)
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith('rules-acknowledged-test-rules-v1', 'true')
      })
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      // Should not throw, just render with default state
      expect(() => render(<RulesPanel rules={mockRules} />)).not.toThrow()
      
      // Should show acknowledgement required (default state)
      expect(screen.getByText('Acknowledgement Required')).toBeInTheDocument()
    })

    it('should handle localStorage save errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded')
      })

      render(<RulesPanel rules={mockRules} />)
      
      // Expand rules and try to acknowledge
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox') as HTMLInputElement
        
        // Should not throw when trying to save
        expect(() => fireEvent.click(checkbox)).not.toThrow()
      })
    })
  })

  describe('markdown formatting', () => {
    it('should handle complex markdown content', async () => {
      const complexRules: Rules = {
        id: 'complex-rules',
        content: {
          format: 'markdown',
          body: `# Main Rules

## Safety Guidelines

**Always** stay with your team.

*Never* go into restricted areas.

### Important Notes

- Check in every 30 minutes
- Report any incidents immediately
- Have fun and be respectful

**Bold text** and *italic text* should work.`
        },
        acknowledgement: {
          required: true,
          text: 'I understand the rules'
        }
      }

      render(<RulesPanel rules={complexRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      await waitFor(() => {
        // Check various markdown elements are rendered
        expect(screen.getByText('Main Rules')).toBeInTheDocument()
        expect(screen.getByText('Safety Guidelines')).toBeInTheDocument()
        expect(screen.getByText('Important Notes')).toBeInTheDocument()
        expect(screen.getByText('Always')).toBeInTheDocument()
        expect(screen.getByText('Never')).toBeInTheDocument()
        expect(screen.getByText('Bold text')).toBeInTheDocument()
        expect(screen.getByText('italic text')).toBeInTheDocument()
      })
    })

    it('should handle empty content gracefully', async () => {
      const emptyRules: Rules = {
        id: 'empty-rules',
        content: {
          format: 'text',
          body: ''
        },
        acknowledgement: {
          required: false,
          text: ''
        }
      }

      render(<RulesPanel rules={emptyRules} />)
      
      // Expand rules
      const header = screen.getByText('Hunt Rules').closest('div')!
      fireEvent.click(header)
      
      // Should render without errors
      await waitFor(() => {
        expect(header).toBeInTheDocument()
      })
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<RulesPanel rules={mockRules} className="custom-class" />)
      
      const panel = screen.getByText('Hunt Rules').closest('.rules-panel')
      expect(panel).toHaveClass('custom-class')
    })

    it('should work without custom className', () => {
      render(<RulesPanel rules={mockRules} />)
      
      const panel = screen.getByText('Hunt Rules').closest('.rules-panel')
      expect(panel).toBeInTheDocument()
      expect(panel).toHaveClass('rules-panel')
    })
  })
})