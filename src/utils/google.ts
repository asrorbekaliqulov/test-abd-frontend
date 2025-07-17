// src/utils/google.ts
const GOOGLE_CLIENT_ID = '230519657191-gtdi19oinmg2stemopsrcvjrnvjgk6h7.apps.googleusercontent.com';

export const requestGoogleAccessToken = (): Promise<{ access_token: string }> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject("Google API yuklanmagan");
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) {
          resolve(response);
        } else {
          reject("Access token olinmadi");
        }
      }
    });

    // 👇 bu `popup` ochmaydi, o‘sha sahifada token so‘raydi
    client.requestAccessToken();
  });
};
