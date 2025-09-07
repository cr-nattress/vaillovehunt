import React, { memo } from 'react'
import { COLORS } from './stopCard.tokens'

interface StopCardCompletedMetaProps {
  stop: {
    funFact: string
  }
  state: {
    done: boolean
  }
  expanded: boolean
}

const StopCardCompletedMeta = memo(function StopCardCompletedMeta({ stop, state, expanded }: StopCardCompletedMetaProps) {
  // Only show fun fact if stop is done and conditions are met
  if (!state.done || !(!state.done || expanded)) {
    return null
  }

  return (
    <div className='mt-3 flex items-center gap-2 text-sm italic' style={{ color: COLORS.cabernet }}>
      <span>❤</span> {stop.funFact}
    </div>
  )
})

export default StopCardCompletedMeta