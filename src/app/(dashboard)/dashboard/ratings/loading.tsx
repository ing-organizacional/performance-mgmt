/**
 * Loading page for department ratings
 * Shows while the server component is fetching data
 */

import { LanguageSwitcher } from '@/components/layout'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse mr-3"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 pb-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Loading Overview Section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6 shadow-lg">
            <div className="h-6 bg-white/20 rounded w-48 animate-pulse mb-4"></div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="h-8 bg-white/20 rounded w-16 animate-pulse mb-1"></div>
                <div className="h-4 bg-white/20 rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-white/20 rounded w-20 animate-pulse mt-1"></div>
              </div>
              <div>
                <div className="h-8 bg-white/20 rounded w-12 animate-pulse mb-1"></div>
                <div className="h-4 bg-white/20 rounded w-36 animate-pulse"></div>
                <div className="h-3 bg-white/20 rounded w-16 animate-pulse mt-1"></div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-400/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-white/20 rounded w-44 animate-pulse"></div>
                </div>
                <div className="h-3 bg-white/20 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Loading Department Cards */}
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="rounded-lg border border-gray-200 border-l-4 border-l-gray-300 p-6 shadow-sm bg-white">
                {/* Department Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-1"></div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 ml-4">
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="text-right">
                      <div className="h-8 bg-gray-200 rounded w-12 animate-pulse mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3].map((metric) => (
                    <div key={metric} className="bg-white/80 rounded-lg p-3 text-center border border-gray-100">
                      <div className="h-5 bg-gray-200 rounded w-8 mx-auto animate-pulse mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>

                {/* Progress Bar Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4 animate-pulse mb-3"></div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading State Message */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600 font-medium">
                Analyzing department performance...
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Loading evaluation data and performance metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}