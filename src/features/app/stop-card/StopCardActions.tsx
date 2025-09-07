import React, { useCallback, useState, useEffect } from 'react'
import { COLORS } from './stopCard.tokens'
import { useToastActions } from '../../notifications/ToastProvider'

interface StopCardActionsProps {
  stop: {
    id: string
    title: string
  }
  state: {
    done: boolean
    photo: string | null
  }
  expanded: boolean
  isUploading: boolean
  onUpload: (stopId: string, file: File) => Promise<void>
}

export default function StopCardActions({
  stop,
  state,
  expanded,
  isUploading,
  onUpload
}: StopCardActionsProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { success, error } = useToastActions()

  // Clear error when upload starts
  useEffect(() => {
    if (isUploading) {
      setUploadError(null)
    }
  }, [isUploading])

  // Only show if conditions are met and no photo yet
  if (!(!state.done || expanded) || state.photo) {
    return null
  }

  const handlePhotoUpload = useCallback(async (file: File) => {
    try {
      setUploadError(null)
      await onUpload(stop.id, file)
      success(`Photo uploaded successfully for ${stop.title}!`)
    } catch (err) {
      const errorMessage = 'Upload failed. Please try again.'
      setUploadError(errorMessage)
      error(errorMessage)
      console.error('Photo upload error:', err)
    }
  }, [onUpload, stop.id, success, error, stop.title])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      await handlePhotoUpload(file)
    }
    // Clear the input so the same file can be selected again if there's an error
    e.target.value = ''
  }, [handlePhotoUpload])

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      handlePhotoUpload(selectedFile)
    }
  }, [selectedFile, handlePhotoUpload])

  return (
    <div className='mt-3 space-y-2'>
      <input 
        type='file' 
        accept='image/*' 
        onChange={handleFileChange}
        className='sr-only'
        id={`file-${stop.id}`}
        aria-describedby={`upload-help-${stop.id}`}
      />
      <label 
        htmlFor={`file-${stop.id}`}
        className={`w-full px-6 py-4 text-white text-lg font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-3 transition-all duration-200 transform focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 focus:outline-none shadow-lg ${
          isUploading 
            ? 'cursor-wait' 
            : 'hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl'
        }`} 
        style={{ backgroundColor: isUploading ? COLORS.warmGrey : COLORS.cabernet }} 
        onMouseEnter={(e) => { if (!isUploading) (e.target as HTMLElement).style.backgroundColor = 'var(--color-deep-wine)' }} 
        onMouseLeave={(e) => { if (!isUploading) (e.target as HTMLElement).style.backgroundColor = COLORS.cabernet }}
        onFocus={(e) => { if (!isUploading) (e.target as HTMLElement).style.backgroundColor = 'var(--color-deep-wine)' }}
        onBlur={(e) => { if (!isUploading) (e.target as HTMLElement).style.backgroundColor = COLORS.cabernet }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            document.getElementById(`file-${stop.id}`)?.click()
          }
        }}
        tabIndex={0}
        role="button"
        aria-disabled={isUploading}
        aria-label={isUploading ? 'Processing photo upload' : `Upload photo for ${stop.title}`}
      >
        {isUploading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Uploading Photo...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Upload Photo
          </>
        )}
      </label>
      
      {/* Microcopy */}
      <p className='text-xs text-center text-slate-500 px-2'>
        Take a creative selfie together at this location to complete the challenge
      </p>
      
      {/* Error state with retry */}
      {uploadError && selectedFile && !isUploading && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-3 space-y-2'>
          <div className='flex items-start gap-2'>
            <span className='text-red-500 flex-shrink-0' aria-hidden="true">⚠️</span>
            <div className='flex-1 min-w-0'>
              <p className='text-sm text-red-700 font-medium'>
                {uploadError}
              </p>
              <p className='text-xs text-red-600 mt-1'>
                Selected: {selectedFile.name}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRetry}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleRetry()
              }
            }}
            className='w-full px-4 py-2 bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 focus:outline-none text-white text-sm font-medium rounded-lg transition-colors duration-200'
            aria-label={`Retry uploading ${selectedFile.name} for ${stop.title}`}
          >
            🔄 Retry Upload
          </button>
        </div>
      )}
      
      <div id={`upload-help-${stop.id}`} className="sr-only">
        Select an image file to upload as your photo for this stop
      </div>
    </div>
  )
}