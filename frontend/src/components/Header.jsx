import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import useMediaQuery from '../hooks/useMediaQuery'
import { Settings as SettingsIcon, LogOut, Plus } from 'lucide-react'

export default function Header({ mode = 'landing', onGenerateClick, showAuthButtons = true }) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isExtraSmall = useMediaQuery('(max-width: 380px)')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="bg-[#F5EFE6] border-b border-[#D4C5B0]">
      <div className={`w-full ${isMobile ? 'py-3 px-4' : 'py-3 px-6'}`}>
        <div className={`flex items-center ${isMobile ? 'gap-3' : ''} justify-between ${isMobile ? 'flex-wrap' : ''} min-h-[48px]`}>
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} flex items-center justify-center`}>
              <img src="/logo_no_P.svg" alt="Piatto" className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
            </div>
            <span
              className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-[#035035]`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Piatto
            </span>
          </Link>

          {/* Landing mode navigation */}
          {mode === 'landing' && (
            <>
              <div className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2 translate-y-[2px]">
                <span className="text-gray-400 text-md font-light italic">
                  Cooking made Simple
                </span>
              </div>

              {showAuthButtons && (
                <>
                  {isAuthenticated ? (
                    <div className="flex items-center gap-3">
                      <Link
                        to="/about"
                        className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-semibold"
                      >
                        {t('navigation.about')}
                      </Link>
                      <Link
                        to="/app"
                        className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg"
                      >
                        {t('navigation.dashboard')}
                      </Link>
                    </div>
                  ) : (
                    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                      <Link
                        to="/auth/login"
                        className={`text-[#035035] hover:text-[#FF9B7B] transition-colors font-semibold ${isExtraSmall ? 'text-xs' : isMobile ? 'text-sm' : ''}`}
                      >
                        {t('navigation.signIn')}
                      </Link>
                      <Link
                        to="/auth/register"
                        className={`bg-[#035035] text-white rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg ${isExtraSmall ? 'px-2.5 py-2 text-xs' : isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
                      >
                        {t('navigation.getStartedFree')}
                      </Link>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* App mode navigation */}
          {mode === 'app' && (
            <>
              <div className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2 translate-y-[2px]">
                <span className="text-gray-400 text-md font-light italic">
                  Cooking made Simple
                </span>
              </div>

              <div className="flex items-center gap-3 relative">
                <button
                  onClick={onGenerateClick}
                  className="h-12 px-5 bg-[#035035] text-white rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('navigation.newRecipe', 'New Recipe')}</span>
                </button>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white hover:ring-[#035035] transition-all"
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
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white">
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
            </>
          )}
        </div>
      </div>

    </nav>
  )
}
