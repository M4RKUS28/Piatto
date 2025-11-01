import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next'

export default function OAuthLoginFailedPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || t('oauth.defaultReason', 'An unexpected error occurred during OAuth login');

  const handleRetryOAuth = () => {
    // Redirect to Google OAuth login
    const backendUrl = window.location.origin;
    window.location.href = `${backendUrl}/api/auth/login/google`;
  };

  return (
    <div className="bg-gradient-to-br from-[#FFF8F0] via-white to-[#F5F5F5] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-[#A8C9B8] opacity-10 blur-3xl"></div>
      <div className="absolute bottom-40 left-10 w-80 h-80 rounded-full bg-[#FF9B7B] opacity-10 blur-3xl"></div>

      <div className="w-full max-w-lg relative z-10 mx-auto">
        {/* Error Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F5F5F5]">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#035035] mb-3">{t('oauth.loginFailedTitle', 'OAuth Login Failed')}</h1>
            <p className="text-[#2D2D2D] text-lg">{t('oauth.loginFailedSubtitle', "We couldn't complete your Google sign-in")}</p>
          </div>

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-medium text-red-800 mb-1">{t('oauth.errorDetails', 'Error Details:')}</p>
            <p className="text-sm text-red-600">{reason}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetryOAuth}
              className="w-full bg-[#035035] text-white py-3 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              {t('oauth.retryWithGoogle', 'Retry with Google')}
            </button>

            <Link
              to="/login"
              className="w-full bg-white border-2 border-[#F5F5F5] text-[#2D2D2D] py-3 rounded-full font-semibold text-lg hover:border-[#035035] hover:scale-105 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('oauth.backToLogin', 'Back to Login')}
            </Link>

            <Link
              to="/"
              className="w-full bg-transparent border-2 border-[#A8C9B8] text-[#035035] py-3 rounded-full font-semibold text-lg hover:bg-[#A8C9B8] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              {t('oauth.goHome', 'Go Home')}
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-[#F5F5F5] text-center">
            <p className="text-sm text-[#2D2D2D] mb-3">{t('oauth.commonOAuthIssues', 'Common OAuth issues:')}</p>
            <ul className="text-sm text-[#2D2D2D] space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-[#FF9B7B] mt-1">•</span>
                <span>{t('oauth.issue1', 'Make sure pop-ups are enabled in your browser')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF9B7B] mt-1">•</span>
                <span>{t('oauth.issue2', "Check that you're using a valid Google account")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF9B7B] mt-1">•</span>
                <span>{t('oauth.issue3', 'Try clearing your browser cache and cookies')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF9B7B] mt-1">•</span>
                <span>{t('oauth.issue4', 'Ensure third-party cookies are not blocked')}</span>
              </li>
            </ul>
            <p className="text-sm text-[#2D2D2D] mt-4">
              {t('oauth.stillTrouble', 'Still having trouble?')}{' '}
              <Link to="/contact" className="text-[#FF9B7B] hover:text-[#035035] font-semibold">
                {t('oauth.contactSupport', 'Contact Support')}
              </Link>
            </p>
          </div>

          {/* Alternative Login */}
          <div className="mt-6 pt-6 border-t border-[#F5F5F5] text-center">
            <p className="text-sm text-[#2D2D2D] mb-3">
              {t('oauth.preferEmail', 'Prefer to use email and password instead?')}
            </p>
            <Link
              to="/login"
              className="inline-block text-[#FF9B7B] hover:text-[#035035] font-semibold text-sm"
            >
              {t('oauth.signInWithEmail', 'Sign in with Email →')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
