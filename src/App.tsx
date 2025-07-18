import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Edit, Crown, Target, DollarSign, Globe, LogOut, X
} from 'lucide-react';

import { useAuth } from './contexts/AuthContext';

import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import CreatePage from './components/CreatePage';
import MapPage from './components/MapPage';
import QuizPage from './components/QuizPage';
import BottomNavigation from './components/BottomNavigation';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import AdminPanel from './components/admin/AdminPanel';
import TestCreator from './components/create/TestCreator';
import QuestionCreator from './components/create/QuestionCreator';
import StoriesViewer from './components/stories/StoriesViewer';
import ProfilePage from './components/ProfilePage';
import QuestionPage from './components/QuestionPgaes';
import EmailVerificationPage from './components/auth/EmailVerificationPgae';
import CompleteProfilePage from './components/auth/CompleteProfilePgae';
import {UserProfilePage} from './components/OtherProfile/OtherUserProfilePage'

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  // ✅ Tema holatini localStorage orqali boshqarish
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  const [currentPage, setCurrentPage] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showTestCreator, setShowTestCreator] = useState(false);
  const [showQuestionCreator, setShowQuestionCreator] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handlePageChange = (page: string) => {
    if (currentPage === 'quiz' && page === 'quiz') {
      setCurrentPage('create');
    } else if (currentPage === 'create' && page === 'quiz') {
      setCurrentPage('quiz');
    } else {
      setCurrentPage(page);
    }
  };

  const mockStories = [
    {
      id: 1,
      user: {
        username: 'alex_dev',
        profile_image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150'
      },
      type: 'test' as const,
      content: {
        title: 'Advanced React Patterns',
        description: 'Learn advanced React patterns and best practices',
        category: 'Programming',
        questions_count: 15
      },
      created_at: '2024-01-20T10:00:00Z'
    }
  ];

  return (
    <div className="min-h-screen bg-theme-secondary transition-theme-normal">
      {/* Pages */}
      {currentPage === 'home' && <HomePage theme={theme} toggleTheme={toggleTheme} />}
      {currentPage === 'search' && <SearchPage theme={theme} />}
      {currentPage === 'quiz' && <QuizPage theme={theme} />}
      {currentPage === 'create' && <CreatePage onNavigate={handlePageChange} />}
      {currentPage === 'map' && <MapPage theme={theme} />}
      {currentPage === 'profile' && <ProfilePage onShowSettings={() => setShowSettings(true)} />}

      {/* Bottom Navigation */}
      <BottomNavigation currentPage={currentPage} onPageChange={handlePageChange} />

      {/* Modals */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex border-b border-theme-primary">
              <div className="w-1/4 bg-theme-secondary p-6 space-y-2">
                {[
                  { id: 'profile', label: 'Edit profile', icon: Edit },
                  { id: 'premium', label: 'Premium', icon: Crown },
                  { id: 'ads', label: 'Advertisement', icon: Target },
                  { id: 'monetization', label: 'Monetization', icon: DollarSign },
                  { id: 'preferences', label: 'Language', icon: Globe },
                  { id: 'logout', label: 'Logout', icon: LogOut }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-theme-normal ${activeTab === item.id
                        ? 'bg-accent-primary text-white'
                        : 'text-theme-secondary hover:bg-theme-tertiary'
                      }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-theme-primary">Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
                  >
                    <X size={24} className="text-theme-secondary" />
                  </button>
                </div>
                {/* Tab contents here */}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTestCreator && (
        <TestCreator theme={theme} onClose={() => setShowTestCreator(false)} />
      )}

      {showQuestionCreator && (
        <QuestionCreator theme={theme} onClose={() => setShowQuestionCreator(false)} />
      )}

      {showStories && (
        <StoriesViewer
          stories={mockStories}
          initialIndex={selectedStoryIndex}
          onClose={() => setShowStories(false)}
          theme={theme}
        />
      )}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />}
      />
      <Route path="/profile/:username" element={<UserProfilePage />} />
      <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/questions/:id" element={<QuestionPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel theme="light" /></ProtectedRoute>} />
      <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
    </Routes>
  );
};

export default App;
