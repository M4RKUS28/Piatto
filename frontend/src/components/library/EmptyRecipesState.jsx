import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EmptyRecipesState({ onGenerateRecipe }) {
  const { t } = useTranslation(["recipe", "common"]);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/30 p-6 sm:p-8 text-center shadow-2xl">
      <div className="text-6xl mb-4">🍽️</div>
      <h3 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] mb-2">
        {t("library.noRecipesYet", "You haven't created any recipes yet")}
      </h3>
      <p className="text-sm sm:text-base text-[#2D2D2D]/70 mb-6">
        {t("library.noRecipesDescription", "Start your culinary journey by generating your first AI-powered recipe. It only takes a minute!")}
      </p>
      <button
        onClick={onGenerateRecipe}
        className="bg-gradient-to-r from-[#035035] to-[#024030] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-xl transition-all inline-flex items-center gap-2 min-h-[44px]"
      >
        <Sparkles className="w-5 h-5" />
        <span>{t("library.generateFirstRecipe", "Generate Your First Recipe")}</span>
      </button>
    </div>
  );
}
