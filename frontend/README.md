# Piatto Frontend - React SPA

Technical documentation for the Piatto frontend application built with React 19, Vite 7, and Tailwind CSS 4.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Component Flow](#component-flow)
- [Routing](#routing)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling & Theming](#styling--theming)
- [Internationalization](#internationalization)
- [Development Setup](#development-setup)
- [Build & Deployment](#build--deployment)

---

## Overview

The Piatto frontend is a modern Single Page Application (SPA) that provides:

- **Responsive UI** for desktop and mobile devices
- **Real-time recipe generation** with AI assistance
- **Interactive cooking interface** with step-by-step guidance
- **Multi-language support** (English, German)
- **OAuth authentication** with Google
- **Cloud-synced recipe library** with collections
- **Voice assistant integration** (optional)

---

## Architecture

### High-Level Design

```text
User Interaction
    *
React Component (src/pages/*)
    *
API Client (src/api/*.js)
    *
Axios HTTP Request
    *
Backend FastAPI (via /api/*)
    *
Response * State Update * UI Re-render
```

### Component Flow Example

**Recipe Generation Flow:**

1. **Page Component** (`RecipeGenerationDesktop.jsx`) renders form
2. **User Input** triggers `handleGenerate()` function
3. **API Client** (`recipeApi.js`) sends POST to `/api/recipe/generate`
4. **Loading State** displays spinner via local state
5. **Response Handler** updates UI with generated recipe
6. **Navigation** routes to recipe view on success
7. **Error Handling** displays error message if failed

---

## Tech Stack

### Core

- **React 19.1** - UI library with latest features
- **Vite 7.1** - Next-generation build tool
- **React Router 6.29** - Client-side routing

### Styling

- **Tailwind CSS 4.1** - Utility-first CSS framework
- **@tailwindcss/vite** - Vite plugin for Tailwind
- **Framer Motion 12.23** - Animation library
- **Lottie React 2.4** - Animation player

### State & Data

- **React Context API** - Global auth state
- **Axios 1.12** - HTTP client with interceptors
- **Custom Hooks** - Reusable stateful logic

### Internationalization

- **i18next 25.6** - i18n framework
- **react-i18next 16.2** - React bindings
- **i18next-browser-languagedetector** - Auto language detection

### UI Components & Icons

- **Lucide React** - Icon library
- **React Icons** - Additional icons
- **React Markdown 9.0** - Markdown renderer
- **react-timer-hook 4.0** - Timer utilities

### Development Tools

- **ESLint 9** - Code linting
- **@vitejs/plugin-react** - React fast refresh

---

## Project Structure

```text
frontend/
 - src/
     - main.jsx                   # Application entry point
     - App.jsx                    # Root component with routing
     - index.css                  # Global styles
     
     - api/                       # API client layer
         - baseApi.js            # Axios instance with interceptors
         - authApi.js            # Authentication endpoints
         - recipeApi.js          # Recipe CRUD operations
         - collectionApi.js      # Collection management
         - instructionApi.js     # Cooking instructions
         - cookingApi.js         # Active cooking session
         - preparingApi.js       # Preparation phase
         - filesApi.js           # File upload/download
     
     - pages/                     # Route-based page components
         - LandingPage.jsx       # Public homepage
         - AboutPage.jsx         # About us
         - ContactPage.jsx       # Contact form
         - PrivacyPage.jsx       # Privacy policy
         - DownloadPage.jsx      # App download
         - NotFoundPage.jsx      # 404 page
         
         - auth/                 # Authentication pages
             - LoginPage.jsx
             - RegisterPage.jsx
             - OAuthCallbackPage.jsx
             - LoginFailedPage.jsx
             - RegisterFailedPage.jsx
             - OAuthLoginFailedPage.jsx
         
         - app/                  # Protected app pages
             - RecipeLibrary/    # Recipe collection view
               RecipeLibrary.jsx
             - RecipeGenerationDesktop/ # Desktop recipe gen
                 index.jsx
             - RecipeGenerationMobile/  # Mobile recipe gen
                 index.jsx
             - RecipeView.jsx    # Recipe detail & cooking
             - AllRecipesView.jsx # All recipes grid
             - CollectionRecipesView.jsx # Collection detail
             - ProfileSettings.jsx # User settings
             - Instructions/     # Cooking instruction UI
                 Instructions.jsx
     
     - components/                # Reusable components
         - Header.jsx            # App header with nav
         - Footer.jsx            # App footer
         - ProtectedRoute.jsx    # Auth guard component
         - LoadingSpinner.jsx    # Loading indicator
         - ErrorMessage.jsx      # Error display
         - EmptyState.jsx        # Empty state placeholder
         - RecipePreviewCard.jsx # Recipe card component
         - RecipeCardMenu.jsx    # Recipe actions menu
         - RecipeDetailsModal.jsx # Recipe detail modal
         - RecipeGenerationModal.jsx # Recipe gen modal
         - CollectionImageCollage.jsx # Collection thumbnail
         - CollectionCardMenu.jsx # Collection actions
         - SaveRecipesCollectionModal.jsx # Save to collection
         - EditCollectionNameModal.jsx # Edit collection
         - EditCollectionsModal.jsx # Manage collections
         - DeleteRecipeModal.jsx # Delete confirmation
         - DeleteCollectionModal.jsx # Delete collection
         - SessionStartDialog.jsx # Cooking session start
         - WakeWordDetection.jsx # Voice wake word
         - InstructionOnboardingTour.jsx # Tutorial
     
     - contexts/                  # React contexts
         - AuthContext.jsx       # Authentication state
     
     - hooks/                     # Custom hooks
         - useMediaQuery.js      # Responsive breakpoints
         - useWakeWordDetection.js # Voice detection
     
     - Layout/                    # Layout components
         - MainLayout.jsx        # Main app layout
         - AuthLayout.jsx        # Auth page layout
     
     - assets/                    # Static assets
         - images/
         - lotties/
         - icons/
 
 - public/                        # Public static files
     - locales/                  # i18n translations
         - en/
             - translation.json
         - de/
             - translation.json
     - lottie-animations/        # Lottie files
     - logo_full_name.svg
     - favicon.ico
 
 - Dockerfile.prebuilt            # Production Nginx container
 - nginx.conf                     # Nginx SPA config
 - vite.config.js                # Vite configuration
 - tailwind.config.js            # Tailwind configuration
 - eslint.config.js              # ESLint configuration
 - package.json                  # Dependencies & scripts
 - README.md                     # This file
```

---

## Component Flow

### Data Flow Architecture

```text
                      User Interaction                         
 -
 
               Page Component (Container)                       
   - Manages local state (loading, errors, data)               
   - Handles user events                                       
   - Calls API clients                                         
   - API Client (src/api/*.js)                        
   - Axios instance with baseURL                               
   - Request/response interceptors                             
   - Auto token refresh on 401                                 
   - Backend API (FastAPI)                            
   - Response Processing                              
   - Success: Update state, trigger re-render                  
   - Error: Display error message, log to console              
```

### Example: Recipe Generation

**Component:** `src/pages/app/RecipeGenerationDesktop/index.jsx`

```jsx
function RecipeGenerationDesktop() {
  // Local state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ prompt: '', ingredients: [] });

  // API call
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API client
      const response = await recipeApi.generateRecipe(formData);

      // Handle success
      navigate(`/app/recipe/${response.data.id}`);
    } catch (err) {
      // Handle error
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* UI with form, loading spinner, error display */}
    </div>
  );
}
```

---

## Routing

### Route Configuration

**File:** `src/App.jsx`

```jsx
<Routes>
  {/* Public routes */}
  <Route path="/" element={<LandingPage />} />

  {/* Auth routes (minimal layout) */}
  <Route path="/auth" element={<AuthLayout />}>
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route path="oauth/callback" element={<OAuthCallbackPage />} />
  </Route>

  {/* Public info pages (main layout, landing mode) */}
  <Route element={<MainLayout mode="landing" />}>
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/contact" element={<ContactPage />} />
  </Route>

  {/* Protected app routes (main layout, app mode) */}
  <Route path="/app" element={<ProtectedRoute><MainLayout mode="app" /></ProtectedRoute>}>
    <Route index element={<RecipeLibrary />} />
    <Route path="generate" element={isMobile ? <RecipeGenerationMobile /> : <RecipeGenerationDesktop />} />
    <Route path="library" element={<RecipeLibrary />} />
    <Route path="recipes/all" element={<AllRecipesView />} />
    <Route path="collection/:collectionId" element={<CollectionRecipesView />} />
    <Route path="settings" element={<ProfileSettings />} />
  </Route>

  {/* Special: Recipe view without layout (fullscreen cooking) */}
  <Route path="/app/recipe/:recipeId" element={<ProtectedRoute><RecipeView /></ProtectedRoute>} />

  {/* 404 */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Protected Routes

**Component:** `src/components/ProtectedRoute.jsx`

```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  if (!user) {
    // Redirect to login, save intended destination
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}
```

---

## State Management

### Authentication Context

**File:** `src/contexts/AuthContext.jsx`

```jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    setUser(response.data.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Local Component State

Most state is managed locally in components using `useState` and `useEffect`:

- **Loading states**: `const [loading, setLoading] = useState(false)`
- **Error states**: `const [error, setError] = useState(null)`
- **Form data**: `const [formData, setFormData] = useState({})`
- **Modal states**: `const [isOpen, setIsOpen] = useState(false)`
- **Pagination**: `const [page, setPage] = useState(1)`

---

## API Integration

### Base API Client

**File:** `src/api/baseApi.js`

```javascript
import axios from 'axios';

const API_URL = '/api';

// Axios instance with credentials
export const apiWithCookies = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for auto token refresh
apiWithCookies.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh on 401 (except auth endpoints)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post('/api/auth/refresh', null, { withCredentials: true });
        return apiWithCookies(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### API Modules

#### Auth API (`src/api/authApi.js`)

```javascript
import { apiWithCookies } from './baseApi';

export const authApi = {
  register: (data) => apiWithCookies.post('/auth/register', data),
  login: (email, password) => apiWithCookies.post('/auth/login', { email, password }),
  logout: () => apiWithCookies.post('/auth/logout'),
  getCurrentUser: () => apiWithCookies.get('/auth/me'),
  googleLogin: () => window.location.href = '/api/auth/google',
};
```

#### Recipe API (`src/api/recipeApi.js`)

```javascript
export const recipeApi = {
  generateRecipe: (data) => apiWithCookies.post('/recipe/generate', data),
  createRecipe: (data) => apiWithCookies.post('/recipe/create', data),
  getRecipe: (id) => apiWithCookies.get(`/recipe/${id}/get`),
  getAllRecipes: () => apiWithCookies.get('/recipe/get_all'),
  updateRecipe: (id, data) => apiWithCookies.put(`/recipe/${id}/update`, data),
  deleteRecipe: (id) => apiWithCookies.delete(`/recipe/${id}/delete`),
  changeRecipeAI: (id, changes) => apiWithCookies.post(`/recipe/${id}/change_ai`, changes),
};
```

#### Collection API (`src/api/collectionApi.js`)

```javascript
export const collectionApi = {
  createCollection: (data) => apiWithCookies.post('/collection/create', data),
  getAllCollections: () => apiWithCookies.get('/collection/get_all'),
  getCollection: (id) => apiWithCookies.get(`/collection/${id}/get`),
  updateCollection: (id, data) => apiWithCookies.put(`/collection/${id}/update`, data),
  deleteCollection: (id) => apiWithCookies.delete(`/collection/${id}/delete`),
  addRecipeToCollection: (collectionId, recipeId) =>
    apiWithCookies.post(`/collection/${collectionId}/add_recipe`, { recipe_id: recipeId }),
  removeRecipeFromCollection: (collectionId, recipeId) =>
    apiWithCookies.delete(`/collection/${collectionId}/remove_recipe`, { data: { recipe_id: recipeId } }),
};
```

---

## Styling & Theming

### Tailwind CSS Configuration

**File:** `tailwind.config.js`

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Custom color palette
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Global Styles

**File:** `src/index.css`

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Custom CSS variables from i18n theme tokens */
:root {
  --color-primary: theme('colors.primary.500');
  --color-background: theme('colors.white');
}

/* Global component styles */
.btn-primary {
  @apply bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors;
}

.card {
  @apply bg-white rounded-lg shadow-md p-6;
}
```

### Animations

**Framer Motion Example:**

```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

---

## Internationalization

### i18n Configuration

**File:** `src/main.jsx`

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: require('../public/locales/en/translation.json'),
      },
      de: {
        translation: require('../public/locales/de/translation.json'),
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
```

### Translation Files

**English** (`public/locales/en/translation.json`):

```json
{
  "landing": {
    "hero": {
      "title": "Cook Smarter with AI",
      "subtitle": "Your personal cooking assistant"
    }
  },
  "recipe": {
    "generate": "Generate Recipe",
    "ingredients": "Ingredients",
    "instructions": "Instructions"
  }
}
```

**German** (`public/locales/de/translation.json`):

```json
{
  "landing": {
    "hero": {
      "title": "Intelligenter Kochen mit KI",
      "subtitle": "Dein pers*nlicher Kochassistent"
    }
  },
  "recipe": {
    "generate": "Rezept Generieren",
    "ingredients": "Zutaten",
    "instructions": "Anleitung"
  }
}
```

### Usage in Components

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('landing.hero.title')}</h1>
      <button onClick={() => i18n.changeLanguage('de')}>
        Switch to German
      </button>
    </div>
  );
}
```

---

## Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. **Navigate to frontend:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment (if needed):**

   Create `.env` file (optional):

   ```env
   VITE_API_URL=/api
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Access application:**

   Open [http://localhost:5173](http://localhost:5173)

### Development Scripts

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

---

## Build & Deployment

### Production Build

```bash
npm run build
```

**Output:** `dist/` directory with optimized static files

**Build optimizations:**

- Code splitting
- Tree shaking
- Minification
- Asset optimization (images, fonts)
- Hashed filenames for cache busting

### Deployment Options

#### Option 1: Cloud Run (Nginx)

**Uses:** `Dockerfile.prebuilt` + `nginx.conf`

```bash
# Build frontend
npm run build

# Build Docker image
docker build -f Dockerfile.prebuilt -t piatto-frontend .

# Deploy to Cloud Run
gcloud run deploy piatto-frontend \
  --image gcr.io/PROJECT_ID/piatto-frontend \
  --region us-central1 \
  --platform managed
```

#### Option 2: Cloud Storage + CDN

```bash
# Build frontend
npm run build

# Upload to Cloud Storage
gsutil -m rsync -d -r dist gs://static-web-piatto

# Set cache headers
gsutil -m setmeta -r -h "Cache-Control:public,max-age=3600" gs://static-web-piatto
```

### Nginx Configuration

**File:** `nginx.conf`

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Cache static assets aggressively
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Never cache index.html
  location = /index.html {
    add_header Cache-Control "no-cache";
    try_files $uri =404;
  }

  # SPA fallback: all other routes * index.html
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## Common Patterns

### Creating a New Page

1. **Create component** in `src/pages/`:

   ```jsx
   // src/pages/MyNewPage.jsx
   export default function MyNewPage() {
     return <div>My New Page</div>;
   }
   ```

2. **Add route** in `App.jsx`:

   ```jsx
   import MyNewPage from './pages/MyNewPage';

   <Route path="/my-page" element={<MyNewPage />} />
   ```

3. **Add navigation link**:

   ```jsx
   import { Link } from 'react-router-dom';

   <Link to="/my-page">Go to My Page</Link>
   ```

### Creating a Reusable Component

```jsx
// src/components/MyButton.jsx
export default function MyButton({ onClick, children, variant = 'primary' }) {
  const baseClasses = 'px-4 py-2 rounded font-semibold transition';
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}
```

### Custom Hook Example

```jsx
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## Troubleshooting

### Common Issues

**Issue:** `Module not found` errors

- **Solution:** Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`

**Issue:** `CORS errors` when calling API

- **Solution:** Ensure backend is running and CORS is configured for `http://localhost:5173`

**Issue:** `Page not found` on refresh in production

- **Solution:** Configure web server (Nginx, etc.) to serve `index.html` for all routes (SPA fallback)

**Issue:** Hot reload not working

- **Solution:** Check Vite config, ensure `server.watch` includes correct directories

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Main Project README](../README.md)
- [Backend README](../backend/README.md)

---

**For questions or contributions, see the main project repository.**
