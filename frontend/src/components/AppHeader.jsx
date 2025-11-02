import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import useMediaQuery from '../hooks/useMediaQuery'
import { Sparkles, Settings as SettingsIcon } from 'lucide-react'

export default function AppHeader({ onGenerateClick }) {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <nav className="bg-[#F5EFE6] border-b border-[#D4C5B0] sticky top-0 z-50">
      <div className={`w-full ${isMobile ? 'py-3 px-4' : 'py-4 px-6'}`}>
        <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-0'} justify-between ${isMobile ? 'flex-wrap' : ''}`}>
          <Link to="/app" className="flex items-center gap-3">
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

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={onGenerateClick}
              className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {t('navigation.generateNewRecipe', { defaultValue: 'Generate New Recipe' })}
            </button>
            <Link
              to="/app/settings"
              className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-semibold flex items-center gap-2"
            >
              <SettingsIcon className="w-5 h-5" />
              {t('navigation.settings', { defaultValue: 'Settings' })}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/app/settings"
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white hover:ring-[#035035] transition-all"
              aria-label={t('aria.openProfile', 'Open profile')}
            >
              <img
                src={user?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`}
                alt={user?.username || 'User'}
                className="w-full h-full"
              />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
