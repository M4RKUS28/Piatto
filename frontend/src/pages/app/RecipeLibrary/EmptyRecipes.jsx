import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EmptyRecipes({ onGenerateClick }) {
  const { t } = useTranslation(["recipe", "common"]);

  return (
    <div className="relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4 w-12 h-12 border-2 border-[#A8C9B8] rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-[#FF9B7B] rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-[#FFF8F0] rounded-full"></div>
      </div>

      <div
        className="relative rounded-2xl border-2 border-dashed border-white/50 p-6 sm:p-10 text-center shadow-[0_8px_32px_0_rgba(168,201,184,0.15)]"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-md mx-auto">
          {/* Enhanced icon with multiple layers */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF9B7B]/20 to-[#035035]/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-1 bg-gradient-to-br from-[#FFF8F0] to-white rounded-full shadow-md"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl transform hover:scale-110 transition-transform">🍽️</span>
            </div>
            {/* Decorative sparkles */}
            <div className="absolute -top-1 -right-1 text-lg animate-bounce">✨</div>
            <div className="absolute -bottom-1 -left-1 text-base animate-bounce" style={{animationDelay: '0.5s'}}>🌟</div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#035035] to-[#035035]/70 bg-clip-text text-transparent mb-3">
            {t("library.noRecipesYet", "You haven't created any recipes yet")}
          </h3>
          <p className="text-sm sm:text-base text-[#2D2D2D]/70 mb-6 leading-relaxed">
            {t("library.noRecipesDescription", "Start your culinary journey by generating your first AI-powered recipe. It only takes a minute!")}
          </p>

          {/* Enhanced CTA button */}
          <button
            onClick={onGenerateClick}
            className="relative bg-gradient-to-r from-[#035035] to-[#035035]/90 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-xl transition-all inline-flex items-center gap-2 min-h-[44px] shadow-md group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#035035]/90 to-[#035035] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform" />
            <span className="relative z-10">{t("library.generateFirstRecipe", "Generate Your First Recipe")}</span>
          </button>

          {/* Additional encouraging text */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#2D2D2D]/50">
            <span>🎯</span>
            <span>Quick setup</span>
            <span>•</span>
            <span>🤖 AI-powered</span>
            <span>•</span>
            <span>🎨 Customizable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
