# Phase 1: Navigation Infrastructure Setup

## 🎯 **Objective**
Set up basic hash-based routing infrastructure to support multiple pages (Hunt and Feed) without breaking existing functionality.

## 🔧 **Tasks**

### 1. Create Simple Hash Router Hook
Create `src/hooks/useHashRouter.ts`:
```typescript
import { useState, useEffect } from 'react'

export type PageType = 'hunt' | 'feed'

export const useHashRouter = (): [PageType, (page: PageType) => void] => {
  const [currentPage, setCurrentPage] = useState<PageType>('hunt')
  
  const navigateToPage = (page: PageType) => {
    const hash = page === 'hunt' ? '#/' : `#/${page}`
    window.location.hash = hash
  }
  
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#/feed') {
        setCurrentPage('feed')
      } else {
        setCurrentPage('hunt') // Default to hunt for any other hash
      }
    }
    
    // Set initial page based on current hash
    handleHashChange()
    
    window.addEventListener('hashchange', handleHashChange)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])
  
  return [currentPage, navigateToPage]
}
```

### 2. Update App.jsx to Use Router
Modify `src/App.jsx` to:
- Import the new useHashRouter hook
- Add currentPage state management
- Conditionally render current hunt content (wrap existing content in a conditional)
- Add placeholder for Feed page

Example structure:
```jsx
import { useHashRouter } from './hooks/useHashRouter'

export default function App() {
  const [currentPage, navigateToPage] = useHashRouter()
  
  // ... existing state and functions ...
  
  return (
    <UploadProvider>
      <div className='min-h-screen text-slate-900' style={{backgroundColor: 'var(--color-cream)'}}>
        <Header 
          // ... existing props ...
          currentPage={currentPage}
          onNavigate={navigateToPage}
        />
        
        {currentPage === 'hunt' && (
          <main>
            {/* Move ALL existing main content here */}
          </main>
        )}
        
        {currentPage === 'feed' && (
          <main>
            <div className="p-4 text-center">
              <h1>Feed Page - Coming Soon!</h1>
              <button 
                onClick={() => navigateToPage('hunt')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Back to Hunt
              </button>
            </div>
          </main>
        )}
      </div>
    </UploadProvider>
  )
}
```

### 3. Update Header Props
Modify `src/features/app/Header.tsx` interface to accept navigation props:
```typescript
interface HeaderProps {
  isMenuOpen: boolean
  onToggleMenu: () => void
  completeCount: number
  totalStops: number
  percent: number
  onReset: () => void
  onToggleTips: () => void
  currentPage: PageType  // NEW
  onNavigate: (page: PageType) => void  // NEW
}
```

## ✅ **Verification Steps**
1. **Test existing hunt functionality**: Ensure all current features work exactly as before
2. **Test URL navigation**: 
   - Visit `#/` should show hunt page
   - Visit `#/feed` should show "Coming Soon" placeholder
   - Browser back/forward buttons should work
3. **Test menu toggle**: Hamburger menu should still work normally
4. **Test all hunt features**: Photo upload, progress tracking, settings, etc.

## 🚨 **Critical Requirements**
- **NO existing functionality should break**
- **All current hunt features must work identically**
- **URL changes should not affect current user experience**
- **Keep changes minimal and isolated**

## 📝 **Notes**
- This phase only adds routing infrastructure
- No UI changes to menu yet (that's Phase 2)
- Feed page is just a placeholder
- Focus on maintaining existing stability