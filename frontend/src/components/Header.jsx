import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

export default function Header({ showAuthButtons = true }) {
  const { t } = useTranslation('common')
  const { isAuthenticated } = useAuth()

  return (
    <nav className="bg-[#F5EFE6] border-b border-[#D4C5B0] sticky top-0 z-50">
      <div className="w-full py-4 px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center">
              <img src="/logo_no_P.svg" alt="Piatto" className="w-10 h-10" />
            </div>
            <span className="text-2xl font-bold text-[#035035]" style={{ fontFamily: 'Georgia, serif' }}>Piatto</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">{t('navigation.features')}</Link>
            <Link to="/#how-it-works" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">{t('navigation.howItWorks')}</Link>
            <Link to="/#recipes" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">{t('navigation.recipes')}</Link>
            <Link to="/about" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">{t('navigation.about')}</Link>
          </div>

          {showAuthButtons && (
            <>
              {isAuthenticated ? (
                <Link
                  to="/app"
                  className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg"
                >
                  {t('navigation.dashboard')}
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-[#035035] hover:text-[#FF9B7B] transition-colors font-semibold"
                  >
                    {t('navigation.signIn')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg"
                  >
                    {t('navigation.getStartedFree')}
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
