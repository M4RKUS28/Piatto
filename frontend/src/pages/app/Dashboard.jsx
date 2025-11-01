import { Link } from 'react-router-dom';
import { ChefHat, Clock, Heart, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next'

export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common'])
  const { user } = useAuth();
  const stats = [
    { label: t('stats.recipesSaved'), value: '24', icon: Heart, color: '#FF9B7B' },
    { label: t('stats.cookedThisWeek'), value: '8', icon: ChefHat, color: '#035035' },
    { label: t('stats.avgCookTime'), value: '32m', icon: Clock, color: '#A8C9B8' },
    { label: t('stats.streakDays'), value: '12', icon: TrendingUp, color: '#FF9B7B' },
  ];

  const recentRecipes = [
    { name: 'Creamy Pasta Carbonara', time: '25 min', image: '🍝' },
    { name: 'Honey Garlic Chicken', time: '35 min', image: '🍗' },
    { name: 'Caprese Salad', time: '10 min', image: '🥗' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#035035]">
            {t('welcome')}, {user?.username || t('chef')}!
          </h1>
          <p className="text-sm sm:text-base text-[#2D2D2D] opacity-70">{t('subtitle')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-[#FFF8F0] rounded-2xl p-4 sm:p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.color + '20' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-[#2D2D2D] opacity-60">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Recent RecipeLibrary */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#035035]">{t('recentRecipes')}</h2>
            <Link to="/app/library" className="text-sm font-semibold text-[#035035] hover:text-[#FF9B7B] transition-colors">
              {t('buttons.findNewRecipes', { ns: 'common' })}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecipes.map((recipe, index) => (
              <div
                key={index}
                className="bg-[#FFF8F0] rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="text-5xl mb-3 text-center">{recipe.image}</div>
                <h3 className="font-semibold text-[#2D2D2D] mb-1">{recipe.name}</h3>
                <p className="text-sm text-[#2D2D2D] opacity-60">{recipe.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            to="/app/generate"
            className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md inline-flex items-center justify-center w-full sm:w-auto"
          >
            {t('buttons.generateRecipe', { ns: 'common' })}
          </Link>
          <Link
            to="/app/recipes"
            className="bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold hover:bg-[#035035] hover:text-white transition-all inline-flex items-center justify-center w-full sm:w-auto"
          >
            {t('buttons.findNewRecipes', { ns: 'common' })}
          </Link>
          <Link
            to="/app/settings"
            className="bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold hover:bg-[#035035] hover:text-white transition-all inline-flex items-center justify-center w-full sm:w-auto"
          >
            {t('buttons.profileSettings', { ns: 'common' })}
          </Link>
        </div>
      </div>
    </div>
  );
}