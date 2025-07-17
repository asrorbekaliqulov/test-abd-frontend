import React from 'react';
import { Chrome } from 'lucide-react';
import { requestGoogleAccessToken } from '../utils/google';

interface SocialAuthProps {
    onGoogleLogin: (data: { access_token: string }) => void;
    loading?: boolean;
}

const SocialAuth: React.FC<SocialAuthProps> = ({ onGoogleLogin, loading = false }) => {
    const handleGoogleLogin = async () => {
        try {
            const { access_token } = await requestGoogleAccessToken();
            onGoogleLogin({ access_token }); // backendga yuboriladi
        } catch (err) {
            console.error('Google login xatosi:', err);
        }
    };

    return (
        <div className="space-y-3 mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Yoki</span>
                </div>
            </div>

            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
                ) : (
                    <Chrome size={20} className="mr-3 text-blue-600" />
                )}
                Google orqali kirish
            </button>
        </div>
    );
};

export default SocialAuth;
