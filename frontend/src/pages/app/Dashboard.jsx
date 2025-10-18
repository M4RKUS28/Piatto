import { Link } from 'react-router-dom';
import { ChefHat, Clock, Heart, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'RecipeLibrary Saved', value: '24', icon: Heart, color: '#FF9B7B' },
    { label: 'Cooked This Week', value: '8', icon: ChefHat, color: '#035035' },
    { label: 'Avg Cook Time', value: '32m', icon: Clock, color: '#A8C9B8' },
    { label: 'Streak Days', value: '12', icon: TrendingUp, color: '#FF9B7B' },
  ];

  const recentRecipes = [
    { name: 'Creamy Pasta Carbonara', time: '25 min', image: '🍝' },
    { name: 'Honey Garlic Chicken', time: '35 min', image: '🍗' },
    { name: 'Caprese Salad', time: '10 min', image: '🥗' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#035035] mb-2">Welcome back, John!</h1>
          <p className="text-[#2D2D2D] opacity-60">Let's cook something delicious today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-[#FFF8F0] rounded-2xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.color + '20' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[#2D2D2D] mb-1">{stat.value}</div>
                <div className="text-sm text-[#2D2D2D] opacity-60">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Recent RecipeLibrary */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] p-6">
          <h2 className="text-2xl font-bold text-[#035035] mb-6">Recent Recipes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="mt-8 flex gap-4 flex-wrap">
          <Link
            to="/app/generate"
            className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md inline-flex items-center justify-center"
          >
            Generate Recipe
          </Link>
          <Link
            to="/app/recipes"
            className="bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold hover:bg-[#035035] hover:text-white transition-all inline-flex items-center justify-center"
          >
            Find New Recipes
          </Link>
          <Link
            to="/app/settings"
            className="bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold hover:bg-[#035035] hover:text-white transition-all inline-flex items-center justify-center"
          >
            Meal Planner
          </Link>
        </div>
      </div>
    </div>
  );
}