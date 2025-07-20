import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { passwordResetAPI } from '../../utils/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email/phone, 2: code verification
  const [error, setError] = useState('');
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();

  // Timer for resend code
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const contact = method === 'email' ? email : phone;
      await passwordResetAPI.sendResetCode(contact, method);
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError('Kod yuborishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('6 raqamli kodni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await passwordResetAPI.verifyResetCode(code);
      if (result.success) {
        navigate('/reset-password', {
          state: {
            token: result.token,
            contact: method === 'email' ? email : phone
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Kodni tekshirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (method === 'email' && !email) {
        setError('Email manzilingizni kiriting');
        return;
      }
      if (method === 'sms' && !phone) {
        setError('Telefon raqamingizni kiriting');
        return;
      }
      await sendCode();
    } else {
      await verifyCode();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            {step === 1 ? (
              <Mail size={32} className="text-white" />
            ) : (
              <MessageSquare size={32} className="text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Parolni unutdingizmi?' : 'Kodni tasdiqlang'}
          </h1>
          <p className="text-gray-600">
            {step === 1
              ? 'Parolni tiklash uchun email yoki telefon raqamingizni kiriting'
              : `${method === 'email' ? email : phone} ga yuborilgan kodni kiriting`
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
                {/* Method Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`p-4 rounded-lg border-2 transition-all ${method === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Mail size={24} className="mx-auto mb-2" />
                    <span className="text-sm font-medium">Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('sms')}
                    className={`p-4 rounded-lg border-2 transition-all ${method === 'sms'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <MessageSquare size={24} className="mx-auto mb-2" />
                    <span className="text-sm font-medium">SMS</span>
                  </button>
                </div>

                {method === 'email' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email manzili
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={20} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Email manzilingizni kiriting"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon raqami
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MessageSquare size={20} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tasdiqlash kodi</h3>
                  <p className="text-gray-600 text-sm">
                    6 raqamli kodni kiriting
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasdiqlash kodi
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-gray-500 text-sm">
                      Qaytadan yuborish: {formatTime(resendTimer)}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Kodni qaytadan yuborish
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                step === 1 ? 'Kod yuborish' : 'Tasdiqlash'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft size={16} />
              <span>Kirish sahifasiga qaytish</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;