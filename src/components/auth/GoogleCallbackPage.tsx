import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

const GoogleCallbackPage: React.FC = () => {
    // const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const error = urlParams.get('error');

                if (error) {
                    // Send error to parent window
                    window.opener?.postMessage({
                        type: 'GOOGLE_AUTH_ERROR',
                        error: error
                    }, window.location.origin);
                    window.close();
                    return;
                }

                if (code) {
                    // Exchange code for user info (simplified for demo)
                    const response = await fetch(`https://oauth2.googleapis.com/token`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            client_id: 'YOUR_CLIENT_ID',
                            client_secret: 'YOUR_CLIENT_SECRET',
                            code: code,
                            grant_type: 'authorization_code',
                            redirect_uri: window.location.origin + '/auth/google/callback'
                        })
                    });

                    const tokenData = await response.json();

                    if (tokenData.access_token) {
                        // instead of sending user object:
                        window.opener?.postMessage({
                            type: 'GOOGLE_AUTH_SUCCESS',
                            access_token: tokenData.access_token // parent oynaga tokenni yuboramiz
                        }, window.location.origin);
                          

                        window.close();}
                      
                }
            } catch (error) {
                console.error('Google callback error:', error);
                window.opener?.postMessage({
                    type: 'GOOGLE_AUTH_ERROR',
                    error: 'Authentication failed'
                }, window.location.origin);
                window.close();
            }
        };

        handleCallback();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Google orqali kirish...</p>
            </div>
        </div>
    );
};

export default GoogleCallbackPage;