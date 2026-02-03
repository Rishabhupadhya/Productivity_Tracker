import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from "../contexts/UserContext";

/**
 * OAuth Callback Handler
 * Handles redirect from OAuth provider
 * Extracts tokens from URL and authenticates user
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Check for errors from OAuth provider
      const errorParam = searchParams.get('error');
      const errorMessage = searchParams.get('message');

      if (errorParam) {
        let userFriendlyError = 'Authentication failed';

        switch (errorParam) {
          case 'oauth_cancelled':
            userFriendlyError = 'You cancelled the login process';
            break;
          case 'invalid_oauth_response':
            userFriendlyError = 'Invalid response from authentication provider';
            break;
          case 'invalid_state_token':
            userFriendlyError = 'Security validation failed. Please try again';
            break;
          case 'oauth_failed':
            userFriendlyError = errorMessage ? decodeURIComponent(errorMessage) : 'Authentication failed';
            break;
          default:
            userFriendlyError = errorMessage ? decodeURIComponent(errorMessage) : 'Something went wrong';
        }

        setError(userFriendlyError);
        setStatus('error');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
        
        return;
      }

      // Extract tokens from URL
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh_token');
      const isNewUser = searchParams.get('new_user') === 'true';

      if (!token || !refreshToken) {
        setError('Authentication data missing. Please try again');
        setStatus('error');
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
        
        return;
      }

      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refreshToken);

      // Refresh user data
      await refreshUser();

      setStatus('success');

      // Show welcome message for new users
      if (isNewUser) {
        console.log('Welcome! Your account has been created.');
      }

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);

    } catch (err: any) {
      console.error('OAuth callback error:', err);
      setError('Failed to complete authentication. Please try again');
      setStatus('error');
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      padding: '24px',
      textAlign: 'center',
    }}>
      {status === 'processing' && (
        <>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(0, 255, 255, 0.1)',
            borderTop: '4px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '24px',
          }} />
          <h2 style={{ 
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '12px',
            color: 'var(--text-primary)',
          }}>
            Completing sign-in...
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}>
            Please wait while we set up your account
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(0, 255, 255, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            fontSize: '32px',
          }}>
            ✓
          </div>
          <h2 style={{ 
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '12px',
            color: 'var(--accent)',
          }}>
            Success!
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}>
            Redirecting to dashboard...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(220, 38, 38, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            fontSize: '32px',
          }}>
            ✕
          </div>
          <h2 style={{ 
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#dc2626',
          }}>
            Authentication Failed
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            maxWidth: '400px',
            marginBottom: '24px',
          }}>
            {error}
          </p>
          <p style={{ 
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}>
            Redirecting to login page...
          </p>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
