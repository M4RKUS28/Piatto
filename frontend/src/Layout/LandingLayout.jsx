import { Link } from 'react-router-dom'

export default function LandingLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="bg-[#FFF8F0] border-b border-[#F5F5F5] sticky top-0 z-50">
        <div className="w-full py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center">
                <img src="/logo_no_P.svg" alt="Piatto" className="w-10 h-10" />
              </div>
              <span className="text-2xl font-bold text-[#035035]" style={{ fontFamily: 'Georgia, serif' }}>Piatto</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">How It Works</a>
              <a href="#recipes" className="text-[#2D2D2D] hover:text-[#035035] transition-colors font-medium">Recipes</a>
            </div>

            <Link
              to="/app"
              className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#035035] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <img src="/logo_full_name.svg" alt="Piatto" className="w-8 h-8" />
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
    </div>
  )
}
