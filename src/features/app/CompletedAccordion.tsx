import React, { memo } from 'react'
import ProgressRing from '../../components/ProgressRing'
import LazyImage from '../../components/LazyImage'

interface CompletedAccordionProps {
  completedStops: any[]
  expandedStops: Record<string, boolean>
  progress: any
  onToggleExpanded: (stopId: string) => void
  completedSectionExpanded: boolean
  onToggleCompletedSection: () => void
}

const CompletedAccordion = memo(function CompletedAccordion({
  completedStops,
  expandedStops,
  progress,
  onToggleExpanded,
  completedSectionExpanded,
  onToggleCompletedSection
}: CompletedAccordionProps) {
  if (completedStops.length === 0) return null
  
  return (
    <div className='mt-6 border rounded-lg shadow-sm' style={{
      backgroundColor: 'var(--color-white)',
      borderColor: 'var(--color-light-grey)'
    }}>
      {/* Accordion Header */}
      <button
        className='w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-colors rounded-t-lg'
        onClick={onToggleCompletedSection}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleCompletedSection()
          }
        }}
        aria-expanded={completedSectionExpanded}
        aria-controls="completed-accordion-content"
        style={{
          backgroundColor: completedSectionExpanded ? 'var(--color-light-pink)' : 'transparent'
        }}
      >
        <div className='flex items-center gap-3'>
          <span className='text-lg font-semibold' style={{ color: 'var(--color-cabernet)' }}>
            📋 Completed Locations
          </span>
          <span 
            className='inline-flex items-center justify-center px-2 py-1 rounded-full text-sm font-bold text-white min-w-[28px] h-7'
            style={{ 
              backgroundColor: '#10B981',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              fontSize: '13px'
            }}
          >
            {completedStops.length}
          </span>
        </div>
        <span style={{ color: 'var(--color-cabernet)' }}>
          {completedSectionExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Accordion Content */}
      {completedSectionExpanded && (
        <div 
          id="completed-accordion-content"
          className='border-t' 
          style={{ borderColor: 'var(--color-light-grey)' }}
        >
          {completedStops.map((s) => {
            const state = progress[s.id]
            const isExpanded = expandedStops[s.id] || false

            return (
              <div key={s.id} className='p-4 border-b last:border-b-0' style={{ borderColor: 'var(--color-light-grey)' }}>
                <div className='w-full text-left flex items-center justify-between hover:bg-gray-50 focus-within:bg-gray-50 p-2 -m-2 rounded transition-colors'>
                  <div 
                    className='flex items-center gap-3 flex-1 min-w-0 cursor-pointer'
                    onClick={() => onToggleExpanded(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onToggleExpanded(s.id)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-controls={`completed-stop-${s.id}`}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for completed stop: ${s.title}`}
                  >
                    {/* Thumbnail */}
                    {state?.photo && (
                      <LazyImage
                        src={state.photo} 
                        alt={`Completed photo for ${s.title}`}
                        className='w-12 h-12 rounded-lg shadow-sm border'
                        style={{ borderColor: 'var(--color-success)' }}
                        loading="lazy"
                      />
                    )}
                    
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-base font-medium truncate' style={{ color: 'var(--color-dark-neutral)' }}>
                        {s.title}
                      </h3>
                      {/* Completed time */}
                      {state?.completedAt && (
                        <p className='text-xs text-slate-500 mt-1'>
                          Completed {new Date(state.completedAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                    
                    <span 
                      className='text-sm transition-transform duration-200 ml-2'
                      style={{ 
                        color: 'var(--color-cabernet)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}
                    >
                      ▶
                    </span>
                  </div>
                  
                  <div className='flex items-center gap-2 ml-2'>
                    {/* Quick Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleExpanded(s.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          onToggleExpanded(s.id)
                        }
                      }}
                      className='p-2 rounded-lg transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:ring-2 focus:ring-opacity-50 focus:outline-none'
                      aria-label={`${isExpanded ? 'Collapse' : 'View'} details for ${s.title}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    
                    {state?.photo && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            await navigator.share({
                              title: `${s.title} - Completed!`,
                              text: `I just completed "${s.title}" on my scavenger hunt!`,
                              url: window.location.href
                            })
                          } catch (err) {
                            // Fallback to copy link
                            navigator.clipboard.writeText(window.location.href)
                          }
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            try {
                              await navigator.share({
                                title: `${s.title} - Completed!`,
                                text: `I just completed "${s.title}" on my scavenger hunt!`,
                                url: window.location.href
                              })
                            } catch (err) {
                              // Fallback to copy link
                              navigator.clipboard.writeText(window.location.href)
                            }
                          }
                        }}
                        className='p-2 rounded-lg transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:ring-2 focus:ring-opacity-50 focus:outline-none'
                        aria-label={`Share completion of ${s.title}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Expanded content */}
                {isExpanded && (
                  <div id={`completed-stop-${s.id}`} className='px-4 pb-3'>
                    {state.photo && (
                      <LazyImage
                        src={state.photo}
                        alt={`Photo for ${s.title}`}
                        className='w-full max-w-sm mx-auto rounded-lg shadow-sm mt-3'
                        style={{ maxHeight: '300px', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    )}
                    <div className='mt-3 text-sm italic' style={{ color: 'var(--color-cabernet)' }}>
                      <span>❤</span> {s.funFact}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

export default CompletedAccordion