import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export default function Footer() {
  const { t, i18n } = useTranslation('common')

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <footer className="bg-[#035035] text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <img src="/logo_full_name.svg" alt="Piatto" className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold">Piatto</span>
            </div>
            <p className="text-sm opacity-80">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/#features" className="hover:opacity-100 transition-opacity">{t('navigation.features')}</Link></li>
              <li><Link to="/#recipes" className="hover:opacity-100 transition-opacity">{t('navigation.recipes')}</Link></li>
              <li><Link to="/about" className="hover:opacity-100 transition-opacity">{t('navigation.about')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/about" className="hover:opacity-100 transition-opacity">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/contact" className="hover:opacity-100 transition-opacity">{t('footer.contact')}</Link></li>
              <li><Link to="/privacy" className="hover:opacity-100 transition-opacity">{t('footer.privacyPolicy')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">{t('footer.connect')}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Instagram</a></li>
              <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">TikTok</a></li>
              <li><a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Pinterest</a></li>
            </ul>

            {/* Language Selector */}
            <div className="mt-6">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('language.label')}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    i18n.language === 'en'
                      ? 'bg-white text-[#035035]'
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('de')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    i18n.language === 'de'
                      ? 'bg-white text-[#035035]'
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                  }`}
                >
                  DE
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white border-opacity-20 pt-8 text-center text-sm opacity-80">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
