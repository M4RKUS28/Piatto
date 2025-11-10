import { ChefHat, Sparkles, BookOpen, Clock, Brain, Users, MessageSquare, Play, CheckCircle2, ArrowRight, Cpu, Lightbulb, TrendingUp, Wine, CupSoda } from 'lucide-react'
import { PiLeaf, PiEgg, PiCow } from 'react-icons/pi'
import { Link } from 'react-router-dom'
import MainLayout from '../Layout/MainLayout.jsx'
import { useTranslation } from 'react-i18next'

// Helper function to get food category display (icon and label)
const getFoodCategoryDisplay = (category, t) => {
  if (!category) return null;

  const normalized = category.toLowerCase().replace(/_/g, '-');

  if (normalized === 'vegan') {
    return { icon: PiLeaf, label: t('foodCategory.vegan', { ns: 'common', defaultValue: 'Vegan' }) };
  }
  if (normalized === 'vegetarian') {
    return { icon: PiEgg, label: t('foodCategory.vegetarian', { ns: 'common', defaultValue: 'Vegetarian' }) };
  }

  if (normalized === 'alcoholic') {
    return { icon: Wine, label: t('foodCategory.alcoholic', { ns: 'common', defaultValue: 'Alcoholic' }) };
  }

  if (normalized === 'non-alcoholic') {
    return { icon: CupSoda, label: t('foodCategory.nonAlcoholic', { ns: 'common', defaultValue: 'Non-alcoholic' }) };
  }

  // Meat categories
  const meatLabels = {
    beef: t('foodCategory.beef', { ns: 'common', defaultValue: 'Beef' }),
    pork: t('foodCategory.pork', { ns: 'common', defaultValue: 'Pork' }),
    chicken: t('foodCategory.chicken', { ns: 'common', defaultValue: 'Chicken' }),
    lamb: t('foodCategory.lamb', { ns: 'common', defaultValue: 'Lamb' }),
    fish: t('foodCategory.fish', { ns: 'common', defaultValue: 'Fish' }),
    seafood: t('foodCategory.seafood', { ns: 'common', defaultValue: 'Seafood' }),
    'mixed-meat': t('foodCategory.mixedMeat', { ns: 'common', defaultValue: 'Mixed Meat' })
  };

  if (meatLabels[normalized]) {
    return { icon: PiCow, label: meatLabels[normalized] };
  }

  return null;
};

// Helper function to format difficulty
const formatDifficulty = (difficulty, t) => {
  if (!difficulty) return t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' });
  const lowerDifficulty = difficulty.toLowerCase();

  if (lowerDifficulty === 'easy') return t('difficulty.easy', { ns: 'common', defaultValue: 'Easy' });
  if (lowerDifficulty === 'medium') return t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' });
  if (lowerDifficulty === 'hard') return t('difficulty.hard', { ns: 'common', defaultValue: 'Hard' });

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

// Helper function to get difficulty color classes
const getDifficultyColorClasses = (difficulty) => {
  const lowerDifficulty = difficulty?.toLowerCase();

  switch (lowerDifficulty) {
    case 'easy':
      return 'text-green-600 bg-green-600/10';
    case 'medium':
      return 'text-orange-500 bg-orange-500/10';
    case 'hard':
      return 'text-orange-700 bg-orange-700/10';
    default:
      return 'text-orange-500 bg-orange-500/10'; // Default to medium
  }
};

// Helper function to format time
const formatTime = (minutes) => {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export default function LandingPage() {
  const { t } = useTranslation(['landing', 'common'])

  const recipes = [
    {
      id: 1,
      name: t('exampleRecipes.mediterraneanBowl.name', 'Mediterranean Sunset Bowl'),
      description: t('exampleRecipes.mediterraneanBowl.description', 'Fresh quinoa with roasted vegetables, feta, and lemon herb dressing'),
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      total_time_minutes: 25,
      difficulty: 'easy',
      food_category: 'vegan'
    },
    {
      id: 2,
      name: t('exampleRecipes.tuscanChicken.name', 'Creamy Tuscan Chicken'),
      description: t('exampleRecipes.tuscanChicken.description', 'Pan-seared chicken in sun-dried tomato cream sauce with spinach'),
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop',
      total_time_minutes: 35,
      difficulty: 'medium',
      food_category: 'chicken'
    },
    {
      id: 3,
      name: t('exampleRecipes.smoothieBowl.name', 'Berry Bliss Smoothie Bowl'),
      description: t('exampleRecipes.smoothieBowl.description', 'Antioxidant-rich blend topped with granola, fresh berries & coconut'),
      image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop',
      total_time_minutes: 10,
      difficulty: 'easy',
      food_category: 'vegetarian'
    }
  ]

  return (
    <MainLayout mode="landing">
      <div className="relative min-h-screen">

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 py-16 lg:py-28 relative">
          <div className="grid lg:grid-cols-2 items-center gap-12 lg:gap-16">
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFF8F0] to-white px-4 py-2 rounded-full border-2 border-[#A8C9B8] w-max shadow-md hover:shadow-lg transition-shadow">
                <Sparkles className="w-4 h-4 text-[#FF9B7B] animate-spin-slow" />
                <span className="text-xs sm:text-sm font-semibold text-[#035035]">{t('hero.badge', 'AI-Powered Cooking Assistant')}</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#035035] leading-tight">
                {t('hero.title', 'Your Personal Chef, Right in Your Pocket')}
              </h1>

              <p className="text-lg sm:text-xl text-[#2D2D2D] leading-relaxed opacity-90">
                {t('hero.description', 'Discover personalized recipes, get step-by-step cooking guidance, and turn your kitchen into a culinary playground with AI-powered creativity.')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/app" className="w-full sm:w-auto">
                  <button className="group bg-gradient-to-r from-[#035035] to-[#046847] text-white px-10 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 w-full">
                    <ChefHat className="w-5 h-5 group-hover:animate-bounce" />
                    {t('buttons.startCooking', { ns: 'common', defaultValue: 'Start Cooking' })}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <a href="#demo-video">
                  <button className="group bg-transparent border-2 border-[#FF9B7B] text-[#FF9B7B] px-10 py-4 rounded-full font-semibold text-lg hover:bg-[#FF9B7B] hover:text-white transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                    <Play className="w-5 h-5" />
                    {t('buttons.watchDemo', { ns: 'common', defaultValue: 'Watch Demo' })}
                  </button>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                <div className="flex items-start gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF8F0] to-[#FFE8D5] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                    <Brain className="w-6 h-6 text-[#035035]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#035035] text-base sm:text-lg">{t('hero.aiRecipeGenerator', 'AI Recipe Generator')}</h3>
                    <p className="text-sm text-[#2D2D2D] opacity-80">{t('hero.aiRecipeGeneratorDesc', 'Custom recipes for your taste')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF8F0] to-[#FFE8D5] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                    <MessageSquare className="w-6 h-6 text-[#035035]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#035035] text-base sm:text-lg">{t('hero.interactiveGuide', 'Interactive Guide')}</h3>
                    <p className="text-sm text-[#2D2D2D] opacity-80">{t('hero.interactiveGuideDesc', 'Step-by-step instructions')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end mt-10 lg:mt-0 animate-fade-in">
              <div className="hidden sm:block absolute top-10 right-20 w-20 h-20 rounded-full bg-[#FF9B7B] opacity-[0.08] animate-float"></div>
              <div className="hidden sm:block absolute bottom-20 right-40 w-16 h-16 rounded-full bg-[#A8C9B8] opacity-[0.08] animate-float" style={{ animationDelay: '1.5s' }}></div>
              <div className="hidden sm:block absolute top-32 right-10 w-12 h-12 rounded-full bg-[#035035] opacity-[0.06] animate-float" style={{ animationDelay: '3s' }}></div>

              <div className="relative z-10 w-[280px] sm:w-[320px] lg:w-[360px] aspect-[9/16] bg-gradient-to-br from-[#2D2D2D] to-[#1a1a1a] rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl p-3 transform hover:scale-105 transition-transform duration-500">
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-[#2D2D2D] rounded-full z-20 shadow-inner"></div>

                <div className="w-full h-full bg-gradient-to-b from-white to-gray-50 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
                  <div className="bg-gradient-to-r from-[#035035] to-[#046847] text-white p-6 pb-8 rounded-b-3xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">{t('mockup.discover', 'Discover')}</h2>
                      <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center backdrop-blur-sm">
                        <ChefHat className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="text-sm opacity-90">{t('mockup.whatToCook', 'What would you like to cook today?')}</p>
                  </div>

                  <div className="p-4 space-y-3 -mt-4">
                    {recipes.map((recipe, index) => (
                      <div
                        key={recipe.id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                        style={{ animation: `slideIn 0.5s ease-out ${index * 0.1}s backwards` }}
                      >
                        <div className="bg-gradient-to-br from-[#FFF8F0] to-[#FFE8D5] h-36 flex items-center justify-center overflow-hidden relative">
                          {recipe.image.startsWith('http') || recipe.image.startsWith('/') ? (
                            <img
                              src={recipe.image}
                              alt={recipe.name}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-4xl">{recipe.image}</span>
                          )}
                        </div>

                        <div className="p-3">
                          <div className="flex items-center gap-1 mb-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${getDifficultyColorClasses(recipe.difficulty)}`}>
                              {formatDifficulty(recipe.difficulty, t)}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-[#2D2D2D] mb-2 line-clamp-2">{recipe.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-[#2D2D2D] opacity-60 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">{formatTime(recipe.total_time_minutes)}</span>
                            </div>
                            {(() => {
                              const foodDisplay = getFoodCategoryDisplay(recipe.food_category, t);
                              if (!foodDisplay) return null;
                              const FoodIcon = foodDisplay.icon;
                              return (
                                <div className="flex items-center gap-1">
                                  <FoodIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="whitespace-nowrap">{foodDisplay.label}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Video Section */}
        <section id="demo-video" className="py-20 bg-gradient-to-b from-white to-[#FFF8F0] scroll-mt-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-[#FF9B7B] w-max mb-6 shadow-md">
                <Play className="w-4 h-4 text-[#FF9B7B]" />
                <span className="text-sm font-semibold text-[#035035]">{t('demo.badge', 'See Piatto in Action')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#035035] mb-6">
                {t('demo.title', 'Experience the Future of Cooking')}
              </h2>
              <p className="text-lg sm:text-xl text-[#2D2D2D] max-w-3xl mx-auto opacity-90">
                {t('demo.subtitle', 'Watch how Piatto transforms your cooking experience with AI-powered guidance and personalized recipes')}
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#035035] to-[#046847] p-8 sm:p-12 aspect-video flex items-center justify-center group hover:scale-[1.02] transition-transform duration-300">
                <iframe
                  src="https://www.youtube.com/embed/j5TfPSnD4Zk?si=VTwedNPHTg4KJuIj"
                  title="YouTube video player"
                  className="absolute inset-0 w-full h-full border-0"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allowfullscreen>
                </iframe>
              </div>
            </div>
            
          </div>
        </section>

        {/* Google Gemini AI Section */}
        <section className="py-20 bg-gradient-to-br from-[#035035] via-[#046847] to-[#035035] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
              <div className="text-center mb-16 animate-fade-in-up">
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md pl-3 pr-5 py-2 rounded-full border border-white/20 w-max mb-6 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFBC99] via-[#FF9B7B] to-[#FF7A59] text-[#035035] shadow">
                    <Cpu className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-semibold text-white tracking-wide">{t('ai.badge', 'Powered by Google AI')}</span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                  {t('ai.title', 'Built with Google Gemini')}
                </h2>
                <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                {t('ai.subtitle', 'Leveraging state-of-the-art AI technology from Google DeepMind to deliver the most intelligent cooking experience')}
              </p>
            </div>

            <div className="text-center">
              <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors group">
                <span className="text-lg font-semibold">{t('ai.learnMore', 'Learn more about Google Gemini')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </section>

  <section id="how-it-works" className="py-20 bg-white scroll-mt-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-[#FFF8F0] px-4 py-2 rounded-full border-2 border-[#A8C9B8] w-max mb-6 shadow-md">
                <TrendingUp className="w-4 h-4 text-[#FF9B7B]" />
                <span className="text-sm font-semibold text-[#035035]">{t('howItWorks.badge', 'Simple Process')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#035035] mb-6">
                {t('howItWorks.title', 'How It Works')}
              </h2>
              <p className="text-lg sm:text-xl text-[#2D2D2D] max-w-3xl mx-auto opacity-90">
                {t('howItWorks.subtitle', 'From idea to delicious meal in three simple steps')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-16">
              <div className="relative group">
                <div className="bg-gradient-to-br from-white to-[#FFF8F0] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 h-full border-2 border-transparent hover:border-[#FF9B7B]">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9B7B] to-[#FF8B6B] flex items-center justify-center mb-6 text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      1
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#A8C9B8] rounded-full opacity-20 group-hover:scale-150 transition-transform"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('howItWorks.step1.title', 'Share Your Preferences')}</h3>
                  <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                    {t('howItWorks.step1.description', "Tell us what you're craving, dietary restrictions, available ingredients, or cooking time. Our AI understands your needs.")}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[#FF9B7B] font-semibold">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm">{t('howItWorks.step1.feature', 'Natural language input')}</span>
                  </div>
                </div>
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#A8C9B8] to-transparent"></div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-br from-white to-[#FFF8F0] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 h-full border-2 border-transparent hover:border-[#035035]">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#035035] to-[#046847] flex items-center justify-center mb-6 text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      2
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF9B7B] rounded-full opacity-20 group-hover:scale-150 transition-transform"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('howItWorks.step2.title', 'Get Personalized Recipes')}</h3>
                  <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                    {t('howItWorks.step2.description', 'Receive custom recipes tailored to your taste, skill level, and kitchen setup. Save favorites to your personal collection.')}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[#035035] font-semibold">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm">{t('howItWorks.step2.feature', 'AI-generated recipes')}</span>
                  </div>
                </div>
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#A8C9B8] to-transparent"></div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-br from-white to-[#FFF8F0] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 h-full border-2 border-transparent hover:border-[#A8C9B8]">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A8C9B8] to-[#98B9A8] flex items-center justify-center mb-6 text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      3
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#035035] rounded-full opacity-20 group-hover:scale-150 transition-transform"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('howItWorks.step3.title', 'Cook with Confidence')}</h3>
                  <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                    {t('howItWorks.step3.description', 'Follow interactive step-by-step guidance with tips, timers, and voice assistance. Create amazing dishes every time.')}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[#A8C9B8] font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">{t('howItWorks.step3.feature', 'Step-by-step guidance')}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

  <section id="features" className="bg-gradient-to-b from-[#FFF8F0] to-white py-20 scroll-mt-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-[#035035] w-max mb-6 shadow-md">
                <Sparkles className="w-4 h-4 text-[#035035]" />
                <span className="text-sm font-semibold text-[#035035]">{t('features.badge', 'Features')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#035035] mb-6">
                {t('features.title', 'Everything You Need to Cook Like a Pro')}
              </h2>
              <p className="text-lg sm:text-xl text-[#2D2D2D] max-w-3xl mx-auto opacity-90">
                {t('features.subtitle', 'From inspiration to the final dish, we guide you every step of the way')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-[#FF9B7B] group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9B7B] to-[#FFB59B] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('features.aiBrainstorming.title', 'AI Recipe Brainstorming')}</h3>
                <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                  {t('features.aiBrainstorming.description', "Tell us your preferences, dietary needs, or what's in your fridge. Our AI creates personalized recipes just for you.")}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-[#035035] group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#035035] to-[#046847] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('features.cookingGuide.title', 'Interactive Cooking Guide')}</h3>
                <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                  {t('features.cookingGuide.description', 'Follow step-by-step instructions with helpful tips, timers, and voice assistance. Cook with confidence.')}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-[#A8C9B8] group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A8C9B8] to-[#B8D9C8] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('features.chatAssistant.title', 'Chat Assistant')}</h3>
                <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                  {t('features.chatAssistant.description', 'Ask questions anytime during cooking. Get instant answers about techniques, substitutions, and more.')}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-[#FF9B7B] group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFB59B] to-[#FFD5BB] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Clock className="w-8 h-8 text-[#FF9B7B]" />
                </div>
                <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('features.smartTimers.title', 'Smart Timers')}</h3>
                <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                  {t('features.smartTimers.description', 'Built-in timers for each cooking step ensure perfect timing and results every time.')}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-[#035035] group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#046847] to-[#057858] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('features.collections.title', 'Personal Collections')}</h3>
                <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                  {t('features.collections.description', 'Organize your favorite recipes into collections. Build your personal cookbook over time.')}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-[#A8C9B8] group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B8D9C8] to-[#C8E9D8] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Lightbulb className="w-8 h-8 text-[#A8C9B8]" />
                </div>
                <h3 className="text-2xl font-bold text-[#035035] mb-4">{t('features.smartSuggestions.title', 'Smart Suggestions')}</h3>
                <p className="text-base text-[#2D2D2D] leading-relaxed opacity-80">
                  {t('features.smartSuggestions.description', 'Get ingredient substitution ideas, cooking tips, and technique recommendations in real-time.')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 py-20 lg:py-24">
          <div className="bg-gradient-to-br from-[#035035] via-[#046847] to-[#035035] rounded-3xl p-12 sm:p-16 lg:p-20 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white opacity-[0.02] animate-pulse-slow"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-white opacity-[0.02] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-3 h-3 rounded-full bg-[#FF9B7B] opacity-30 animate-float"></div>
            <div className="absolute top-1/3 right-1/4 w-4 h-4 rounded-full bg-[#FF9B7B] opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-[#A8C9B8] opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <ChefHat className="w-16 h-16 mx-auto mb-8 animate-bounce" />
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                {t('cta.title', 'Ready to Transform Your Cooking?')}
              </h2>
              <p className="text-lg sm:text-xl mb-10 opacity-90">
                {t('cta.subtitle', 'Start your culinary journey with AI-powered guidance and personalized recipes')}
              </p>
              <Link to="/download">
                <button className="group bg-gradient-to-r from-[#FF9B7B] to-[#FF8B6B] text-white px-12 py-5 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-lg hover:shadow-2xl inline-flex items-center gap-3">
                  {t('cta.button', 'Download Piatto Free')}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </section>

        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) translateX(0px);
            }
            25% {
              transform: translateY(-20px) translateX(10px);
            }
            50% {
              transform: translateY(-10px) translateX(-10px);
            }
            75% {
              transform: translateY(-15px) translateX(5px);
            }
          }

          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.15;
            }
            50% {
              opacity: 0.25;
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .animate-float {
            animation: float 8s ease-in-out infinite;
          }

          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out;
          }

          .animate-fade-in {
            animation: fade-in 1s ease-out;
          }

          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `}</style>
      </div>
    </MainLayout>
  )
}
