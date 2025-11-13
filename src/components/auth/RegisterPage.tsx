import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle, ExternalLink, Loader2, X } from 'lucide-react';
import { checkUsername, checkReferral, authAPI, checkEmail } from '../../utils/api';
import letterT from "../assets/images/logo.png";

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-8 right-4 z-50 p-4 rounded-lg shadow-lg ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        } animate-slide-in`}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailVerified = searchParams.get('verified') === 'true';
  const verificationToken = searchParams.get('token');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    country: '',
    region: '',
    district: '',
    settlement: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'not_valid' | 'error'>('idle');

  // Refrral states
  const [hasReferral, setHasReferral] = useState(false);
  const [referral, setReferral] = useState('');
  const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'error'>('idle');
  const [referralCheckTimeout, setReferralCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Location data
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const navigate = useNavigate();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
  }

  // Handle email verification on page load
  useEffect(() => {
    if (emailVerified && verificationToken) {
      // Email has been verified, show step 2
        navigate('/login?registered=true');
    }
  }, [emailVerified, navigate, verificationToken]);

  const isValidUsername = (username: string): boolean => {
    // Harflar, raqamlar, _ va . dan boshqa belgilar bo'lmasligi kerak
    const allowedPattern = /^[a-zA-Z0-9._]+$/;
    if (!allowedPattern.test(username)) return false;

    // Ketma-ket _, ., _., ._ bo'lmasligi kerak
    const invalidSequencePattern = /(__|\.\.|_\.)|(\._)/;
    if (invalidSequencePattern.test(username)) return false;

    // Boshi yoki oxiri . yoki _ bilan tugamasligi kerak
    if (/^[._]/.test(username) || /[._]$/.test(username)) return false;

    // Eng kamida 3 ta belgi bo'lishi kerak
    if (username.length < 5) return false;

    return true;
  };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            if (formData.password !== formData.confirmPassword) {
                setError('Parollar mos kelmaydi');
                return;
            }
            if (formData.password.length < 8) {
                setError('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
                return;
            }
            if (passwordStrength < 75) {
                setError("Ushbu parol juda kuchsiz, boshqasini yarating");
                return;
            }
            if (usernameStatus !== 'available') {
                setError("Bu foydalanuvchi nomi band, boshqasini tanlang");
                return;
            }
            if (!isValidUsername(formData.username)) {
                setError("Foydalanuvchi nomida faqat harflar, raqamlar, '.' va '_' bo'lishi mumkin. Ketma-ket yoki noto‘g‘ri joylashgan belgilarga ruxsat yo‘q.");
                return;
            }
            if (await checkEmail(formData.email) === false) {
                setError("Ushbu email allaqachon ro'yxatdan o'tgan");
                return;
            }
            if (hasReferral && referral && referralStatus !== 'valid') {
                setError("Promocod yaroqsiz yoki tekshirilmagan");
                return;
            }

            setLoading(true);
            setError('');

            try {
                const data = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    verification_token: verificationToken || undefined,
                    referral_code: hasReferral && referral ? referral : undefined
                };
                await authAPI.register(data);

                // Email yuborildi
                setEmailSent(true);
                showToast("Siz ro'yxatdan o'tganligingiz uchun 5 coin hisobingizga o'tqazildi", "success");

                // Bu yerda **login sahifasiga yo‘naltirish** faqat foydalanuvchi emailni tasdiqlagandan keyin bo‘ladi
                // Ya'ni `emailSent` === true bo‘lsa, confirmation UI chiqadi
            } catch (err: any) {
                setError(err.response?.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
            } finally {
                setLoading(false);
            }
        }
    };


    const checkUsernameStatus = async (username: string) => {
    if (username.length < 5) {
      setUsernameStatus('idle');
      return;
    }
    if (!isValidUsername(username)) {
      setUsernameStatus("not_valid")
      return;
    }

    setUsernameStatus('checking');

    try {
      const available = await checkUsername(username); // siz bergan tayyor funksiya
      setUsernameStatus(available ? 'available' : 'taken');
    } catch (error) {
      // Fallback logic (ixtiyoriy)
      const fallback = ['admin', 'test', 'user', 'demo', 'root'];
      setUsernameStatus(
        fallback.includes(username.toLowerCase()) ? 'taken' : 'available'
      );
    }
  };

  const checkReferralStatus = async (code: string) => {
    if (code.length < 3) {
      setReferralStatus('idle');
      return;
    }

    setReferralStatus('checking');

    try {
      const isValid = await checkReferral(code);

      setReferralStatus(isValid ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Error checking referral code:', error);
      setReferralStatus('error');
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    if (name === 'username') {
      checkUsernameStatus(value)
    }

    if (error) setError('');
  };

  const handleReferralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReferral(value);

    // Clear previous timeout
    if (referralCheckTimeout) {
      clearTimeout(referralCheckTimeout);
    }

    // Set new timeout for 1 second delay
    const timeout = setTimeout(() => {
      if (value.trim()) {
        checkReferralStatus(value.trim());
      } else {
        setReferralStatus('idle');
      }
    }, 1000);

    setReferralCheckTimeout(timeout);
  };
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'taken':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'not_valid':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <User className="h-5 w-5 text-gray-400" />;
    }
  };

  const getUsernameStatusMessage = () => {
    switch (usernameStatus) {
      case 'checking':
        return <span className="text-sm text-gray-500">Mavjudligi tekshirilmoqda...</span>;
      case 'available':
        return <span className="text-sm text-green-600">Foydalanuvchi nomi mavjud!</span>;
      case 'taken':
        return <span className="text-sm text-red-600">Foydalanuvchi nomi allaqachon olingan</span>;
      case 'error':
        return <span className="text-sm text-orange-600">Foydalanuvchi nomini tekshirishda xatolik yuz berdi</span>;
      case 'not_valid':
        return <span className="text-sm text-red-600">Foydalanuvchi nomi yaroqsiz</span>;
      default:
        return null;
    }
  };

  const getReferralStatusIcon = () => {
    switch (referralStatus) {
      case 'checking':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getReferralStatusMessage = () => {
    switch (referralStatus) {
      case 'checking':
        return <span className="text-sm text-gray-500">Taklif havolasi tekshirilmoqda...</span>;
      case 'valid':
        return <span className="text-sm text-green-600">Taklif havola yaroqli!</span>;
      case 'invalid':
        return <span className="text-sm text-red-600">Taklif havola topilmadi</span>;
      case 'error':
        return <span className="text-sm text-orange-600">Taklif havolani tekshirishda xatolik yuz berdi</span>;
      default:
        return null;
    }
  };

  // Step 1: Email sent confirmation
  if (step === 1 && emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email tasdiqlash</h1>
            <p className="text-gray-600">Emailingizni tekshiring va tasdiqlash havolasini bosing</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tasdiqlash havolasi yuborildi!</h3>
              <p className="text-gray-600 text-sm mb-4">
                <strong>{formData.email}</strong> manziliga tasdiqlash havolasi yuborildi.
              </p>
              <p className="text-gray-500 text-sm">
                Emailingizni tekshiring va havolani bosib ro'yxatdan o'tishni yakunlang.
              </p>
            </div>

            <div className="space-y-4">
              <a
                href="https://gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
              >
                <Mail size={20} />
                <span>Emailga o'tish</span>
                <ExternalLink size={16} />
              </a>

              <button
                onClick={() => setEmailSent(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Orqaga qaytish
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Email kelmadimi?{' '}
                <button
                  onClick={() => {
                    // Resend email logic here
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Qaytadan yuborish
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white"><img src={letterT} draggable={false} className={"flex w-16 h-16"} loading={"lazy"} decoding={"async"} alt="t"/></span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? "TestAbd'ga qo'shiling" : "Profilingizni to'ldiring"}
          </h1>
          <p className="text-gray-600">
            {step === 1
              ? "Hisobingizni yaratish uchun ma'lumotlarni kiriting"
              : "Shaxsiy ma'lumotlaringizni to'ldiring"
            }
          </p>
        </div>

        {/* Progress Indicator */}


        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`block w-full pl-3 outline-none pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${usernameStatus === 'available' ? 'border-green-300' :
                        usernameStatus === 'taken' ? 'border-red-300' :
                          usernameStatus === 'error' ? 'border-orange-300' :
                            usernameStatus === 'not_valid' ? 'border-red-300' :
                              'border-gray-300'
                        }`}
                      placeholder="Noyob foydalanuvchi nomini tanlang"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {getUsernameStatusIcon()}
                    </div>
                  </div>
                  {getUsernameStatusMessage()}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email manzili *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Email manzilingizni kiriting"
                    />
                  </div>
                </div>

                {/* Password Fields */}
                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Parol *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-12 py-3 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Kuchli parol yarating"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Parolni tasdiqlang *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-12 py-3 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Parolingizni tasdiqlang"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <div className="mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Parollar mos keladi</span>
                      </div>
                    )}
                  </div>

                {/* Referral Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      id="hasReferral"
                      type="checkbox"
                      checked={hasReferral}
                      onChange={(e) => {
                        setHasReferral(e.target.checked);
                        if (!e.target.checked) {
                          setReferral('');
                          setReferralStatus('idle');
                          if (referralCheckTimeout) {
                            clearTimeout(referralCheckTimeout);
                          }
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="hasReferral" className="text-sm font-medium text-gray-700">
                      Menda referral cod bor
                    </label>
                  </div>

                  {hasReferral && (
                    <div className="animate-slide-down">
                      <label htmlFor="referral" className="block text-sm font-medium text-gray-700 mb-2">
                        Referral cod
                      </label>
                      <div className="relative">
                        <input
                          id="referral"
                          name="referral"
                          type="text"
                          value={referral}
                          onChange={handleReferralChange}
                          className={`block w-full px-3 py-3 border outline-none rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${referralStatus === 'valid' ? 'border-green-300 bg-green-50' :
                              referralStatus === 'invalid' ? 'border-red-300 bg-red-50' :
                                referralStatus === 'error' ? 'border-orange-300 bg-orange-50' :
                                  'border-gray-300'
                            }`}
                          placeholder="Referral codni kiriting"
                        />
                        {referral && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {getReferralStatusIcon()}
                          </div>
                        )}
                      </div>
                      {referral && getReferralStatusMessage()}
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {step === 1 ? 'Ro\'yxatdan o\'tish' : 'Profilni saqlash'}
                  </span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Social Login - only show on first step */}


          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Hisobingiz bormi?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Kirish
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;