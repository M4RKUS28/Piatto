import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Sparkles, User, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '../hooks/useMediaQuery';
import AppHeader from '../components/AppHeader';
import RecipeGenerationModal from '../components/RecipeGenerationModal';

export default function MainLayout({ children }) {
  const { t } = useTranslation('mainLayout');
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

  // Fallback user data if user is not loaded yet
  const displayUser = user ? {
    username: user.username || 'User',
    email: user.email || 'user@example.com',
    profile_image_url: user.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'User'}`,
    id: user.id
  } : {
    username: 'User',
    email: 'user@example.com',
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
  };

  const mobileNavItems = [
    { label: t('navigation.dashboard', 'Dashboard'), to: '/app', icon: Home, end: true },
    { label: t('navigation.generate', 'Generate'), to: '/app/generate', icon: Sparkles },
    { label: t('navigation.recipes', 'Recipes'), to: '/app/recipes/all', icon: BookOpen },
    { label: t('navigation.profile', 'Profile'), to: '/app/settings', icon: User }
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

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="sticky top-0 z-50 bg-[#FFF8F0] border-b border-[#F5F5F5]">
          <div className="flex items-center justify-between px-4 py-3">
            <Link
              to="/app"
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center">
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

        <main className="flex-1 pb-20">
          {content}
        </main>

        {!isRecipeViewPage && (
          <footer className="py-4 px-4 text-center">
            <p className="text-xs text-[#2D2D2D] opacity-40">
              {t('footer.copyright', '© 2025 Piatto. Cooking made delightful, one recipe at a time.')}
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Desktop Header */}
      <AppHeader onGenerateClick={handleGenerateClick} />

      {/* Main Content */}
      <main className="flex-1">{content}</main>

      {/* Footer (hidden on recipe view page) */}
      {!isRecipeViewPage && (
        <footer className="py-3 px-6 text-center">
          <p className="text-xs text-[#2D2D2D] opacity-40">
            {t('footer.copyright', '© 2025 Piatto. Cooking made delightful, one recipe at a time.')}
          </p>
        </footer>
      )}

      {/* Recipe Generation Modal - Desktop only */}
      <RecipeGenerationModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  );
}
