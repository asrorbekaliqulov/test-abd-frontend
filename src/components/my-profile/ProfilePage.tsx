"use client"

import type React from "react"
import {useState, useEffect, ChangeEvent} from "react"
import {
    Settings,
    Shield,
    Crown,
    UserPlus,
    UserMinus,
    BookOpen,
    BarChart3,
    Edit,
    Play,
    ExternalLink,
    Sparkles,
    Zap,
    Bot,
    X,
    FileText,
    HelpCircle,
    Users,
    Gift,
    TrendingUp,
    Trash2,
    Eye,
    Clock,
    Search,
    RefreshCw,
    Bookmark,
    Star,
Plus, Library
} from "lucide-react"
import {quizAPI, authAPI, accountsAPI} from "../../utils/api.ts"
import correctImg from "../assets/images/correct.png";
import wrongImg from "../assets/images/wrong.png";
import accuracyImg from "../assets/images/accuracy.png";
import coinImg from "../assets/images/coin.png";
import {useNavigate} from "react-router-dom";

// Types
export interface UserType {
    id: number
    username: string
    profile_image: string | null
    is_following?: boolean
}

interface UserData {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
    profile_image: string
    bio: string
    phone_number: string
    level: string
    is_premium: boolean
    is_badged: boolean
    coins: number
    correct_count: number
    wrong_count: number
    country: number | null
    region: number | null
    district: number | null
    settlement: number | null
}

export interface UserFollowData {
    followers: UserType[]
    following: UserType[]
}

interface MyTests {
    id: number
    title: string
    description: string
    total_questions: number
    completions: number
    rating: number
    status: "published" | "draft"
    visibility: "public" | "unlisted" | "draft"
    created_at: string
    updated_at: string
    category: {
        id: number
        title: string
        emoji: string
    } | null
}

export interface RecentQuestion {
    id: number
    question: string
    test_title: string
    type: string
    difficulty: string
    category: {
        id: number
        title: string
        emoji: string
    } | null
    answers: number
    correctRate: number
    created_at: string
    updated_at: string
    is_active: boolean
}

interface SavedTest {
    id: number
    test_detail: {
        id: number
        title: string
        description: string
        total_questions: number
        difficulty_percentage: number
        category: {
            id: number
            title: string
            emoji: string
        } | null
    }
    user: {
        username: string
        profile_image: string | null
    }
    created_at: string
}

interface SavedQuestion {
    id: number;
    question_detail: {
        id: number;
        question_text: string;
        question_type: string;
        difficulty_percentage: number;
        created_at: string;
        test_title: string;
        category: {
            id: number;
            title: string;
            emoji: string;
        } | null;
        user: {
            username: string;
            profile_image: string | null;
        };
    };
    user: {
        username: string;
        profile_image: string | null;
    };
    created_at: string;
}

// Toast Component
const Toast = ({message, type, onClose}: { message: string; type: "success" | "error"; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            } animate-slide-in`}
        >
            <div className="flex items-center justify-between">
                <span>{message}</span>
                <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
                    <X size={16}/>
                </button>
            </div>
        </div>
    )
}

interface ProfilePageProps {
    onShowSettings?: () => void
}

const ProfilePage = ({onShowSettings}: ProfilePageProps) => {
    const [mestats, setMestats] = useState<UserData | null>(null)
    const [myTests, setMyTests] = useState<MyTests[]>([])
    const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([])
    const [savedTests, setSavedTests] = useState<SavedTest[]>([])
    const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([])
    const [follow, setFollow] = useState<UserFollowData | null>(null)
    const [showFollowers, setShowFollowers] = useState(false)
    const [showFollowing, setShowFollowing] = useState(false)
    const [loadingFollowData, setLoadingFollowData] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTabs, setActiveTabs] = useState("test")
    const [imageUploading, setImageUploading] = useState(false)
    const [selectedTest, setSelectedTest] = useState<MyTests | null>(null)
    const [selectedQuestion, setSelectedQuestion] = useState<RecentQuestion | null>(null)
    const [editingTest, setEditingTest] = useState<MyTests | null>(null)
    const [editingQuestion, setEditingQuestion] = useState<RecentQuestion | null>(null)
    const [showTestAnalytics, setShowTestAnalytics] = useState(false)
    const [showQuestionAnalytics, setShowQuestionAnalytics] = useState(false)
    const [showTestEditModal, setShowTestEditModal] = useState(false)
    const [showQuestionEditModal, setShowQuestionEditModal] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

    // New states for Saved section
    const [savedSectionTab, setSavedSectionTab] = useState("tests");
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSavedItems, setSelectedSavedItems] = useState<number[]>([]);
    const [deletingItem, setDeletingItem] = useState<number | null>(null);
    const [showReferralModal, setShowReferralModal] = useState(false);

    // Edit states
    const [editingTestData, setEditingTestData] = useState<Partial<MyTests> | null>(null);
    const [editingQuestionData, setEditingQuestionData] = useState<Partial<RecentQuestion> | null>(null);
    const [updatingTest, setUpdatingTest] = useState(false);
    const [updatingQuestion, setUpdatingQuestion] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [overallStats, setOverallStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);

    const navigate = useNavigate();

    const showToast = (message: string, type: "success" | "error") => {
        setToast({message, type})
    }
    const fetchLibraryData = async () => {
    setLoadingLibrary(true);
    try {
        const token = localStorage.getItem('access_token'); // Yoki sizda token qayerda saqlansa
        const response = await fetch('https://backend.testabd.uz/books/library-stat/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        // API-dan kelgan ma'lumotlarni state-ga saqlaymiz
        setOverallStats(data.overall);
        setRecentActivity(data.recent_activity);
    } catch (error) {
        console.error("Kutubxona ma'lumotlarini yuklashda xato:", error);
    } finally {
        setLoadingLibrary(false);
    }

    };
    useEffect(() => {
        if (activeTabs === "library") {
            fetchLibraryData();
        }
    }, [activeTabs]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authAPI.getMe()
                console.log("Profile data:", res.data)
                setMestats(res.data)
            } catch (err) {
                console.error("Profil ma'lumotlarini olishda xatolik:", err)
                showToast("Profil ma'lumotlarini olishda xatolik yuz berdi", "error")
            }
        }
        fetchProfile()
    }, [])

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await quizAPI.fetchMyTest()
                setMyTests(res.data)
            } catch (err) {
                console.error("MyTests olishda xatolik:", err)
                showToast("Testlarni yuklashda xatolik", "error")
            }
        }
        fetchTests()
    }, [])

    const fetchSavedContent = async () => {
        try {
            setLoadingSaved(true);
            const [testsRes, questionsRes] = await Promise.all([
                quizAPI.getBookmarksTest(),
                quizAPI.getBookmarks()
            ]);

            setSavedTests(testsRes.data.results || []);
            setSavedQuestions(questionsRes.data.results || []);
            setSelectedSavedItems([]);
        } catch (err) {
            console.error("Saqlangan kontentni olishda xatolik:", err);
            showToast("Saqlanganlarni yuklashda xatolik", "error");
        } finally {
            setLoadingSaved(false);
        }
    };

    useEffect(() => {
        fetchSavedContent();
    }, [])

    const fetchFollowData = async () => {
        if (mestats?.id) {
            setLoadingFollowData(true)
            try {
                const res = await accountsAPI.getUserFollowData(mestats.id)
                setFollow({
                    followers: res.data.followers,
                    following: res.data.following,
                })
            } catch (error) {
                console.error("Follow data olishda xatolik:", error)
                showToast("Kuzatuvchilar ma'lumotlarini yuklashda xatolik", "error")
            } finally {
                setLoadingFollowData(false)
            }
        }
    }

    useEffect(() => {
        fetchFollowData()
    }, [mestats?.id])

    const handleFollow = async (userId: number) => {
        try {
            await accountsAPI.toggleFollow(userId)
            await fetchFollowData()
            showToast("Muvaffaqiyatli amalga oshirildi", "success")
        } catch (error) {
            console.error("Follow toggle xatolik:", error)
            showToast("Amalni bajarishda xatolik", "error")
        }
    }

    useEffect(() => {
        const fetchRecentQuestions = async () => {
            try {
                setLoadingQuestions(true);
                // quiz/recent API endpointidan savollarni olish
                const res = await quizAPI.fetchRecentQuestions();
                console.log("Recent questions API response:", res);

                // Agar API javobi results ichida bo'lsa
                const questions = res.data.results || res.data || [];

                // Ma'lumotlarni RecentQuestion formatiga o'tkazish
                const formattedQuestions: RecentQuestion[] = await Promise.all(
                    questions.map(async (question: any) => {
                        let category = null;

                        // Savolning kategoriyasini olish
                        if (question.category) {
                            category = {
                                id: question.category.id,
                                title: question.category.title,
                                emoji: question.category.emoji || "📝"
                            };
                        } else if (question.test) {
                            // Test orqali kategoriyani olish
                            try {
                                const testRes = await quizAPI.fetchTestById(question.test);
                                category = testRes.data.category;
                            } catch (error) {
                                console.error("Category fetch error:", error);
                            }
                        }

                        // Qiyinlik darajasini aniqlash
                        let difficulty = "O'rtacha";
                        if (question.difficulty_percentage !== undefined) {
                            if (question.difficulty_percentage < 33) {
                                difficulty = "Oson";
                            } else if (question.difficulty_percentage < 66) {
                                difficulty = "O'rtacha";
                            } else {
                                difficulty = "Qiyin";
                            }
                        }

                        // To'g'ri javob foizini hisoblash
                        let correctRate = 0;
                        if (question.correct_count !== undefined && question.wrong_count !== undefined) {
                            const total = question.correct_count + question.wrong_count;
                            if (total > 0) {
                                correctRate = Math.round((question.correct_count / total) * 100);
                            }
                        }

                        return {
                            id: question.id,
                            question: question.question_text || question.question || "Savol matni yo'q",
                            test_title: question.test_title || "Test",
                            type: question.question_type || "single",
                            difficulty: difficulty,
                            category: category,
                            answers: question.answers?.length || question.answer_options?.length || 0,
                            correctRate: correctRate,
                            created_at: question.created_at || new Date().toISOString(),
                            updated_at: question.updated_at || question.created_at || new Date().toISOString(),
                            is_active: question.is_active !== false
                        };
                    })
                );

                console.log("Formatted questions:", formattedQuestions);
                setRecentQuestions(formattedQuestions);
            } catch (error) {
                console.error("Recent questions olishda xatolik:", error);
                showToast("Savollarni yuklashda xatolik", "error");
            } finally {
                setLoadingQuestions(false);
            }
        };

        fetchRecentQuestions();
    }, []);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("uz-UZ", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Tashkent",
            }).format(date);
        } catch (error) {
            return dateString;
        }
    };

    const getLevelBadge = (level: string) => {
        const badges = {
            beginner: {icon: "🔰", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"},
            intermediate: {icon: "⭐", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"},
            advanced: {icon: "🏆", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"},
            expert: {icon: "👑", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"},
        }
        return badges[level as keyof typeof badges] || badges.beginner
    }

    // Profil rasmini yangilash funksiyasi
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            showToast("Faqat rasm fayllari ruxsat etilgan", "error")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("Rasm hajmi 5MB dan kichik bo'lishi kerak", "error")
            return
        }

        setImageUploading(true)
        try {
            const formData = new FormData()
            formData.append("profile_image", file)

            const response = await authAPI.updateProfileImage(formData)

            if (response.success && response.data) {
                const updatedUser = { ...mestats, profile_image: response.data.profile_image }
                setMestats(updatedUser as UserData)

                if (response.data.user) {
                    setMestats(response.data.user as UserData)
                    localStorage.setItem('user', JSON.stringify(response.data.user))
                }

                showToast("Profil rasmi muvaffaqiyatli yangilandi!", "success")
            } else {
                throw new Error(response.error || "Rasm yuklashda xatolik")
            }
        } catch (error) {
            console.error("Image upload error:", error)
            showToast("Rasm yuklashda xatolik yuz berdi", "error")
        } finally {
            setImageUploading(false)
            event.target.value = ""
        }
    }

    const handleSaveProfile = async () => {
        if (!mestats) return
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("first_name", mestats.first_name)
            formData.append("last_name", mestats.last_name)
            formData.append("username", mestats.username)
            formData.append("bio", mestats.bio)
            formData.append("email", mestats.email)
            formData.append("phone_number", mestats.phone_number)
            await authAPI.updateProfile(formData)
            showToast("Profil muvaffaqiyatli saqlandi!", "success")
        } catch (error) {
            console.error("Profile update error:", error)
            showToast("Profilni saqlashda xatolik yuz berdi", "error")
        }
        setIsLoading(false)
    }

    const getTelegramBotUrl = () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        return `https://t.me/TestAbdUzBot?start=access_token=${accessToken}&refresh_token=${refreshToken}`;
    };

    const accuracy =
        mestats && mestats.correct_count + mestats.wrong_count > 0
            ? ((mestats.correct_count / (mestats.correct_count + mestats.wrong_count)) * 100).toFixed(2)
            : "0.00"

    // Tahrirlash funksiyalari
    const handleStartTestEdit = (test: MyTests) => {
        setEditingTest(test);
        setEditingTestData({...test});
        setShowTestEditModal(true);
    };

    const handleStartQuestionEdit = (question: RecentQuestion) => {
        setEditingQuestion(question);
        setEditingQuestionData({...question});
        setShowQuestionEditModal(true);
    };

    const handleShowTestAnalytics = (test: MyTests) => {
        setSelectedTest(test);
        setShowTestAnalytics(true);
    };

    const handleShowQuestionAnalytics = (question: RecentQuestion) => {
        setSelectedQuestion(question);
        setShowQuestionAnalytics(true);
    };

    // Testni yangilash
    const handleUpdateTest = async () => {
        if (!editingTest || !editingTestData) return;

        setUpdatingTest(true);
        try {
            // API orqali yangilash
            const updateData = {
                title: editingTestData.title,
                description: editingTestData.description,
                status: editingTestData.status,
                visibility: editingTestData.visibility
            };

            // API chaqiruvi (agar mavjud bo'lsa)
            // await quizAPI.updateTest(editingTest.id, updateData);

            // UI ni yangilash
            setMyTests(prev => prev.map(test =>
                test.id === editingTest.id
                    ? {...test, ...editingTestData}
                    : test
            ));

            showToast("Test muvaffaqiyatli yangilandi!", "success");
            setShowTestEditModal(false);
            setEditingTest(null);
            setEditingTestData(null);
        } catch (error) {
            console.error("Testni yangilashda xatolik:", error);
            showToast("Testni yangilashda xatolik", "error");
        } finally {
            setUpdatingTest(false);
        }
    };

    // Savolni yangilash
    const handleUpdateQuestion = async () => {
        if (!editingQuestion || !editingQuestionData) return;

        setUpdatingQuestion(true);
        try {
            // API orqali yangilash
            const updateData = {
                question: editingQuestionData.question,
                difficulty: editingQuestionData.difficulty,
                type: editingQuestionData.type
            };

            // API chaqiruvi (agar mavjud bo'lsa)
            // await quizAPI.updateQuestion(editingQuestion.id, updateData);

            // UI ni yangilash
            setRecentQuestions(prev => prev.map(question =>
                question.id === editingQuestion.id
                    ? {...question, ...editingQuestionData}
                    : question
            ));

            showToast("Savol muvaffaqiyatli yangilandi!", "success");
            setShowQuestionEditModal(false);
            setEditingQuestion(null);
            setEditingQuestionData(null);
        } catch (error) {
            console.error("Savolni yangilashda xatolik:", error);
            showToast("Savolni yangilashda xatolik", "error");
        } finally {
            setUpdatingQuestion(false);
        }
    };

    const handleTestDataChange = (field: keyof MyTests, value: string) => {
        setEditingTestData(prev => prev ? {...prev, [field]: value} : null);
    };

    const handleQuestionDataChange = (field: keyof RecentQuestion, value: string) => {
        setEditingQuestionData(prev => prev ? {...prev, [field]: value} : null);
    };

    // Saved Items Functions
    const handleDeleteSavedTest = async (testId: number) => {
        if (!window.confirm("Bu testni saqlanganlardan o'chirishni istaysizmi?")) return;

        setDeletingItem(testId);
        try {
            await quizAPI.deleteBookmarkTest(testId);
            setSavedTests(prev => prev.filter(test => test.id !== testId));
            setSelectedSavedItems(prev => prev.filter(id => id !== testId));
            showToast("Test saqlanganlardan o'chirildi", "success");
        } catch (error) {
            console.error("Testni o'chirishda xatolik:", error);
            showToast("Testni o'chirishda xatolik", "error");
        } finally {
            setDeletingItem(null);
        }
    };

    const handleDeleteSavedQuestion = async (questionId: number) => {
        if (!window.confirm("Bu savolni saqlanganlardan o'chirishni istaysizmi?")) return;

        setDeletingItem(questionId);
        try {
            await quizAPI.deleteBookmarkQuestion(questionId);
            setSavedQuestions(prev => prev.filter(question => question.id !== questionId));
            setSelectedSavedItems(prev => prev.filter(id => id !== questionId));
            showToast("Savol saqlanganlardan o'chirildi", "success");
        } catch (error) {
            console.error("Savolni o'chirishda xatolik:", error);
            showToast("Savolni o'chirishda xatolik", "error");
        } finally {
            setDeletingItem(null);
        }
    };

    const handleDeleteSelectedItems = () => {
        if (selectedSavedItems.length === 0) return;

        if (!window.confirm(`${selectedSavedItems.length} ta elementni o'chirishni istaysizmi?`)) return;

        if (savedSectionTab === "tests") {
            selectedSavedItems.forEach(id => {
                handleDeleteSavedTest(id);
            });
        } else {
            selectedSavedItems.forEach(id => {
                handleDeleteSavedQuestion(id);
            });
        }
        setSelectedSavedItems([]);
    };

    const toggleSelectItem = (id: number) => {
        setSelectedSavedItems(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const items = savedSectionTab === "tests"
            ? savedTests.map(t => t.id)
            : savedQuestions.map(q => q.id);

        if (selectedSavedItems.length === items.length) {
            setSelectedSavedItems([]);
        } else {
            setSelectedSavedItems(items);
        }
    };

    const viewTestDetails = (testId: number) => {
        window.location.href = `/test/${testId}`;
    };

    const viewQuestionDetails = (questionId: number) => {
        window.location.href = `/question/${questionId}`;
    };

    const filteredSavedTests = savedTests.filter(test =>
        test.test_detail?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.test_detail?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.test_detail?.category?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSavedQuestions = savedQuestions.filter(question =>
        question.question_detail?.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.question_detail?.test_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.question_detail?.category?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Custom UI Components
    const CustomModal = ({
                             isOpen,
                             onClose,
                             title,
                             children,
                             size = "md",
                         }: {
        isOpen: boolean
        onClose: () => void
        title?: string
        children: React.ReactNode
        size?: "sm" | "md" | "lg" | "xl"
    }) => {
        if (!isOpen) return null

        const sizes = {
            sm: "max-w-md",
            md: "max-w-2xl",
            lg: "max-w-4xl",
            xl: "max-w-6xl",
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}/>
                <div
                    className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden`}
                >
                    {title && (
                        <div
                            className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    )}
                    <div className="overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
                </div>
            </div>
        )
    }

    const CustomBadge = ({
                             children,
                             variant = "default",
                             className = "",
                         }: {
        children: React.ReactNode
        variant?: "default" | "secondary" | "success" | "danger" | "warning"
        className?: string
    }) => {
        const variants = {
            default: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
            success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        }

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
            >
                {children}
            </span>
        )
    }

    // Settings sahifasiga o'tish
    const handleGoToSettings = () => {
        window.location.href = '/settings';
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Profile Header Card */}
                <div className="bg-gray-800 rounded-2xl shadow-lg mb-6">
                    <div className="p-4 sm:p-6">
                        {/* Top Bar */}
                        <div className="flex flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className={"flex items-center"}>
                                <p className="text-gray-400 mt-1 text-lg">@{mestats?.username}</p>
                            </div>
                            <div className="flex items-center gap-3 w-auto">
                                <button
                                    onClick={() => setShowReferralModal(true)}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Gift size={18}/>
                                    <span className="hidden sm:inline">Referral</span>
                                </button>
                                <button
                                    onClick={handleGoToSettings}
                                    className="p-2 sm:p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <Settings size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex flex-col justify-center gap-6">
                            <div className="lg:col-span-2">
                                <div className="flex flex-row items-center sm:items-start gap-6">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <img
                                            src={mestats?.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                                            alt="Profile"
                                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-700 object-cover shadow-lg"
                                        />
                                        {mestats?.is_badged && (
                                            <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg">
                                                <Shield size={16}/>
                                            </div>
                                        )}
                                        {mestats?.is_premium && (
                                            <div className="absolute top-2 right-2 bg-yellow-500 text-white p-2 rounded-full shadow-lg">
                                                <Crown size={16}/>
                                            </div>
                                        )}
                                    </div>

                                    {/* User Details */}
                                    <div className="flex-1 text-center sm:text-left">
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div
                                                onClick={() => setShowFollowers(true)}
                                                className="bg-gray-700/50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="text-2xl font-bold text-blue-500">
                                                    {loadingFollowData ? "..." : follow?.followers?.length || 0}
                                                </div>
                                                <div className="text-sm text-gray-400">Followers</div>
                                            </div>
                                            <div
                                                onClick={() => setShowFollowing(true)}
                                                className="bg-gray-700/50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="text-2xl font-bold text-blue-500">
                                                    {loadingFollowData ? "..." : follow?.following?.length || 0}
                                                </div>
                                                <div className="text-sm text-gray-400">Following</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className={"flex flex-row items-center justify-between mt-6"}>
                                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                                            {mestats?.first_name || ""} {mestats?.last_name || ""}
                                        </h2>
                                        <div className={`${getLevelBadge(mestats?.level || "beginner").color} px-2 py-1 rounded-full text-sm`}>
                                            {getLevelBadge(mestats?.level || "beginner").icon} {mestats?.level || "beginner"}
                                        </div>
                                    </div>
                                    {mestats?.bio && (
                                        <p className="text-gray-300 mb-4">{mestats.bio}</p>
                                    )}
                                </div>
                            </div>

                            {/* Coins Card */}
                            <div className="rounded-lg border border-yellow-800 gap-1 bg-[linear-gradient(90deg,rgba(206,178,90,1)_0%,rgba(87,67,4,1)_100%)]">
                                <div className={"rounded-lg p-3 text-center"} style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                                    <div className="flex flex-row items-center justify-start gap-1">
                                        <img src={coinImg} alt="coin" className={"flex md:w-10 md:h-10 w-6 h-6"}/>
                                        <div className="text-md text-gray-200">Test Coins</div>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-500 w-full text-start">
                                        {mestats?.coins || 0}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Accuracy Card */}
                                <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <img src={accuracyImg} alt="accuracy" className="w-8 h-8"/>
                                            <span className="text-gray-300 font-medium">Accuracy</span>
                                        </div>
                                        <span className="text-2xl font-bold text-green-500">{accuracy}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${accuracy}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Correct/Wrong Cards Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-xl p-3 border border-green-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <img src={correctImg} alt="correct" className="w-6 h-6"/>
                                            <span className="text-gray-300 text-sm">To'g'ri</span>
                                        </div>
                                        <div className="text-xl font-bold text-green-500">
                                            {mestats?.correct_count || 0}
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 rounded-xl p-3 border border-red-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <img src={wrongImg} alt="wrong" className="w-6 h-6"/>
                                            <span className="text-gray-300 text-sm">Xato</span>
                                        </div>
                                        <div className="text-xl font-bold text-red-500">
                                            {mestats?.wrong_count || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="mb-6">
                    <div className="flex flex-row border-b border-gray-700 overflow-x-auto">
                        {[
                            {id: "test", label: "Block", icon: FileText},
                            {id: "question", label: "Savollar", icon: HelpCircle},
                            {id: "savedQuestion", label: "Saqlangan", icon: Bookmark},
                            {id: "library", label: "Kutubxona", icon: Library}
                        ].map((tab) => {
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTabs(tab.id)}
                                    className={`flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-3 font-medium transition whitespace-nowrap
                                        ${activeTabs === tab.id
                                        ? "border-b-2 border-blue-500 text-blue-500"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    {tab.id === "savedQuestion" && (
                                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                                            {savedTests.length + savedQuestions.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
                    {/* Test Tab */}
                    {activeTabs === "test" && (
                        <div>
                            <div className="flex flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Mening Testlarim</h3>
                                <button onClick={() => {navigate(`/create/test`)}} className={"flex flex-row items-center px-2 py-1 bg-blue-800 rounded-full md:text-lg text-xs text-white gap-1"}><Plus size={20}/> Test yaratish</button>
                            </div>

                            {myTests.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                                    <h3 className="text-lg font-medium text-white mb-2">Testlar topilmadi</h3>
                                    <p className="text-gray-400 mb-6">Siz hali hech qanday test yaratmagansiz</p>
                                    <button
                                        onClick={() => window.location.href = '/create/new-block'}
                                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Birinchi testni yaratish
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {myTests.map((test) => (
                                        <div key={test.id} className="group relative h-full rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/30 p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-sm overflow-hidden flex flex-col">
                                            {/* Top section */}
                                            <div className="relative flex flex-col gap-3 mb-4 flex-1 min-h-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                                                                test.visibility === "public"
                                                                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                                                    : test.visibility === "unlisted"
                                                                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                                                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                                            } text-xs font-semibold whitespace-nowrap`}>
                                                                {test.visibility === "public" ? "Ommaviy" :
                                                                    test.visibility === "unlisted" ? "Maxfiy" : "Qoralama"}
                                                            </div>

                                                            {test.status === "published" && (
                                                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30 whitespace-nowrap">
                                                                    <Eye size={12} />
                                                                    Faol
                                                                </div>
                                                            )}
                                                        </div>

                                                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors line-clamp-2 leading-tight">
                                                            {test.title}
                                                        </h3>

                                                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed break-words min-h-[40px]">
                                                            {test.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Category badge */}
                                                <div className="flex items-center gap-3 mt-auto">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
                                                        <FileText className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-300 truncate">
                                    {test.category?.title || (
                                        <span className="text-gray-400/80 italic">Kategoriya yo'q</span>
                                    )}
                                </span>
                                                </div>
                                            </div>

                                            {/* Stats section */}
                                            <div className="relative grid grid-cols-3 gap-3 pt-4 border-t border-gray-800/50 mt-4">
                                                <div className="flex flex-col items-center p-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <HelpCircle className="w-4 h-4 text-blue-400" />
                                                        <span className="text-lg font-bold text-white">{test.total_questions || 0}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">Savol</span>
                                                </div>

                                                <div className="flex flex-col items-center p-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Users className="w-4 h-4 text-green-400" />
                                                        <span className="text-lg font-bold text-white">{test.completions || 0}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">Yechgan</span>
                                                </div>

                                                <div className="flex flex-col items-center p-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Star className="w-4 h-4 text-yellow-400" />
                                                        <span className="text-lg font-bold text-white">{test.rating || 0}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">Reyting</span>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="relative mt-4 pt-4 border-t border-gray-800/50">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartTestEdit(test);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <Edit size={14} />
                                                        Tahrirlash
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShowTestAnalytics(test);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <BarChart3 size={14} />
                                                        Analitika
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTabs === "question" && (
                        <div>
                            <div className="flex flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Mening Savollarim</h3>
                                <button onClick={() => {navigate(`/create`)}} className={"flex flex-row items-center px-2 py-1 bg-blue-800 rounded-full md:text-lg text-xs text-white gap-1"}><Plus size={20}/> Savol yaratish</button>
                            </div>

                            {loadingQuestions ? (
                                <div className="flex justify-center items-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                </div>
                            ) : recentQuestions.length === 0 ? (
                                <div className="text-center py-12">
                                    <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                                    <h3 className="text-lg font-medium text-white mb-2">Savollar topilmadi</h3>
                                    <p className="text-gray-400 mb-6">Siz hali hech qanday savol yaratmagansiz</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {recentQuestions.map((question, index) => (
                                        <div key={`q-${question.id}-${index}`}
                                             className="group relative h-full rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/30 p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 backdrop-blur-sm overflow-hidden flex flex-col">
                                            {/* Top section */}
                                            <div className="relative flex flex-col gap-3 mb-4 flex-1 min-h-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                                                                question.difficulty === "Oson"
                                                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                                                    : question.difficulty === "O'rtacha"
                                                                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                                                        : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                                            } text-xs font-semibold whitespace-nowrap`}>
                                                                {question.difficulty}
                                                            </div>

                                                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 whitespace-nowrap">
                                                                {question.type}
                                                            </div>
                                                        </div>

                                                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors line-clamp-2 leading-tight">
                                                            {question.question}
                                                        </h3>

                                                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                                                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                                                            <span className="truncate">{question.test_title}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Category badge */}
                                                {question.category && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                                                            <span className="text-sm">{question.category.emoji}</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-300 truncate">
                                        {question.category.title}
                                    </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stats section */}
                                            <div className="relative grid grid-cols-2 gap-3 pt-4 border-t border-gray-800/50 mt-4">
                                                <div className="flex flex-col items-center p-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <HelpCircle className="w-4 h-4 text-blue-400" />
                                                        <span className="text-lg font-bold text-white">{question.answers || 0}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">Variant</span>
                                                </div>

                                                <div className="flex flex-col items-center p-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                                        <span className="text-lg font-bold text-white">{question.correctRate || 0}%</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">To'g'ri</span>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="relative mt-4 pt-4 border-t border-gray-800/50">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartQuestionEdit(question);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <Edit size={14} />
                                                        Tahrirlash
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShowQuestionAnalytics(question);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <BarChart3 size={14} />
                                                        Analitika
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Saved Tab */}
                    {activeTabs === "savedQuestion" && (
                        <div>
                            <div className="mb-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Saqlanganlar</h3>
                                        <p className="text-gray-400">
                                            {savedSectionTab === "tests"
                                                ? `${savedTests.length} ta saqlangan test`
                                                : `${savedQuestions.length} ta saqlangan savol`}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {selectedSavedItems.length > 0 && (
                                            <button
                                                onClick={handleDeleteSelectedItems}
                                                className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 size={16}/>
                                                O'chirish ({selectedSavedItems.length})
                                            </button>
                                        )}

                                        <button
                                            onClick={fetchSavedContent}
                                            disabled={loadingSaved}
                                            className="inline-flex items-center px-4 py-2 border border-gray-600 text-gray-300 font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                            {loadingSaved ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Yuklanmoqda...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw size={16}/>
                                                    Yangilash
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Saved section tabs */}
                                <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                                    <button
                                        onClick={() => {
                                            setSavedSectionTab("tests");
                                            setSelectedSavedItems([]);
                                        }}
                                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors relative whitespace-nowrap
                                            ${savedSectionTab === "tests"
                                            ? "text-blue-500"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        <FileText size={18}/>
                                        Testlar
                                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                                            {savedTests.length}
                                        </span>
                                        {savedSectionTab === "tests" && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setSavedSectionTab("questions");
                                            setSelectedSavedItems([]);
                                        }}
                                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors relative whitespace-nowrap
                                            ${savedSectionTab === "questions"
                                            ? "text-purple-500"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        <HelpCircle size={18}/>
                                        Savollar
                                        <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full">
                                            {savedQuestions.length}
                                        </span>
                                        {savedSectionTab === "questions" && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
                                        )}
                                    </button>
                                </div>

                                {/* Search and controls */}
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"/>
                                        <input
                                            type="text"
                                            placeholder={savedSectionTab === "tests" ? "Testlarni qidirish..." : "Savollarni qidirish..."}
                                            value={searchTerm}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {savedSectionTab === "tests" && filteredSavedTests.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSavedItems.length === filteredSavedTests.length}
                                                    onChange={toggleSelectAll}
                                                    className="h-5 w-5 text-blue-600 rounded"
                                                />
                                                <span className="text-sm text-gray-400 hidden sm:inline">Barchasini tanlash</span>
                                            </div>
                                        )}

                                        {savedSectionTab === "questions" && filteredSavedQuestions.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSavedItems.length === filteredSavedQuestions.length}
                                                    onChange={toggleSelectAll}
                                                    className="h-5 w-5 text-purple-600 rounded"
                                                />
                                                <span className="text-sm text-gray-400 hidden sm:inline">Barchasini tanlash</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            {loadingSaved ? (
                                <div className="flex justify-center items-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                </div>
                            ) : savedSectionTab === "tests" ? (
                                <div className="space-y-4">
                                    {filteredSavedTests.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                                            <h3 className="text-lg font-medium text-white mb-2">Saqlangan testlar yo'q</h3>
                                            <p className="text-gray-500 mb-6">Siz hali hech qanday testni saqlamagansiz.</p>
                                            <button
                                                onClick={() => window.location.href = '/tests'}
                                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Testlarni ko'rish
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredSavedTests.map((test) => (
                                                <div key={test.id} className="relative bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSavedItems.includes(test.id)}
                                                            onChange={() => toggleSelectItem(test.id)}
                                                            className="mt-1 h-5 w-5 text-blue-600 rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="text-lg font-semibold text-white line-clamp-1">
                                                                    {test.test_detail?.title || "Nomsiz test"}
                                                                </h4>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => viewTestDetails(test.test_detail?.id || 0)}
                                                                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                                        title="Ko'rish"
                                                                    >
                                                                        <Eye size={16}/>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteSavedTest(test.id)}
                                                                        disabled={deletingItem === test.id}
                                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                                        title="O'chirish"
                                                                    >
                                                                        {deletingItem === test.id ? (
                                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                                        ) : (
                                                                            <Trash2 size={16}/>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                {test.test_detail?.category && (
                                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                                                        <span>{test.test_detail.category.emoji}</span>
                                                                        <span>{test.test_detail.category.title}</span>
                                                                    </div>
                                                                )}
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                                                    <Clock size={12}/>
                                                                    <span>{test.test_detail?.total_questions || 0} savol</span>
                                                                </div>
                                                                {test.test_detail?.difficulty_percentage && (
                                                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                                                        test.test_detail.difficulty_percentage < 40 ? "bg-green-500/20 text-green-400" :
                                                                            test.test_detail.difficulty_percentage < 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                                                                    }`}>
                                                                        {test.test_detail.difficulty_percentage}%
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                                                                {test.test_detail?.description || "Tavsif yo'q"}
                                                            </p>

                                                            <div className="flex justify-between items-center text-xs text-gray-400">
                                                                <span>@{test.user.username}</span>
                                                                <span>Saqlangan: {formatDate(test.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredSavedQuestions.length === 0 ? (
                                        <div className="text-center py-12">
                                            <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                                            <h3 className="text-lg font-medium text-white mb-2">Saqlangan savollar yo'q</h3>
                                            <p className="text-gray-500 mb-6">Siz hali hech qanday savolni saqlamagansiz.</p>
                                            <button
                                                onClick={() => window.location.href = '/questions'}
                                                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                Savollarni ko'rish
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {filteredSavedQuestions.map((question) => (
                                                <div key={question.id} className="relative bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSavedItems.includes(question.id)}
                                                            onChange={() => toggleSelectItem(question.id)}
                                                            className="mt-1 h-5 w-5 text-purple-600 rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1">
                                                                    <h4 className="text-lg font-semibold text-white line-clamp-2 mb-2">
                                                                        {question.question_detail?.question_text || "Savol matni yo'q"}
                                                                    </h4>
                                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                                        <div className="inline-flex items-center px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                                                            {question.question_detail?.question_type || "Noma'lum"}
                                                                        </div>
                                                                        {question.question_detail?.difficulty_percentage && (
                                                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                                                                question.question_detail.difficulty_percentage < 40 ? "bg-green-500/20 text-green-400" :
                                                                                    question.question_detail.difficulty_percentage < 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                                                                            }`}>
                                                                                {question.question_detail.difficulty_percentage}%
                                                                            </div>
                                                                        )}
                                                                        {question.question_detail?.category && (
                                                                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                                                                <span>{question.question_detail.category.emoji}</span>
                                                                                <span>{question.question_detail.category.title}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 ml-2">
                                                                    <button
                                                                        onClick={() => viewQuestionDetails(question.question_detail?.id || 0)}
                                                                        className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
                                                                        title="Ko'rish"
                                                                    >
                                                                        <Eye size={16}/>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteSavedQuestion(question.id)}
                                                                        disabled={deletingItem === question.id}
                                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                                        title="O'chirish"
                                                                    >
                                                                        {deletingItem === question.id ? (
                                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                                        ) : (
                                                                            <Trash2 size={16}/>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="text-sm text-gray-300 mb-3">
                                                                <p className="mb-1">
                                                                    <span className="font-medium">Test:</span> {question.question_detail?.test_title || "Noma'lum"}
                                                                </p>
                                                                {question.question_detail?.created_at && (
                                                                    <p>
                                                                        <span className="font-medium">Yaratilgan:</span> {formatDate(question.question_detail.created_at)}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex justify-between items-center text-xs text-gray-400">
                                                                <div className="flex items-center gap-2">
                                                                    <span>@{question.user.username}</span>
                                                                    <span>•</span>
                                                                    <span>Saqlangan: {formatDate(question.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTabs === "library" && (
                        <div className="space-y-6">
                            {/* Header qismi */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                        <BookOpen className="text-blue-500" />
                                        Mening Kutubxonam
                                    </h3>
                                    <p className="text-gray-400 text-sm">Mutolaa jarayonidagi kitoblar va shaxsiy natijalaringiz</p>
                                </div>
                                {/*<button*/}
                                {/*    onClick={() => navigate('/books')}*/}
                                {/*    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-500/20"*/}
                                {/*>*/}
                                {/*    <Plus size={18} />*/}
                                {/*    Yangi kitob qo'shish*/}
                                {/*</button>*/}
                            </div>

                            {/* Umumiy statistika paneli (Dashboard API dan) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-4 rounded-2xl">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Jami o'qildi</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-white">{overallStats?.total_words_read || 0}</span>
                                        <span className="text-gray-400 text-xs mb-1">so'z</span>
                                    </div>
                                </div>
                                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-4 rounded-2xl">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">O'rtacha tezlik</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-blue-400">{overallStats?.average_speed_wpm || 0}</span>
                                        <span className="text-gray-400 text-xs mb-1">wpm</span>
                                    </div>
                                </div>
                                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-4 rounded-2xl">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Mutolaa vaqti</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-green-400">{overallStats?.total_reading_time_hours || 0}</span>
                                        <span className="text-gray-400 text-xs mb-1">soat</span>
                                    </div>
                                </div>
                                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-4 rounded-2xl">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Tugallash ko'rsatkichi</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-purple-400">{overallStats?.average_completion_rate || 0}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Kitoblar ro'yxati (Recent Activity API dan) */}
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-20 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
                                    <BookOpen className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">Kutubxona bo'sh</h3>
                                    <p className="text-gray-400 mb-6">Siz hali birorta ham kitobni o'qishni boshlamagansiz.</p>
                                    <button className="text-blue-500 hover:underline font-medium">Kitoblar katalogiga o'tish</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                    {recentActivity.map((item, index) => (
                                        <div key={index} className="group relative rounded-3xl border border-gray-800 bg-gray-900/50 p-6 hover:border-blue-500/50 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex gap-4">
                                                    <div className="w-14 h-20 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                                                        <FileText className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                                            {item.book_title}
                                                        </h4>
                                                        <p className="text-gray-400 text-sm flex items-center gap-2">
                                                            <Clock size={14} />
                                                            Oxirgi faollik: {formatDate(item.updated_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                    item.reading_percent === 100 
                                                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                }`}>
                                                    {item.reading_percent === 100 ? "Tugallandi" : "O'qilmoqda"}
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-6">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-gray-400">Progress</span>
                                                    <span className="text-blue-400 font-bold">{item.reading_percent?.toFixed(2)}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000"
                                                        style={{ width: `${item.reading_percent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Mini Stats Grid */}
                                            <div className="grid grid-cols-3 gap-2 mb-6">
                                                <div className="p-3 rounded-2xl bg-gray-800/50 border border-gray-700 text-center">
                                                    <Zap size={14} className="text-amber-400 mx-auto mb-1" />
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Tezlik</p>
                                                    <p className="text-sm font-bold text-white">{item.words_per_minute}</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-gray-800/50 border border-gray-700 text-center">
                                                    <FileText size={14} className="text-blue-400 mx-auto mb-1" />
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">So'zlar</p>
                                                    <p className="text-sm font-bold text-white">{item.unique_words_read}</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-gray-800/50 border border-gray-700 text-center">
                                                    <Users size={14} className="text-purple-400 mx-auto mb-1" />
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Hajm</p>
                                                    <p className="text-sm font-bold text-white">{item.total_words_in_book}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                 <button
                                                    onClick={() => navigate(`/reader/`)} // Kitob ID-siga qarab o'tadi
                                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Play size={16} fill="currentColor" />
                                                    Mutolaani davom ettirish
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Referral Modal */}
            <CustomModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} title="Referral Dasturi" size="lg">
                <div className="p-6">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Bot size={28} className="text-white"/>
                                    </div>
                                    <div>
                                        <h3 className="md:text-xl text-md font-bold mb-1">🚀 Telegram Bot orqali boshqaring!</h3>
                                        <p className="text-blue-100 text-sm">Referral malumotlaringizni yanada qulay boshqaring</p>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <Sparkles size={20} className="text-yellow-300 animate-pulse"/>
                                    <Zap size={20} className="text-yellow-300 animate-bounce"/>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                                <h4 className="font-semibold mb-2 flex items-center">
                                    <span className="mr-2">✨</span>
                                    Telegram botimizning afzalliklari:
                                </h4>
                                <ul className="text-sm space-y-1 text-blue-100">
                                    <li className="flex items-center"><span className="mr-2">🔥</span>Referral cod yaratish</li>
                                    <li className="flex items-center"><span className="mr-2">📱</span>Tushunarli interfeys</li>
                                    <li className="flex items-center"><span className="mr-2">🔔</span>Taklif qilgan do'stlaringiz ro'yxati</li>
                                    <li className="flex items-center"><span className="mr-2">⚡</span>Bir necha sekundda sozlash</li>
                                </ul>
                            </div>

                            <a
                                href={getTelegramBotUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <Bot size={20} className="mr-2"/>
                                <span className="mr-2">@TestAbdUzBot</span>
                                <ExternalLink size={16}/>
                            </a>
                        </div>

                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                    </div>
                </div>
            </CustomModal>

            {/* Followers Modal */}
            <CustomModal
                isOpen={showFollowers}
                onClose={() => setShowFollowers(false)}
                title="Obunachilar"
                size="md"
            >
                <div className="p-6">
                    <div className="max-h-96 overflow-y-auto space-y-4">
                        {loadingFollowData ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : follow && follow.followers && follow.followers.length > 0 ? (
                            follow.followers.map((user) => (
                                <div key={user.id} className="flex items-center space-x-4 p-2 md:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <img
                                        src={`${user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}`}
                                        alt={user.username}
                                        className="w-9 h-9 md:w-12 md:h-12 rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://backend.testabd.uz/media/defaultuseravatar.png"
                                        }}
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold dark:text-white text-[14px] md:text-lg">@{user.username}</h4>
                                    </div>
                                    <button
                                        onClick={() => handleFollow(user.id)}
                                        className={`md:px-4 md:py-2 px-2 py-2 rounded-lg flex items-center gap-2 text-xs md:text-sm transition-colors ${
                                            user.is_following
                                                ? "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                    >
                                        {user.is_following ? (
                                            <>
                                                <UserMinus size={16}/>
                                                Kuzatmaslik
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={16}/>
                                                Kuzatish
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Hozircha hech kim sizni kuzatmayapti</p>
                        )}
                    </div>
                </div>
            </CustomModal>

            {/* Following Modal */}
            <CustomModal
                isOpen={showFollowing}
                onClose={() => setShowFollowing(false)}
                title="Kuzatilganlar"
                size="md"
            >
                <div className="p-6">
                    <div className="max-h-96 overflow-y-auto space-y-4">
                        {loadingFollowData ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : follow && follow.following && follow.following.length > 0 ? (
                            follow.following.map((user) => (
                                <div key={user.id} className="flex items-center space-x-4 p-2 md:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <img
                                        src={user.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                                        alt={user.username}
                                        className="md:w-12 md:h-12 w-9 h-9 rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://backend.testabd.uz/media/defaultuseravatar.png"
                                        }}
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold dark:text-white text-[14px] md:text-lg">@{user.username}</h4>
                                    </div>
                                    <button
                                        onClick={() => handleFollow(user.id)}
                                        className="md:px-4 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-xs md:text-sm transition-colors"
                                    >
                                        <UserMinus size={16}/>
                                        Kuzatmaslik
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Hozircha hech kimni kuzatmayapsiz</p>
                        )}
                    </div>
                </div>
            </CustomModal>

            {/* Test Tahrirlash Modali */}
            <CustomModal
                isOpen={showTestEditModal}
                onClose={() => {
                    setShowTestEditModal(false);
                    setEditingTest(null);
                    setEditingTestData(null);
                }}
                title="Testni tahrirlash"
                size="lg"
            >
                <div className="p-6">
                    {editingTestData && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Test nomi
                                </label>
                                <input
                                    type="text"
                                    value={editingTestData.title || ''}
                                    onChange={(e) => handleTestDataChange('title', e.target.value)}
                                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tavsif
                                </label>
                                <textarea
                                    value={editingTestData.description || ''}
                                    onChange={(e) => handleTestDataChange('description', e.target.value)}
                                    rows={3}
                                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Holati
                                    </label>
                                    <select
                                        value={editingTestData.status || 'draft'}
                                        onChange={(e) => handleTestDataChange('status', e.target.value as "published" | "draft")}
                                        className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="draft">Qoralama</option>
                                        <option value="published">Nashr qilingan</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Ko'rinishi
                                    </label>
                                    <select
                                        value={editingTestData.visibility || 'draft'}
                                        onChange={(e) => handleTestDataChange('visibility', e.target.value as "public" | "unlisted" | "draft")}
                                        className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="draft">Qoralama</option>
                                        <option value="unlisted">Maxfiy</option>
                                        <option value="public">Ommaviy</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowTestEditModal(false);
                                        setEditingTest(null);
                                        setEditingTestData(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleUpdateTest}
                                    disabled={updatingTest}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {updatingTest ? "Saqlanmoqda..." : "Saqlash"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </CustomModal>

            {/* Savol Tahrirlash Modali */}
            <CustomModal
                isOpen={showQuestionEditModal}
                onClose={() => {
                    setShowQuestionEditModal(false);
                    setEditingQuestion(null);
                    setEditingQuestionData(null);
                }}
                title="Savolni tahrirlash"
                size="lg"
            >
                <div className="p-6">
                    {editingQuestionData && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Savol matni
                                </label>
                                <textarea
                                    value={editingQuestionData.question || ''}
                                    onChange={(e) => handleQuestionDataChange('question', e.target.value)}
                                    rows={3}
                                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Qiyinlik darajasi
                                    </label>
                                    <select
                                        value={editingQuestionData.difficulty || 'O\'rtacha'}
                                        onChange={(e) => handleQuestionDataChange('difficulty', e.target.value)}
                                        className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Oson">Oson</option>
                                        <option value="O'rtacha">O'rtacha</option>
                                        <option value="Qiyin">Qiyin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Savol turi
                                    </label>
                                    <input
                                        type="text"
                                        value={editingQuestionData.type || ''}
                                        onChange={(e) => handleQuestionDataChange('type', e.target.value)}
                                        className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowQuestionEditModal(false);
                                        setEditingQuestion(null);
                                        setEditingQuestionData(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleUpdateQuestion}
                                    disabled={updatingQuestion}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {updatingQuestion ? "Saqlanmoqda..." : "Saqlash"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </CustomModal>

            {/* Test Analitika Modali */}
            <CustomModal
                isOpen={showTestAnalytics}
                onClose={() => setShowTestAnalytics(false)}
                title="Test analitikasi"
                size="lg"
            >
                <div className="p-6">
                    {selectedTest && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {selectedTest.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {selectedTest.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {selectedTest.total_questions}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Savollar soni
                                    </div>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {selectedTest.completions}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Yechganlar
                                    </div>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {selectedTest.rating}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Reyting
                                    </div>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                    <div className={`text-2xl font-bold ${
                                        selectedTest.status === 'published' ? 'text-green-600 dark:text-green-400' :
                                            selectedTest.status === 'draft' ? 'text-yellow-600 dark:text-yellow-400' :
                                                'text-gray-600 dark:text-gray-400'
                                    }`}>
                                        {selectedTest.status === 'published' ? 'Faol' : 'Qoralama'}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Holati
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    Qo'shimcha ma'lumotlar
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Yaratilgan:</span>
                                        <span className="font-medium">{formatDate(selectedTest.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Yangilangan:</span>
                                        <span className="font-medium">{formatDate(selectedTest.updated_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Ko'rinish:</span>
                                        <span className="font-medium">
                                            {selectedTest.visibility === 'public' ? 'Ommaviy' :
                                                selectedTest.visibility === 'unlisted' ? 'Maxfiy' : 'Qoralama'}
                                        </span>
                                    </div>
                                    {selectedTest.category && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Kategoriya:</span>
                                            <span className="font-medium">{selectedTest.category.title}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CustomModal>

            {/* Savol Analitika Modali */}
            <CustomModal
                isOpen={showQuestionAnalytics}
                onClose={() => setShowQuestionAnalytics(false)}
                title="Savol analitikasi"
                size="lg"
            >
                <div className="p-6">
                    {selectedQuestion && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {selectedQuestion.question}
                                </h3>

                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedQuestion.difficulty === 'Oson'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                            selectedQuestion.difficulty === "O'rtacha"
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                        {selectedQuestion.difficulty}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium">
                                        {selectedQuestion.type}
                                    </span>
                                    {selectedQuestion.category && (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                                            {selectedQuestion.category.emoji} {selectedQuestion.category.title}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {selectedQuestion.answers}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Variantlar soni
                                    </div>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {selectedQuestion.correctRate}%
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        To'g'ri javob foizi
                                    </div>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                    <div className={`text-2xl font-bold ${
                                        selectedQuestion.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {selectedQuestion.is_active ? 'Faol' : 'Noaktiv'}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Holati
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    Qo'shimcha ma'lumotlar
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Test:</span>
                                        <span className="font-medium">{selectedQuestion.test_title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Yaratilgan:</span>
                                        <span className="font-medium">{formatDate(selectedQuestion.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Yangilangan:</span>
                                        <span className="font-medium">{formatDate(selectedQuestion.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CustomModal>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
                
                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    )
}

export default ProfilePage