import React, { memo, useState, useRef, useEffect } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  loading?: 'lazy' | 'eager'
  webpSrc?: string // Optional WebP version for better compression
}

const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  style = {},
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDIwMHYyMDBIMHoiIGZpbGw9IiNmNWY1ZjUiLz48cGF0aCBkPSJNOTMuMDIgNzguMzNjLTIuNzQgMC01IDIuMjYtNSA1IDAgMi43NCAyLjI2IDUgNSA1IDIuNzQgMCA1LTIuMjYgNS01IDAtMi43NC0yLjI2LTUtNS01em0tNCAyMS45NWMyLjczLTEuNiA5LjQ0LTMuNSAxOC4wNi0zLjVzMTUuMzMgMS45IDE4LjA2IDMuNWMwIDAtNy4zLTIuNTQtMTguMDYtMi41NHMtMTguMDYgMi41NC0xOC4wNiAyLjU0eiIgZmlsbD0iI2Q5ZDlkOSIvPjwvc3ZnPg==',
  onError,
  loading = 'lazy',
  webpSrc
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(placeholder)
  const imgRef = useRef<HTMLImageElement>(null)

  // Check WebP support and use appropriate source
  useEffect(() => {
    const checkWebPSupport = () => {
      return new Promise<boolean>((resolve) => {
        const webP = new Image()
        webP.onload = webP.onerror = () => resolve(webP.height === 2)
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
      })
    }

    const loadImage = async () => {
      // Use intersection observer for lazy loading if supported
      if ('IntersectionObserver' in window && loading === 'lazy' && imgRef.current) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(async (entry) => {
              if (entry.isIntersecting) {
                const isWebPSupported = webpSrc ? await checkWebPSupport() : false
                const finalSrc = isWebPSupported && webpSrc ? webpSrc : src
                
                // Preload the image
                const img = new Image()
                img.onload = () => {
                  setCurrentSrc(finalSrc)
                  setIsLoaded(true)
                }
                img.onerror = () => {
                  setHasError(true)
                  if (webpSrc && isWebPSupported) {
                    // Fallback to original format if WebP fails
                    const fallbackImg = new Image()
                    fallbackImg.onload = () => {
                      setCurrentSrc(src)
                      setIsLoaded(true)
                    }
                    fallbackImg.onerror = () => setHasError(true)
                    fallbackImg.src = src
                  }
                }
                img.src = finalSrc
                
                observer.unobserve(entry.target)
              }
            })
          },
          { 
            rootMargin: '50px', // Start loading when 50px from viewport
            threshold: 0.1 
          }
        )

        observer.observe(imgRef.current)
        return () => observer.disconnect()
      } else {
        // Immediate loading for eager loading or when IntersectionObserver not supported
        const isWebPSupported = webpSrc ? await checkWebPSupport() : false
        const finalSrc = isWebPSupported && webpSrc ? webpSrc : src
        setCurrentSrc(finalSrc)
        setIsLoaded(true)
      }
    }

    loadImage()
  }, [src, webpSrc, loading])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    if (onError) {
      onError(e)
    }
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  return (
    <div className={`relative ${className}`} style={style}>
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded && !hasError ? 'opacity-100' : 'opacity-70'
        } ${className}`}
        style={style}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
      />
      
      {/* Loading spinner overlay */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  )
})

export default LazyImage