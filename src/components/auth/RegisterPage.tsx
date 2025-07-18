import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight, AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { checkUsername, authAPI } from '../../utils/api';

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Region {
  id: number;
  name: string;
  country: number;
}

interface District {
  id: number;
  name: string;
  region: number;
}

interface Settlement {
  id: number;
  name: string;
  district: number;
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
  const [step, setStep] = useState(emailVerified ? 2 : 1);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'not_valid' | 'error'>('idle');
  // const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  // Location data
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const navigate = useNavigate();

  // Load countries on component mount
  useEffect(() => {
    authAPI.getCountry()
      .then(response => {
        setCountries(response.data); // <-- .data orqali olamiz
      })
      .catch(err => {
        console.error('Error loading countries:', err);
      });
  }, []);
  
  // Load regions when country changes
  useEffect(() => {
    if (formData.country) {
      authAPI.getRegion(parseInt(formData.country)).then(response => {
        setRegions(response.data);
        setDistricts([]);
        setSettlements([]);
        setFormData(prev => ({ ...prev, region: '', district: '', settlement: '' }));
      }).catch(err => {
        console.error('Error loading regions:', err);
        setRegions([]);
      });
    } else {
      setRegions([]);
      setDistricts([]);
      setSettlements([]);
    }
  }, [formData.country]);

  // Load districts when region changes
  useEffect(() => {
    if (formData.region) {
      authAPI.getDistrict(parseInt(formData.region)).then(response => {
        setDistricts(response.data);
        setSettlements([]);
        setFormData(prev => ({ ...prev, district: '', settlement: '' }));
      }).catch(err => {
        console.error('Error loading districts:', err);
        setDistricts([]);
      });
    } else {
      setDistricts([]);
      setSettlements([]);
    }
  }, [formData.region]);

  // Load settlements when district changes
  useEffect(() => {
    if (formData.district) {
      authAPI.getSettlement(parseInt(formData.district)).then(response => {
        setSettlements(response.data);
        setFormData(prev => ({ ...prev, settlement: '' }));
      }).catch(err => {
        console.error('Error loading settlements:', err);
        setSettlements([]);
      });
    } else {
      setSettlements([]);
    }
  }, [formData.district]);

  // Handle email verification on page load
  useEffect(() => {
    if (emailVerified && verificationToken) {
      // Email has been verified, show step 2
      setStep(2);
    }
  }, [emailVerified, verificationToken]);

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
      // Step 1: Initial registration
      if (formData.password !== formData.confirmPassword) {
        setError('Parollar mos kelmaydi');
        return;
      }
      if (formData.password.length < 8) {
        setError('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
        return;
      }
      if (passwordStrength < 75){
        console.log(passwordStrength)
        setError("Ushbu parol juda kuchsiz boshqasini yarating");
        return;
      }
      if (usernameStatus !== 'available') {
        setError("Bu foydalanuvchi nomi band boshqasini tanlang");
        return;
      }
      if (!isValidUsername(formData.username)) {
        setError("Foydalanuvchi nomida faqat harflar, raqamlar, '.' va '_' bo'lishi mumkin. Ketma-ket yoki noto‘g‘ri joylashgan belgilarga ruxsat yo‘q.");
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Send initial registration request
        const data = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          verification_token: verificationToken || undefined
        };
        // if (verificationToken !== undefined) {
        //   data.verification_token = verificationToken;
        // }
        console.log('Registering with data:', data);
        const res = await authAPI.register(data);
        console.log(res)
        setEmailSent(true);
        console.log('Registration email sent to:', formData.email);
      } catch (err: any) {
        setError(err.response?.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 2) {
      // Step 2: Complete profile
      setLoading(true);
      setError('');

      try {
        const completeData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number || undefined,
          country: formData.country ? parseInt(formData.country) : undefined,
          region: formData.region ? parseInt(formData.region) : undefined,
          district: formData.district ? parseInt(formData.district) : undefined,
          settlement: formData.settlement ? parseInt(formData.settlement) : undefined
        };

        // Update user profile
        await authAPI.updateProfile(completeData);

        // Navigate to success or login page
        navigate('/login?registered=true');
      } catch (err: any) {
        setError(err.message || 'Profil ma\'lumotlarini saqlashda xatolik yuz berdi');
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

  // Step 1: Email sent confirmation
  if (step === 1 && emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
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
                    console.log('Resending email...');
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
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">T</span>
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
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
              {step > 1 ? <CheckCircle size={16} /> : '1'}
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
              2
            </div>
          </div>
        </div>

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
                      className={`block w-full pl-3 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${usernameStatus === 'available' ? 'border-green-300' :
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Email manzilingizni kiriting"
                    />
                  </div>
                </div>

                {/* Password Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                  </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ism
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Ismingiz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Familiya
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Familiyangiz"
                    />
                  </div>
                </div>

                {/* Phone (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon raqami (ixtiyoriy)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                </div>

                {/* Location Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mamlakat
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Mamlakatni tanlang</option>
                      {countries.map(country => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.country && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Viloyat
                      </label>
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Viloyatni tanlang</option>
                        {regions.map(region => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.region && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tuman
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Tumanni tanlang</option>
                        {districts.map(district => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.district && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aholi punkti
                      </label>
                      <select
                        name="settlement"
                        value={formData.settlement}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Aholi punktini tanlang</option>
                        {settlements.map(settlement => (
                          <option key={settlement.id} value={settlement.id}>
                            {settlement.name}
                          </option>
                        ))}
                      </select>
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