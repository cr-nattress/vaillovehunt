import React, { memo } from 'react'
import { COLORS, SIZES } from './stopCard.tokens'

interface StopCardMediaProps {
  stop: {
    id: string
    title: string
  }
  state: {
    done: boolean
    photo: string | null
    preview?: {
      objectUrl?: string
      fileMeta?: {
        name: string
        type: string
        size: number
      }
      savedLocally: boolean
    }
  }
  expanded: boolean
  displayImage: string | null
}

const StopCardMedia = memo(function StopCardMedia({ stop, state, expanded, displayImage }: StopCardMediaProps) {
  // Only show if conditions are met
  if (!(!state.done || expanded)) {
    return null
  }

  // Show preview if available, otherwise show saved photo, otherwise show placeholder
  const hasPreview = state.preview?.objectUrl
  const hasPhoto = state.photo

  // Only render the container if we have content to show
  if (!hasPreview && !hasPhoto) {
    // Return just spacing div without border when no media
    return <div className='mt-2' />
  }

  return (
    <div className='mt-2 rounded-xl border p-3 shadow-sm' style={{ backgroundColor: COLORS.white }}>
      {hasPreview ? (
        <>
          <div className={`text-xs uppercase tracking-wide mb-2`} style={{ color: COLORS.cabernet }}>
            👁️ Preview
          </div>
          <img 
            src={state.preview!.objectUrl} 
            alt={`Preview for ${stop.title}`} 
            className='rounded-md object-cover w-full mb-2' 
            style={{ height: `${SIZES.imageHeight}px` }}
            onError={(e) => {(e.target as HTMLElement).style.display='none'}} 
          />
          <div className='mt-2 flex items-center gap-2 text-xs text-slate-500'>
            📝 {state.preview?.fileMeta?.name} • {state.preview?.fileMeta && Math.round(state.preview.fileMeta.size / 1024)}KB
          </div>
        </>
      ) : (
        <>
          <div className={`text-xs uppercase tracking-wide mb-2`} style={{ color: COLORS.success }}>
            ✅ Photo Complete
          </div>
          <img 
            src={displayImage} 
            alt={`Photo for ${stop.title}`} 
            className='rounded-md object-cover w-full mb-2' 
            style={{ height: `${SIZES.imageHeight}px` }}
            onError={(e) => {(e.target as HTMLElement).style.display='none'}} 
          />
          <div className='mt-2 flex items-center gap-2 text-xs text-slate-500'>
            ✨ Your photo
          </div>
        </>
      )}
    </div>
  )
})

export default StopCardMedia