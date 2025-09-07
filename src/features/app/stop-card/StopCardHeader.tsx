import React, { memo } from 'react'
import ProgressRing from '../../../components/ProgressRing'
import { COLORS, SIZES, ANIMATIONS } from './stopCard.tokens'

interface StopCardHeaderProps {
  stop: {
    id: string
    title: string
    originalNumber?: number
  }
  state: {
    done: boolean
    revealedHints: number
  }
  expanded: boolean
  index: number
  onRevealNextHint: () => void
  totalHints: number
}

const StopCardHeader = memo(function StopCardHeader({
  stop,
  state,
  expanded,
  index,
  onRevealNextHint,
  totalHints
}: StopCardHeaderProps) {
  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex items-center gap-2 flex-1 min-w-0'>
        {state.done ? (
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white flex-shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <ProgressRing 
            number={stop.originalNumber ?? index + 1} 
            isCompleted={false}
            size={SIZES.progressRing}
          />
        )}
        <h3 className='text-base font-semibold truncate' style={{ color: COLORS.cabernet }}>
          {stop.title}
        </h3>
      </div>

      <div className='flex items-center gap-2 flex-shrink-0'>
        {/* Hint reveal button */}
        {(() => {
          const shouldShow = (!state.done || expanded) && state.revealedHints < totalHints
          console.log(`🔘 HINT BUTTON: stopId=${stop.id}, shouldShow=${shouldShow}, state.done=${state.done}, expanded=${expanded}, revealedHints=${state.revealedHints}, totalHints=${totalHints}`)
          return shouldShow
        })() && (
          <button
            onClick={(e) => {
              console.log(`🔘 HINT BUTTON CLICKED: stopId=${stop.id}`)
              e.stopPropagation()
              e.preventDefault()
              onRevealNextHint()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                console.log(`🔘 HINT BUTTON KEYBOARD: stopId=${stop.id}`)
                e.stopPropagation()
                e.preventDefault()
                onRevealNextHint()
              }
            }}
            className='px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-opacity-50 focus:outline-none'
            aria-label={`Reveal hint ${state.revealedHints + 1} of ${totalHints} for ${stop.title}`}
            style={{ 
              backgroundColor: COLORS.cabernet,
              color: 'white',
              border: 'none',
              zIndex: 1000,
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-deep-wine)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.cabernet
            }}
          >
            💡 Hint {state.revealedHints + 1}
          </button>
        )}
        
        {state.done && (
          <span 
            className='text-lg transition-transform duration-200'
            style={{ 
              color: COLORS.cabernet,
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
            }}
          >
            ▶
          </span>
        )}
      </div>
    </div>
  )
})

export default StopCardHeader