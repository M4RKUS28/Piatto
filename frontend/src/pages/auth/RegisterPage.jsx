import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      return 'Please fill in all fields';
    }

    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters long';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (!acceptedPrivacy) {
      return 'Please accept the Privacy Policy to continue';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    const result = await register(formData.email, formData.password, formData.username);
    
    if (result.success) {
      navigate('/app');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignup = () => {
    if (!acceptedPrivacy) {
      setError('Please accept the Privacy Policy to continue');
    }
    loginWithGoogle();
  };

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md min-w-[400px] relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#035035] mb-2">Create Your Account</h1>
          <p className="text-[#2D2D2D]">Start your culinary adventure today</p>
        </div>
        {/* Registration Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#F5F5F5]">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-[#035035] mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A8C9B8]" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D]"
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#035035] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A8C9B8]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D]"
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#035035] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A8C9B8]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D]"
                  placeholder="At least 6 characters"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#035035] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A8C9B8]" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#F5F5F5] rounded-2xl focus:outline-none focus:border-[#035035] transition-colors text-[#2D2D2D]"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Privacy Policy Checkbox */}
            <div className="flex items-start gap-3 bg-[#FFF8F0] p-4 rounded-2xl border border-[#F5F5F5]">
              <button
                type="button"
                onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
                className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  acceptedPrivacy
                    ? 'bg-[#035035] border-[#035035]'
                    : 'bg-white border-[#A8C9B8]'
                }`}
                disabled={isLoading}
              >
                {acceptedPrivacy && <CheckCircle className="w-4 h-4 text-white" />}
              </button>
              <label className="text-sm text-[#2D2D2D] cursor-pointer" onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}>
                I accept the{' '}
                <Link to="/privacy" className="text-[#FF9B7B] hover:text-[#035035] font-semibold">
                  Privacy Policy
                </Link>{' '}
                and agree to the processing of my personal data
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#035035] text-white py-3 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F5F5F5]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#2D2D2D]">Or continue with</span>
            </div>
          </div>

          {/* Google Signup Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full bg-white border-2 border-[#F5F5F5] text-[#2D2D2D] py-3 rounded-full font-semibold text-lg hover:border-[#035035] hover:scale-105 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            Sign up with Google
          </button>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-[#2D2D2D]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#FF9B7B] hover:text-[#035035] transition-colors font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
