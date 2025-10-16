import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Users, Filter } from 'lucide-react';

export default function Recipes() {
  const [searchQuery, setSearchQuery] = useState('');

  const recipes = [
    { name: 'Spaghetti Carbonara', time: '25 min', servings: '4', difficulty: 'Easy', image: '🍝', category: 'Pasta' },
    { name: 'Chicken Tikka Masala', time: '45 min', servings: '6', difficulty: 'Medium', image: '🍛', category: 'Indian' },
    { name: 'Caesar Salad', time: '15 min', servings: '2', difficulty: 'Easy', image: '🥗', category: 'Salad' },
    { name: 'Beef Tacos', time: '30 min', servings: '4', difficulty: 'Easy', image: '🌮', category: 'Mexican' },
    { name: 'Margherita Pizza', time: '35 min', servings: '4', difficulty: 'Medium', image: '🍕', category: 'Italian' },
    { name: 'Pad Thai', time: '40 min', servings: '4', difficulty: 'Medium', image: '🍜', category: 'Thai' },
    { name: 'Greek Moussaka', time: '90 min', servings: '8', difficulty: 'Hard', image: '🍆', category: 'Greek' },
    { name: 'Chocolate Lava Cake', time: '20 min', servings: '2', difficulty: 'Medium', image: '🍰', category: 'Dessert' },
    { name: 'Avocado Toast', time: '10 min', servings: '2', difficulty: 'Easy', image: '🥑', category: 'Breakfast' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#035035] mb-2">Your Recipes</h1>
            <p className="text-[#2D2D2D] opacity-60">Discover and save your favorite dishes</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/app"
              className="px-5 py-3 rounded-full border border-[#035035] text-[#035035] font-semibold hover:bg-[#035035] hover:text-white transition-all"
            >
              Back to Dashboard
            </Link>
            <Link
              to="/app/settings"
              className="px-5 py-3 rounded-full border border-[#FF9B7B] text-[#FF9B7B] font-semibold hover:bg-[#FF9B7B] hover:text-white transition-all"
            >
              Preferences
            </Link>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#2D2D2D] opacity-40" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all"
            />
          </div>
          <button className="bg-white border-2 border-[#035035] text-[#035035] px-6 py-3 rounded-full font-semibold hover:bg-[#035035] hover:text-white transition-all flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </button>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-[#F5F5F5] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
            >
              {/* Image Placeholder */}
              <div className="bg-[#FFF8F0] h-48 flex items-center justify-center text-7xl">
                {recipe.image}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#035035] bg-[#035035]/10 px-3 py-1 rounded-full">
                    {recipe.category}
                  </span>
                  <span className="text-xs font-semibold text-[#FF9B7B] bg-[#FF9B7B]/10 px-3 py-1 rounded-full">
                    {recipe.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#2D2D2D] mb-3">{recipe.name}</h3>
                <div className="flex items-center gap-4 text-sm text-[#2D2D2D] opacity-60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servings} servings</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Recipe Button */}
        <div className="mt-8 text-center">
          <button className="bg-[#FF9B7B] text-white px-8 py-4 rounded-full font-semibold hover:scale-105 transition-all shadow-md text-lg">
            + Add New Recipe
          </button>
        </div>
      </div>
    </div>
  );
}