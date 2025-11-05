import React from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import { ChefHat, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '../../../hooks/useMediaQuery';

export default function EmptyState() {
  const { t } = useTranslation(["recipe", "common"]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [animationData, setAnimationData] = React.useState(null);

  React.useEffect(() => {
    fetch('/lottie-animations/logo_with_cutlery.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Error loading Lottie animation:", error));
  }, []);

  return (
    <div className="space-y-6">
      {/* Empty State for No Recipes */}
      <div className="relative bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] rounded-3xl border-2 border-dashed border-[#A8C9B8] p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#FF9B7B] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#035035] opacity-5 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-center">
            {animationData ? (
              <div className="w-full max-w-xl">
                <Lottie
                  animationData={animationData}
                  loop={false}
                  speed={0.5}
                  style={{ width: '100%', height: 'auto' }}
                  rendererSettings={{
                    preserveAspectRatio: 'xMidYMid slice'
                  }}
                />
              </div>
            ) : (
              <ChefHat className="w-16 h-16 sm:w-20 sm:h-20 text-[#035035]" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#035035]">
            {t("library.emptyState.title", "Your Culinary Journey Starts Here!")}
          </h2>

          <p className="text-base sm:text-lg text-[#2D2D2D] opacity-80 max-w-xl mx-auto">
            {t("library.emptyState.description", "It looks like you haven't created any recipes yet. Let our AI help you discover amazing dishes tailored to your taste!")}
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            {isMobile ? (
              <Link
                to="/app/generate"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-[#035035] to-[#046847] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl hover:scale-105 transition-all shadow-lg hover:shadow-2xl"
              >
                <Sparkles className="w-6 h-6" />
                {t("library.emptyState.createFirst", "Create Your First Recipe")}
              </Link>
            ) : (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openGenerateModal'));
                }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-[#035035] to-[#046847] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl hover:scale-105 transition-all shadow-lg hover:shadow-2xl"
              >
                <Sparkles className="w-6 h-6" />
                {t("library.emptyState.createFirst", "Create Your First Recipe")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
