import React from 'react';
import { Home, Search, Plus, User, Store } from 'lucide-react';

const LogoImage: React.FC = () => (
  <img src="/logo.jpg" alt="T" className="w-8 h-8 rounded-full" />
);

interface BottomNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'quiz', label: currentPage === 'quiz' || currentPage === 'create' ? 'Create' : 'Quiz', 
      icon: currentPage === 'quiz' || currentPage === 'create' ? Plus : LogoImage, 
      isSpecial: true },
    { id: 'map', label: 'Store', icon: Store },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-theme-primary border-t border-theme-primary z-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-around items-center py-0.8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            if (item.isSpecial) {
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className="relative p-3"
                >
                  <div className={`w-14 h-14 flex items-center rounded-full justify-center shadow-lg ${
                    currentPage === 'quiz' || currentPage === 'create' 
                      ? 'bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full' 
                      : 'bg-transparent'
                  }`}>
                    <Icon size={24} className="text-white" />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex flex-col items-center py-2 px-3 transition-theme-normal ${
                  isActive 
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