import React, {Suspense} from 'react';
import {Routes, Route, Navigate, useLocation} from 'react-router-dom';
import {useAuth} from './contexts/AuthContext';
import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import QuizPage from './components/QuizPage/QuizPage.tsx';
import BottomNavigation from './components/components/BottomNavigation.tsx';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import AdminPanel from './components/admin/AdminPanel';
import TestsPage from './components/TestPage';
import QuestionCreator from './components/create/QuestionCreator';
import RealTimeQuizPage from './pages/RealTimeQuizPage';
import ProfilePage from './components/my-profile/ProfilePage.tsx';
import QuestionPage from './components/QuizPage/QuestionPgaes.tsx';
import EmailVerificationPage from './components/auth/EmailVerificationPgae';
import {OtherUserProfilePage} from './components/OtherProfile/OtherUserProfilePage';
import LogoutPage from './components/auth/LogOutPage';
import TestDetailPage from './components/TestDetailPages';
import QuizTakingPage from './components/QuizPage/QuizTalkingPages.tsx';
import CreateLiveQuiz from './components/live_quiz/live_quiz.tsx';
import ChatApp from "./pages/ChatApp";
import NotFound from "./pages/not-found";
import CreateNewBlock from "./components/create/CreatePage.tsx";
import { AIReader } from './components/CardsMarket';
import Leaderboard from "./components/LeaderBoard";
import SettingsPage from "./components/my-profile/SettingsPage.tsx";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {isAuthenticated, loading} = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-secondary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {isAuthenticated, loading} = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-secondary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        const from = location.state?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen bg-theme-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
    </div>
);

const App: React.FC = () => {
    const {loading: authLoading} = useAuth();

    if (authLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                } />

                <Route path="/register" element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                } />

                <Route path="/forgot-password" element={
                    <PublicRoute>
                        <ForgotPasswordPage />
                    </PublicRoute>
                } />

                <Route path="/verify-email/:token" element={
                    <PublicRoute>
                        <EmailVerificationPage />
                    </PublicRoute>
                } />

                <Route path="/logout" element={<LogoutPage />} />

                {/* Main protected routes with BottomNavigation */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <div className="min-h-screen bg-theme-secondary transition-theme-normal pb-20">
                            <HomePage />
                            <div className="fixed bottom-0 left-0 right-0 z-[9999]">
                                <BottomNavigation />
                            </div>
                        </div>
                    </ProtectedRoute>
                } />

                <Route path="/search" element={
                    <ProtectedRoute>
                        <div className="min-h-screen bg-theme-secondary transition-theme-normal pb-20">
                            <SearchPage />
                            <div className="fixed bottom-0 left-0 right-0 z-[9999]">
                                <BottomNavigation />
                            </div>
                        </div>
                    </ProtectedRoute>
                } />

                <Route path="/quiz" element={
                    <ProtectedRoute>
                        <div className="min-h-screen bg-theme-secondary transition-theme-normal pb-20">
                            <QuizPage />
                            <div className="fixed bottom-0 left-0 right-0 z-[9999]">
                                <BottomNavigation />
                            </div>
                        </div>
                    </ProtectedRoute>
                } />

                <Route path="/create" element={
                    <ProtectedRoute>
                        <div className="min-h-screen bg-theme-secondary transition-theme-normal pb-20">
                            <QuestionCreator />
                            <div className="fixed bottom-0 left-0 right-0 z-[9999]">
                                <BottomNavigation />
                            </div>
                        </div>
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <div className="min-h-screen bg-theme-secondary transition-theme-normal pb-20">
                            <ProfilePage />
                            <div className="fixed bottom-0 left-0 right-0 z-[9999]">
                                <BottomNavigation />
                            </div>
                        </div>
                    </ProtectedRoute>
                } />

                {/* Other protected routes without BottomNavigation */}
                <Route path="/profile/:username" element={
                    <ProtectedRoute>
                        <OtherUserProfilePage />
                    </ProtectedRoute>
                } />

                <Route path="/tests" element={
                    <ProtectedRoute>
                        <TestsPage />
                    </ProtectedRoute>
                } />

                <Route path="/tests/:testId" element={
                    <ProtectedRoute>
                        <TestDetailPage />
                    </ProtectedRoute>
                } />

                <Route path="/questions/:id" element={
                    <ProtectedRoute>
                        <QuestionPage />
                    </ProtectedRoute>
                } />

                <Route path="/quiz-taking" element={
                    <ProtectedRoute>
                        <QuizTakingPage />
                    </ProtectedRoute>
                } />

                <Route path="/create-live-quiz" element={
                    <ProtectedRoute>
                        <CreateLiveQuiz />
                    </ProtectedRoute>
                } />

                <Route path="/live-quiz/:quiz_id" element={
                    <ProtectedRoute>
                        <RealTimeQuizPage quiz_id={0} />
                    </ProtectedRoute>
                } />

                <Route path="/admin" element={
                    <ProtectedRoute>
                        <AdminPanel />
                    </ProtectedRoute>
                } />

                <Route path="/chat" element={
                    <ProtectedRoute>
                        <ChatApp />
                    </ProtectedRoute>
                } />

                <Route path="/chat-private" element={
                    <ProtectedRoute>
                        <ChatApp />
                    </ProtectedRoute>
                } />

                <Route path="/chat/:roomId" element={
                    <ProtectedRoute>
                        <ChatApp />
                    </ProtectedRoute>
                } />

                <Route path="/create/new-block" element={
                    <ProtectedRoute>
                        <CreateNewBlock />
                    </ProtectedRoute>
                } />

                <Route path="/reader" element={
                    <ProtectedRoute>
                        <AIReader />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/leader-board" element={
                    <ProtectedRoute>
                        <Leaderboard />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/create/test" element={
                    <ProtectedRoute>
                        <CreateNewBlock />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/" element={
                    <ProtectedRoute>
                        <HomePage />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/search" element={
                    <ProtectedRoute>
                        <SearchPage />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/quiz" element={
                    <ProtectedRoute>
                        <QuizPage />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/create" element={
                    <ProtectedRoute>
                        <QuestionCreator />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/reader" element={
                    <ProtectedRoute>
                        <AIReader />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <ProfilePage />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                <Route path="/settings" element={
                    <ProtectedRoute>
                        <SettingsPage />
                        <BottomNavigation />
                    </ProtectedRoute>
                } />

                {/* 404 page */}
                <Route path="*" element={
                    <ProtectedRoute>
                        <NotFound />
                    </ProtectedRoute>
                } />
            </Routes>
        </Suspense>
    );
};

export default App;