import { ChefHat, Sparkles, BookOpen, Clock } from 'lucide-react'
import LandingLayout from '../Layout/LandingLayout.jsx'
import { useTranslation } from 'react-i18next'



export default function LandingPage() {
  const { t } = useTranslation(['landing', 'common'])

  const recipes = [
    {
      name: t('exampleRecipes.mediterraneanBowl.name', 'Mediterranean Sunset Bowl'),
      description: t('exampleRecipes.mediterraneanBowl.description', 'Fresh quinoa with roasted vegetables, feta, and lemon herb dressing'),
      time: '25 ' + t('time.min', { ns: 'common', defaultValue: 'min' }),
      difficulty: t('difficulty.easy', { ns: 'common', defaultValue: 'Easy' }),
      color: '#FF9B7B'
    },
    {
      name: t('exampleRecipes.tuscanChicken.name', 'Creamy Tuscan Chicken'),
      description: t('exampleRecipes.tuscanChicken.description', 'Pan-seared chicken in sun-dried tomato cream sauce with spinach'),
      time: '35 ' + t('time.min', { ns: 'common', defaultValue: 'min' }),
      difficulty: t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' }),
      color: '#035035'
    },
    {
      name: t('exampleRecipes.smoothieBowl.name', 'Berry Bliss Smoothie Bowl'),
      description: t('exampleRecipes.smoothieBowl.description', 'Antioxidant-rich blend topped with granola, fresh berries & coconut'),
      time: '10 ' + t('time.min', { ns: 'common', defaultValue: 'min' }),
      difficulty: t('difficulty.easy', { ns: 'common', defaultValue: 'Easy' }),
      color: '#A8C9B8'
    }
  ]

  return (
    <LandingLayout>
      <div className="relative min-h-screen bg-white overflow-hidden">
        <div className="hidden lg:block fixed top-20 right-20 w-64 h-64 rounded-full bg-[#A8C9B8] opacity-10 blur-3xl"></div>
        <div className="hidden lg:block fixed bottom-40 left-10 w-80 h-80 rounded-full bg-[#FF9B7B] opacity-10 blur-3xl"></div>

        <section className="container mx-auto px-4 sm:px-6 py-14 lg:py-24">
          <div className="grid lg:grid-cols-2 items-center gap-12">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-[#FFF8F0] px-4 py-2 rounded-full border border-[#A8C9B8] w-max">
                <Sparkles className="w-4 h-4 text-[#FF9B7B]" />
                <span className="text-xs sm:text-sm font-medium text-[#035035]">{t('hero.badge', 'AI-Powered Cooking Assistant')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#035035] leading-tight">
                {t('hero.title', 'Your Personal Chef, Right in Your Pocket')}
              </h1>

              <p className="text-base sm:text-lg text-[#2D2D2D] leading-relaxed">
                {t('hero.description', 'Discover personalized recipes, get step-by-step cooking guidance, and turn your kitchen into a culinary playground with AI-powered creativity.')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-[#035035] text-white px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:scale-105 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto">
                  <ChefHat className="w-5 h-5" />
                  {t('buttons.startCooking', { ns: 'common', defaultValue: 'Start Cooking' })}
                </button>
                <button className="bg-transparent border-2 border-[#FF9B7B] text-[#FF9B7B] px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-[#FF9B7B] hover:text-white transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                  <BookOpen className="w-5 h-5" />
                  {t('buttons.exploreRecipes', { ns: 'common', defaultValue: 'Explore Recipes' })}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF8F0] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#035035]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#035035] text-sm sm:text-base">{t('hero.aiRecipeGenerator', 'AI Recipe Generator')}</h3>
                    <p className="text-sm text-[#2D2D2D] opacity-80">{t('hero.aiRecipeGeneratorDesc', 'Custom recipes for your taste')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF8F0] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-[#035035]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#035035] text-sm sm:text-base">{t('hero.interactiveGuide', 'Interactive Guide')}</h3>
                    <p className="text-sm text-[#2D2D2D] opacity-80">{t('hero.interactiveGuideDesc', 'Step-by-step instructions')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end mt-10 lg:mt-0">
              <div className="hidden sm:block absolute top-10 right-20 w-20 h-20 rounded-full bg-[#FF9B7B] opacity-20 animate-float"></div>
              <div className="hidden sm:block absolute bottom-20 right-40 w-16 h-16 rounded-full bg-[#A8C9B8] opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
              <div className="hidden sm:block absolute top-32 right-10 w-12 h-12 rounded-full bg-[#035035] opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>

              <div className="relative z-10 w-[240px] sm:w-[300px] lg:w-[320px] aspect-[9/16] bg-[#2D2D2D] rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl p-3 transform hover:scale-105 transition-transform duration-500">
                <div className="absolute top-5 sm:top-6 left-1/2 transform -translate-x-1/2 w-24 sm:w-32 h-5 sm:h-6 bg-[#2D2D2D] rounded-full z-20"></div>

                <div className="w-full h-full bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
                  <div className="bg-[#035035] text-white p-6 pb-8 rounded-b-3xl">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">{t('mockup.discover', 'Discover')}</h2>
                      <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                        <ChefHat className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-sm opacity-90">{t('mockup.whatToCook', 'What would you like to cook today?')}</p>
                  </div>

                  <div className="p-4 space-y-4 -mt-4">
                    {recipes.map((recipe, index) => (
                      <div
                        key={recipe.name}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all border-2 border-transparent hover:border-[#FF9B7B]"
                        style={{ animation: `slideIn 0.5s ease-out ${index * 0.1}s backwards` }}
                      >
                        <div
                          className="h-32 relative"
                          style={{
                            background: `linear-gradient(135deg, ${recipe.color} 0%, ${recipe.color}dd 100%)`
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ChefHat className="w-12 h-12 text-white opacity-30" />
                          </div>
                          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold text-[#035035] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {recipe.time}
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-[#035035] mb-2">{recipe.name}</h3>
                          <p className="text-sm text-[#2D2D2D] mb-3 leading-relaxed">{recipe.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#A8C9B8] bg-[#FFF8F0] px-3 py-1 rounded-full">
                              {recipe.difficulty}
                            </span>
                            <button className="text-[#FF9B7B] font-semibold text-sm hover:text-[#035035] transition-colors">
                              {t('mockup.startCooking', 'Start Cooking →')}
                            </button>
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

        <section id="how-it-works" className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#035035] mb-4">
                {t('howItWorks.title', 'How It Works')}
              </h2>
              <p className="text-base sm:text-lg text-[#2D2D2D] max-w-2xl mx-auto">
                {t('howItWorks.subtitle', 'From idea to delicious meal in three simple steps')}
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="relative">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 h-full">
                  <div className="w-16 h-16 rounded-full bg-[#FF9B7B] flex items-center justify-center mb-6 text-white text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#035035] mb-3 sm:mb-4">{t('howItWorks.step1.title', 'Share Your Preferences')}</h3>
                  <p className="text-sm sm:text-base text-[#2D2D2D] leading-relaxed">
                    {t('howItWorks.step1.description', "Tell us what you're craving, dietary restrictions, available ingredients, or cooking time. Our AI understands your needs.")}
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-[#A8C9B8]"></div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 h-full">
                  <div className="w-16 h-16 rounded-full bg-[#035035] flex items-center justify-center mb-6 text-white text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#035035] mb-3 sm:mb-4">{t('howItWorks.step2.title', 'Get Personalized Recipes')}</h3>
                  <p className="text-sm sm:text-base text-[#2D2D2D] leading-relaxed">
                    {t('howItWorks.step2.description', 'Receive custom recipes tailored to your taste, skill level, and kitchen setup. Save favorites to your personal collection.')}
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-[#A8C9B8]"></div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 h-full">
                <div className="w-16 h-16 rounded-full bg-[#A8C9B8] flex items-center justify-center mb-6 text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#035035] mb-3 sm:mb-4">{t('howItWorks.step3.title', 'Cook with Confidence')}</h3>
                <p className="text-sm sm:text-base text-[#2D2D2D] leading-relaxed">
                  {t('howItWorks.step3.description', 'Follow interactive step-by-step guidance with tips, timers, and voice assistance. Create amazing dishes every time.')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-[#FFF8F0] py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#035035] mb-4">
                {t('features.title', 'Cooking Made Simple & Fun')}
              </h2>
              <p className="text-base sm:text-lg text-[#2D2D2D] max-w-2xl mx-auto">
                {t('features.subtitle', 'From inspiration to the final dish, we guide you every step of the way')}
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-[#FFF8F0] flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-[#FF9B7B]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#035035] mb-3 sm:mb-4">{t('features.aiBrainstorming.title', 'AI Recipe Brainstorming')}</h3>
                <p className="text-sm sm:text-base text-[#2D2D2D] leading-relaxed">
                  {t('features.aiBrainstorming.description', "Tell us your preferences, dietary needs, or what's in your fridge. Our AI creates personalized recipes just for you, tailored to your taste and skill level.")}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-[#FFF8F0] flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8 text-[#035035]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#035035] mb-3 sm:mb-4">{t('features.cookingGuide.title', 'Interactive Cooking Guide')}</h3>
                <p className="text-sm sm:text-base text-[#2D2D2D] leading-relaxed">
                  {t('features.cookingGuide.description', 'Follow along with step-by-step instructions, helpful tips, and voice assistance. Cook with confidence, no matter your experience level.')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="bg-gradient-to-br from-[#035035] to-[#046847] rounded-3xl p-10 sm:p-12 lg:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white opacity-5"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-white opacity-5"></div>
            <div className="absolute top-1/2 left-1/4 w-3 h-3 rounded-full bg-[#FF9B7B]"></div>
            <div className="absolute top-1/3 right-1/4 w-4 h-4 rounded-full bg-[#FF9B7B]"></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <ChefHat className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-6 animate-bounce" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                {t('cta.title', 'Ready to Transform Your Cooking?')}
              </h2>
              <p className="text-base sm:text-lg mb-8 opacity-90">
                {t('cta.subtitle', 'Join thousands of home chefs discovering the joy of personalized, guided cooking')}
              </p>
              <button className="bg-[#FF9B7B] text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:scale-105 transition-all shadow-lg hover:shadow-2xl inline-flex items-center gap-2">
                {t('cta.button', 'Download Piatto Free')}
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) translateX(0px);
            }
            25% {
              transform: translateY(-15px) translateX(10px);
            }
            50% {
              transform: translateY(-8px) translateX(-8px);
            }
            75% {
              transform: translateY(-12px) translateX(5px);
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

          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
    </LandingLayout>
  )
}
