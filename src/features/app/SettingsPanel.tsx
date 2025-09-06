import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusManagement } from '../../hooks/useFocusManagement'

interface SettingsPanelProps {
  locationName: string
  teamName: string
  eventName: string
  onChangeLocation: (value: string) => void
  onChangeTeam: (value: string) => void
  onChangeEvent: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

export default function SettingsPanel({
  locationName,
  teamName,
  eventName,
  onChangeLocation,
  onChangeTeam,
  onChangeEvent,
  onSave,
  onCancel
}: SettingsPanelProps) {
  const { t } = useTranslation()
  const { trapRef } = useFocusManagement(true)

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = () => {
      onCancel()
    }

    document.addEventListener('focusManagementEscape', handleEscape)
    return () => {
      document.removeEventListener('focusManagementEscape', handleEscape)
    }
  }, [onCancel])

  return (
    <div 
      ref={trapRef}
      id="settings-panel" 
      className='mt-4' 
      role="dialog" 
      aria-labelledby="settings-heading" 
      aria-describedby="settings-description"
      aria-modal="true"
    >
      <h2 id="settings-heading" className="sr-only">{t('settings.heading')}</h2>
      <p id="settings-description" className="sr-only">
        {t('settings.description')}
      </p>
      
      <div className='space-y-4'>
        <div>
          <label 
            htmlFor="organization-select"
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            {t('settings.organization')}
          </label>
          <select
            id="organization-select"
            value={locationName}
            onChange={(e) => onChangeLocation(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent opacity-50 cursor-not-allowed'
            disabled={true}
            aria-describedby="organization-help"
          >
            <option value="BHHS">BHHS</option>
            <option value="Vail Valley">Vail Valley</option>
            <option value="Vail Village">Vail Village</option>
            <option value="TEST">TEST</option>
          </select>
          <div id="organization-help" className="sr-only">
            {t('settings.organizationHelp')}
          </div>
        </div>
        
        <div>
          <label 
            htmlFor="event-input"
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            {t('settings.event')}
          </label>
          <input
            id="event-input"
            type='text'
            value={eventName}
            onChange={(e) => onChangeEvent(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            placeholder={t('settings.eventPlaceholder')}
            aria-describedby="event-help"
            autoComplete="off"
          />
          <div id="event-help" className="sr-only">
            {t('settings.eventHelp')}
          </div>
        </div>
        
        <div>
          <label 
            htmlFor="team-input"
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            {t('settings.team')}
          </label>
          <input
            id="team-input"
            type='text'
            value={teamName}
            onChange={(e) => onChangeTeam(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            placeholder={t('settings.teamPlaceholder')}
            aria-describedby="team-help"
            autoComplete="off"
          />
          <div id="team-help" className="sr-only">
            {t('settings.teamHelp')}
          </div>
        </div>
        
        <div className='flex gap-3' role="group" aria-label={t('accessibility.settingsActions')}>
          <button
            onClick={onSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSave()
              }
            }}
            className='flex-1 px-4 py-2 text-white font-medium rounded-md transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50'
            style={{
              backgroundColor: 'var(--color-cabernet)'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet-hover)'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet)'}
            onFocus={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet-hover)'}
            onBlur={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet)'}
            onMouseDown={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet-active)'}
            onMouseUp={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-cabernet-hover)'}
            aria-describedby="save-help"
          >
            {t('settings.saveChanges')}
          </button>
          <div id="save-help" className="sr-only">
            {t('settings.saveHelp')}
          </div>
          
          <button
            onClick={onCancel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCancel()
              } else if (e.key === 'Escape') {
                onCancel()
              }
            }}
            className='flex-1 px-4 py-2 font-medium rounded-md transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50'
            style={{
              backgroundColor: 'var(--color-light-grey)',
              color: 'var(--color-dark-neutral)'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-warm-grey)';
              (e.target as HTMLElement).style.color = 'var(--color-white)'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-light-grey)';
              (e.target as HTMLElement).style.color = 'var(--color-dark-neutral)'
            }}
            onFocus={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-warm-grey)';
              (e.target as HTMLElement).style.color = 'var(--color-white)'
            }}
            onBlur={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-light-grey)';
              (e.target as HTMLElement).style.color = 'var(--color-dark-neutral)'
            }}
            onMouseDown={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-blush-pink)'}
            onMouseUp={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-warm-grey)'}
            aria-describedby="cancel-help"
          >
            {t('settings.cancel')}
          </button>
          <div id="cancel-help" className="sr-only">
            {t('settings.cancelHelp')}
          </div>
        </div>
      </div>
    </div>
  )
}