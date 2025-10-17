import { Link } from 'react-router-dom'

export default function Footer() {
  return (
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
              <li><Link to="/#features" className="hover:opacity-100 transition-opacity">Features</Link></li>
              <li><Link to="/#recipes" className="hover:opacity-100 transition-opacity">Recipes</Link></li>
              <li><Link to="/about" className="hover:opacity-100 transition-opacity">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/about" className="hover:opacity-100 transition-opacity">About Us</Link></li>
              <li><Link to="/contact" className="hover:opacity-100 transition-opacity">Contact</Link></li>
              <li><Link to="/privacy" className="hover:opacity-100 transition-opacity">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Instagram</a></li>
              <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">TikTok</a></li>
              <li><a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Pinterest</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white border-opacity-20 pt-8 text-center text-sm opacity-80">
          <p>© 2025 Piatto. Cooking made delightful, one recipe at a time.</p>
        </div>
      </div>
    </footer>
  )
}
