import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next'
import useMediaQuery from '../../hooks/useMediaQuery';

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const from = location.state?.from?.pathname || '/app';

  const containerPadding = isMobile ? 'px-4 py-10' : 'px-6 py-12';
  const headingSize = isMobile ? 'text-2xl' : 'text-3xl';
  const subheadingSize = isMobile ? 'text-sm' : 'text-base';
  const cardPadding = isMobile ? 'p-6' : 'p-8';
  const labelSize = isMobile ? 'text-xs' : 'text-sm';
  const iconClass = isMobile
    ? 'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A8C9B8]'
    : 'absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A8C9B8]';
  const inputPadding = isMobile
    ? 'pl-10 pr-3 py-2.5 text-sm placeholder:text-sm'
    : 'pl-12 pr-4 py-3 text-base placeholder:text-base';
  const helperTextSize = isMobile ? 'text-xs' : 'text-sm';
  const buttonPadding = isMobile ? 'py-2.5' : 'py-3';
  const buttonTextSize = isMobile ? 'text-base' : 'text-lg';
  const googleGap = isMobile ? 'gap-2' : 'gap-3';
  const googleIconSize = isMobile ? 'w-4 h-4' : 'w-5 h-5';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!emailOrUsername || !password) {
      setError(t('login.errors.fillAllFields', 'Please fill in all fields'));
      setIsLoading(false);
      return;
    }

    const result = await login(emailOrUsername, password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className={`bg-gradient-to-br from-[#FFF8F0] via-white to-[#F5F5F5] flex items-center justify-center ${containerPadding} relative overflow-hidden`}
    >
      {/* Decorative background elements */}
      <div className={`${isMobile ? 'hidden' : 'absolute top-20 right-20 w-64 h-64 rounded-full bg-[#A8C9B8] opacity-10 blur-3xl'}`}></div>
      <div className={`${isMobile ? 'hidden' : 'absolute bottom-40 left-10 w-80 h-80 rounded-full bg-[#FF9B7B] opacity-10 blur-3xl'}`}></div>

      <div className="w-full max-w-md relative z-10 mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`${headingSize} font-bold text-[#035035] mb-2`}>{t('login.title', 'Welcome Back!')}</h1>
          <p className={`text-[#2D2D2D] ${subheadingSize}`}>{t('login.subtitle', 'Sign in to continue your culinary journey')}</p>
        </div>

        {/* Login Form Card */}
        <div className={`bg-white rounded-3xl shadow-xl border border-[#F5F5F5] ${cardPadding}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {error.includes('|') ? (
                    <ul className="text-sm text-red-600 space-y-1">
                      {error.split('|').map((err, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{err.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Email or Username Input */}
            <div>
              <label htmlFor="emailOrUsername" className={`block font-semibold text-[#035035] mb-2 ${labelSize}`}>
                {t('login.emailOrUsername', 'Email or Username')}
              </label>
              <div className="relative">
                <Mail className={iconClass} />
                <input
                  id="emailOrUsername"
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className={`w-full border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D] ${inputPadding}`}
                  placeholder={t('login.emailOrUsernamePlaceholder', 'your@email.com or username')}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className={`block font-semibold text-[#035035] mb-2 ${labelSize}`}>
                {t('login.password', 'Password')}
              </label>
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D] ${inputPadding}`}
                  placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className={`text-right ${helperTextSize}`}>
              <Link
                to="/forgot-password"
                className="text-sm text-[#FF9B7B] hover:text-[#035035] transition-colors font-medium"
              >
                {t('login.forgotPassword', 'Forgot Password?')}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#035035] text-white rounded-full font-semibold hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${buttonPadding} ${buttonTextSize}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('login.signingIn', 'Signing in...')}
                </span>
              ) : (
                t('login.signIn', 'Sign In')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F5F5F5]"></div>
            </div>
            <div className={`relative flex justify-center ${helperTextSize}`}>
              <span className="px-4 bg-white text-[#2D2D2D]">{t('login.orContinueWith', 'Or continue with')}</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full bg-white border-2 border-[#F5F5F5] text-[#2D2D2D] rounded-full font-semibold hover:border-[#035035] hover:scale-105 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center ${googleGap} ${buttonPadding} ${buttonTextSize}`}
          >
            <svg className={googleIconSize} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('login.continueWithGoogle', 'Continue with Google')}
          </button>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className={`text-[#2D2D2D] ${helperTextSize}`}>
              {t('login.noAccount', "Don't have an account?")}{' '}
              <Link to="/register" className="text-[#FF9B7B] hover:text-[#035035] transition-colors font-semibold">
                {t('login.signUp', 'Sign Up')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
