import React, {useState, useEffect} from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import {useAuth} from './contexts/AuthContext';

import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import QuizPage from './components/QuizPage';
import BottomNavigation from './components/BottomNavigation';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import AdminPanel from './components/admin/AdminPanel';
import TestCreator from './components/create/TestCreator';
import TestsPage from './components/TestPage';
import QuestionCreator from './components/create/QuestionCreator';
import RealTimeQuizPage from './pages/RealTimeQuizPage';
import ProfilePage from './components/ProfilePage';
import QuestionPage from './components/QuestionPgaes';
import EmailVerificationPage from './components/auth/EmailVerificationPgae';
import {OtherUserProfilePage} from './components/OtherProfile/OtherUserProfilePage'
import LogoutPage from './components/auth/LogOutPage';
import TestDetailPage from './components/TestDetailPages';
import QuizTakingPage from './components/QuizTalkingPages';
import CreateLiveQuiz from './components/live_quiz';
import ChatApp from "./pages/ChatApp";
import NotFound from "./pages/not-found";
import CreateNewBlock from "./components/CreatePage.tsx";
import CardsMarket from "./components/CardsMarket.tsx";
import Leaderboard from "./components/LeaderBoard.tsx";

const AppContent: React.FC = () => {
    const [theme, setTheme] = useState<'dark'>(() => localStorage.getItem('theme') === 'dark' ? 'dark' : 'dark');
    const [currentPage, setCurrentPage] = useState<'home' | 'search' | 'quiz' | 'create' | 'new-block' | 'map' | 'profile'>('home');
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [showTestCreator, setShowTestCreator] = useState(false);
    const [showQuestionCreator, setShowQuestionCreator] = useState(false);
    const [showStories, setShowStories] = useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [showNewBlock, setShowNewBlock] = useState(false);
    const [loading, setLoading] = useState(false);

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
        setTheme(theme === 'dark');
    };

    const handlePageChange = (page: string) => {
        // Quiz <-> Create toggle
        if (currentPage === "quiz" && page === "quiz") {
            setCurrentPage("create");
            setShowNewBlock(false);
        } else if (currentPage === "create" && page === "quiz") {
            setCurrentPage("quiz");
            setShowNewBlock(false);
        }
        // Create -> New Block
        else if (currentPage === "create" && page === "new-block") {
            setCurrentPage("create"); // currentPage hali create bo‘lib qoladi
            setShowNewBlock(true);    // new-block sahifa ko‘rsatiladi
        }
        // Other pages
        else {
            setCurrentPage(page as any);
            setShowNewBlock(false);
        }
    };

    return (
        <div className="min-h-screen bg-theme-secondary transition-theme-normal pb-20">
            {/* Pages */}
            {currentPage === 'home' && <HomePage theme={theme} toggleTheme={toggleTheme} />}
            {currentPage === 'search' && <SearchPage theme={theme} />}
            {currentPage === 'quiz' && <QuizPage theme={theme} quizzes={[]} />}
            {currentPage === 'create' && !showNewBlock && (
                <QuestionCreator
                    onNavigate={handlePageChange}
                    theme={theme}
                    onClose={() => setCurrentPage('home')}
                />
            )}

            {/* NEW-BLOCK PAGE */}
            {(currentPage === 'new-block' || (currentPage === 'create' && showNewBlock)) && (
                <CreateNewBlock
                    theme={theme}
                    currentPage="new-block" // 🔹 currentPage aniq "new-block" qilib uzatish
                    onPageChange={handlePageChange} // 🔹 parent handler
                />
            )}


            {currentPage === 'map' && <CardsMarket theme={theme} />}
            {currentPage === 'profile' && <ProfilePage onShowSettings={() => setShowSettings(true)} />}

            {/* BottomNavigation – har doim fixed va ishlaydigan */}
            <div className="fixed bottom-0 left-0 right-0 z-[9999]">
                <BottomNavigation currentPage={currentPage} onPageChange={handlePageChange} />
            </div>

            {/* Modals */}
            {showTestCreator && <TestCreator theme={theme} onClose={() => setShowTestCreator(false)} />}
            {showQuestionCreator && <QuestionCreator theme={theme} onClose={() => setShowQuestionCreator(false)} />}
        </div>
    );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {isAuthenticated, loading} = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-secondary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace/>;
};

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const stored = localStorage.getItem('theme');
        return stored === 'dark' ? 'dark' : 'light';
    });

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };
    const {isAuthenticated} = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={!isAuthenticated ? <LoginPage/> : <Navigate to="/" replace/>}
            />
            <Route
                path="/register"
                element={!isAuthenticated ? <RegisterPage/> : <Navigate to="/" replace/>}
            />
            <Route path="/profile/:username" element={<OtherUserProfilePage/>}/>
            <Route path="/verify-email/:token" element={<EmailVerificationPage/>}/>
            <Route path="/tests" element={<ProtectedRoute><TestsPage theme={theme}/></ProtectedRoute>}/>
            <Route path="/tests/:testId" element={<TestDetailPage theme={theme}/>}/>
            <Route path="/questions/:id" element={<QuestionPage theme={theme}/>}/>
            <Route path="/quiz" element={<QuizTakingPage theme={theme}/>}/>
            <Route path="/create-live-quiz" element={<CreateLiveQuiz theme={theme} toggleTheme={toggleTheme}/>}/>
            <Route path="/live-quiz/:quiz_id" element={<RealTimeQuizPage quiz_id={0}/>}/>
            <Route path="/logout" element={<LogoutPage/>}/>
            <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
            <Route path="/admin" element={<ProtectedRoute><AdminPanel theme="light"/></ProtectedRoute>}/>
            <Route path="/chat" element={<ChatApp/>}/>
            <Route path="/chat-private" element={<ChatApp/>}/>
            <Route path="/chat/:roomId" element={<ChatApp/>}/>
            <Route path="/*" element={<ProtectedRoute><AppContent/></ProtectedRoute>}/>
            <Route path="*" element={<NotFound/>}/>
            <Route path="/create/new-block" element={<CreateNewBlock />} />
            <Route path="/leader-board" element={<Leaderboard />} />
        </Routes>
    );
};

export default App;
