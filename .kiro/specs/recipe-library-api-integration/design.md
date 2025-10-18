# Design Document

## Overview

This design document outlines the integration of the Recipe Library frontend with the existing backend APIs. The solution will replace hardcoded recipe data with dynamic data fetched from the server, enabling users to view, manage, and cook recipes from their personal library. The implementation follows React best practices, uses the existing API infrastructure, and maintains consistency with the Piattio brand style guide.

### Key Design Principles

1. **Separation of Concerns**: API logic separated into dedicated service layer
2. **Progressive Enhancement**: Graceful degradation with loading and error states
3. **Reusability**: Shared components and utilities for common patterns
4. **Performance**: Efficient data fetching with proper caching strategies
5. **User Experience**: Smooth transitions and clear feedback for all actions

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ RecipeLibrary│  │  RecipeView  │  │ Instructions │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Service Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  recipeApi   │  │  cookingApi  │  │ preparingApi │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      baseApi.js                              │
│              (apiWithCookies - Axios Instance)               │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend REST APIs                         │
│     /recipe/*    /cooking/*    /preparing/*                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Recipe Library Load**:
   - Component mounts → Fetch user recipes → Display in grid
   - Search/filter → Client-side filtering → Update display

2. **Recipe Detail View**:
   - Navigate with recipe ID → Fetch recipe details → Display recipe
   - User adjusts servings → Recalculate ingredients → Update display

3. **Start Cooking Session**:
   - User clicks "Start Cooking" → Create cooking session → Navigate to Instructions
   - Instructions load → Fetch session state and recipe → Display steps
   - User progresses → Update session state → Sync with backend

## Components and Interfaces

### API Service Layer

#### recipeApi.js

```javascript
// Location: frontend/src/api/recipeApi.js

import { apiWithCookies } from './baseApi';

/**
 * Fetch all permanent recipes for the authenticated user
 * @returns {Promise<Array>} Array of recipe preview objects
 */
export const getUserRecipes = async () => {
  const response = await apiWithCookies.get('/recipe/list');
  return response.data;
};

/**
 * Fetch a single recipe by ID
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<Object>} Complete recipe object
 */
export const getRecipeById = async (recipeId) => {
  const response = await apiWithCookies.get(`/recipe/${recipeId}/get`);
  return response.data;
};

/**
 * Save a recipe (mark as permanent)
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<void>}
 */
export const saveRecipe = async (recipeId) => {
  const response = await apiWithCookies.post(`/recipe/${recipeId}/save`);
  return response.data;
};

/**
 * Delete a recipe
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<void>}
 */
export const deleteRecipe = async (recipeId) => {
  const response = await apiWithCookies.delete(`/recipe/${recipeId}/delete`);
  return response.data;
};

/**
 * Update recipe using AI
 * @param {number} recipeId - The recipe ID
 * @param {string} changePrompt - The change request
 * @returns {Promise<Object>} Updated recipe object
 */
export const changeRecipeAI = async (recipeId, changePrompt) => {
  const response = await apiWithCookies.put('/recipe/change_ai', {
    recipe_id: recipeId,
    change_prompt: changePrompt,
  });
  return response.data;
};

/**
 * Update recipe manually
 * @param {number} recipeId - The recipe ID
 * @param {Object} updates - Recipe updates
 * @returns {Promise<Object>} Updated recipe object
 */
export const changeRecipeManual = async (recipeId, updates) => {
  const response = await apiWithCookies.put('/recipe/change_manual', {
    recipe_id: recipeId,
    ...updates,
  });
  return response.data;
};
```

#### cookingApi.js

```javascript
// Location: frontend/src/api/cookingApi.js

import { apiWithCookies } from './baseApi';

/**
 * Start a cooking session for a recipe
 * @param {number} recipeId - The recipe ID
 * @returns {Promise<number>} Cooking session ID
 */
export const startCookingSession = async (recipeId) => {
  const response = await apiWithCookies.post(`/cooking/${recipeId}/start`);
  return response.data; // Returns session ID
};

/**
 * Get cooking session details
 * @param {number} sessionId - The cooking session ID
 * @returns {Promise<Object>} Cooking session object
 */
export const getCookingSession = async (sessionId) => {
  const response = await apiWithCookies.get(`/cooking/${sessionId}/get_session`);
  return response.data;
};

/**
 * Update cooking session state (progress through steps)
 * @param {number} sessionId - The cooking session ID
 * @param {number} newState - The new state/step number
 * @returns {Promise<void>}
 */
export const updateCookingState = async (sessionId, newState) => {
  const response = await apiWithCookies.put('/cooking/change_state', {
    cooking_session_id: sessionId,
    new_state: newState,
  });
  return response.data;
};

/**
 * Ask a question during cooking
 * @param {number} sessionId - The cooking session ID
 * @param {string} prompt - The question
 * @returns {Promise<Object>} Prompt history with response
 */
export const askCookingQuestion = async (sessionId, prompt) => {
  const response = await apiWithCookies.post('/cooking/ask_question', {
    cooking_session_id: sessionId,
    prompt,
  });
  return response.data;
};

/**
 * Get prompt history for a cooking session
 * @param {number} sessionId - The cooking session ID
 * @returns {Promise<Object>} Prompt history object
 */
export const getPromptHistory = async (sessionId) => {
  const response = await apiWithCookies.get(`/cooking/${sessionId}/get_prompt_history`);
  return response.data;
};

/**
 * Finish a cooking session
 * @param {number} sessionId - The cooking session ID
 * @returns {Promise<void>}
 */
export const finishCookingSession = async (sessionId) => {
  const response = await apiWithCookies.delete(`/cooking/${sessionId}/finish`);
  return response.data;
};
```

### Component Updates

#### RecipeLibrary.jsx

**Current State**: Displays hardcoded recipe array

**Updated Design**:
- Add state management for recipes, loading, and errors
- Fetch recipes on component mount using `getUserRecipes()`
- Implement loading skeleton/spinner
- Implement error state with retry button
- Implement empty state when no recipes exist
- Update recipe cards to use dynamic data
- Update navigation to pass recipe ID to RecipeView
- Implement client-side search filtering

**Key State Variables**:
```javascript
const [recipes, setRecipes] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [searchQuery, setSearchQuery] = useState('');
```

**Data Transformation**:
Backend recipe preview format needs to be mapped to component expectations:
```javascript
// Backend format
{
  id: number,
  title: string,
  description: string,
  image_url: string
}

// Component needs (extended with defaults)
{
  id: number,
  name: string,        // mapped from title
  time: string,        // default or extracted from recipe
  servings: string,    // default or extracted from recipe
  difficulty: string,  // default or extracted from recipe
  image: string,       // mapped from image_url
  category: string     // default or extracted from recipe
}
```

#### RecipeView.jsx

**Current State**: Container component with split view (Recipe + Instructions)

**Updated Design**:
- Extract recipe ID from URL params using `useParams()`
- Pass recipe ID to Recipe component
- Pass recipe ID to Instructions component (for cooking session)
- Handle recipe not found scenario

#### Recipe.jsx

**Current State**: Displays hardcoded recipe data

**Updated Design**:
- Accept recipe ID as prop
- Fetch recipe details on mount using `getRecipeById()`
- Implement loading state
- Implement error state
- Transform backend data to component format
- Update ingredient calculations to work with backend data structure
- Implement save/delete actions
- Handle missing nutrition data gracefully (hide tab if not available)

**Key State Variables**:
```javascript
const [recipe, setRecipe] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [servings, setServings] = useState(4);
const [activeTab, setActiveTab] = useState('ingredients');
```

**Data Transformation**:
```javascript
// Backend format
{
  id: number,
  title: string,
  description: string,
  ingredients: [
    { name: string, quantity: number, unit: string }
  ],
  instructions: [
    { Instruction: string, timer: number }
  ],
  image_url: string
}

// Component format
{
  baseServings: number,  // extracted or default to 4
  ingredients: [
    { amount: number, unit: string, name: string }
  ],
  instructions: [
    { title: string, description: string, timer: number }
  ]
}
```

#### Instructions.jsx

**Current State**: Displays hardcoded instruction steps

**Updated Design**:
- Accept recipe ID and optional cooking session ID as props
- If no cooking session exists, provide "Start Cooking" button
- When "Start Cooking" clicked, call `startCookingSession()` and update state
- Fetch recipe instructions using recipe ID
- Display steps from recipe data
- Track current step/state
- Implement step completion with `updateCookingState()`
- Add AI assistant chat interface for asking questions
- Display prompt history if available

**Key State Variables**:
```javascript
const [cookingSessionId, setCookingSessionId] = useState(null);
const [currentStep, setCurrentStep] = useState(0);
const [instructions, setInstructions] = useState([]);
const [loading, setLoading] = useState(true);
const [chatMessages, setChatMessages] = useState([]);
const [userQuestion, setUserQuestion] = useState('');
```

### Shared Components

#### LoadingSpinner.jsx

```javascript
// Location: frontend/src/components/LoadingSpinner.jsx

// Reusable loading spinner following brand style guide
// Uses Forest Green (#035035) color
// Bouncy animation with cubic-bezier easing
```

#### ErrorMessage.jsx

```javascript
// Location: frontend/src/components/ErrorMessage.jsx

// Reusable error message component
// Props: message, onRetry
// Displays error with retry button
// Uses Coral Sunset (#FF9B7B) for error accent
```

#### EmptyState.jsx

```javascript
// Location: frontend/src/components/EmptyState.jsx

// Reusable empty state component
// Props: title, message, actionLabel, onAction
// Displays friendly empty state with call-to-action
```

## Data Models

### Recipe (Frontend)

```typescript
interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  imageUrl: string;
  baseServings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  difficulty?: string;
  category?: string;
}

interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

interface Instruction {
  Instruction: string;
  timer: number | null;
}
```

### RecipePreview (Frontend)

```typescript
interface RecipePreview {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  // Extended with defaults for display
  time?: string;
  servings?: string;
  difficulty?: string;
  category?: string;
}
```

### CookingSession (Frontend)

```typescript
interface CookingSession {
  id: number;
  recipeId: number;
  state: number; // Current step (0 = not started, 1+ = step number)
}
```

### PromptHistory (Frontend)

```typescript
interface PromptHistory {
  prompts: string[];
  responses: string[];
}
```

## Error Handling

### Error Types and Handling Strategy

1. **Network Errors**:
   - Display: "Unable to connect. Please check your internet connection."
   - Action: Retry button
   - Implementation: Catch in component, display ErrorMessage component

2. **404 Not Found**:
   - Display: "Recipe not found. It may have been deleted."
   - Action: Navigate back to library
   - Implementation: Check response status, redirect with message

3. **401 Unauthorized**:
   - Handled automatically by baseApi interceptor
   - Attempts token refresh
   - Redirects to login if refresh fails

4. **500 Server Error**:
   - Display: "Something went wrong. Please try again later."
   - Action: Retry button
   - Implementation: Generic error handling

5. **Validation Errors**:
   - Display specific validation message from backend
   - Action: Allow user to correct input
   - Implementation: Parse error response, display field-specific errors

### Error Handling Pattern

```javascript
const fetchRecipes = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const data = await getUserRecipes();
    setRecipes(data);
  } catch (err) {
    console.error('Failed to fetch recipes:', err);
    
    if (err.response?.status === 404) {
      setError('No recipes found. Start by creating your first recipe!');
    } else if (err.response?.status >= 500) {
      setError('Server error. Please try again later.');
    } else if (!err.response) {
      setError('Network error. Please check your connection.');
    } else {
      setError('Failed to load recipes. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

## Testing Strategy

### Unit Testing

**API Service Tests**:
- Mock axios responses
- Test successful API calls
- Test error handling
- Test data transformation

**Component Tests**:
- Test loading states
- Test error states
- Test empty states
- Test data rendering
- Test user interactions (search, filter, navigation)

### Integration Testing

- Test complete user flows:
  - Browse recipes → View recipe → Start cooking
  - Search recipes → Select result → View details
  - Delete recipe → Confirm → Update library

### Manual Testing Checklist

- [ ] Recipe library loads with user's recipes
- [ ] Search filters recipes correctly
- [ ] Recipe detail view displays all information
- [ ] Serving size adjustment recalculates ingredients
- [ ] Start cooking creates session and navigates
- [ ] Cooking instructions display correctly
- [ ] Step progression updates session state
- [ ] AI assistant responds to questions
- [ ] Save recipe marks as permanent
- [ ] Delete recipe removes from library
- [ ] Error states display appropriately
- [ ] Loading states show during API calls
- [ ] Mobile responsive layout works correctly
- [ ] Touch targets are appropriately sized

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**:
   - Load recipe images lazily
   - Use React.lazy for route-based code splitting

2. **Caching**:
   - Consider implementing React Query or SWR for automatic caching
   - Cache recipe list to avoid refetching on navigation back

3. **Debouncing**:
   - Debounce search input to reduce re-renders

4. **Memoization**:
   - Use useMemo for expensive calculations (ingredient adjustments)
   - Use useCallback for event handlers passed to child components

5. **Image Optimization**:
   - Use responsive images with srcset
   - Implement placeholder images while loading
   - Consider WebP format for better compression

### Performance Targets

- Initial page load: < 2s on 3G
- Recipe list render: < 500ms
- Recipe detail load: < 1s
- Search filter response: < 100ms (instant feel)

## Security Considerations

1. **Authentication**:
   - All API calls use authenticated endpoints
   - Leverage existing cookie-based auth with refresh token

2. **Authorization**:
   - Backend validates user owns recipe before operations
   - Frontend doesn't expose other users' recipes

3. **Input Validation**:
   - Validate user inputs before sending to API
   - Sanitize any user-generated content displayed

4. **XSS Prevention**:
   - React automatically escapes content
   - Be cautious with dangerouslySetInnerHTML (avoid if possible)

5. **CSRF Protection**:
   - Existing baseApi configuration handles CSRF tokens

## Migration Strategy

### Phase 1: API Service Layer
- Create recipeApi.js and cookingApi.js
- Test API calls independently
- Ensure error handling works correctly

### Phase 2: Recipe Library Integration
- Update RecipeLibrary component to fetch data
- Implement loading and error states
- Test search and filter functionality

### Phase 3: Recipe Detail Integration
- Update Recipe component to fetch data
- Handle data transformation
- Test serving size calculations

### Phase 4: Cooking Session Integration
- Update Instructions component
- Implement cooking session creation
- Add AI assistant chat interface

### Phase 5: Polish and Testing
- Add shared components (LoadingSpinner, ErrorMessage, EmptyState)
- Comprehensive testing
- Performance optimization
- Mobile responsiveness verification

## Future Enhancements

1. **Offline Support**:
   - Cache recipes for offline viewing
   - Queue actions when offline, sync when online

2. **Recipe Sharing**:
   - Generate shareable links
   - Export recipes as PDF

3. **Advanced Filtering**:
   - Filter by dietary restrictions
   - Filter by available ingredients
   - Sort by recently cooked, favorites, etc.

4. **Recipe Collections**:
   - Group recipes into collections/meal plans
   - Share collections with other users

5. **Voice Assistant**:
   - Voice commands during cooking
   - Hands-free step progression

6. **Shopping List**:
   - Generate shopping list from recipe ingredients
   - Combine ingredients from multiple recipes
