import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';


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
import TestsPage from './components/TestPage';
import QuestionCreator from './components/create/QuestionCreator';
import { StoriesViewer } from './components/stories/StoriesViewer';
import ProfilePage from './components/ProfilePage';
import QuestionPage from './components/QuestionPgaes';
import EmailVerificationPage from './components/auth/EmailVerificationPgae';
import CompleteProfilePage from './components/auth/CompleteProfilePgae';
import { OtherUserProfilePage } from './components/OtherProfile/OtherUserProfilePage'
import LogoutPage from './components/auth/LogOutPage';
import TestDetailPage from './components/TestDetailPages';
import QuizTakingPage from './components/QuizTalkingPages';

// interface ProfilePageProps {
//   onShowSettings: () => void;
// }

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



  return (
    <div className="min-h-screen bg-theme-secondary transition-theme-normal">
      {/* Pages */}
      {currentPage === 'home' && <HomePage theme={theme} toggleTheme={toggleTheme} />}
      {currentPage === 'search' && <SearchPage theme={theme} />}
      {currentPage === 'quiz' && <QuizPage theme={theme} />}
      {currentPage === 'create' && <CreatePage onNavigate={handlePageChange} />}
      {currentPage === 'map' && <MapPage theme={theme} />}
      {currentPage === 'profile' && <ProfilePage onShowSettings={() => setShowSettings(true)} />}
      {/* {currentPage === 'logout' && } */}

      {/* Bottom Navigation */}
      <BottomNavigation currentPage={currentPage} onPageChange={handlePageChange} />

      {/* Modals */}


      {showTestCreator && (
        <TestCreator theme={theme} onClose={() => setShowTestCreator(false)} />
      )}

      {showQuestionCreator && (
        <QuestionCreator theme={theme} onClose={() => setShowQuestionCreator(false)} />
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };
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
      <Route path="/profile/:username" element={<OtherUserProfilePage />} />
      <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/tests" element={<ProtectedRoute><TestsPage theme={theme} /></ProtectedRoute>} />
      <Route path="/tests/:testId" element={<TestDetailPage theme={theme} />} />
      <Route path="/questions/:id" element={<QuestionPage />} />
      <Route path="/quiz" element={<QuizTakingPage theme={theme} />} />{" "}
      <Route path="/logout" element={<LogoutPage  />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel theme="light" /></ProtectedRoute>} />
      <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
    </Routes>
  );
};

export default App;
