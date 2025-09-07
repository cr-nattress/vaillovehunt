/**
 * Design tokens and constants for StopCard components
 */

// CSS Custom Properties (already defined in the app)
export const COLORS = {
  cabernet: 'var(--color-cabernet)',
  cabernetHover: 'var(--color-cabernet-hover)',
  success: 'var(--color-success)',
  lightPink: 'var(--color-light-pink)',
  blushPink: 'var(--color-blush-pink)',
  white: 'var(--color-white)',
  warmGrey: 'var(--color-warm-grey)',
  lightGrey: 'var(--color-light-grey)',
} as const

// Component sizes
export const SIZES = {
  progressRing: 36,
  hintIcon: 28, // w-7 h-7
  imageHeight: 160, // h-40 (40 * 0.25rem = 10rem = 160px)
} as const

// Animation timings
export const ANIMATIONS = {
  cardTransition: '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
  hintReveal: '0.4s ease-out',
  buttonHover: '200ms',
  fadeInDelay: 0.15, // seconds per index for staggered animations
} as const

// Z-index layers
export const Z_INDEX = {
  hintButton: 1000,
} as const

// Image placeholder
export const PLACEHOLDER_IMAGE = '/images/selfie-placeholder.svg'