import { useLanguage } from '@/contexts/LanguageContext'
import { useSwipe } from '@/hooks/useSwipe'
import type { ActiveTab } from '../types'

interface AssignmentTabsProps {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
}

export function AssignmentTabs({ activeTab, setActiveTab }: AssignmentTabsProps) {
  const { t } = useLanguage()
  
  // Tab navigation with swipe support
  const tabs: ActiveTab[] = ['company', 'department']
  
  const handleSwipeLeft = () => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const handleSwipeRight = () => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const { elementRef } = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  }, {
    threshold: 50,
    preventDefaultTouchmoveEvent: true
  })


  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'company':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9zm-6 4h2v2H7v-2zm4 0h2v2h-2v-2z" clipRule="evenodd" />
          </svg>
        )
      case 'department':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getBadgeLabel = (level: string) => {
    switch (level) {
      case 'company':
        return t.common.company
      case 'department':
        return t.common.department
      default:
        return t.common.department // Fallback to department for any remaining items
    }
  }

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>} className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-24 z-40 shadow-sm">
      <div className="max-w-8xl mx-auto px-6 lg:px-8">
        <div className="flex justify-center lg:justify-start space-x-2 relative py-4">
          {/* Swipe indicator - only show on mobile */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400/70 animate-pulse lg:hidden">
            ← Swipe to navigate →
          </div>
          
          {/* Tab position indicator */}
          <div 
            className="absolute bottom-0 h-1 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${tabs.indexOf(activeTab) * (100 / tabs.length)}%`
            }}
          />
          
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 px-6 py-3 min-h-[44px] font-semibold rounded-xl transition-all duration-200 active:scale-95 touch-manipulation shadow-sm border ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 border-primary scale-105'
                  : 'bg-white text-gray-600 hover:text-primary hover:bg-primary/5 hover:border-primary/20 hover:shadow-md border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {getBadgeIcon(tab)}
                <span className="capitalize whitespace-nowrap text-sm lg:text-base">{getBadgeLabel(tab)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}