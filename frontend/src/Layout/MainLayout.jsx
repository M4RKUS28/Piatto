import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, PanelLeft, Settings as SettingsIcon, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useMediaQuery from '../hooks/useMediaQuery';

export default function MainLayout({ children }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Hide footer on recipe view page
  const isRecipeViewPage = location.pathname.startsWith('/app/recipe/');

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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

  // Debug log
  console.log('MainLayout - User data:', user);
  console.log('MainLayout - Display user:', displayUser);

  const navItems = [
    { label: 'Dashboard', to: '/app', icon: Home, end: true },
    { label: 'Generate Recipe', to: '/app/generate', icon: Sparkles },
    { label: 'Recipe Library', to: '/app/library', icon: UtensilsCrossed }
  ];

  const content = children ?? <Outlet />;
  const mobileNavItems = [...navItems, { label: 'Settings', to: '/app/settings', icon: SettingsIcon }];

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="sticky top-0 z-50 bg-[#FFF8F0] border-b border-[#F5F5F5]">
          <div className="flex items-center justify-between px-4 py-3">
            <Link
              to="/"
              onClick={() => setProfileMenuOpen(false)}
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

            <button
              onClick={toggleProfileMenu}
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white"
              aria-label="Open profile menu"
            >
              <img
                src={displayUser.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser.username}`}
                alt={displayUser.username}
                className="w-full h-full"
              />
            </button>
          </div>
        </header>

        <main className="flex-1 pb-20">
          {content}
        </main>

        {!isRecipeViewPage && (
          <footer className="py-4 px-4 text-center">
            <p className="text-xs text-[#2D2D2D] opacity-40">
              © 2025 Piatto. Cooking made delightful, one recipe at a time.
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
                  onClick={() => setProfileMenuOpen(false)}
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

        {profileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setProfileMenuOpen(false)}
            />
            <div className="fixed top-20 right-4 z-50 bg-white rounded-2xl shadow-lg border border-[#F5F5F5] p-4 w-64">
              <div className="flex items-center gap-3 pb-3 border-b border-[#F5F5F5]">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white">
                  <img
                    src={displayUser.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser.username}`}
                    alt={displayUser.username}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#2D2D2D] truncate">
                    {displayUser.username || 'User'}
                  </div>
                  <div className="text-xs text-[#2D2D2D] opacity-60 truncate">
                    {displayUser.email || 'user@example.com'}
                  </div>
                </div>
              </div>

              <div className="pt-3 space-y-2">
                <Link
                  to="/app/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#2D2D2D] hover:bg-[#FFF8F0] transition-all"
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#2D2D2D] hover:bg-[#FFF8F0] transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#FFF8F0] border-r border-[#F5F5F5] z-50 transition-all duration-300 flex flex-col ${sidebarExpanded ? 'w-64' : 'w-16'
          }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Logo / Toggle */}
        <div className="p-4 border-b border-[#F5F5F5]">
          <div className="w-full flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 group relative hover:shadow-md transition-all"
              title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarExpanded ? (
                <img src="/logo_no_P.svg" alt="Piatto" className="w-6 h-6" />
              ) : (
                <>
                  <img src="/logo_no_P.svg" alt="Piatto" className="w-6 h-6 group-hover:opacity-0 transition-opacity" />
                  <PanelLeft className="w-5 h-5 text-[#035035] absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
            {sidebarExpanded && (
              <>
                <Link
                  to="/"
                  onClick={() => {
                    setProfileMenuOpen(false);
                  }}
                  className="text-xl font-bold text-[#035035] flex-1 transition-colors hover:text-[#023724]"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Piatto
                </Link>
                <button
                  onClick={toggleSidebar}
                  className="text-[#035035] opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4">
          <div className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setProfileMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 px-3 py-3 rounded-xl transition-all group',
                      isActive
                        ? 'bg-white text-[#035035] shadow-sm'
                        : 'text-[#2D2D2D] hover:bg-white hover:text-[#035035]'
                    ].join(' ')
                  }
                >
                  {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                  {sidebarExpanded && <span className="font-medium">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Profile Section */}
        <div className="p-2 border-t border-[#F5F5F5] relative">
          <button
            onClick={toggleProfileMenu}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white transition-all"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white">
              <img
                src={displayUser.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser.username}`}
                alt={displayUser.username}
                className="w-full h-full"
              />
            </div>
            {sidebarExpanded && (
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-[#2D2D2D] truncate">
                  {displayUser.username || 'User'}
                </div>
              </div>
            )}
          </button>

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <div
              className={`absolute bg-white rounded-2xl shadow-lg border border-[#F5F5F5] p-3 z-[60] min-w-[14rem] ${sidebarExpanded ? 'bottom-16 left-2 right-2' : 'bottom-16 left-2'
                }`}
              style={{
                animation: 'scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* User Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#F5F5F5]">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#A8C9B8] bg-white">
                  <img
                    src={displayUser.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser.username}`}
                    alt={displayUser.username}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#2D2D2D] truncate">
                    {displayUser.username || 'User'}
                  </div>
                  <div className="text-xs text-[#2D2D2D] opacity-60 truncate">
                    {displayUser.email || 'user@example.com'}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="pt-3 space-y-2">
                <Link
                  to="/app/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2D2D] hover:bg-[#FFF8F0] transition-all text-left"
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span className="text-base font-medium">Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#2D2D2D] hover:bg-[#FFF8F0] transition-all text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-base font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'
          }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <main className="flex-1">{content}</main>

        {/* Footer (hidden on recipe view page) */}
        {!isRecipeViewPage && (
          <footer className="py-3 px-6 text-center">
            <p className="text-xs text-[#2D2D2D] opacity-40">
              © 2025 Piatto. Cooking made delightful, one recipe at a time.
            </p>
          </footer>
        )}
      </div>

      {/* Click outside to close profile menu */}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileMenuOpen(false)}
        />
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}