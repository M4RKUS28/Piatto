import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import MainLayout from './Layout/MainLayout.jsx'
import Dashboard from './pages/app/Dashboard.jsx'
import Recipes from './pages/app/Recipes.jsx'
import RecipeView from "./pages/app/RecipeView.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="spaghetti" element={<RecipeView />} />
      </Route>
    </Routes>
  )
}

export default App
