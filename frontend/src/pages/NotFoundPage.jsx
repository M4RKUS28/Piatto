import { Link } from 'react-router-dom';
import { Home, Search, ChefHat } from 'lucide-react';
import { useTranslation } from 'react-i18next'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#F5F5F5] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed top-20 right-20 w-64 h-64 rounded-full bg-[#A8C9B8] opacity-10 blur-3xl"></div>
      <div className="fixed bottom-40 left-10 w-80 h-80 rounded-full bg-[#FF9B7B] opacity-10 blur-3xl"></div>
      
      {/* Floating decorative elements */}
      <div className="fixed top-40 left-20 w-16 h-16 rounded-full bg-[#FF9B7B] opacity-20 animate-float"></div>
      <div className="fixed bottom-60 right-40 w-20 h-20 rounded-full bg-[#A8C9B8] opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-2xl relative z-10 text-center">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
            <img src="/logo_no_P.svg" alt="Piatto" className="w-14 h-14" />
          </div>
          <span className="text-4xl font-bold text-[#035035]" style={{ fontFamily: 'Georgia, serif' }}>
            Piatto
          </span>
        </Link>

        {/* 404 Content */}
        <div className="bg-white rounded-3xl shadow-xl p-12 border border-[#F5F5F5]">
          {/* Large 404 */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-[#035035] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              404
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <ChefHat className="w-8 h-8 text-[#FF9B7B]" />
              <h2 className="text-3xl font-bold text-[#035035]">Recipe Not Found</h2>
            </div>
            <p className="text-xl text-[#2D2D2D]">
              Oops! Looks like this page went off the menu.
            </p>
          </div>

          {/* Divider */}
          <div className="w-20 h-1 bg-[#A8C9B8] rounded-full mx-auto mb-8"></div>

          {/* Description */}
          <p className="text-[#2D2D2D] mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or may have been moved. 
            Let's get you back to cooking delicious meals!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-[#035035] text-white px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
            
            <Link
              to="/app/library"
              className="bg-transparent border-2 border-[#FF9B7B] text-[#FF9B7B] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#FF9B7B] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Browse Recipes
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-[#F5F5F5]">
            <p className="text-sm text-[#2D2D2D] mb-4">Quick Links:</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/app" className="text-[#035035] hover:text-[#FF9B7B] transition-colors font-medium">
                Dashboard
              </Link>
              <span className="text-[#F5F5F5]">•</span>
              <Link to="/about" className="text-[#035035] hover:text-[#FF9B7B] transition-colors font-medium">
                About Us
              </Link>
              <span className="text-[#F5F5F5]">•</span>
              <Link to="/contact" className="text-[#035035] hover:text-[#FF9B7B] transition-colors font-medium">
                Contact
              </Link>
              <span className="text-[#F5F5F5]">•</span>
              <Link to="/privacy" className="text-[#035035] hover:text-[#FF9B7B] transition-colors font-medium">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
