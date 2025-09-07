import React, { memo } from 'react'
import { COLORS, SIZES, ANIMATIONS } from './stopCard.tokens'

// Enhanced hint system functions (from original StopCard)
const getHintMetadata = (hintText: string, hintIndex: number) => {
  const hint = (hintText || '').toLowerCase()
  
  // Categorize hint type
  let category = '💡' // default
  let categoryName = 'General'
  let categoryColor = '#6B7280'
  
  if (hint.includes('look') || hint.includes('find') || hint.includes('near') || hint.includes('behind')) {
    category = '📍'
    categoryName = 'Location'
    categoryColor = '#10B981'
  } else if (hint.includes('color') || hint.includes('shape') || hint.includes('see') || hint.includes('notice')) {
    category = '👀'
    categoryName = 'Visual'
    categoryColor = '#3B82F6'
  } else if (hint.includes('history') || hint.includes('built') || hint.includes('named') || hint.includes('fact')) {
    category = '📚'
    categoryName = 'History'
    categoryColor = '#8B5CF6'
  } else if (hint.includes('people') || hint.includes('ask') || hint.includes('local') || hint.includes('staff')) {
    category = '👥'
    categoryName = 'Social'
    categoryColor = '#F59E0B'
  }
  
  // Hint difficulty (gets progressively harder)
  const hintDifficulty = Math.min(hintIndex + 1, 3) // 1-3, with later hints being harder
  const costPoints = hintDifficulty // Cost in "points" for using this hint
  
  return {
    category,
    categoryName,
    categoryColor,
    difficulty: hintDifficulty,
    costPoints,
    difficultyLabel: hintDifficulty === 1 ? 'Easy' : hintDifficulty === 2 ? 'Medium' : 'Hard'
  }
}

interface StopCardHintsProps {
  stop: {
    id: string
    hints: string[]
  }
  state: {
    done: boolean
    revealedHints: number
  }
  expanded: boolean
}

const StopCardHints = memo(function StopCardHints({ stop, state, expanded }: StopCardHintsProps) {
  // Only show hints section if conditions are met
  const shouldShowHints = (!state.done || expanded)
  const hintsToShow = stop.hints.slice(0, state.revealedHints)
  
  console.log(`💡 HINTS SECTION: stopId=${stop.id}, shouldShowHints=${shouldShowHints}, hintsToShow=${hintsToShow.length}, state.done=${state.done}, expanded=${expanded}`)

  if (!shouldShowHints) {
    return null
  }

  return (
    <div className='mt-2'>
      {/* Hint Stepper */}
      <div className='mb-2 flex items-center justify-between text-xs text-slate-500'>
        <span>
          {state.revealedHints > 0 ? `Hint ${Math.min(state.revealedHints, stop.hints.length)} of ${stop.hints.length}` : 'Hints'}
        </span>
        <div className='flex gap-1'>
          {stop.hints.map((_, idx) => (
            <div 
              key={idx}
              className='w-2 h-2 rounded-full transition-colors duration-200'
              style={{
                backgroundColor: idx < state.revealedHints ? COLORS.cabernet : '#E5E7EB'
              }}
            />
          ))}
        </div>
      </div>
      
      <div className='space-y-1'>
        {hintsToShow.map((hint: string, hintIndex: number) => {
          const hintMetadata = getHintMetadata(hint, hintIndex)
          
          return (
            <div 
              key={hintIndex}
              className='border-l-4 p-2 rounded-r-xl transition-all duration-300 shadow-sm'
              style={{
                backgroundColor: `${hintMetadata.categoryColor}10`,
                borderColor: hintMetadata.categoryColor,
                animation: `slideInFromLeft ${ANIMATIONS.hintReveal} ease-out ${hintIndex * 0.1}s forwards`,
                opacity: 0
              }}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-2 flex-1'>
                  <span 
                    className='flex-shrink-0 text-white text-sm font-bold rounded-full flex items-center justify-center'
                    style={{ 
                      backgroundColor: hintMetadata.categoryColor,
                      width: `${SIZES.hintIcon}px`,
                      height: `${SIZES.hintIcon}px`
                    }}
                  >
                    {hintMetadata.category}
                  </span>
                  <div className='flex-1'>
                    <p className='text-sm leading-snug mb-1' style={{ color: hintMetadata.categoryColor }}>
                      {hint}
                    </p>
                  </div>
                </div>
                
                {/* Hint metadata badges */}
                <div className='flex items-center gap-1 flex-shrink-0'>
                  <div className='px-2 py-1 rounded-full text-[10px] font-medium' style={{
                    backgroundColor: `${hintMetadata.categoryColor}20`,
                    color: hintMetadata.categoryColor
                  }}>
                    {hintMetadata.categoryName}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default StopCardHints