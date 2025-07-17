import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../utils/api';
import SocialAuth from '../SocialAuth';

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

  // Location data
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();

  // Load countries on component mount
  useEffect(() => {
    authAPI.getCountry().then(data => {
      setCountries(data);
    }).catch(err => {
      console.error('Error loading countries:', err);
    });
  }, []);

  // Load regions when country changes
  useEffect(() => {
    if (formData.country) {
      authAPI.getRegion(parseInt(formData.country)).then(data => {
        setRegions(data.results);
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
      authAPI.getDistrict(parseInt(formData.region)).then(data => {
        setDistricts(data);
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
      authAPI.getSettlement(parseInt(formData.district)).then(data => {
        setSettlements(data);
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
        if (verificationToken !== undefined) {
          data.verification_token = verificationToken;
        }
        console.log('Registering with data:', data);
        await authAPI.register(data);

        setEmailSent(true);
        console.log('Registration email sent to:', formData.email);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSocialLogin = async (provider: string, data: any) => {
    setLoading(true);
    setError('');

    try {
      await socialLogin(provider, data);
      navigate('/');
    } catch (err: any) {
      setError(`${provider} orqali ro'yxatdan o'tishda xatolik yuz berdi`);
    } finally {
      setLoading(false);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foydalanuvchi nomi *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Foydalanuvchi nomini kiriting"
                    />
                  </div>
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

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parol *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Parol yarating"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parolni tasdiqlang *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Parolni qaytadan kiriting"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
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
          {step === 1 && (
            <SocialAuth
              onGoogleLogin={(data) => handleSocialLogin('google', data)}
              onFacebookLogin={(data) => handleSocialLogin('facebook', data)}
              onTelegramLogin={(data) => handleSocialLogin('telegram', data)}
              loading={loading}
            />
          )}

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