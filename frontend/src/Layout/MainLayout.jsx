import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Sparkles, User, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '../hooks/useMediaQuery';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer';
import RecipeGenerationModal from '../components/RecipeGenerationModal';

export default function MainLayout({ children, mode = 'landing' }) {
  const { t } = useTranslation(['mainLayout', 'common']);
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Hide footer on recipe view page
  const isRecipeViewPage = location.pathname.startsWith('/app/recipe/');

  // Listen for custom event to open generate modal
  useEffect(() => {
    const handleOpenModal = () => {
      if (!isMobile) {
        setShowGenerateModal(true);
      }
    };

    window.addEventListener('openGenerateModal', handleOpenModal);
    return () => window.removeEventListener('openGenerateModal', handleOpenModal);
  }, [isMobile]);

  // Scroll behavior for landing layout
  useEffect(() => {
    if (mode === 'landing') {
      if (location.hash) {
        const target = document.querySelector(location.hash)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [location.pathname, location.hash, mode])

  const mobileNavItems = [
    { label: t('navigation.dashboard', { ns: 'mainLayout', defaultValue: 'Dashboard' }), to: '/app', icon: Home, end: true },
    { label: t('navigation.generate', { ns: 'mainLayout', defaultValue: 'Generate' }), to: '/app/generate', icon: Sparkles },
    { label: t('navigation.recipes', { ns: 'mainLayout', defaultValue: 'Recipes' }), to: '/app/recipes/all', icon: BookOpen },
    { label: t('navigation.profile', { ns: 'mainLayout', defaultValue: 'Profile' }), to: '/app/settings', icon: User }
  ];

  const content = children ?? <Outlet />;

  const handleGenerateClick = () => {
    if (isMobile) {
      // On mobile, navigate to the generation page
      // This is handled by the routing in App.jsx
      return;
    }
    // On desktop, open the modal
    setShowGenerateModal(true);
  };

  // Mobile App Layout
  if (mode === 'app' && isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col relative">
        {/* Animated background elements */}
        <div className="hidden lg:block fixed top-20 right-20 w-96 h-96 rounded-full bg-[#A8C9B8] opacity-20 blur-3xl animate-pulse-slow z-0 pointer-events-none"></div>
        <div className="hidden lg:block fixed bottom-40 left-10 w-96 h-96 rounded-full bg-[#FF9B7B] opacity-20 blur-3xl animate-pulse-slow z-0 pointer-events-none" style={{ animationDelay: '2s' }}></div>
        <div className="hidden lg:block fixed top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#035035] opacity-15 blur-3xl animate-pulse-slow z-0 pointer-events-none" style={{ animationDelay: '4s' }}></div>

        <header className="bg-[#FFF8F0] border-b border-[#F5F5F5] relative z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <Link
              to="/"
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 flex items-center justify-center">
                <img src="/logo_no_P.svg" alt="Piatto" className="w-7 h-7" />
              </div>
              <span
                className="text-lg font-bold text-[#035035]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Piatto
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-20 relative z-10">
          {content}
        </main>

        {!isRecipeViewPage && (
          <footer className="py-4 px-4 text-center">
            <p className="text-xs text-[#2D2D2D] opacity-40">
              {t('footer.copyright', { ns: 'mainLayout', defaultValue: '© 2025 Piatto. Cooking made delightful, one recipe at a time.' })}
            </p>
          </footer>
        )}

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8F0] border-t border-[#F5F5F5] backdrop-blur">
          <div className="flex">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-all',
                      isActive
                        ? 'text-[#035035] font-semibold'
                        : 'text-[#2D2D2D] opacity-80 hover:text-[#035035]'
                    ].join(' ')
                  }
                >
                  {Icon && <Icon className="w-6 h-6" />}
                  <span className="text-xs">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <style>{`
          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.15;
            }
            50% {
              opacity: 0.25;
            }
          }

          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Desktop Layout (both landing and app)
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Animated background elements */}
      <div className="hidden lg:block fixed top-20 right-20 w-96 h-96 rounded-full bg-[#A8C9B8] opacity-20 blur-3xl animate-pulse-slow z-0 pointer-events-none"></div>
      <div className="hidden lg:block fixed bottom-40 left-10 w-96 h-96 rounded-full bg-[#FF9B7B] opacity-20 blur-3xl animate-pulse-slow z-0 pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="hidden lg:block fixed top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#035035] opacity-15 blur-3xl animate-pulse-slow z-0 pointer-events-none" style={{ animationDelay: '4s' }}></div>

      <Header mode={mode} onGenerateClick={handleGenerateClick} />

      <main className="flex-1 relative z-10">{content}</main>

      {/* Footer (hidden on recipe view page for app mode) */}
      {mode === 'landing' && <Footer />}
      {mode === 'app' && !isRecipeViewPage && (
        <footer className="py-3 px-6 text-center">
          <p className="text-xs text-[#2D2D2D] opacity-40">
            {t('footer.copyright', { ns: 'mainLayout', defaultValue: '© 2025 Piatto. Cooking made delightful, one recipe at a time.' })}
          </p>
        </footer>
      )}

      {/* Recipe Generation Modal - Desktop only for app mode */}
      {mode === 'app' && (
        <RecipeGenerationModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
        />
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
