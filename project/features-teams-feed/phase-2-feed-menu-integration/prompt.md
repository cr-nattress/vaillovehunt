# Phase 2: Feed Menu Integration

## 🎯 **Objective**
Add "Feed" menu item to the hamburger menu navigation and ensure smooth navigation between Hunt and Feed pages.

## 📋 **Prerequisites**
- Phase 1 must be completed and verified
- Hash routing should be working
- Hunt page should render correctly when `currentPage === 'hunt'`

## 🔧 **Tasks**

### 1. Update Header Component Navigation
Modify `src/features/app/Header.tsx` to add Feed menu item:

Add the Feed menu button in the hamburger menu (after Rules, before Reset):

```typescript
<button 
  onClick={() => {
    onNavigate('feed')
    onToggleMenu()
  }}
  className='w-full text-left px-4 py-3 rounded-lg transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99] flex items-center gap-3 opacity-0'
  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-light-pink)'}
  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
  onMouseDown={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-blush-pink)'}
  onMouseUp={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-light-pink)'}
  style={{
    animation: 'fadeInSlide 0.3s ease-out 0.15s forwards'
  }}
>
  <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
  </svg>
  <span className='text-gray-700'>Feed</span>
</button>
```

### 2. Update Menu Item Animations
Adjust the animation delays for existing menu items to accommodate the new Feed item:
- Rules: `0.1s` (keep current)
- **Feed**: `0.15s` (new)
- Reset: `0.2s` (update from current `0.2s`)

### 3. Add Active Page Indicator (Optional Enhancement)
Consider adding visual indication of current page in the header or menu items:
```typescript
// Add visual indicator for current page
className={`... ${currentPage === 'feed' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
```

### 4. Improve Feed Placeholder Page
Enhance the Feed placeholder in `src/App.jsx` to be more polished:
```jsx
{currentPage === 'feed' && (
  <main className='max-w-screen-sm mx-auto px-4 py-5'>
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Feed</h1>
      <p className="text-gray-600 mb-6">See photos from all teams participating in the hunt!</p>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 text-sm">
          🚧 Feed feature coming soon! Check back later to see amazing photos from other teams.
        </p>
      </div>
      
      <button 
        onClick={() => onNavigate('hunt')}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        ← Back to Hunt
      </button>
    </div>
  </main>
)}
```

## ✅ **Verification Steps**

### Test Navigation Flow:
1. **Hunt to Feed**: Click hamburger menu → Feed → should navigate to feed page
2. **Feed to Hunt**: Click "Back to Hunt" → should return to hunt page  
3. **URL persistence**: Refresh page on `#/feed` → should stay on feed page
4. **Menu animations**: All menu items should animate in sequence
5. **Menu closing**: Menu should close when Feed is selected

### Test Existing Functionality:
1. **Hunt page**: All existing features work when currentPage === 'hunt'
2. **Rules button**: Should still show tips overlay
3. **Reset button**: Should still reset progress
4. **Settings gear**: Should still work
5. **Photo uploads**: Should still function normally
6. **Progress tracking**: Should update correctly

### Test Edge Cases:
1. **Direct URL access**: Visit `domain/#/feed` directly
2. **Browser navigation**: Back/forward buttons work correctly
3. **Menu state**: Hamburger menu state resets properly
4. **Mobile responsiveness**: Menu works on mobile viewports

## 🚨 **Critical Requirements**
- **All existing hunt functionality must remain identical**
- **Menu animations should be smooth and sequential**
- **Navigation should be intuitive and responsive**
- **URL changes should be reflected immediately**

## 📝 **Notes**
- Keep Feed page as placeholder for now
- Focus on smooth navigation experience
- Ensure menu closes after navigation
- Test thoroughly on mobile devices