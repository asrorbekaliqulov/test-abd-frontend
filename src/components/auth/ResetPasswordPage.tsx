import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { passwordResetAPI } from '../../utils/api';

const ResetPasswordPage: React.FC = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { token, contact } = location.state || {};

    useEffect(() => {
        // Check if we have a valid token
        if (!token) {
            navigate('/forgot-password');
        }
    }, [token, navigate]);

    const validatePassword = (password: string) => {
        const errors = [];

        if (password.length < 8) {
            errors.push('Kamida 8 ta belgi');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Kamida 1 ta katta harf');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Kamida 1 ta kichik harf');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Kamida 1 ta raqam');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Kamida 1 ta maxsus belgi');
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Parollar mos kelmaydi');
            return;
        }

        // Validate password strength
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
            setError(`Parol talablari: ${passwordErrors.join(', ')}`);
            return;
        }

        setLoading(true);

        try {
            await passwordResetAPI.resetPassword(token, formData.password);

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.message || 'Parolni o\'zgartirishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const passwordErrors = validatePassword(formData.password);
    const isPasswordValid = passwordErrors.length === 0 && formData.password.length > 0;

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Parol muvaffaqiyatli o'zgartirildi!</h1>
                        <p className="text-gray-600 mb-6">
                            Parolingiz muvaffaqiyatli yangilandi. Endi yangi parol bilan tizimga kirishingiz mumkin.
                        </p>

                        <div className="space-y-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>

                            <p className="text-sm text-gray-500">
                                3 soniyadan keyin kirish sahifasiga yo'naltirilasiz...
                            </p>

                            <Link
                                to="/login"
                                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                            >
                                Hoziroq kirish
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Lock size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Yangi parol yarating</h1>
                    <p className="text-gray-600">
                        {contact && `${contact} uchun yangi parol o'rnating`}
                    </p>
                </div>

                {/* Reset Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Yangi parol
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
                                    placeholder="Yangi parolni kiriting"
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

                            {/* Password Requirements */}
                            {formData.password && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Parol talablari:</p>
                                    <div className="space-y-1">
                                        {[
                                            { check: formData.password.length >= 8, text: 'Kamida 8 ta belgi' },
                                            { check: /[A-Z]/.test(formData.password), text: 'Kamida 1 ta katta harf' },
                                            { check: /[a-z]/.test(formData.password), text: 'Kamida 1 ta kichik harf' },
                                            { check: /[0-9]/.test(formData.password), text: 'Kamida 1 ta raqam' },
                                            { check: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), text: 'Kamida 1 ta maxsus belgi' }
                                        ].map((requirement, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${requirement.check ? 'bg-green-100' : 'bg-gray-100'
                                                    }`}>
                                                    {requirement.check && <CheckCircle size={12} className="text-green-600" />}
                                                </div>
                                                <span className={`text-xs ${requirement.check ? 'text-green-600' : 'text-gray-500'
                                                    }`}>
                                                    {requirement.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Parolni tasdiqlang
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

                            {/* Password Match Indicator */}
                            {formData.confirmPassword && (
                                <div className="mt-2 flex items-center space-x-2">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${formData.password === formData.confirmPassword ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                        {formData.password === formData.confirmPassword ? (
                                            <CheckCircle size={12} className="text-green-600" />
                                        ) : (
                                            <AlertCircle size={12} className="text-red-600" />
                                        )}
                                    </div>
                                    <span className={`text-xs ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {formData.password === formData.confirmPassword ? 'Parollar mos keladi' : 'Parollar mos kelmaydi'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isPasswordValid || formData.password !== formData.confirmPassword}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Parolni o\'zgartirish'
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

export default ResetPasswordPage;