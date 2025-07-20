import React, { useEffect } from 'react';
import { CheckCircle, LogOut } from 'lucide-react';
import { authAPI } from '../../utils/api';

interface LogoutPageProps {
}

const LogoutPage: React.FC<LogoutPageProps> = ({  }) => {


    useEffect(() => {
        // Logout qilish
        authAPI.logout();
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // 3 soniyadan keyin login sahifasiga o'tkazish
        const timer = setTimeout(() => {
            window.location.href = '/login';
        }, 3000);

        return () => clearTimeout(timer);
    }, [authAPI.logout]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>

                    {/* Success Message */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Muvaffaqiyatli chiqildi!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Siz muvaffaqiyatli dasturdan chiqdingiz. Tez orada bosh sahifaga yo'naltirilasiz.
                    </p>

                    {/* Loading Animation */}
                    <div className="flex items-center justify-center space-x-2 mb-6">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>

                    {/* Manual Navigation Button */}
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Bosh sahifaga o'tish
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutPage;