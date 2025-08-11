import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { ChevronLeft, Plus, Settings, LogOut } from 'lucide-react'

interface UsersHeaderProps {
  onAddUser: () => void
  isPending: boolean
}

export function UsersHeader({ onAddUser, isPending }: UsersHeaderProps) {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left Section - Navigation & Title */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
              title={t.users.goBack}
              aria-label={t.users.goBack}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {t.users.userManagement}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t.users.manageUsersDescription}
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={onAddUser}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              <span>{t.users.addUser}</span>
            </button>
            <button
              onClick={() => router.push('/users/advanced')}
              className="hidden lg:flex items-center gap-2 px-6 py-3 min-h-[44px] bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
            >
              <Settings className="w-5 h-5" />
              <span>{t.users.advanced}</span>
            </button>
            <LanguageSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm touch-manipulation"
              title={t.users.signOut}
              aria-label={t.users.signOut}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}