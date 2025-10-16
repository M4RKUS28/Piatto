import React, { useState } from 'react';
import { ChefHat, Sparkles, BookOpen, Clock } from 'lucide-react';

export default function LandingPage() {
  const [activeRecipe, setActiveRecipe] = useState(0);

  const recipes = [
    {
      name: "Mediterranean Sunset Bowl",
      description: "Fresh quinoa with roasted vegetables, feta, and lemon herb dressing",
      time: "25 min",
      difficulty: "Easy",
      color: "#FF9B7B"
    },
    {
      name: "Creamy Tuscan Chicken",
      description: "Pan-seared chicken in sun-dried tomato cream sauce with spinach",
      time: "35 min",
      difficulty: "Medium",
      color: "#035035"
    },
    {
      name: "Berry Bliss Smoothie Bowl",
      description: "Antioxidant-rich blend topped with granola, fresh berries & coconut",
      time: "10 min",
      difficulty: "Easy",
      color: "#A8C9B8"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Decorative Background Elements */}
      <div className="fixed top-20 right-20 w-64 h-64 rounded-full bg-[#A8C9B8] opacity-10 blur-3xl"></div>
      <div className="fixed bottom-40 left-10 w-80 h-80 rounded-full bg-[#FF9B7B] opacity-10 blur-3xl"></div>
      
      {/* Navigation Bar - Cream Color */}
      <nav className="bg-[#FFF8F0] border-b border-[#F5F5F5] sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center">
                <img src="logo_full_name.svg" alt="Piatto" className="w-10 h-10" />
              </div>
              <span className="text-2xl font-bold text-[#035035]" style={{ fontFamily: 'Georgia, serif' }}>Piatto</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">How It Works</a>
              <a href="#recipes" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">Recipes</a>
            </div>

            {/* CTA Button */}
            <button className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#FFF8F0] px-4 py-2 rounded-full border border-[#A8C9B8]">
              <Sparkles className="w-4 h-4 text-[#FF9B7B]" />
              <span className="text-sm font-medium text-[#035035]">AI-Powered Cooking Assistant</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-[#035035] leading-tight">
              Your Personal Chef, Right in Your Pocket
            </h1>

            <p className="text-xl text-[#2D2D2D] leading-relaxed">
              Discover personalized recipes, get step-by-step cooking guidance, and turn your kitchen into a culinary playground with AI-powered creativity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-[#035035] text-white px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                <ChefHat className="w-5 h-5" />
                Start Cooking
              </button>
              <button className="bg-transparent border-2 border-[#FF9B7B] text-[#FF9B7B] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#FF9B7B] hover:text-white transition-all flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" />
                Explore Recipes
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF8F0] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#035035]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#035035]">AI Recipe Generator</h3>
                  <p className="text-sm text-[#2D2D2D]">Custom recipes for your taste</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF8F0] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-[#035035]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#035035]">Interactive Guide</h3>
                  <p className="text-sm text-[#2D2D2D]">Step-by-step instructions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Decorative circles behind phone */}
            <div className="absolute top-10 right-20 w-20 h-20 rounded-full bg-[#FF9B7B] opacity-20 animate-float"></div>
            <div className="absolute bottom-20 right-40 w-16 h-16 rounded-full bg-[#A8C9B8] opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-32 right-10 w-12 h-12 rounded-full bg-[#035035] opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>

            {/* Phone Frame */}
            <div className="relative z-10 w-[320px] h-[640px] bg-[#2D2D2D] rounded-[3rem] shadow-2xl p-3 transform hover:scale-105 transition-transform duration-500">
              {/* Phone Notch */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-[#2D2D2D] rounded-full z-20"></div>
              
              {/* Phone Screen */}
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                {/* App Header */}
                <div className="bg-[#035035] text-white p-6 pb-8 rounded-b-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Discover</h2>
                    <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <ChefHat className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm opacity-90">What would you like to cook today?</p>
                </div>

                {/* Recipe Cards */}
                <div className="p-4 space-y-4 -mt-4">
                  {recipes.map((recipe, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all border-2 border-transparent hover:border-[#FF9B7B]"
                      onMouseEnter={() => setActiveRecipe(index)}
                      style={{
                        animation: `slideIn 0.5s ease-out ${index * 0.1}s backwards`
                      }}
                    >
                      {/* Recipe Image */}
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

                      {/* Recipe Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-[#035035] mb-2">{recipe.name}</h3>
                        <p className="text-sm text-[#2D2D2D] mb-3 leading-relaxed">{recipe.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#A8C9B8] bg-[#FFF8F0] px-3 py-1 rounded-full">
                            {recipe.difficulty}
                          </span>
                          <button className="text-[#FF9B7B] font-semibold text-sm hover:text-[#035035] transition-colors">
                            Start Cooking →
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

      {/* Features Section */}
      <section id="features" className="bg-[#FFF8F0] py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#035035] mb-4">
              Cooking Made Simple & Fun
            </h2>
            <p className="text-xl text-[#2D2D2D] max-w-2xl mx-auto">
              From inspiration to the final dish, we guide you every step of the way
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-[#FFF8F0] flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-[#FF9B7B]" />
              </div>
              <h3 className="text-2xl font-bold text-[#035035] mb-4">AI Recipe Brainstorming</h3>
              <p className="text-[#2D2D2D] leading-relaxed">
                Tell us your preferences, dietary needs, or what's in your fridge. Our AI creates personalized recipes just for you, tailored to your taste and skill level.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-[#FFF8F0] flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-[#035035]" />
              </div>
              <h3 className="text-2xl font-bold text-[#035035] mb-4">Interactive Cooking Guide</h3>
              <p className="text-[#2D2D2D] leading-relaxed">
                Follow along with step-by-step instructions, helpful tips, and voice assistance. Cook with confidence, no matter your experience level.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-[#035035] to-[#046847] rounded-3xl p-12 lg:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white opacity-5"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-white opacity-5"></div>
          <div className="absolute top-1/2 left-1/4 w-3 h-3 rounded-full bg-[#FF9B7B]"></div>
          <div className="absolute top-1/3 right-1/4 w-4 h-4 rounded-full bg-[#FF9B7B]"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <ChefHat className="w-16 h-16 mx-auto mb-6 animate-bounce" />
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Cooking?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of home chefs discovering the joy of personalized, guided cooking
            </p>
            <button className="bg-[#FF9B7B] text-white px-10 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-lg hover:shadow-2xl inline-flex items-center gap-2">
              Download Piatto Free
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#035035] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <img src="logo_full_name.svg" alt="Piatto" className="w-8 h-8" />
                </div>
                <span className="text-xl font-bold">Piatto</span>
              </div>
              <p className="text-sm opacity-80">
                Your AI-powered cooking companion for delicious everyday meals
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Features</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Recipes</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition-opacity">About Us</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Blog</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Instagram</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">TikTok</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Pinterest</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white border-opacity-20 pt-8 text-center text-sm opacity-80">
            <p>© 2025 Piatto. Cooking made delightful, one recipe at a time.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
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
  );
}