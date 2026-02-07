import { useState, useEffect } from 'react';
import { loginWithGoogle } from '../../services/auth.server';
import './googleSSO.css';

interface GoogleSSOButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectUrl?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleSSOButton({
  onSuccess,
  onError,
  redirectUrl = '/dashboard'
}: GoogleSSOButtonProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize Google Auth
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID_HERE", // Ideally from env
          callback: handleCredentialResponse
        });

        // Render button
        const btnContainer = document.getElementById("googleSyncBtn");
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: "outline", size: "large", width: "100%" }
          );
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      setError(null);
      const { credential } = response;

      // Call backend with token
      const data = await loginWithGoogle(credential);

      // Update local storage and context
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Force redirect to load user data/app state fresh
        window.location.href = redirectUrl;
      }

      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error("Google Login Error:", err);
      const msg = err.response?.data?.message || "Google login failed";
      setError(msg);
      if (onError) onError(msg);
    }
  };

  return (
    <div className="google-sso-container">
      <div id="googleSyncBtn" style={{ width: '100%' }}></div>
      {error && (
        <div className="google-sso-error" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
