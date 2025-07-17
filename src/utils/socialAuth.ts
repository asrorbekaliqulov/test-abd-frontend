// Real Google OAuth configuration
export interface GoogleConfig {
  clientId: string;
  redirectUri: string;
}

export interface FacebookConfig {
  appId: string;
  version: string;
}

export interface TelegramConfig {
  botName: string;
}

// Real Google OAuth 2.0 configuration
export const googleConfig: GoogleConfig = {
  clientId: "YOUR_CLIENT_ID.apps.googleusercontent.com", // Replace with your Google Client ID
  redirectUri: window.location.origin + "/auth/google/callback"
};

// Facebook SDK configuration (you'll need to set up Facebook app)
export const facebookConfig: FacebookConfig = {
  appId: "YOUR_FACEBOOK_APP_ID", // Replace with your Facebook App ID
  version: "v18.0"
};

// Telegram Bot configuration (you'll need to set up Telegram bot)
export const telegramConfig: TelegramConfig = {
  botName: "YOUR_BOT_NAME" // Replace with your bot name from @BotFather
};

// Google OAuth URL creation

export const createGoogleAuthUrl = () => {
  const scope = encodeURIComponent('openid email profile');
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleConfig.clientId}&redirect_uri=${googleConfig.redirectUri}&response_type=code&scope=${scope}&prompt=consent&access_type=offline`;
};


// Popup ochib Google auth URL ga redirect qiladi
export const handleGoogleLogin = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const authUrl = createGoogleAuthUrl(); // bu URL ichida `redirect_uri` va `scope` bo'lishi kerak

    const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');

    if (!popup) return reject(new Error('Popup blocked'));

    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        window.removeEventListener('message', messageListener);
        popup.close();
        resolve(event.data.data);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', messageListener);
        popup.close();
        reject(new Error(event.data.error));
      }
    };

    window.addEventListener('message', messageListener);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        reject(new Error('Authentication cancelled'));
      }
    }, 1000);
  });
};
  

// Facebook SDK loading
export const loadFacebookSDK = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: facebookConfig.appId,
        cookie: true,
        xfbml: true,
        version: facebookConfig.version
      });
      resolve();
    };

    // Load Facebook SDK script
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.head.appendChild(script);
  });
};

// Facebook login handler
export const handleFacebookLogin = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    loadFacebookSDK().then(() => {
      window.FB.login((response: any) => {
        if (response.authResponse) {
          // Get user info
          window.FB.api('/me', { fields: 'name,email,picture' }, (userInfo: any) => {
            resolve({
              id: userInfo.id,
              name: userInfo.name,
              email: userInfo.email,
              picture: userInfo.picture?.data?.url,
              access_token: response.authResponse.accessToken
            });
          });
        } else {
          reject(new Error('Facebook login failed'));
        }
      }, { scope: 'email' });
    });
  });
};

// Telegram Widget loading
export const loadTelegramWidget = (containerId: string, onAuth: (user: any) => void): void => {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', telegramConfig.botName);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');
  script.setAttribute('data-request-access', 'write');
  
  // Global callback function
  (window as any).onTelegramAuth = onAuth;
  
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = ''; // Clear previous widget
    container.appendChild(script);
  }
};

// Handle authorization code from Google redirect
export const handleGoogleCallback = async (code: string) => {
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleConfig.clientId,
        client_secret: 'YOUR_CLIENT_SECRET',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: googleConfig.redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userResponse.json();

    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      access_token: tokens.access_token,
    };
  } catch (error) {
    console.error('Google callback error:', error);
    throw error;
  }
};

// Type definitions for global objects
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}