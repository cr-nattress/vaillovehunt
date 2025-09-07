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
  }
  expanded: boolean
  displayImage: string
}

const StopCardMedia = memo(function StopCardMedia({ stop, state, expanded, displayImage }: StopCardMediaProps) {
  // Only show if conditions are met
  if (!(!state.done || expanded)) {
    return null
  }

  return (
    <div className='mt-2 rounded-xl border p-3 shadow-sm' style={{ backgroundColor: COLORS.white }}>
      {state.photo ? (
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
      ) : (
        <div className='flex items-center gap-2 text-xs text-slate-500 mb-2'>
          📷 Capture a creative selfie together at this location.
        </div>
      )}
    </div>
  )
})

export default StopCardMedia