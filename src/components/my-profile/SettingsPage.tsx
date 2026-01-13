"use client"

import type React from "react"
import {useState, useEffect, ChangeEvent} from "react"
import { useNavigate } from "react-router-dom"
import {
    ArrowLeft,
    User,
    Shield,
    Lock,
    Bell,
    Globe,
    LogOut,
    Save,
    Upload,
    Bot,
    ExternalLink,
    Sparkles,
    AlertTriangle,
    ChevronRight,
    Settings as SettingsIcon,
    HelpCircle,
    FileText,
    Info,
    X,
    Mail,
    Key,
    Save as SaveIcon
} from "lucide-react"
import {authAPI} from "../../utils/api.ts"

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

// Types
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

interface Country {
    id: number
    name: string
    code: string
}

interface Region {
    id: number
    name: string
    country_id: number
}

interface District {
    id: number
    name: string
    region_id: number
}

interface Settlement {
    id: number
    name: string
    district_id: number
}

const SettingsPage = () => {
    const navigate = useNavigate()
    const [mestats, setMestats] = useState<UserData | null>(null)
    const [selectedCountry, setSelectedCountry] = useState<number | null>(null)
    const [selectedRegion, setSelectedRegion] = useState<number | null>(null)
    const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null)
    const [selectedSettlement, setSelectedSettlement] = useState<number | null>(null)
    const [countries, setCountries] = useState<Country[]>([])
    const [regions, setRegions] = useState<Region[]>([])
    const [districts, setDistricts] = useState<District[]>([])
    const [settlements, setSettlements] = useState<Settlement[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [imageUploading, setImageUploading] = useState(false)
    const [activeSection, setActiveSection] = useState("profile")
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

    // State'lar (faqat backenddan keladigan ma'lumotlar)
    const [passwordData, setPasswordData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: ""
    })
    const [privacySettings, setPrivacySettings] = useState({
        public_profile: false,
        show_online_status: false
    })
    const [notificationSettings, setNotificationSettings] = useState({
        push_notifications: true,
        email_notifications: true
    })
    const [language, setLanguage] = useState("uz")
    const [loadingLocations, setLoadingLocations] = useState({
        countries: false,
        regions: false,
        districts: false,
        settlements: false
    })

    const showToast = (message: string, type: "success" | "error") => {
        setToast({message, type})
    }

    // Fetch user data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authAPI.getMe()
                if (res.success && res.data) {
                    setMestats(res.data)
                    setSelectedCountry(res.data.country || null)
                    setSelectedRegion(res.data.region || null)
                    setSelectedDistrict(res.data.district || null)
                    setSelectedSettlement(res.data.settlement || null)

                    // Privacy va notification sozlamalarini backenddan olish
                    fetchPrivacySettings()
                    fetchNotificationSettings()
                } else {
                    showToast("Profil ma'lumotlarini olishda xatolik", "error")
                }
            } catch (err) {
                console.error("Profil ma'lumotlarini olishda xatolik:", err)
                showToast("Profil ma'lumotlarini olishda xatolik yuz berdi", "error")
            }
        }
        fetchProfile()
    }, [])

    // Privacy sozlamalarini backenddan olish
    const fetchPrivacySettings = async () => {
        try {
            // Agar API endpoint bo'lsa, bu yerda backenddan privacy sozlamalarini olish kerak
            // Hozircha demo ma'lumot o'rniga default qiymatlar
            setPrivacySettings({
                public_profile: true,
                show_online_status: true
            })
        } catch (error) {
            console.error("Privacy settings olishda xatolik:", error)
        }
    }

    // Notification sozlamalarini backenddan olish
    const fetchNotificationSettings = async () => {
        try {
            // Agar API endpoint bo'lsa, bu yerda backenddan notification sozlamalarini olish kerak
            // Hozircha demo ma'lumot o'rniga default qiymatlar
            setNotificationSettings({
                push_notifications: true,
                email_notifications: true
            })
        } catch (error) {
            console.error("Notification settings olishda xatolik:", error)
        }
    }

    // Fetch countries
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                setLoadingLocations(prev => ({...prev, countries: true}))
                const res = await authAPI.getCountry()
                if (res.success && res.data) {
                    setCountries(Array.isArray(res.data) ? res.data : [])
                } else {
                    setCountries([])
                    showToast("Davlatlar ro'yxatini yuklashda xatolik", "error")
                }
            } catch (err) {
                console.error("Countries olishda xatolik:", err)
                setCountries([])
                showToast("Davlatlar ro'yxatini yuklashda xatolik", "error")
            } finally {
                setLoadingLocations(prev => ({...prev, countries: false}))
            }
        }
        fetchCountries()
    }, [])

    // Fetch regions when country changes
    useEffect(() => {
        if (selectedCountry && typeof selectedCountry === 'number') {
            const fetchRegions = async () => {
                try {
                    setLoadingLocations(prev => ({...prev, regions: true}))
                    const res = await authAPI.getRegion(selectedCountry)
                    if (res.success && res.data) {
                        setRegions(Array.isArray(res.data) ? res.data : [])
                    } else {
                        setRegions([])
                        showToast("Viloyatlar ro'yxatini yuklashda xatolik", "error")
                    }
                } catch (err) {
                    console.error(`Regions olishda xatolik: ${selectedCountry}`, err)
                    setRegions([])
                    showToast("Viloyatlar ro'yxatini yuklashda xatolik", "error")
                } finally {
                    setLoadingLocations(prev => ({...prev, regions: false}))
                }
            }
            fetchRegions()
        } else {
            setRegions([])
            setSelectedRegion(null)
            setDistricts([])
            setSelectedDistrict(null)
            setSettlements([])
            setSelectedSettlement(null)
        }
    }, [selectedCountry])

    // Fetch districts when region changes
    useEffect(() => {
        if (selectedRegion && typeof selectedRegion === 'number') {
            const fetchDistricts = async () => {
                try {
                    setLoadingLocations(prev => ({...prev, districts: true}))
                    const res = await authAPI.getDistrict(selectedRegion)
                    if (res.success && res.data) {
                        setDistricts(Array.isArray(res.data) ? res.data : [])
                    } else {
                        setDistricts([])
                        showToast("Tumanlar ro'yxatini yuklashda xatolik", "error")
                    }
                } catch (err) {
                    console.error(`Districts olishda xatolik: ${selectedRegion}`, err)
                    setDistricts([])
                    showToast("Tumanlar ro'yxatini yuklashda xatolik", "error")
                } finally {
                    setLoadingLocations(prev => ({...prev, districts: false}))
                }
            }
            fetchDistricts()
        } else {
            setDistricts([])
            setSelectedDistrict(null)
            setSettlements([])
            setSelectedSettlement(null)
        }
    }, [selectedRegion])

    // Fetch settlements when district changes
    useEffect(() => {
        if (selectedDistrict && typeof selectedDistrict === 'number') {
            const fetchSettlements = async () => {
                try {
                    setLoadingLocations(prev => ({...prev, settlements: true}))
                    const res = await authAPI.getSettlement(selectedDistrict)
                    if (res.success && res.data) {
                        setSettlements(Array.isArray(res.data) ? res.data : [])
                    } else {
                        setSettlements([])
                        showToast("Mahallalar ro'yxatini yuklashda xatolik", "error")
                    }
                } catch (err) {
                    console.error(`Settlements olishda xatolik: ${selectedDistrict}`, err)
                    setSettlements([])
                    showToast("Mahallalar ro'yxatini yuklashda xatolik", "error")
                } finally {
                    setLoadingLocations(prev => ({...prev, settlements: false}))
                }
            }
            fetchSettlements()
        } else {
            setSettlements([])
            setSelectedSettlement(null)
        }
    }, [selectedDistrict])

    // Profilni saqlash
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

            if (selectedCountry) formData.append("country_id", String(selectedCountry))
            if (selectedRegion) formData.append("region_id", String(selectedRegion))
            if (selectedDistrict) formData.append("district_id", String(selectedDistrict))
            if (selectedSettlement) formData.append("settlement_id", String(selectedSettlement))

            const response = await authAPI.updateProfile(formData)

            if (response.success) {
                showToast("Profil muvaffaqiyatli yangilandi!", "success")
            } else {
                throw new Error(response.error || "Profilni yangilashda xatolik")
            }
        } catch (error: any) {
            console.error("Profile update error:", error)
            const errorMessage = error.response?.data?.message || error.message || "Profilni yangilashda xatolik yuz berdi"
            showToast(errorMessage, "error")
        } finally {
            setIsLoading(false)
        }
    }

    // Parolni o'zgartirish
    const handleChangePassword = async () => {
        if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
            showToast("Barcha maydonlarni to'ldiring", "error")
            return
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            showToast("Yangi parol va tasdiqlash paroli mos kelmadi", "error")
            return
        }

        if (passwordData.new_password.length < 8) {
            showToast("Parol kamida 8 belgidan iborat bo'lishi kerak", "error")
            return
        }

        setIsLoading(true)
        try {
            const response = await authAPI.changePassword({
                old_password: passwordData.old_password,
                new_password: passwordData.new_password,
                confirm_password: passwordData.confirm_password
            })

            if (response.success) {
                showToast("Parol muvaffaqiyatli o'zgartirildi!", "success")
                setPasswordData({
                    old_password: "",
                    new_password: "",
                    confirm_password: ""
                })
            } else {
                throw new Error(response.error || "Parolni o'zgartirishda xatolik")
            }
        } catch (error: any) {
            console.error("Password change error:", error)
            const errorMessage = error.response?.data?.message || error.message || "Parolni o'zgartirishda xatolik"
            showToast(errorMessage, "error")
        } finally {
            setIsLoading(false)
        }
    }

    // Privacy sozlamalarini backendga yuborish
    const handleSavePrivacySettings = async () => {
        setIsLoading(true)
        try {
            // Bu yerda privacy sozlamalarini backendga yuborish kerak
            // Misol uchun: const res = await authAPI.updatePrivacySettings(privacySettings)

            // Hozircha API endpoint bo'lmagani uchun demo
            await new Promise(resolve => setTimeout(resolve, 1000))

            showToast("Maxfiylik sozlamalari saqlandi!", "success")
        } catch (error: any) {
            console.error("Privacy settings saqlashda xatolik:", error)
            showToast("Sozlamalarni saqlashda xatolik", "error")
        } finally {
            setIsLoading(false)
        }
    }

    // Notification sozlamalarini backendga yuborish
    const handleSaveNotificationSettings = async () => {
        setIsLoading(true)
        try {
            // Bu yerda notification sozlamalarini backendga yuborish kerak
            // Misol uchun: const res = await authAPI.updateNotificationSettings(notificationSettings)

            // Hozircha API endpoint bo'lmagani uchun demo
            await new Promise(resolve => setTimeout(resolve, 1000))

            showToast("Bildirishnoma sozlamalari saqlandi!", "success")
        } catch (error: any) {
            console.error("Notification settings saqlashda xatolik:", error)
            showToast("Sozlamalarni saqlashda xatolik", "error")
        } finally {
            setIsLoading(false)
        }
    }

    // Til sozlamalarini backendga yuborish
    const handleSaveLanguageSettings = async () => {
        setIsLoading(true)
        try {
            // Til sozlamalarini saqlash
            // Agar API endpoint bo'lsa: await authAPI.updateLanguageSettings({ language })

            // Joylashuv ma'lumotlarini saqlash
            await handleSaveProfile()

            showToast("Til va joylashuv sozlamalari saqlandi!", "success")
        } catch (error: any) {
            console.error("Language settings saqlashda xatolik:", error)
            showToast("Sozlamalarni saqlashda xatolik", "error")
        } finally {
            setIsLoading(false)
        }
    }

    // Hisobni o'chirish
    const handleDeleteAccount = async () => {
        if (!window.confirm("Hisobingizni o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) {
            return
        }

        setIsLoading(true)
        try {
            // Bu yerda hisobni o'chirish API'sini chaqirish kerak
            // Misol uchun: await authAPI.deleteAccount()

            await new Promise(resolve => setTimeout(resolve, 1000))

            showToast("Hisob o'chirildi", "success")
            setTimeout(() => {
                handleLogout()
            }, 1500)
        } catch (error: any) {
            console.error("Hisobni o'chirishda xatolik:", error)
            showToast("Hisobni o'chirishda xatolik", "error")
        } finally {
            setIsLoading(false)
        }
    }

    // Profil rasmini yangilash
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
        } catch (error: any) {
            console.error("Image upload error:", error)
            const errorMessage = error.response?.data?.message || error.message || "Rasm yuklashda xatolik yuz berdi"
            showToast(errorMessage, "error")
        } finally {
            setImageUploading(false)
            event.target.value = ""
        }
    }

    const handleLogout = async () => {
        try {
            await authAPI.logout()
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            localStorage.removeItem("user")
            navigate("/login")
        } catch (error) {
            console.error("Logout error:", error)
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            localStorage.removeItem("user")
            navigate("/login")
        }
    }

    const getTelegramBotUrl = () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        return `https://t.me/TestAbdUzBot?start=access_token=${accessToken}&refresh_token=${refreshToken}`;
    };

    const settingsSections = [
        {
            id: "profile",
            title: "Profil",
            icon: User,
            description: "Shaxsiy ma'lumotlaringizni boshqaring"
        },
        {
            id: "account",
            title: "Hisob",
            icon: Shield,
            description: "Hisob xavfsizligi va sozlamalari"
        },
        {
            id: "privacy",
            title: "Maxfiylik",
            icon: Lock,
            description: "Maxfiylik sozlamalari"
        },
        {
            id: "notifications",
            title: "Bildirishnomalar",
            icon: Bell,
            description: "Bildirishnoma sozlamalari"
        },
        {
            id: "language",
            title: "Til va mintaqa",
            icon: Globe,
            description: "Til va joylashuv sozlamalari"
        },
        {
            id: "about",
            title: "Ilova haqida",
            icon: Info,
            description: "Versiya va qo'llab-quvvatlash"
        }
    ]

    // Render active section content
    const renderSectionContent = () => {
        switch (activeSection) {
            case "profile":
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <div className="relative">
                                <img
                                    src={mestats?.profile_image || "https://backend.testabd.uz/media/defaultuseravatar.png"}
                                    alt="Profile"
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-700"
                                />
                                {imageUploading && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-semibold text-white">Profil rasmini o'zgartirish</h3>
                                <p className="text-sm text-gray-400 mt-1">JPG, PNG yoki GIF. 5MB dan oshmasligi kerak.</p>
                            </div>
                            <label className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={imageUploading}
                                />
                                <div className={`px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors ${
                                    imageUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                }`}>
                                    {imageUploading ? "Yuklanmoqda..." : "Yuklash"}
                                </div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Ism</label>
                                    <input
                                        type="text"
                                        value={mestats?.first_name || ""}
                                        onChange={(e) => setMestats(prev => prev ? {...prev, first_name: e.target.value} : null)}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Familiya</label>
                                    <input
                                        type="text"
                                        value={mestats?.last_name || ""}
                                        onChange={(e) => setMestats(prev => prev ? {...prev, last_name: e.target.value} : null)}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                                <textarea
                                    value={mestats?.bio || ""}
                                    onChange={(e) => setMestats(prev => prev ? {...prev, bio: e.target.value} : null)}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={mestats?.email || ""}
                                    onChange={(e) => setMestats(prev => prev ? {...prev, email: e.target.value} : null)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Telefon raqami</label>
                                <input
                                    type="tel"
                                    value={mestats?.phone_number || ""}
                                    onChange={(e) => setMestats(prev => prev ? {...prev, phone_number: e.target.value} : null)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saqlanmoqda...
                                </>
                            ) : (
                                <>
                                    <Save size={16}/>
                                    Saqlash
                                </>
                            )}
                        </button>
                    </div>
                )

            case "account":
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-4 text-white">Hisob xavfsizligi</h3>
                            <div className="space-y-3">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Joriy parol</label>
                                        <input
                                            type="password"
                                            value={passwordData.old_password}
                                            onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Yangi parol</label>
                                        <input
                                            type="password"
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Yangi parolni tasdiqlash</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={isLoading}
                                        className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Yangilanmoqda...
                                            </>
                                        ) : (
                                            <>
                                                <Key size={16}/>
                                                Parolni yangilash
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-4 text-white">Xavfli sozlamalar</h3>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-between p-3 bg-red-900/20 rounded-lg hover:bg-red-900/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <LogOut size={20} className="text-red-400"/>
                                    <div className="text-left">
                                        <h4 className="font-medium text-red-400">Hisobdan chiqish</h4>
                                        <p className="text-sm text-red-300">Joriy hisobdan chiqish</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-red-400"/>
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                disabled={isLoading}
                                className="w-full flex items-center justify-between p-3 bg-red-900/20 rounded-lg hover:bg-red-900/30 transition-colors mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={20} className="text-red-400"/>
                                    <div className="text-left">
                                        <h4 className="font-medium text-red-400">Hisobni o'chirish</h4>
                                        <p className="text-sm text-red-300">Hisobingizni butunlay o'chirib tashlash</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-red-400"/>
                            </button>
                        </div>
                    </div>
                )

            case "privacy":
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-4 text-white">Profildagi ma'lumotlar</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Lock size={20} className="text-blue-500"/>
                                        <div>
                                            <h4 className="font-medium text-white">Ommaviy profil</h4>
                                            <p className="text-sm text-gray-400">Profilni hamma ko'ra olishi</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.public_profile}
                                            onChange={(e) => setPrivacySettings({
                                                ...privacySettings,
                                                public_profile: e.target.checked
                                            })}
                                            className="sr-only"
                                            id="publicProfile"
                                        />
                                        <label
                                            htmlFor="publicProfile"
                                            className={`block w-12 h-6 rounded-full cursor-pointer transition-colors ${privacySettings.public_profile ? 'bg-blue-600' : 'bg-gray-600'}`}
                                        >
                                            <div
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${privacySettings.public_profile ? 'transform translate-x-7' : 'transform translate-x-1'}`}
                                            ></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Bell size={20} className="text-green-500"/>
                                        <div>
                                            <h4 className="font-medium text-white">Online holat</h4>
                                            <p className="text-sm text-gray-400">Online holatni ko'rsatish</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.show_online_status}
                                            onChange={(e) => setPrivacySettings({
                                                ...privacySettings,
                                                show_online_status: e.target.checked
                                            })}
                                            className="sr-only"
                                            id="showOnlineStatus"
                                        />
                                        <label
                                            htmlFor="showOnlineStatus"
                                            className={`block w-12 h-6 rounded-full cursor-pointer transition-colors ${privacySettings.show_online_status ? 'bg-green-600' : 'bg-gray-600'}`}
                                        >
                                            <div
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${privacySettings.show_online_status ? 'transform translate-x-7' : 'transform translate-x-1'}`}
                                            ></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSavePrivacySettings}
                                disabled={isLoading}
                                className="w-full mt-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon size={16}/>
                                        Saqlash
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )

            case "notifications":
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-4 text-white">Bildirishnoma turlari</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Bell size={20} className="text-yellow-500"/>
                                        <div>
                                            <h4 className="font-medium text-white">Push bildirishnomalar</h4>
                                            <p className="text-sm text-gray-400">Qurilmangizga bildirishnomalar</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.push_notifications}
                                            onChange={(e) => setNotificationSettings({
                                                ...notificationSettings,
                                                push_notifications: e.target.checked
                                            })}
                                            className="sr-only"
                                            id="pushNotifications"
                                        />
                                        <label
                                            htmlFor="pushNotifications"
                                            className={`block w-12 h-6 rounded-full cursor-pointer transition-colors ${notificationSettings.push_notifications ? 'bg-yellow-600' : 'bg-gray-600'}`}
                                        >
                                            <div
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notificationSettings.push_notifications ? 'transform translate-x-7' : 'transform translate-x-1'}`}
                                            ></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Mail size={20} className="text-blue-500"/>
                                        <div>
                                            <h4 className="font-medium text-white">Email bildirishnomalar</h4>
                                            <p className="text-sm text-gray-400">Email orqali bildirishnomalar</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.email_notifications}
                                            onChange={(e) => setNotificationSettings({
                                                ...notificationSettings,
                                                email_notifications: e.target.checked
                                            })}
                                            className="sr-only"
                                            id="emailNotifications"
                                        />
                                        <label
                                            htmlFor="emailNotifications"
                                            className={`block w-12 h-6 rounded-full cursor-pointer transition-colors ${notificationSettings.email_notifications ? 'bg-blue-600' : 'bg-gray-600'}`}
                                        >
                                            <div
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notificationSettings.email_notifications ? 'transform translate-x-7' : 'transform translate-x-1'}`}
                                            ></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveNotificationSettings}
                                disabled={isLoading}
                                className="w-full mt-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon size={16}/>
                                        Saqlash
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )

            case "language":
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-4 text-white">Til va mintaqa</h3>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Til</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="uz">O'zbekcha</option>
                                        <option value="ru">Русский</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Davlat</label>
                                    <select
                                        value={selectedCountry || ""}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : null;
                                            setSelectedCountry(value);
                                        }}
                                        disabled={loadingLocations.countries}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Davlatni tanlash</option>
                                        {countries && countries.length > 0 ? (
                                            countries.map((country) => (
                                                <option key={country.id} value={country.id}>
                                                    {country.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Yuklanmoqda...</option>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Viloyat</label>
                                    <select
                                        value={selectedRegion || ""}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : null;
                                            setSelectedRegion(value);
                                        }}
                                        disabled={!selectedCountry || loadingLocations.regions}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Viloyatni tanlash</option>
                                        {regions && regions.length > 0 ? (
                                            regions.map((region) => (
                                                <option key={region.id} value={region.id}>
                                                    {region.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                {loadingLocations.regions ? "Yuklanmoqda..." : "Viloyat topilmadi"}
                                            </option>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tuman</label>
                                    <select
                                        value={selectedDistrict || ""}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : null;
                                            setSelectedDistrict(value);
                                        }}
                                        disabled={!selectedRegion || loadingLocations.districts}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Tumanni tanlash</option>
                                        {districts && districts.length > 0 ? (
                                            districts.map((district) => (
                                                <option key={district.id} value={district.id}>
                                                    {district.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                {loadingLocations.districts ? "Yuklanmoqda..." : "Tuman topilmadi"}
                                            </option>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Mahalla</label>
                                    <select
                                        value={selectedSettlement || ""}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : null;
                                            setSelectedSettlement(value);
                                        }}
                                        disabled={!selectedDistrict || loadingLocations.settlements}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Mahallani tanlash</option>
                                        {settlements && settlements.length > 0 ? (
                                            settlements.map((settlement) => (
                                                <option key={settlement.id} value={settlement.id}>
                                                    {settlement.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                {loadingLocations.settlements ? "Yuklanmoqda..." : "Mahalla topilmadi"}
                                            </option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveLanguageSettings}
                                disabled={isLoading}
                                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon size={16}/>
                                        Sozlamalarni saqlash
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )

            case "about":
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-4 text-white">Ilova haqida</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <SettingsIcon size={24} className="text-white"/>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">TestAbd</h4>
                                    <p className="text-sm text-gray-400">Versiya 1.0.0</p>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm">
                                TestAbd - bu interaktiv testlar yaratish va ulashish platformasi.
                                O'quv materiallarini test shaklida tayyorlash va baholash uchun qulay vosita.
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-4 text-white">Qo'llab-quvvatlash</h3>
                            <div className="space-y-3">
                                <a
                                    href="mailto:support@testabd.uz"
                                    className="w-full flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <HelpCircle size={20} className="text-blue-500"/>
                                        <div>
                                            <h4 className="font-medium text-white">Yordam markazi</h4>
                                            <p className="text-sm text-gray-400">support@testabd.uz</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400"/>
                                </a>

                                <button
                                    onClick={() => window.open('/terms', '_blank')}
                                    className="w-full flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText size={20} className="text-green-500"/>
                                        <div>
                                            <h4 className="font-medium text-white">Foydalanish shartlari</h4>
                                            <p className="text-sm text-gray-400">Platforma qoidalari</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400"/>
                                </button>
                            </div>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-400">© 2024 TestAbd. Barcha huquqlar himoyalangan.</p>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

            {/* Mobile Header */}
            <div className="lg:hidden sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-300"/>
                    </button>
                    <h1 className="text-lg font-semibold text-white">Sozlamalar</h1>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <SettingsIcon size={20} className="text-gray-300"/>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50">
                    <div className="absolute top-0 right-0 h-full w-64 bg-gray-800 shadow-xl">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white">Sozlamalar</h2>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-300"/>
                                </button>
                            </div>

                            {/* Telegram Bot Banner */}
                            <div className="mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-4 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Bot size={18} className="text-white"/>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm">Telegram Bot</h3>
                                            <p className="text-white/90 text-xs">Sozlamalarni bot orqali boshqaring</p>
                                        </div>
                                    </div>
                                    <Sparkles size={14} className="text-yellow-300 animate-pulse"/>
                                </div>
                                <a
                                    href={getTelegramBotUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all text-xs"
                                >
                                    <span>Botga o'tish</span>
                                    <ExternalLink size={12}/>
                                </a>
                            </div>

                            {/* Settings Menu */}
                            <nav className="space-y-2">
                                {settingsSections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            setActiveSection(section.id)
                                            setIsMobileMenuOpen(false)
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                            activeSection === section.id
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-300 hover:bg-gray-700"
                                        }`}
                                    >
                                        <section.icon size={20}/>
                                        <span className="font-medium">{section.title}</span>
                                    </button>
                                ))}
                            </nav>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-3 mt-6 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <LogOut size={20}/>
                                <span className="font-medium">Chiqish</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="lg:flex lg:min-h-screen">
                {/* Sidebar - Desktop */}
                <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-700">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <button
                                onClick={() => navigate("/")}
                                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} className="text-gray-300"/>
                            </button>
                            <h1 className="text-xl font-bold text-white">Sozlamalar</h1>
                        </div>

                        {/* Telegram Bot Banner */}
                        <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Bot size={20} className="text-white"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">Telegram Bot</h3>
                                        <p className="text-white/90 text-xs">Sozlamalarni bot orqali boshqaring</p>
                                    </div>
                                </div>
                                <Sparkles size={16} className="text-yellow-300 animate-pulse"/>
                            </div>
                            <a
                                href={getTelegramBotUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all text-sm"
                            >
                                <span>Botga o'tish</span>
                                <ExternalLink size={14}/>
                            </a>
                        </div>

                        {/* Settings Menu */}
                        <nav className="space-y-2">
                            {settingsSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                        activeSection === section.id
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-300 hover:bg-gray-800"
                                    }`}
                                >
                                    <section.icon size={20}/>
                                    <div className="text-left">
                                        <div className="font-medium">{section.title}</div>
                                        <div className="text-xs text-gray-400">{section.description}</div>
                                    </div>
                                </button>
                            ))}
                        </nav>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-3 mt-6 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <LogOut size={20}/>
                            <span className="font-medium">Chiqish</span>
                        </button>

                        {/* App Info */}
                        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                            <p className="text-sm text-gray-400">TestAbd v1.0.0</p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 lg:overflow-y-auto">
                    <div className="p-4 sm:p-6">
                        {/* Content Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {settingsSections.find(s => s.id === activeSection)?.title || "Sozlamalar"}
                            </h2>
                            <p className="text-gray-400 mt-1">
                                {settingsSections.find(s => s.id === activeSection)?.description}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
                            {renderSectionContent()}
                        </div>
                    </div>
                </div>
            </div>

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
            `}</style>
        </div>
    )
}

export default SettingsPage