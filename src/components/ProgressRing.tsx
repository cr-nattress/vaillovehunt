import React, { memo, useMemo } from 'react'

interface ProgressRingProps {
  number: number
  isCompleted: boolean
  size?: number
  strokeWidth?: number
}

const ProgressRing = memo(function ProgressRing({ 
  number, 
  isCompleted, 
  size = 36, 
  strokeWidth = 3 
}: ProgressRingProps) {
  // Memoize calculations to prevent recalculation on every render
  const { radius, circumference, center } = useMemo(() => ({
    radius: (size - strokeWidth) / 2,
    circumference: ((size - strokeWidth) / 2) * 2 * Math.PI,
    center: size / 2
  }), [size, strokeWidth])

  if (isCompleted) {
    // Mini achievement badge for completed stops
    return (
      <div 
        className="inline-flex items-center justify-center rounded-full font-semibold text-white"
        style={{
          width: `${size * 0.67}px`, // Smaller for completed
          height: `${size * 0.67}px`,
          backgroundColor: '#10B981',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
          fontSize: `${size * 0.31}px`
        }}
      >
        {number}
      </div>
    )
  }

  // Animated progress ring for active/current stop
  return (
    <div 
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress ring with pulsing animation */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25} // 75% progress
          style={{
            animation: 'progressPulse 2s ease-in-out infinite'
          }}
        />
      </svg>
      
      {/* Number in center */}
      <div 
        className="absolute inset-0 flex items-center justify-center font-bold text-slate-700"
        style={{ fontSize: `${size * 0.39}px` }}
      >
        {number}
      </div>
    </div>
  )
})

export default ProgressRing