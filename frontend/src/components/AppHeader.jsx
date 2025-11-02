import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import useMediaQuery from '../hooks/useMediaQuery'
import { Sparkles, Settings as SettingsIcon, LogOut } from 'lucide-react'

export default function AppHeader({ onGenerateClick }) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleGenerateClick = () => {
    // Navigate to /app first, then open modal
    navigate('/app')
    setTimeout(() => {
      if (onGenerateClick) onGenerateClick()
    }, 100)
  }

  return (
    <nav className="bg-[#F5EFE6] border-b border-[#D4C5B0] sticky top-0 z-50">
      <div className={`w-full ${isMobile ? 'py-3 px-4' : 'py-4 px-6'}`}>
        <div className={`flex items-center ${isMobile ? 'gap-3' : ''} justify-between ${isMobile ? 'flex-wrap' : ''}`}>
          <Link to="/app" className="flex items-center gap-3 flex-shrink-0">
            <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-white rounded-2xl shadow-md flex items-center justify-center`}>
              <img src="/logo_no_P.svg" alt="Piatto" className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
            </div>
            <div className="flex flex-col">
              <span
                className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-[#035035]`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Piatto
              </span>
              {!isMobile && (
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#2D2D2D]/70">
                  {t('navigation.tagline', { defaultValue: 'AI Culinary Copilot' })}
                </span>
              )}
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            <Link
              to="/app"
              className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-semibold"
            >
              {t('navigation.dashboard', { defaultValue: 'Dashboard' })}
            </Link>
            <button
              onClick={handleGenerateClick}
              className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {t('navigation.generateNewRecipe', { defaultValue: 'Generate New Recipe' })}
            </button>
            <Link
              to="/app/settings"
              className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-semibold"
            >
              {t('navigation.settings', { defaultValue: 'Settings' })}
            </Link>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white hover:ring-[#035035] transition-all"
              aria-label={t('aria.openProfile', 'Open profile')}
            >
              <img
                src={user?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`}
                alt={user?.username || 'User'}
                className="w-full h-full"
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute top-14 right-0 z-50 bg-white rounded-2xl shadow-lg border border-[#F5F5F5] p-3 min-w-[14rem]">
                  {/* User Info */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#F5F5F5]">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white">
                      <img
                        src={user?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`}
                        alt={user?.username || 'User'}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#2D2D2D] truncate">
                        {user?.username || 'User'}
                      </div>
                      <div className="text-xs text-[#2D2D2D] opacity-60 truncate">
                        {user?.email || 'user@example.com'}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="pt-3 space-y-2">
                    <Link
                      to="/app/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2D2D] hover:bg-[#FFF8F0] transition-all text-left"
                    >
                      <SettingsIcon className="w-5 h-5" />
                      <span className="text-base font-medium">{t('navigation.settings', 'Settings')}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2D2D] hover:bg-[#FFF8F0] transition-all text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-base font-medium">{t('navigation.logout', 'Logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
