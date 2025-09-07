import React from 'react'

interface MountainLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
}

const sizeMap = {
  sm: { width: 48, height: 48 },
  md: { width: 64, height: 64 },
  lg: { width: 96, height: 96 },
  xl: { width: 128, height: 128 }
}

export default function MountainLogo({ size = 'md', className = '', animated = false }: MountainLogoProps) {
  const { width, height } = sizeMap[size]
  
  return (
    <div className={`inline-block ${className} ${animated ? 'mountain-logo-animated' : ''}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r="62"
          fill="url(#backgroundGradient)"
          stroke="var(--color-cabernet)"
          strokeWidth="2"
          className="backdrop-blur-sm"
        />
        
        {/* Main Mountain Peak */}
        <path
          d="M32 88 L64 32 L96 88 Z"
          fill="url(#mountainGradient)"
          stroke="var(--color-cabernet)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        
        {/* Secondary Mountain Peak */}
        <path
          d="M20 88 L48 48 L76 88 Z"
          fill="url(#secondaryMountainGradient)"
          stroke="var(--color-cabernet-hover)"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.8"
        />
        
        {/* Third Mountain Peak */}
        <path
          d="M52 88 L80 40 L108 88 Z"
          fill="url(#tertiaryMountainGradient)"
          stroke="var(--color-cabernet-light)"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.6"
        />
        
        {/* Snow Caps */}
        <path
          d="M56 48 L64 32 L72 48 Z"
          fill="white"
          opacity="0.9"
        />
        <path
          d="M72 56 L80 40 L88 56 Z"
          fill="white"
          opacity="0.7"
        />
        
        {/* Sun/Moon accent */}
        <circle
          cx="88"
          cy="40"
          r="6"
          fill="var(--color-cream)"
          stroke="var(--color-cabernet)"
          strokeWidth="1"
          opacity="0.8"
        />
        
        {/* Base line */}
        <line
          x1="16"
          y1="88"
          x2="112"
          y2="88"
          stroke="var(--color-cabernet)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-cream)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-light-pink)" stopOpacity="0.1" />
          </linearGradient>
          
          <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-cabernet)" />
            <stop offset="100%" stopColor="var(--color-cabernet-active)" />
          </linearGradient>
          
          <linearGradient id="secondaryMountainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-cabernet-hover)" />
            <stop offset="100%" stopColor="var(--color-cabernet)" />
          </linearGradient>
          
          <linearGradient id="tertiaryMountainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-cabernet-light)" />
            <stop offset="100%" stopColor="var(--color-cabernet-hover)" />
          </linearGradient>
          
          {animated && (
            <>
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 64 64"
                to="360 64 64"
                dur="20s"
                repeatCount="indefinite"
              />
            </>
          )}
        </defs>
      </svg>
      
      {animated && (
        <style jsx>{`
          .mountain-logo-animated {
            animation: gentle-glow 3s ease-in-out infinite alternate;
          }
          
          @keyframes gentle-glow {
            from {
              filter: drop-shadow(0 0 5px rgba(85, 36, 72, 0.3));
            }
            to {
              filter: drop-shadow(0 0 15px rgba(85, 36, 72, 0.6));
            }
          }
        `}</style>
      )}
    </div>
  )
}