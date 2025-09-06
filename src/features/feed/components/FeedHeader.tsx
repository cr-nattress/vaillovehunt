import React from 'react'
import { PageType } from '../../../hooks/useHashRouter'

interface FeedHeaderProps {
  onNavigate: (page: PageType) => void
  onRefresh?: () => void
}

export default function FeedHeader({ onNavigate, onRefresh }: FeedHeaderProps) {
  return (
    <div className="sticky top-16 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-screen-sm mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('hunt')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to Hunt"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team Feed</h1>
            <p className="text-sm text-gray-500">Latest photos from all teams</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button 
            onClick={onRefresh}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            disabled={!onRefresh}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}