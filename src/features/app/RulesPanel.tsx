/**
 * RulesPanel - Component for rendering hunt rules with acknowledgement support
 * Supports markdown content and persistent acknowledgement tracking
 */

import React, { useState, useEffect } from 'react'
import { Rules } from '../../types/orgData.schemas'

interface RulesPanelProps {
  rules?: Rules
  onAcknowledge?: (rulesId: string, acknowledged: boolean) => void
  className?: string
}

// Simple markdown-like text formatting (basic implementation)
function formatMarkdown(text: string): string {
  if (!text) return ''
  
  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    
    // Italic: *text* or _text_
    .replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)([^_]+?)_(?!_)/g, '<em>$1</em>')
    
    // Headers: # text, ## text, ### text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    
    // Line breaks
    .replace(/\n/g, '<br/>')
    
    // Lists: - item or * item
    .replace(/^[*-] (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
}

function getStorageKey(rulesId: string): string {
  return `rules-acknowledged-${rulesId}`
}

function getAcknowledgementStatus(rulesId: string): boolean {
  try {
    const stored = localStorage.getItem(getStorageKey(rulesId))
    return stored === 'true'
  } catch (error) {
    console.warn('Failed to read acknowledgement status from localStorage:', error)
    return false
  }
}

function setAcknowledgementStatus(rulesId: string, acknowledged: boolean): void {
  try {
    localStorage.setItem(getStorageKey(rulesId), acknowledged.toString())
  } catch (error) {
    console.warn('Failed to save acknowledgement status to localStorage:', error)
  }
}

export default function RulesPanel({ rules, onAcknowledge, className = '' }: RulesPanelProps) {
  const [isAcknowledged, setIsAcknowledged] = useState(false)
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    if (rules?.id) {
      const acknowledged = getAcknowledgementStatus(rules.id)
      setIsAcknowledged(acknowledged)
    }
  }, [rules?.id])

  if (!rules) {
    return null
  }

  const handleAcknowledgementChange = (acknowledged: boolean) => {
    setIsAcknowledged(acknowledged)
    setAcknowledgementStatus(rules.id, acknowledged)
    onAcknowledge?.(rules.id, acknowledged)
  }

  const formattedContent = rules.content.format === 'markdown' 
    ? formatMarkdown(rules.content.body)
    : rules.content.body

  return (
    <div className={`rules-panel bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Rules Header */}
      <div 
        className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setShowRules(!showRules)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Hunt Rules</h3>
            {rules.version && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                v{rules.version}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {rules.acknowledgement.required && !isAcknowledged && (
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                Acknowledgement Required
              </span>
            )}
            
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${showRules ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Rules Content */}
      {showRules && (
        <div className="px-4 py-3 border-t border-gray-200">
          {/* Rules Body */}
          <div className="rules-content mb-4">
            {rules.content.format === 'markdown' ? (
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: formattedContent }}
              />
            ) : (
              <div className="text-gray-700 whitespace-pre-wrap">
                {rules.content.body}
              </div>
            )}
          </div>

          {/* Categories */}
          {rules.categories && rules.categories.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {rules.categories.map((category, index) => (
                  <span 
                    key={index}
                    className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Acknowledgement Section */}
          {rules.acknowledgement.required && (
            <div className="pt-3 border-t border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAcknowledged}
                  onChange={(e) => handleAcknowledgementChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  {rules.acknowledgement.text}
                </span>
              </label>

              {isAcknowledged && (
                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  Acknowledged
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {rules.updatedAt && (
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
              Last updated: {new Date(rules.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}