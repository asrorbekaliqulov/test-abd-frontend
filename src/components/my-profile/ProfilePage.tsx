"use client"

import type React from "react"
import {useState, useEffect, ChangeEvent} from "react"
import {
    Settings,
    Shield,
    Crown,
    UserPlus,
    Cog,
    UserMinus,
    User,
    BarChart3,
    Edit,
    Upload,
    ExternalLink,
    Sparkles,
    Zap,
    Bot,
    X,
    ChevronRight,
    Bookmark,
    FileText,
    HelpCircle,
    Users,
    Gift,
    Copy,
    Share2,
    TrendingUp,
    Award,
    Target,
    LogOut,
    Trash2,
    Eye,
    Clock,
    Search,
    Filter,
    BookmarkCheck,
    ChevronLeft,
    AlertTriangle,
    RefreshCw,
    Home,
    Save,
    Plus,
    Calendar,
    Star,
    CheckCircle,
    PlayCircle,
    MoreVertical
} from "lucide-react"
import {quizAPI, authAPI, accountsAPI, updateProfileImage} from "../../utils/api.ts"
import correctImg from "../assets/images/correct.png";
import wrongImg from "../assets/images/wrong.png";
import accuracyImg from "../assets/images/accuracy.png";
import coinImg from "../assets/images/coin.png";

// Types
export interface Country {
    id: number
    name: string
    code: string
}

export interface Region {
    id: number
    name: string
    country_id: number
}

interface Category {
    id: number;
    title: string;
    emoji: string;
}

export interface District {
    id: number
    name: string
    region_id: number
}

export interface Settlement {
    id: number
    name: string
    district_id: number
}

export interface UserType {
    id: number
    username: string
    profile_image: string | null
    is_following?: boolean
}

interface UserData {
    id: number
    last_login: string
    is_superuser: boolean
    username: string
    first_name: string
    last_name: string
    email: string
    is_staff: boolean
    date_joined: string
    profile_image: string
    bio: string
    phone_number: string
    created_at: string
    is_active: boolean
    role: string
    is_premium: boolean
    is_badged: boolean
    join_date: string
    level: string
    tests_solved: number
    correct_count: number
    wrong_count: number
    average_time: number
    country: number | null
    region: number | null
    district: number | null
    settlement: number | null
    streak_day: number
    streak_days: number
    referral_code: string
    coin_percentage: number
    coins: number
    weekly_test_count: {
        Dush: number
        Sesh: number
        Chor: number
        Pay: number
        Jum: number
        Shan: number
        Yak: number
    }
    groups: number[]
    user_permissions: number[]
    categories_of_interest: number[]
}

export interface UserFollowData {
    followers: UserType[]
    following: UserType[]
}

interface UserSettings {
    country: number | null
    region: number | null
    district: number | null
    settlement: number | null
    language: string
    theme: string
    notifications: {
        push: boolean
        email: boolean
        sound: boolean
    }
    privacy: {
        publicProfile: boolean
        showOnlineStatus: boolean
    }
    monetization: boolean
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
    is_public: boolean
    time_limit: number
    category: {
        id: number
        title: string
        slug: string
        emoji: string
    } | null
}

export interface RecentQuestion {
    id: number
    question: string
    test_title: string
    type: string
    difficulty: string
    category: Category | null
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
    const [settings, setSettings] = useState<UserSettings>({
        country: null,
        region: null,
        district: null,
        settlement: null,
        language: "uz",
        theme: "light",
        notifications: {
            push: true,
            email: true,
            sound: true,
        },
        privacy: {
            publicProfile: true,
            showOnlineStatus: true,
        },
        monetization: false,
    })

    const [follow, setFollow] = useState<UserFollowData | null>(null)
    const [showFollowers, setShowFollowers] = useState(false)
    const [showFollowing, setShowFollowing] = useState(false)
    const [countries, setCountries] = useState<Country[]>([])
    const [regions, setRegions] = useState<Region[]>([])
    const [districts, setDistricts] = useState<District[]>([])
    const [settlements, setSettlements] = useState<Settlement[]>([])
    const [loadingFollowData, setLoadingFollowData] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("profile")
    const [settingsLoading, setSettingsLoading] = useState(false)
    const [imageUploading, setImageUploading] = useState(false)
    const [selectedTest, setSelectedTest] = useState<MyTests | null>(null)
    const [selectedQuestion, setSelectedQuestion] = useState<RecentQuestion | null>(null)
    const [editingTest, setEditingTest] = useState<MyTests | null>(null)
    const [editingQuestion, setEditingQuestion] = useState<RecentQuestion | null>(null)
    const [showTestAnalytics, setShowTestAnalytics] = useState(false)
    const [showQuestionAnalytics, setShowQuestionAnalytics] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [activeTabs, setActiveTabs] = useState("test")

    // New states for Saved section
    const [savedSectionTab, setSavedSectionTab] = useState("tests"); // 'tests' or 'questions'
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

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

        const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark)

        setIsDarkMode(shouldBeDark)
        document.documentElement.setAttribute("data-theme", shouldBeDark ? "dark" : "light")
        setSettings((prev) => ({...prev, theme: shouldBeDark ? "dark" : "light"}))
    }, [])

    const showToast = (message: string, type: "success" | "error") => {
        setToast({message, type})
    }

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authAPI.getMe()
                console.log("Profile data:", res.data)
                setMestats(res.data)
                setSettings((prev) => ({
                    ...prev,
                    country: res.data.country || null,
                    region: res.data.region || null,
                    district: res.data.district || null,
                    settlement: res.data.settlement || null,
                }))
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
            } finally {
                setLoadingFollowData(false)
            }
        }
    }

    useEffect(() => {
        fetchFollowData()
    }, [mestats?.id])

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await authAPI.getCountry()
                setCountries(res.data)
                console.log("Countries loaded:", res.data)
            } catch (err) {
                console.error("Countries olishda xatolik:", err)
            }
        }
        fetchCountries()
    }, [])

    useEffect(() => {
        if (settings.country) {
            const fetchRegions = async () => {
                try {
                    const res = await authAPI.getRegion(settings.country)
                    setRegions(res.data)
                    console.log("Regions loaded for country", settings.country, ":", res.data)
                } catch (err) {
                    console.error("Regions olishda xatolik:", err)
                }
            }
            fetchRegions()
        } else {
            setRegions([])
        }
    }, [settings.country])

    useEffect(() => {
        if (settings.region) {
            const fetchDistricts = async () => {
                try {
                    const res = await authAPI.getDistrict(settings.region)
                    setDistricts(res.data)
                    console.log("Districts loaded for region", settings.region, ":", res.data)
                } catch (err) {
                    console.error("Districts olishda xatolik:", err)
                }
            }
            fetchDistricts()
        } else {
            setDistricts([])
        }
    }, [settings.region])

    useEffect(() => {
        if (settings.district) {
            const fetchSettlements = async () => {
                try {
                    const res = await authAPI.getSettlement(settings.district)
                    setSettlements(res.data)
                    console.log("Settlements loaded for district", settings.district, ":", res.data)
                } catch (err) {
                    console.error("Settlements olishda xatolik:", err)
                }
            }
            fetchSettlements()
        } else {
            setSettlements([])
        }
    }, [settings.district])

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

    const convertToRecentQuestion = (q: any, category: any): RecentQuestion => ({
        id: q.id,
        question: q.question_text,
        type: q.question_type,
        test_title: q.test_title || "No Test",
        difficulty:
            q.difficulty_percentage < 33
                ? "Oson"
                : q.difficulty_percentage < 66
                    ? "O'rtacha"
                    : "Qiyin",
        category: category || null,
        answers: q.answers?.length || 0,
        correctRate:
            q.correct_count + q.wrong_count > 0
                ? Math.round((q.correct_count / (q.correct_count + q.wrong_count)) * 100)
                : 0,
        created_at: q.created_at,
        updated_at: q.updated_at,
        is_active: q.is_active,
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await quizAPI.fetchRecentQuestions();
                const recent = await Promise.all(
                    res.data.map(async (q) => {
                        try {
                            const testRes = await quizAPI.fetchTestById(q.test);
                            return convertToRecentQuestion(q, testRes.data.category);
                        } catch (error) {
                            return convertToRecentQuestion(q, null);
                        }
                    })
                );
                setRecentQuestions(recent);
            } catch (error) {
                console.error("Recent questions olishda xatolik:", error);
            }
        };
        load();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("uz-UZ", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Tashkent",
        });
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
            // 1. FormData yaratish
            const formData = new FormData()
            formData.append("profile_image", file)

            // 2. API orqali rasmni yuklash - yangi optimallashtirilgan funksiya
            const response = await authAPI.updateProfileImage(formData)

            // 3. Agar yangilangan ma'lumotlar qaytsa, state'ni yangilash
            if (response.success && response.data) {
                // Profil ma'lumotlarini yangilash
                const updatedUser = { ...mestats, profile_image: response.data.profile_image }
                setMestats(updatedUser as UserData)

                // Agar API to'liq user ma'lumotini qaytarsa
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
            event.target.value = "" // Inputni tozalash
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
            if (settings.country) formData.append("country_id", String(settings.country))
            if (settings.region) formData.append("region_id", String(settings.region))
            if (settings.district) formData.append("district_id", String(settings.district))
            if (settings.settlement) formData.append("settlement_id", String(settings.settlement))
            await authAPI.updateProfile(formData)
            showToast("Profil muvaffaqiyatli saqlandi!", "success")
        } catch (error) {
            console.error("Profile update error:", error)
            showToast("Profilni saqlashda xatolik yuz berdi", "error")
        }
        setIsLoading(false)
    }

    const handleSettingChange = (category: keyof UserSettings, key: string, value: any) => {
        setSettings((prev) => {
            const current = prev[category]
            if (typeof current === "object" && current !== null) {
                return {
                    ...prev,
                    [category]: {
                        ...current,
                        [key]: value,
                    },
                }
            }

            // Agar country o'zgartirilsa, region, district, settlement reset qilish
            if (category === "country" && value !== prev.country) {
                return {
                    ...prev,
                    country: value,
                    region: null,
                    district: null,
                    settlement: null,
                }
            }

            // Agar region o'zgartirilsa, district va settlement reset qilish
            if (category === "region" && value !== prev.region) {
                return {
                    ...prev,
                    region: value,
                    district: null,
                    settlement: null,
                }
            }

            // Agar district o'zgartirilsa, settlement reset qilish
            if (category === "district" && value !== prev.district) {
                return {
                    ...prev,
                    district: value,
                    settlement: null,
                }
            }

            return {
                ...prev,
                [category]: value,
            }
        })
    }

    const handleSaveSettings = async () => {
        setSettingsLoading(true)
        try {
            const formData = new FormData()
            if (settings.country) formData.append("country_id", String(settings.country))
            if (settings.region) formData.append("region_id", String(settings.region))
            if (settings.district) formData.append("district_id", String(settings.district))
            if (settings.settlement) formData.append("settlement_id", String(settings.settlement))

            await authAPI.updateProfile(formData)
            showToast("Sozlamalar muvaffaqiyatli saqlandi!", "success")

            // Profil ma'lumotlarini yangilash
            const res = await authAPI.getMe()
            setMestats(res.data)
        } catch (error) {
            console.error("Settings update error:", error)
            showToast("Sozlamalarni saqlashda xatolik yuz berdi", "error")
        }
        setSettingsLoading(false)
    }

    const handleLogout = async () => {
        try {
            await authAPI.logout()
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            window.location.href = "/login"
        } catch (error) {
            console.error("Logout error:", error)
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            window.location.href = "/login"
        }
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

    // Saved Items Functions
    const handleDeleteSavedTest = async (testId: number) => {
        if (!window.confirm("Bu testni saqlanganlardan o'chirishni istaysizmi?")) return;

        setDeletingItem(testId);
        try {
            await quizAPI.deleteBookmarkTest(testId);
            setSavedTests(prev => prev.filter(test => test.id !== testId));
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

    // Handle Test Edit
    const handleStartTestEdit = (test: MyTests) => {
        setEditingTest(test);
        setEditingTestData({...test});
    };

    const handleUpdateTest = async () => {
        if (!editingTest || !editingTestData) return;

        setUpdatingTest(true);
        try {
            // Bu yerda API so'rovini yuborish kerak
            // Masalan: await quizAPI.updateTest(editingTest.id, editingTestData);
            // Hozircha demo uchun faqat toast ko'rsatamiz
            await new Promise(resolve => setTimeout(resolve, 1000)); // Demo delay

            // Lokal holatni yangilash
            setMyTests(prev => prev.map(test =>
                test.id === editingTest.id
                    ? {...test, ...editingTestData}
                    : test
            ));

            showToast("Test muvaffaqiyatli yangilandi!", "success");
            setEditingTest(null);
            setEditingTestData(null);
        } catch (error) {
            console.error("Testni yangilashda xatolik:", error);
            showToast("Testni yangilashda xatolik", "error");
        } finally {
            setUpdatingTest(false);
        }
    };

    const handleTestDataChange = (field: keyof MyTests, value: string) => {
        setEditingTestData(prev => prev ? {...prev, [field]: value} : null);
    };

    // Handle Question Edit
    const handleStartQuestionEdit = (question: RecentQuestion) => {
        setEditingQuestion(question);
        setEditingQuestionData({...question});
    };

    const handleUpdateQuestion = async () => {
        if (!editingQuestion || !editingQuestionData) return;

        setUpdatingQuestion(true);
        try {
            // Bu yerda API so'rovini yuborish kerak
            // Masalan: await quizAPI.updateQuestion(editingQuestion.id, editingQuestionData);
            // Hozircha demo uchun faqat toast ko'rsatamiz
            await new Promise(resolve => setTimeout(resolve, 1000)); // Demo delay

            // Lokal holatni yangilash
            setRecentQuestions(prev => prev.map(question =>
                question.id === editingQuestion.id
                    ? {...question, ...editingQuestionData}
                    : question
            ));

            showToast("Savol muvaffaqiyatli yangilandi!", "success");
            setEditingQuestion(null);
            setEditingQuestionData(null);
        } catch (error) {
            console.error("Savolni yangilashda xatolik:", error);
            showToast("Savolni yangilashda xatolik", "error");
        } finally {
            setUpdatingQuestion(false);
        }
    };

    const handleQuestionDataChange = (field: keyof RecentQuestion, value: string) => {
        setEditingQuestionData(prev => prev ? {...prev, [field]: value} : null);
    };

    // Custom UI Components
    const CustomButton = ({
                              children,
                              onClick,
                              variant = "primary",
                              size = "md",
                              disabled = false,
                              className = "",
                              ...props
                          }: {
        children: React.ReactNode
        onClick?: () => void
        variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
        size?: "sm" | "md" | "lg"
        disabled?: boolean
        className?: string
        [key: string]: any
    }) => {
        const baseStyles =
            "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"

        const variants = {
            primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
            secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
            outline:
                "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
            ghost:
                "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800",
            danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        }

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2 text-sm",
            lg: "px-6 py-3 text-base",
        }

        const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"

        return (
            <button
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                {...props}
            >
                {children}
            </button>
        )
    }

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

    // Render Saved Tests
    const renderSavedTests = () => (
        <div className="space-y-4">
            {filteredSavedTests.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-medium text-white mb-2">Saqlangan testlar yo'q</h3>
                    <p className="text-gray-500 mb-6">Siz hali hech qanday testni saqlamagansiz.</p>
                    <CustomButton onClick={() => window.location.href = '/tests'}>
                        Testlarni ko'rish
                    </CustomButton>
                </div>
            ) : (
                <>
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
                                                <CustomBadge variant="secondary" className="flex items-center gap-1">
                                                    <span>{test.test_detail.category.emoji}</span>
                                                    <span>{test.test_detail.category.title}</span>
                                                </CustomBadge>
                                            )}
                                            <CustomBadge variant="secondary" className="flex items-center gap-1">
                                                <Clock size={12}/>
                                                <span>{test.test_detail?.total_questions || 0} savol</span>
                                            </CustomBadge>
                                            {test.test_detail?.difficulty_percentage && (
                                                <CustomBadge
                                                    variant={
                                                        test.test_detail.difficulty_percentage < 40 ? "success" :
                                                            test.test_detail.difficulty_percentage < 70 ? "warning" : "danger"
                                                    }
                                                >
                                                    {test.test_detail.difficulty_percentage}%
                                                </CustomBadge>
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
                </>
            )}
        </div>
    );

    // Render Saved Questions
    const renderSavedQuestions = () => (
        <div className="space-y-4">
            {filteredSavedQuestions.length === 0 ? (
                <div className="text-center py-12">
                    <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-medium text-white mb-2">Saqlangan savollar yo'q</h3>
                    <p className="text-gray-500 mb-6">Siz hali hech qanday savolni saqlamagansiz.</p>
                    <CustomButton onClick={() => window.location.href = '/questions'}>
                        Savollarni ko'rish
                    </CustomButton>
                </div>
            ) : (
                <>
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
                                                    <CustomBadge variant="secondary">
                                                        {question.question_detail?.question_type || "Noma'lum"}
                                                    </CustomBadge>
                                                    {question.question_detail?.difficulty_percentage && (
                                                        <CustomBadge
                                                            variant={
                                                                question.question_detail.difficulty_percentage < 40 ? "success" :
                                                                    question.question_detail.difficulty_percentage < 70 ? "warning" : "danger"
                                                            }
                                                        >
                                                            {question.question_detail.difficulty_percentage}%
                                                        </CustomBadge>
                                                    )}
                                                    {question.question_detail?.category && (
                                                        <CustomBadge variant="secondary" className="flex items-center gap-1">
                                                            <span>{question.question_detail.category.emoji}</span>
                                                            <span>{question.question_detail.category.title}</span>
                                                        </CustomBadge>
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
                </>
            )}
        </div>
    );

    // Main tabs
    const mainTabs = [
        {
            id: "test",
            label: "Test",
            icon: FileText
        },
        {
            id: "question",
            label: "Question",
            icon: HelpCircle
        },
        {
            id: "savedQuestion",
            label: "Saved",
            icon: Bookmark
        }
    ];

    // Referral Section Component
    const ReferralSection = () => {
        const [referralCode] = useState("REF123456")
        const [referralStats] = useState({
            totalReferrals: 0,
            thisMonth: 0,
            earnings: 0,
            pending: 0,
        })

        const handleCopyCode = () => {
            navigator.clipboard.writeText('@TestAbdUzBot')
            showToast("Telegram bot manzili nusxalandi!", "success")
        }

        const handleShare = () => {
            if (navigator.share) {
                navigator.share({
                    title: "TestAbd-ga qo'shiling!",
                    text: "Mening referral kodim bilan TestAbd-da ro'yxatdan o'ting va bonuslar oling!",
                    url: `https://testabd.uz/register?ref=${referralCode}`,
                })
            }
        }

        return (
            <div className="space-y-6">
                <div
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                        <div className="flex md:flex-row flex-col items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Bot size={28} className="text-white"/>
                                </div>
                                <div>
                                    <h3 className="md:text-xl text-md font-bold mb-1">🚀 Telegram Bot orqali boshqaring!</h3>
                                    <p className="text-blue-100 text-sm">Referral malumotlaringizni yanada qulay
                                        boshqaring</p>
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
                                <li className="flex items-center"><span className="mr-2">🔔</span>Taklif qilgan do'stlaringiz
                                    ro'yxati
                                </li>
                                <li className="flex items-center"><span className="mr-2">⚡</span>Bir necha sekundda sozlash
                                </li>
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
                <div>
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">Referral Dasturi</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Do'stlaringizni taklif qiling va har bir muvaffaqiyatli ro'yxatdan o'tish uchun bonus oling!
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5"/>
                            <span className="text-sm font-medium">Jami</span>
                        </div>
                        <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5"/>
                            <span className="text-sm font-medium">Bu oy</span>
                        </div>
                        <div className="text-2xl font-bold">{referralStats.thisMonth}</div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5"/>
                            <span className="text-sm font-medium">Daromad</span>
                        </div>
                        <div className="text-2xl font-bold">{referralStats.earnings} so'm</div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5"/>
                            <span className="text-sm font-medium">Kutilmoqda</span>
                        </div>
                        <div className="text-2xl font-bold">{referralStats.pending} so'm</div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-4 dark:text-white">Sizning Referral Kodingiz</h4>

                    <div className="flex md:flex-row flex-col items-center gap-3 mb-4">
                        <div
                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 font-italic text-lg text-white text-center">
                            <a href="https://t.me/TestAbdUzBot" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">@TestAbdUzBot</a> orqali olishingiz mumkin
                        </div>
                        <div className={"flex md:flex-col flex-row w-full items-start"}>
                            <button
                                onClick={handleCopyCode}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-lg transition-colors flex items-center justify-center"
                            >
                                <Copy className="w-5 h-5"/>
                            </button>
                            <button
                                onClick={handleShare}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-lg transition-colors flex items-center justify-center"
                            >
                                <Share2 className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>

                    <div
                        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400"/>
                            <span className="font-medium text-yellow-800 dark:text-yellow-200">Coming Soon!</span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Referral kod funksiyasini bizning telegram botdan boshqarishingiz mumkin.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 dark:text-white">Qanday ishlaydi?</h4>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div
                                className="md:w-8 md:h-8 w-6 h-6 md:p-0 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                1
                            </div>
                            <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">Kod ulashing</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Referral kodingizni do'stlaringiz bilan ulashing
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div
                                className="md:w-8 md:h-8 w-6 h-6 md:p-0 p-2 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
                                2
                            </div>
                            <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">Ro'yxatdan o'tish</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ular sizning kodingiz bilan ro'yxatdan o'tishadi
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div
                                className="md:w-8 md:h-8 w-6 h-6 md:p-0 p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                                3
                            </div>
                            <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">Bonus oling</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Har bir muvaffaqiyatli referral uchun bonus oling
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 dark:text-white">Referral Tarixi</h4>

                    <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Hozircha referrallar yo'q</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hozircha referrallar tarixi <a href="https://t.me/TestAbdUzBot" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">@TestAbdUzBot</a> botimizdan
                            ko'rsangiz bo'ladi
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

            {/* Main Content - Responsive Design */}
            <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Profile Header Card - Responsive */}
                <div className="bg-gray-800 rounded-2xl shadow-lg mb-6">
                    <div className="p-4 sm:p-6">
                        {/* Top Bar - Mobile & Desktop */}
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
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-2 sm:p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <Settings size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* Profile Info - Responsive Grid */}
                        <div className="flex flex-col justify-center gap-6">
                            {/* Left Column - User Info */}
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
                                        {/* Stats - Responsive Grid */}
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

                            {/* Right Column - Performance Stats */}
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

                {/* Main Navigation Tabs - Responsive */}
                <div className="mb-6">
                    <div className="flex flex-row border-b border-gray-700 overflow-x-auto">
                        {mainTabs.map((tab) => {
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

                {/* Tab Content - Responsive */}
                <div className="bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
                    {/* Test Tab */}
                    {activeTabs === "test" && (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-6">
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Mening Testlarim</h3>
                            </div>

                            {myTests.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                                    <h3 className="text-lg font-medium text-white mb-2">Testlar topilmadi</h3>
                                    <p className="text-gray-400 mb-6">Siz hali hech qanday test yaratmagansiz</p>
                                    <CustomButton onClick={() => window.location.href = '/create/new-block'}>
                                        Birinchi testni yaratish
                                    </CustomButton>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {myTests.map((test) => (
                                        <div key={test.id} className="group relative h-full rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/30 p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-sm overflow-hidden flex flex-col">
                                            {/* Gradient background effect */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
                                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
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

                                                    <Edit className="w-5 h-5 text-gray-600 group-hover:text-blue-400 group-hover:rotate-12 transition-all flex-shrink-0 mt-2" />
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

                                            {/* Progress bars */}
                                            <div className="relative mt-4 space-y-3">
                                                <div>
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                        <span className="truncate">To'liqlik</span>
                                                        <span className="font-medium text-white whitespace-nowrap">
                                        {test.total_questions > 0 ? '100%' : '0%'}
                                    </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-green-500 transition-all duration-700"
                                                            style={{ width: `${test.total_questions > 0 ? 100 : 0}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                        <span className="truncate">Muvaffaqiyat</span>
                                                        <span className="font-medium text-white whitespace-nowrap">
                                        {test.rating ? `${(test.rating / 5 * 100).toFixed(0)}%` : '0%'}
                                    </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-yellow-500 transition-all duration-700"
                                                            style={{ width: `${(test.rating || 0) / 5 * 100}%` }}
                                                        />
                                                    </div>
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
                                                            setSelectedTest(test);
                                                            setShowTestAnalytics(true);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <BarChart3 size={14} />
                                                        Analitika
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Hover effect */}
                                            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-500/30 transition-colors pointer-events-none" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTabs === "question" && (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 mb-6">
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Mening Savollarim</h3>
                            </div>

                            {recentQuestions.length === 0 ? (
                                <div className="text-center py-12">
                                    <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                                    <h3 className="text-lg font-medium text-white mb-2">Savollar topilmadi</h3>
                                    <p className="text-gray-400 mb-6">Siz hali hech qanday savol yaratmagansiz</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* 3 emas 2 column */}
                                    {recentQuestions.map((question, index) => (
                                        <div key={`q-${question.id}-${index}`}
                                             className="group relative h-full rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/30 p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 backdrop-blur-sm overflow-hidden flex flex-col">
                                            {/* Gradient background effect */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
                                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
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

                                                    <Edit className="w-5 h-5 text-gray-600 group-hover:text-purple-400 group-hover:rotate-12 transition-all flex-shrink-0 mt-2" />
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

                                            {/* Progress bar for correct rate */}
                                            <div className="relative mt-4">
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>To'g'rilik darajasi</span>
                                                    <span className="font-medium text-white">{question.correctRate}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            question.correctRate >= 70 ? 'bg-emerald-500' :
                                                                question.correctRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}
                                                        style={{ width: `${question.correctRate}%` }}
                                                    />
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
                                                            setSelectedQuestion(question);
                                                            setShowQuestionAnalytics(true);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <BarChart3 size={14} />
                                                        Analitika
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Status badge */}
                                            {question.is_active === false && (
                                                <div className="absolute top-3 right-3 bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-gray-400 border border-gray-700">
                                                    Faol emas
                                                </div>
                                            )}

                                            {/* Hover effect */}
                                            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-purple-500/30 transition-colors pointer-events-none" />
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
                                            <CustomButton
                                                variant="danger"
                                                onClick={handleDeleteSelectedItems}
                                                className="flex items-center gap-2"
                                            >
                                                <Trash2 size={16}/>
                                                O'chirish ({selectedSavedItems.length})
                                            </CustomButton>
                                        )}

                                        <CustomButton
                                            variant="outline"
                                            onClick={fetchSavedContent}
                                            disabled={loadingSaved}
                                            className="flex items-center gap-2"
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
                                        </CustomButton>
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
                                renderSavedTests()
                            ) : (
                                renderSavedQuestions()
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Modal - Full responsive */}
            <CustomModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} size="xl">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Mobile Navigation */}
                    <div className="md:hidden border-b border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
                            {[
                                {id: "profile", icon: User, text: "Profil"},
                                {id: "preferences", icon: Cog, text: "Sozlamalar"},
                                {id: "referral", icon: Users, text: "Referral"},
                                {id: "logout", icon: LogOut, text: "Chiqish"},
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap min-w-max
                                        ${activeTab === item.id
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                    <item.icon size={16}/>
                                    <span className="text-sm">{item.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Sidebar */}
                    <div className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-2 dark:text-white">Sozlamalar</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Hisobingiz va afzalliklaringizni boshqaring</p>

                            <nav className="space-y-2">
                                {[
                                    {id: "profile", icon: User, text: "Profil"},
                                    {id: "preferences", icon: Cog, text: "Sozlamalar"},
                                    {id: "referral", icon: Users, text: "Referral"},
                                    {id: "logout", icon: LogOut, text: "Chiqish"},
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-left
                                            ${activeTab === item.id
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        }`}
                                    >
                                        <item.icon size={20} className="mr-3"/>
                                        {item.text}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                        {activeTab === "profile" && (
                            <div className="space-y-6">
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
                                    <div className="absolute inset-0 bg-black/10"></div>
                                    <div className="relative z-10">
                                        <div className="flex flex-col md:flex-row sm:items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                                    <Bot size={26} className="text-white"/>
                                                </div>
                                                <div>
                                                    <h3 className="md:text-xl text-md font-bold mb-1">🚀 Telegram Bot orqali boshqaring!</h3>
                                                    <p className="text-blue-100 md:text-sm text-xs">Profil ma'lumotlaringizni yanada qulay boshqaring</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1">
                                                <Sparkles size={20} className="text-yellow-300 animate-pulse"/>
                                                <Zap size={20} className="text-yellow-300 animate-bounce"/>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                                            <h4 className="font-semibold mb-2 flex items-center text-sm md:text-md">
                                                <span className="mr-2">✨</span>
                                                Telegram botimizning afzalliklari:
                                            </h4>
                                            <ul className="text-sm space-y-1 text-blue-100">
                                                <li className="flex items-center"><span className="mr-2 text-xs md:text-md">🔥</span>Tezkor profil yangilash</li>
                                                <li className="flex items-center"><span className="mr-2 text-xs md:text-md">📱</span>Mobil qurilmada qulay foydalanish</li>
                                                <li className="flex items-center"><span className="mr-2 text-xs md:text-md">🔔</span>Real vaqtda bildirishnomalar</li>
                                                <li className="flex items-center"><span className="mr-2 text-xs md:text-md">⚡</span>Bir necha sekundda sozlash</li>
                                            </ul>
                                        </div>

                                        <a
                                            href={getTelegramBotUrl()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1.5 w-full text-center md:px-6 md:py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <Bot size={20} className="mr-2"/>
                                            <span className="mr-2">@TestAbdUzBot</span>
                                            <ExternalLink size={16}/>
                                        </a>
                                    </div>

                                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-2 dark:text-white">Profil Sozlamalari</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                        Shaxsiy ma'lumotlaringizni va profil rasmingizni yangilang
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="relative">
                                        <img
                                            src={mestats?.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                                            alt="Current Avatar"
                                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                        />
                                        {imageUploading && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h5 className="font-medium mb-2 dark:text-white">Profil rasmini o'zgartirish</h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Yangi profil rasmini yuklang. Tavsiya etilgan o'lcham: 400x400px, maksimal hajm: 5MB
                                        </p>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={imageUploading}
                                            />
                                            <button
                                                className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors ${
                                                    imageUploading
                                                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                }`}
                                                disabled={imageUploading}
                                            >
                                                {imageUploading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-300 mr-2"></div>
                                                        Yuklanmoqda...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-2"/>
                                                        Yangi rasm yuklash
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-200 dark:border-gray-700"/>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ism</label>
                                        <input
                                            type="text"
                                            value={mestats?.first_name || ""}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                setMestats((prev) => prev ? {...prev, first_name: e.target.value} : null)
                                            }
                                            placeholder="Ismingizni kiriting"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Familiya</label>
                                        <input
                                            type="text"
                                            value={mestats?.last_name || ""}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                setMestats((prev) => prev ? {...prev, last_name: e.target.value} : null)
                                            }
                                            placeholder="Familyangizni kiriting"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={mestats?.email || ""}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setMestats((prev) => prev ? {...prev, email: e.target.value} : null)
                                        }
                                        placeholder="Emailingizni kiriting"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon raqami</label>
                                    <input
                                        type="text"
                                        value={mestats?.phone_number || ""}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setMestats((prev) => prev ? {...prev, phone_number: e.target.value} : null)
                                        }
                                        placeholder="Telefon raqamingizni kiriting"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                    <textarea
                                        placeholder="O'zingiz haqingizda ma'lumot bering..."
                                        rows={4}
                                        value={mestats?.bio || ""}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                            setMestats((prev) => prev ? {...prev, bio: e.target.value} : null)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Saqlanmoqda...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18}/>
                                                Saqlash
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "preferences" && (
                            <div className="space-y-6">
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
                                    <div className="absolute inset-0 bg-black/10"></div>
                                    <div className="relative z-10">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                                    <Bot size={26} className="text-white"/>
                                                </div>
                                                <div>
                                                    <h3 className="md:text-xl text-md font-bold mb-1">🚀 Telegram Bot orqali boshqaring!</h3>
                                                    <p className="text-blue-100 md:text-sm text-xs">Profil ma'lumotlaringizni yanada qulay boshqaring</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1">
                                                <Sparkles size={20} className="text-yellow-300 animate-pulse"/>
                                                <Zap size={20} className="text-yellow-300 animate-bounce"/>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                                            <h4 className="font-semibold mb-2 flex items-center md:text-lg text-sm">
                                                <span className="mr-2">✨</span>
                                                Telegram botimizning afzalliklari:
                                            </h4>
                                            <ul className="text-sm space-y-1 text-blue-100">
                                                <li className="flex items-center"><span className="mr-2 md:text-md text-xs">🔥</span>Profile malumotlaridan qulay xabardor bo'lish</li>
                                                <li className="flex items-center"><span className="mr-2 md:text-md text-xs">📱</span>Bir necha bosish bilan malumotlaringizni ko'ring</li>
                                                <li className="flex items-center"><span className="mr-2 md:text-md text-xs">⚡</span>Bir necha sekundda sozlash</li>
                                            </ul>
                                        </div>

                                        <a
                                            href={getTelegramBotUrl()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1.5 w-full md:px-6 md:py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <Bot size={20} className="mr-2"/>
                                            <span className="mr-2">@TestAbdUzBot</span>
                                            <ExternalLink size={16}/>
                                        </a>
                                    </div>

                                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-2 dark:text-white">Joylashuv</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                        O'zingizning joylashuvingizni tanlang
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Davlat</label>
                                        <select
                                            value={settings.country || ""}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                const value = e.target.value ? Number(e.target.value) : null;
                                                handleSettingChange("country", "", value);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Davlatni tanlash</option>
                                            {countries.map((country) => (
                                                <option key={country.id} value={country.id}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Viloyat</label>
                                        <select
                                            value={settings.region || ""}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                const value = e.target.value ? Number(e.target.value) : null;
                                                handleSettingChange("region", "", value);
                                            }}
                                            disabled={!settings.country}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Viloyatni tanlash</option>
                                            {regions.map((region) => (
                                                <option key={region.id} value={region.id}>
                                                    {region.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tuman</label>
                                        <select
                                            value={settings.district || ""}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                const value = e.target.value ? Number(e.target.value) : null;
                                                handleSettingChange("district", "", value);
                                            }}
                                            disabled={!settings.region}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Tumanni tanlash</option>
                                            {districts.map((district) => (
                                                <option key={district.id} value={district.id}>
                                                    {district.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mahalla</label>
                                        <select
                                            value={settings.settlement || ""}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                const value = e.target.value ? Number(e.target.value) : null;
                                                handleSettingChange("settlement", "", value);
                                            }}
                                            disabled={!settings.district}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Mahallani tanlash</option>
                                            {settlements.map((settlement) => (
                                                <option key={settlement.id} value={settlement.id}>
                                                    {settlement.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <hr className="border-gray-200 dark:border-gray-700"/>

                                <div>
                                    <h4 className="text-base font-medium mb-4 dark:text-white">Mavzu</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            {code: "light", icon: "☀️", name: "Yorug'"},
                                            {code: "dark", icon: "🌙", name: "Qorong'u"},
                                        ].map((theme) => (
                                            <button
                                                key={theme.code}
                                                onClick={() => {
                                                    handleSettingChange("theme", "", theme.code)
                                                    if (theme.code === "dark") {
                                                        setIsDarkMode(true)
                                                        document.documentElement.setAttribute("data-theme", "dark")
                                                        localStorage.setItem("theme", "dark")
                                                    } else if (theme.code === "light") {
                                                        setIsDarkMode(false)
                                                        document.documentElement.setAttribute("data-theme", "light")
                                                        localStorage.setItem("theme", "light")
                                                    }
                                                }}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                                                    settings.theme === theme.code
                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                }`}
                                            >
                                                <span className="text-xl">{theme.icon}</span>
                                                <span>{theme.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-gray-200 dark:border-gray-700"/>

                                <div className="flex flex-col sm:flex-row justify-end gap-4">
                                    <button
                                        onClick={() => {
                                            setSettings({
                                                country: mestats?.country || null,
                                                region: mestats?.region || null,
                                                district: mestats?.district || null,
                                                settlement: mestats?.settlement || null,
                                                language: "uz",
                                                theme: isDarkMode ? "dark" : "light",
                                                notifications: {
                                                    push: true,
                                                    email: true,
                                                    sound: true,
                                                },
                                                privacy: {
                                                    publicProfile: true,
                                                    showOnlineStatus: true,
                                                },
                                                monetization: false,
                                            })
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Qayta tiklash
                                    </button>
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={settingsLoading}
                                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {settingsLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Saqlanmoqda...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18}/>
                                                Sozlamalarni saqlash
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "referral" && <ReferralSection/>}

                        {activeTab === "logout" && (
                            <div className="flex items-center justify-center min-h-[400px]">
                                <div className="max-w-md w-full p-6 text-center bg-white dark:bg-gray-700 rounded-xl">
                                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4"/>
                                    <h3 className="text-xl font-semibold dark:text-white mb-2">Rostdan ham dasturdan chiqmoqchimisiz?</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Agar "Ha" tugmasini bossangiz, siz tizimdan chiqarilasiz.
                                    </p>
                                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                                        <button
                                            onClick={handleLogout}
                                            className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <LogOut size={18}/>
                                            Ha, chiqaman
                                        </button>
                                        <button
                                            onClick={() => setIsSettingsOpen(false)}
                                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Yo'q, qolaman
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CustomModal>

            {/* Referral Modal */}
            <CustomModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} title="Referral Dasturi" size="lg">
                <div className="p-6">
                    <ReferralSection/>
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

            {/* Test Analytics Modal */}
            <CustomModal
                isOpen={showTestAnalytics && selectedTest !== null}
                onClose={() => {
                    setShowTestAnalytics(false)
                    setSelectedTest(null)
                }}
                title={`Test Analitikasi`}
                size="md"
            >
                {selectedTest && (
                    <div className="p-4 md:p-6 space-y-6">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                            <h4 className="text-lg font-semibold mb-2 dark:text-white">{selectedTest.title}</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{selectedTest.description}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 md:p-4">
                                <div className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 md:mb-2">Jami Tugallanganlar</div>
                                <div className="text-lg md:text-2xl font-bold dark:text-white">{selectedTest.completions}</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 md:p-4">
                                <div className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400 mb-1 md:mb-2">Reyting</div>
                                <div className="text-lg md:text-2xl font-bold dark:text-white">{selectedTest.rating}/5</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 md:p-4">
                                <div className="text-xs md:text-sm font-medium text-purple-600 dark:text-purple-400 mb-1 md:mb-2">Savollar Soni</div>
                                <div className="text-lg md:text-2xl font-bold dark:text-white">{selectedTest.total_questions}</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 md:p-4">
                                <div className="text-xs md:text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1 md:mb-2">Status</div>
                                <div className="text-lg md:text-2xl font-bold dark:text-white">
                                    {selectedTest.status === "published" ? "Chop etilgan" : "Qoralama"}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                            <h4 className="text-lg font-semibold mb-3 dark:text-white">Test Ma'lumotlari</h4>
                            <div className="space-y-3">
                                {selectedTest.category && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategoriya</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{selectedTest.category.emoji}</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{selectedTest.category.title}</span>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Holati</div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        selectedTest.status === "published"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    }`}>
                                        {selectedTest.status === "published" ? "Chop etilgan" : "Qoralama"}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yaratilgan sana</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedTest.created_at)}</p>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yangilangan sana</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedTest.updated_at)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowTestAnalytics(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                )}
            </CustomModal>

            {/* Question Analytics Modal */}
            <CustomModal
                isOpen={showQuestionAnalytics && selectedQuestion !== null}
                onClose={() => {
                    setShowQuestionAnalytics(false)
                    setSelectedQuestion(null)
                }}
                title={`Savol Analitikasi`}
                size="md"
            >
                {selectedQuestion && (
                    <div className="p-4 md:p-6 space-y-6">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                            <h4 className="text-lg font-semibold mb-2 dark:text-white">Savol Matni</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{selectedQuestion.question}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 md:p-4">
                                <div className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 md:mb-2">Tur</div>
                                <div className="text-lg md:text-xl font-bold dark:text-white">{selectedQuestion.type}</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 md:p-4">
                                <div className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400 mb-1 md:mb-2">Murakkablik</div>
                                <div className="text-lg md:text-xl font-bold dark:text-white">{selectedQuestion.difficulty}</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 md:p-4">
                                <div className="text-xs md:text-sm font-medium text-purple-600 dark:text-purple-400 mb-1 md:mb-2">Variantlar</div>
                                <div className="text-lg md:text-xl font-bold dark:text-white">{selectedQuestion.answers}</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 md:p-4">
                                <div className="text-xs md:text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1 md:mb-2">To'g'ri Foiz</div>
                                <div className="text-lg md:text-xl font-bold dark:text-white">{selectedQuestion.correctRate}%</div>
                            </div>
                        </div>

                        {selectedQuestion.category && (
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                                <h4 className="text-lg font-semibold mb-2 dark:text-white">Kategoriya</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{selectedQuestion.category.emoji}</span>
                                    <span className="text-gray-700 dark:text-gray-300">{selectedQuestion.category.title}</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                            <h4 className="text-lg font-semibold mb-2 dark:text-white">Test</h4>
                            <p className="text-gray-700 dark:text-gray-300">{selectedQuestion.test_title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Yaratilgan</div>
                                <div className="text-sm dark:text-white">{formatDate(selectedQuestion.created_at)}</div>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Yangilangan</div>
                                <div className="text-sm dark:text-white">{formatDate(selectedQuestion.updated_at)}</div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowQuestionAnalytics(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                )}
            </CustomModal>

            {/* Edit Test Modal */}
            <CustomModal
                isOpen={editingTest !== null}
                onClose={() => {
                    setEditingTest(null);
                    setEditingTestData(null);
                }}
                title="Testni Tahrirlash"
                size="md"
            >
                {editingTest && editingTestData && (
                    <div className="p-4 md:p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Nomi</label>
                            <input
                                type="text"
                                value={editingTestData.title || ""}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    handleTestDataChange("title", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tavsif</label>
                            <textarea
                                value={editingTestData.description || ""}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                    handleTestDataChange("description", e.target.value)
                                }
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                onClick={() => {
                                    setEditingTest(null);
                                    setEditingTestData(null);
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleUpdateTest}
                                disabled={updatingTest}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {updatingTest ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    "Saqlash"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </CustomModal>

            {/* Edit Question Modal */}
            <CustomModal
                isOpen={editingQuestion !== null}
                onClose={() => {
                    setEditingQuestion(null);
                    setEditingQuestionData(null);
                }}
                title="Savolni Tahrirlash"
                size="md"
            >
                {editingQuestion && editingQuestionData && (
                    <div className="p-4 md:p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Savol Matni</label>
                            <textarea
                                value={editingQuestionData.question || ""}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                    handleQuestionDataChange("question", e.target.value)
                                }
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Nomi</label>
                            <input
                                type="text"
                                value={editingQuestionData.test_title || ""}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    handleQuestionDataChange("test_title", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                onClick={() => {
                                    setEditingQuestion(null);
                                    setEditingQuestionData(null);
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleUpdateQuestion}
                                disabled={updatingQuestion}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {updatingQuestion ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    "Saqlash"
                                )}
                            </button>
                        </div>
                    </div>
                )}
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
                
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                
                /* Responsive breakpoints */
                @media (max-width: 640px) {
                    .text-2xl {
                        font-size: 1.5rem;
                    }
                    .text-3xl {
                        font-size: 1.875rem;
                    }
                }
                
                @media (max-width: 768px) {
                    .modal-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </div>
    )
}

export default ProfilePage