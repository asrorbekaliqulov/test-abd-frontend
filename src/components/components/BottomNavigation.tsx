import React from 'react';
import { Home, Search, User, AtomIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const LogoImage: React.FC = () => (
    <img src="/logo.jpg" alt="T" className="w-8 h-8 rounded-full" />
);

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      isSpecial: false
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      path: '/search',
      isSpecial: false
    },
    {
      id: 'quiz',
      label: '',
      icon: LogoImage,
      path: '/quiz',
      isSpecial: true,
      activePaths: ['/quiz']
    },
    {
      id: 'library',
      label: 'AI Reader',
      icon: AtomIcon,
      path: '/reader',
      isSpecial: false
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
      isSpecial: false
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (item: any) => {
    if (item.activePaths) {
      return item.activePaths.includes(location.pathname);
    }
    return location.pathname === item.path;
  };

  // Quiz va Create birgalikda faol holatda bo'lsa
  const isQuizOrCreateActive = location.pathname === '/quiz' || location.pathname === '/create';
  const activeSpecialItem = isQuizOrCreateActive
      ? (location.pathname === '/quiz' ? 'quiz' : 'create')
      : null;

  return (
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-around items-center py-0.8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              const isSpecialActive = activeSpecialItem === item.id;

              if (item.isSpecial) {
                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        className="relative p-2"
                    >
                      <div className={`w-14 h-14 flex items-center justify-center shadow-lg rounded-full ${
                          isSpecialActive
                              ? 'bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full'
                              : 'bg-transparent'
                      }`}>
                        <Icon size={isSpecialActive ? 24 : 24} className={isSpecialActive ? "text-white" : "text-theme-secondary"} />
                      </div>
                      <span className="text-xs mt-1 font-medium text-center w-full block">
                    {item.label}
                  </span>
                    </button>
                );
              }

              return (
                  <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`flex flex-col items-center py-2 px-3 transition-theme-normal ${
                          active
                              ? 'text-accent-primary'
                              : 'text-theme-secondary hover:text-theme-primary'
                      }`}
                  >
                    <Icon size={24} />
                    <span className="text-xs mt-1 font-medium">{item.label}</span>
                  </button>
              );
            })}
          </div>
        </div>
      </nav>
  );
};

export default BottomNavigation;