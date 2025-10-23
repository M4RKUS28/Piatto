import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchAndSetCurrentUser } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    const processOAuthCallback = async () => {
      console.log('OAuthCallbackPage: Processing OAuth callback...');
      const queryParams = new URLSearchParams(location.search);
      const oauthError = queryParams.get('error');
      const oauthErrorDescription = queryParams.get('error_description');

      // Check for OAuth provider errors
      if (oauthError) {
        const errorMessage = oauthErrorDescription || oauthError || 'An unknown OAuth error occurred.';
        console.error(`OAuthCallbackPage: OAuth provider error: ${errorMessage}`);
        setStatus('error');
        setTimeout(() => {
          navigate(`/oauth/callback/login-failed?reason=${encodeURIComponent(errorMessage)}`);
        }, 2000);
        return;
      }

      // Attempt to fetch user with cookie-based authentication
      try {
        console.log('OAuthCallbackPage: Calling fetchAndSetCurrentUser (expecting cookie)...');
        const user = await fetchAndSetCurrentUser();

        if (user) {
          console.log('OAuthCallbackPage: Authentication successful, user:', user);
          setStatus('success');
          setTimeout(() => {
            navigate('/app');
          }, 1500);
        } else {
          console.error('OAuthCallbackPage: No user returned (cookie auth). Possible session issue.');
          setStatus('error');
          setTimeout(() => {
            navigate('/oauth/callback/login-failed?reason=session_verification_failed');
          }, 2000);
        }
      } catch (error) {
        console.error('OAuthCallbackPage: Error during fetchAndSetCurrentUser:', error);
        
        const detailMessage = 
          error?.response?.data?.detail || 
          error?.response?.data?.message || 
          'Unexpected error occurred during OAuth login. Please try again later.';
        
        setStatus('error');
        setTimeout(() => {
          navigate(`/oauth/callback/login-failed?reason=${encodeURIComponent(detailMessage)}`);
        }, 2000);
      }
    };

    processOAuthCallback();
  }, [location, navigate, fetchAndSetCurrentUser]);

  return (
    <div className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md min-w-[400px] relative z-10 mx-auto">
        <div className="w-full bg-white rounded-3xl shadow-xl p-12 border border-[#F5F5F5] text-center">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 border-4 border-[#A8C9B8] border-t-[#035035] rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-[#035035] mb-3">Signing you in...</h2>
              <p className="text-[#2D2D2D]">Please wait while we complete your authentication</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#035035] mb-3">Success!</h2>
              <p className="text-[#2D2D2D]">Redirecting you to your dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#035035] mb-3">Something went wrong</h2>
              <p className="text-[#2D2D2D]">Redirecting you to error details...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
