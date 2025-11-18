import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { authAPI } from '../../utils/api';

const EmailVerificationPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const { verifyEmail, resendVerificationEmail } = authAPI;
    const { email } = location.state || {};

    const { token } = useParams(); // <-- token URL path'dan olinadi
    
    useEffect(() => {
        if (token) {
            handleVerifyEmail(token);
        }
    }, [token]);


    const handleVerifyEmail = async (verificationToken?: string) => {
        setLoading(true);
        setError('');

        try {
            const res = await verifyEmail(verificationToken || '');
            const { access, refresh, email } = res.data;

            setVerified(true);
            // Tokenlarni localStorage yoki contextga yozing
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem("email_verified", "true");
            localStorage.setItem("verified_email", email);

            setTimeout(() => {
                navigate('/login', {
                    state: {
                        verified: true,
                    },
                });
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Email tasdiqlashda xatolik yuz berdi.');
        } finally {
            setLoading(false);
        }
    };


    const resendEmail = async () => {
        setLoading(true);
        setError('');

        try {
            await resendVerificationEmail(email);
        } catch (err: any) {
            setError(err.message || 'Email qaytadan yuborishda xatolik yuz berdi.');
        } finally {
            setLoading(false);
        }
    };

    if (verified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Email tasdiqlandi!</h1>
                        <p className="text-gray-600 mb-6">
                            Email manzilingiz muvaffaqiyatli tasdiqlandi. Endi profilingiz ga kiring.
                        </p>

                        <div className="space-y-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>

                            <p className="text-sm text-gray-500">
                                3 soniyadan keyin login sahifasiga yo'naltirilasiz...
                            </p>

                            <button
                                onClick={() => navigate('/login', { state: { email, verified: true } })}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>Login</span>
                                <ArrowRight size={20} />
                            </button>
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
                        <Mail size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Email tasdiqlash</h1>
                    <p className="text-gray-600">
                        {email ? `${email} manziliga yuborilgan havolani bosing` : 'Email manzilingizni tasdiqlang'}
                    </p>
                </div>

                {/* Verification Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <Mail size={32} className="text-blue-600" />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email tasdiqlash</h3>
                            <p className="text-gray-600 text-sm">
                                Email manzilingizga tasdiqlash havolasi yuborildi. Havolani bosib, emailingizni tasdiqlang.
                            </p>
                        </div>

                        {!token && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">
                                    Email kelmadimi? Spam papkasini tekshiring yoki qaytadan yuboring.
                                </p>

                                <button
                                    onClick={resendEmail}
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Emailni qaytadan yuborish'
                                    )}
                                </button>
                            </div>
                        )}

                        {token && (
                            <button
                                onClick={() => verifyEmail(token)}
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Emailni tasdiqlash'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPage;