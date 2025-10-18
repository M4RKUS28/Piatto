import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingLayout from './Layout/LandingLayout.jsx'
import AuthLayout from './Layout/AuthLayout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import MainLayout from './Layout/MainLayout.jsx'
import Dashboard from './pages/app/Dashboard.jsx'
import RecipeLibrary from './pages/app/RecipeLibrary.jsx'
import RecipeView from "./pages/app/RecipeView.jsx"
import RecipeGeneration from './pages/app/RecipeGeneration.jsx'
import ProfileSettings from './pages/app/ProfileSettings.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage.jsx'
import OAuthLoginFailedPage from './pages/auth/OAuthLoginFailedPage.jsx'
import LoginFailedPage from './pages/auth/LoginFailedPage.jsx'
import RegisterFailedPage from './pages/auth/RegisterFailedPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ContactPage from './pages/ContactPage.jsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth pages with minimal AuthLayout (no auth buttons, no footer) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
          <Route path="/oauth/callback/login-failed" element={<OAuthLoginFailedPage />} />
          <Route path="/login-failed" element={<LoginFailedPage />} />
          <Route path="/register-failed" element={<RegisterFailedPage />} />
        </Route>

        {/* Public info pages with full LandingLayout */}
        <Route element={<LandingLayout />}>
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Protected app routes with MainLayout */}
        <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="generate" element={<RecipeGeneration />} />
          <Route path="recipes" element={<RecipeLibrary />} />
          <Route path="recipe/:recipeId" element={<RecipeView />} />
          <Route path="settings" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}


export default App
