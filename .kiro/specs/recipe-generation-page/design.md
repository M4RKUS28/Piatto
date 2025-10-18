# Design Document

## Overview

The Recipe Generation page is a new frontend feature that enables users to generate AI-powered recipe suggestions through a conversational, step-by-step workflow. Users first describe what they want to cook, then provide their available ingredients (via text or image), and finally select from 3 AI-generated recipe options. The page follows the Piattio design system and integrates seamlessly with existing backend APIs (preparing.py, recipe.py, cooking.py) to provide a complete recipe generation, viewing, and cooking workflow.

The design emphasizes simplicity and user experience, with a multi-step interface that guides users through the generation process, visual recipe preview cards for selection, and smooth transitions to existing recipe viewing and cooking functionality.

## Architecture

### Component Structure

```
RecipeGeneration (Page Component)
├── PromptStep (Step 1 Component)
│   └── PromptInput (Text Input)
├── IngredientsStep (Step 2 Component)
│   ├── TextIngredientsInput (Text Area)
│   └── ImageIngredientsUpload (Image Upload Component)
├── RecipeOptionsStep (Step 3 Component)
│   └── RecipePreviewCard[] (Card Component - exactly 3)
├── LoadingSpinner (Shared Component)
└── ErrorMessage (Shared Component)
```

### Data Flow

1. **Step 1: Prompt Input**
   - User enters what they want to cook (e.g., "healthy dinner", "quick pasta")
   - Validation: prompt must not be empty
   - On submit, proceed to Step 2

2. **Step 2: Ingredients Input**
   - User chooses between text input or image upload
   - Text: Enter comma-separated ingredients
   - Image: Upload photo of fridge/ingredients, store image_key
   - Validation: must provide either text or image
   - On submit, proceed to Step 3 (generation)

3. **Step 3: Recipe Generation Request**
   - POST /preparing/generate with prompt, written_ingredients, and optional image_key
   - Backend returns preparing_session_id
   - Frontend stores session ID in component state
   - Display loading state: "Generating your recipe options..."

4. **Recipe Options Retrieval**
   - GET /preparing/{preparing_session_id}/get_options
   - Backend returns array of exactly 3 RecipePreview objects
   - Frontend displays 3 preview cards

5. **Recipe Selection or Regeneration**
   - User clicks on a recipe preview card → Navigate to /app/recipe/:recipeId
   - OR user clicks "Generate New Recipes" → Call POST /preparing/generate again with same prompt/ingredients
   - Existing RecipeView component loads full recipe details

6. **Session Cleanup**
   - DELETE /preparing/{preparing_session_id}/finish
   - Called when user navigates away or selects a recipe

### State Management

The component will use React hooks for local state management:

```javascript
const [currentStep, setCurrentStep] = useState(1); // 1: prompt, 2: ingredients, 3: options
const [prompt, setPrompt] = useState('');
const [ingredients, setIngredients] = useState('');
const [imageKey, setImageKey] = useState('');
const [inputMethod, setInputMethod] = useState('text'); // 'text' or 'image'
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [preparingSessionId, setPreparingSessionId] = useState(null);
const [recipeOptions, setRecipeOptions] = useState([]);
```

## Components and Interfaces

### 1. RecipeGeneration (Main Page Component)

**Location:** `frontend/src/pages/app/RecipeGeneration.jsx`

**Purpose:** Main container component that orchestrates the multi-step recipe generation workflow

**Props:** None (route component)

**State:**
- `currentStep`: Number (1, 2, or 3) indicating current step
- `prompt`: String for user's cooking prompt
- `ingredients`: String for text-based ingredients
- `imageKey`: String for uploaded image reference
- `inputMethod`: String ('text' or 'image') for ingredient input method
- `loading`: Boolean for loading state
- `error`: String or null for error messages
- `preparingSessionId`: Number or null for session tracking
- `recipeOptions`: Array of recipe preview objects (always 3)

**Key Methods:**
- `handlePromptSubmit(promptText)`: Validates prompt and moves to step 2
- `handleIngredientsSubmit(ingredientsText, imageKey)`: Validates ingredients and triggers generation
- `handleGenerateRecipes()`: Calls POST /preparing/generate API
- `handleGetRecipeOptions()`: Calls GET /preparing/{id}/get_options API
- `handleRecipeSelect(recipeId)`: Navigates to recipe view and cleans up session
- `handleRegenerateRecipes()`: Calls generate API again with same prompt/ingredients
- `handleGoBack()`: Returns to previous step
- `handleCleanupSession()`: Calls DELETE /preparing/{id}/finish

**Lifecycle:**
- `useEffect` with cleanup to call DELETE /preparing/{id}/finish on unmount

### 2. PromptStep (Step 1 Component)

**Location:** `frontend/src/pages/app/RecipeGeneration.jsx` (inline or separate file)

**Purpose:** Collects user's cooking prompt/intention

**Props:**
- `onSubmit`: Function to handle prompt submission
- `initialValue`: String with default prompt value (optional)
- `loading`: Boolean to disable form during submission

**State:**
- `promptText`: String (input value)
- `error`: String or null for validation error

**Validation Rules:**
- Prompt: Required, minimum 3 characters

**UI Elements:**
- Large heading: "What do you want to cook today?"
- Text input or textarea with placeholder: "e.g., Something healthy for dinner, Quick pasta dish, Comfort food..."
- "Next" button (Primary button style)
- Examples or suggestions below input (optional)

### 3. IngredientsStep (Step 2 Component)

**Location:** `frontend/src/pages/app/RecipeGeneration.jsx` (inline or separate file)

**Purpose:** Collects user's available ingredients via text or image

**Props:**
- `onSubmit`: Function to handle ingredients submission
- `onBack`: Function to return to previous step
- `loading`: Boolean to disable form during submission

**State:**
- `inputMethod`: String ('text' or 'image')
- `ingredientsText`: String (textarea value)
- `uploadedImage`: File or null
- `error`: String or null for validation error

**Validation Rules:**
- Must provide either text ingredients (min 3 characters) OR uploaded image
- Cannot submit empty

**UI Elements:**
- Heading: "What ingredients do you have?"
- Toggle/tabs to switch between "Text Input" and "Upload Image"
- Text mode: Textarea with placeholder "Enter your ingredients, separated by commas..."
- Image mode: Image upload dropzone or file input
- "Back" button (Secondary style)
- "Generate Recipes" button (Primary button style)

### 4. RecipePreviewCard (Card Component)

**Location:** `frontend/src/components/RecipePreviewCard.jsx`

**Purpose:** Displays a preview of a generated recipe option

**Props:**
- `recipe`: Object with { id, title, description, image_url }
- `onClick`: Function to handle card click

**UI Structure:**
```jsx
<div className="recipe-preview-card">
  <img src={recipe.image_url} alt={recipe.title} />
  <div className="card-content">
    <h3>{recipe.title}</h3>
    <p>{recipe.description}</p>
  </div>
</div>
```

**Styling:**
- Border radius: 16px
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
- Hover effect: Transform Y -4px, stronger shadow
- Transition: 300ms ease-out

### 5. API Integration Layer

**Location:** `frontend/src/api/preparingApi.js` (new file)

**Purpose:** Encapsulates all preparing-related API calls

**Functions:**

```javascript
/**
 * Generate recipes based on user input
 * @param {string} prompt - Natural language prompt
 * @param {string} writtenIngredients - Comma-separated ingredients
 * @param {string} imageKey - Optional image reference
 * @param {number} preparingSessionId - Optional existing session
 * @returns {Promise<number>} Preparing session ID
 */
export const generateRecipes = async (prompt, writtenIngredients, imageKey = '', preparingSessionId = null)

/**
 * Get recipe options for a preparing session
 * @param {number} preparingSessionId - Session ID
 * @returns {Promise<Array>} Array of recipe preview objects
 */
export const getRecipeOptions = async (preparingSessionId)

/**
 * Finish and cleanup a preparing session
 * @param {number} preparingSessionId - Session ID
 * @returns {Promise<void>}
 */
export const finishPreparingSession = async (preparingSessionId)
```

**Location:** `frontend/src/api/cookingApi.js` (new file)

**Purpose:** Encapsulates all cooking-related API calls

**Functions:**

```javascript
/**
 * Start a cooking session for a recipe
 * @param {number} recipeId - Recipe ID
 * @returns {Promise<number>} Cooking session ID
 */
export const startCookingSession = async (recipeId)

/**
 * Get cooking session details
 * @param {number} cookingSessionId - Session ID
 * @returns {Promise<Object>} Cooking session object
 */
export const getCookingSession = async (cookingSessionId)

/**
 * Update cooking session state
 * @param {number} cookingSessionId - Session ID
 * @param {number} newState - New state value
 * @returns {Promise<void>}
 */
export const updateCookingState = async (cookingSessionId, newState)

/**
 * Ask a question during cooking
 * @param {number} cookingSessionId - Session ID
 * @param {string} prompt - Question text
 * @returns {Promise<Object>} Prompt history object
 */
export const askCookingQuestion = async (cookingSessionId, prompt)

/**
 * Finish and cleanup a cooking session
 * @param {number} cookingSessionId - Session ID
 * @returns {Promise<void>}
 */
export const finishCookingSession = async (cookingSessionId)
```

## Data Models

### Workflow State Model

```javascript
{
  currentStep: number,      // 1 (prompt), 2 (ingredients), 3 (options)
  prompt: string,           // "I want something healthy for dinner"
  ingredients: string,      // "tomatoes, pasta, garlic, olive oil"
  imageKey: string,         // "" or "image_key_from_upload"
  inputMethod: string       // "text" | "image"
}
```

### Recipe Preview Model (from backend)

```javascript
{
  id: number,
  title: string,
  description: string,
  image_url: string
}
```

### Generation Request Payload

```javascript
{
  prompt: string,                    // Constructed from form data
  written_ingredients: string,       // From ingredients field
  image_key: string,                 // Empty string for now
  preparing_session_id: number | null // null for new session
}
```

### Prompt Usage

The prompt is directly provided by the user in Step 1 and used as-is in the API request. No construction needed - the user's natural language prompt is sent directly to the AI.

## Error Handling

### Error Types and Handling Strategy

1. **Network Errors** (no response)
   - Display: "Network error. Please check your connection."
   - Action: Provide retry button
   - Log: Console error with full error object

2. **Server Errors** (5xx status codes)
   - Display: "Server error. Please try again later."
   - Action: Provide retry button
   - Log: Console error with status and response

3. **Client Errors** (4xx status codes)
   - 400: "Invalid request. Please check your inputs."
   - 404: "Resource not found."
   - 429: "Too many requests. Please wait a moment."
   - Action: Provide retry button or guidance
   - Log: Console error with details

4. **Validation Errors**
   - Display inline field errors
   - Prevent form submission
   - Highlight invalid fields with red border

### Error Component Integration

Use existing `ErrorMessage` component:

```jsx
<ErrorMessage
  message={error}
  onRetry={handleRetry}
/>
```

### Error State Management

```javascript
const [error, setError] = useState(null);

// Clear error on retry
const handleRetry = () => {
  setError(null);
  // Retry the failed operation
};

// Set error from catch block
catch (err) {
  console.error('Operation failed:', err);
  if (!err.response) {
    setError('Network error. Please check your connection.');
  } else if (err.response.status >= 500) {
    setError('Server error. Please try again later.');
  } else {
    setError('Failed to complete operation. Please try again.');
  }
}
```

## UI/UX Design

### Layout Structure

**Step 1: Prompt Input (Desktop & Mobile)**
```
┌─────────────────────────────────────────┐
│  Header (from MainLayout)               │
├─────────────────────────────────────────┤
│                                         │
│  What do you want to cook today?        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ e.g., Something healthy for     │   │
│  │ dinner, Quick pasta dish...     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Next Button]                          │
│                                         │
└─────────────────────────────────────────┘
```

**Step 2: Ingredients Input (Desktop & Mobile)**
```
┌─────────────────────────────────────────┐
│  Header (from MainLayout)               │
├─────────────────────────────────────────┤
│                                         │
│  What ingredients do you have?          │
│                                         │
│  [Text Input] [Upload Image]            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Enter your ingredients,         │   │
│  │ separated by commas...          │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Back]  [Generate Recipes]             │
│                                         │
└─────────────────────────────────────────┘
```

**Step 3: Recipe Options (Desktop)**
```
┌─────────────────────────────────────────┐
│  Header (from MainLayout)               │
├─────────────────────────────────────────┤
│                                         │
│  Choose Your Recipe                     │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │Card │  │Card │  │Card │             │
│  │  1  │  │  2  │  │  3  │             │
│  └─────┘  └─────┘  └─────┘             │
│                                         │
│  [Generate New Recipes]                 │
│                                         │
└─────────────────────────────────────────┘
```

**Step 3: Recipe Options (Mobile)**
```
┌─────────────────────┐
│  Header             │
├─────────────────────┤
│  Choose Recipe      │
│                     │
│  ┌───────────────┐  │
│  │ Recipe Card 1 │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ Recipe Card 2 │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ Recipe Card 3 │  │
│  └───────────────┘  │
│                     │
│  [New Recipes Btn]  │
└─────────────────────┘
```

### Color Scheme (from styleguide)

- **Primary Actions:** Forest Green (#035035)
- **Secondary Actions:** Coral Sunset (#FF9B7B)
- **Backgrounds:** Cream (#FFF8F0), Warm White (#FFFFFF)
- **Text:** Charcoal (#2D2D2D)
- **Borders/Subtle:** Sage Green (#A8C9B8), Soft Gray (#F5F5F5)

### Typography

- **Page Title:** Poppins Bold, 32px mobile / 48px desktop, Forest Green
- **Section Headers:** Poppins SemiBold, 24px mobile / 32px desktop
- **Body Text:** Inter Regular, 16px
- **Labels:** Inter Medium, 14px
- **Button Text:** Poppins SemiBold, 16px

### Form Styling

**Input Fields (Prompt & Ingredients):**
```css
.input-field {
  border-radius: 12px;
  border: 2px solid #F5F5F5;
  padding: 12px 16px;
  font-size: 16px;
  transition: border-color 200ms;
  width: 100%;
}

.input-field:focus {
  border-color: #035035;
  outline: none;
}

.input-field.error {
  border-color: #FF9B7B;
}
```

**Textarea (Ingredients):**
```css
.ingredients-textarea {
  min-height: 120px;
  resize: vertical;
  font-family: 'Inter', sans-serif;
}
```

**Input Method Toggle (Text/Image):**
```css
.input-method-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.toggle-button {
  flex: 1;
  padding: 12px 24px;
  border: 2px solid #A8C9B8;
  border-radius: 24px;
  background: white;
  transition: all 200ms;
  cursor: pointer;
}

.toggle-button.active {
  background: #035035;
  color: white;
  border-color: #035035;
}

.toggle-button:hover:not(.active) {
  background: #A8C9B8;
}
```

**Image Upload Area:**
```css
.image-upload-area {
  border: 2px dashed #A8C9B8;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 200ms;
}

.image-upload-area:hover {
  border-color: #035035;
  background: #FFF8F0;
}

.image-upload-area.has-image {
  border-style: solid;
  border-color: #035035;
}
```

### Recipe Preview Card Styling

```css
.recipe-preview-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 300ms ease-out;
}

.recipe-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.recipe-preview-card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.recipe-preview-card .card-content {
  padding: 16px;
}

.recipe-preview-card h3 {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #035035;
  margin-bottom: 8px;
}

.recipe-preview-card p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #2D2D2D;
  opacity: 0.8;
  line-height: 1.5;
}
```

### Responsive Grid for Recipe Cards

Always displays exactly 3 recipe cards:

```css
.recipe-grid {
  display: grid;
  gap: 24px;
  margin-top: 24px;
}

/* Mobile - Stack vertically */
@media (max-width: 767px) {
  .recipe-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet - 2 cards on first row, 1 centered on second */
@media (min-width: 768px) and (max-width: 1023px) {
  .recipe-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .recipe-grid > :last-child:nth-child(3) {
    grid-column: 1 / -1;
    max-width: 50%;
    margin: 0 auto;
  }
}

/* Desktop - All 3 cards in one row */
@media (min-width: 1024px) {
  .recipe-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Animation and Transitions

**Step Transitions:**
- Fade out current step (200ms)
- Fade in next step (300ms)
- Slide animation optional (translateX)

**Recipe Generation:**
- Fade out ingredients form (300ms)
- Show loading spinner with bounce animation
- Display message: "Generating your recipe options..."
- Fade in recipe cards with stagger (100ms delay between each)

**Card Hover:**
- Scale: 1.0 → 1.02 (200ms)
- Shadow: Increase depth (200ms)
- Easing: cubic-bezier(0.34, 1.56, 0.64, 1)

**Loading State:**
- Use existing LoadingSpinner component
- Display centered with message: "Generating your recipe options..."

## Testing Strategy

### Unit Tests

1. **Step 1: Prompt Validation**
   - Test required field validation
   - Test minimum length validation (3 characters)
   - Test empty/whitespace-only input rejection

2. **Step 2: Ingredients Validation**
   - Test text input validation (minimum 3 characters)
   - Test image upload validation
   - Test that either text OR image is required
   - Test input method toggle functionality

3. **API Integration Functions**
   - Mock API calls and test success paths
   - Test error handling for different status codes
   - Test request payload formatting (prompt, written_ingredients, image_key)
   - Test regeneration with same parameters

### Integration Tests

1. **Complete Workflow**
   - Step 1: Enter prompt → Click Next → Verify step 2 shown
   - Step 2: Enter ingredients → Click Generate → Verify API call
   - Step 3: Display 3 cards → Click card → Verify navigation
   - Verify loading states at each step
   - Verify error display on failure

2. **Recipe Selection Flow**
   - Generate recipes → Display exactly 3 cards → Click card
   - Verify navigation to recipe view with correct recipe_id
   - Verify session cleanup on navigation

3. **Regeneration Flow**
   - Generate recipes → Click "Generate New Recipes"
   - Verify API called again with same prompt/ingredients
   - Verify new preparing_session_id received
   - Verify 3 new recipe cards displayed

4. **Back Navigation**
   - Step 2 → Click Back → Verify step 1 shown with preserved prompt
   - Verify data is preserved when going back

5. **Error Recovery**
   - Trigger error → Display error message → Click retry
   - Verify retry attempts API call again
   - Verify error clears on successful retry

### Accessibility Tests

1. **Keyboard Navigation**
   - Tab through all form fields
   - Submit form with Enter key
   - Navigate recipe cards with keyboard
   - Verify focus indicators visible

2. **Screen Reader**
   - Verify form labels properly associated
   - Verify error messages announced
   - Verify loading states announced
   - Verify recipe card content accessible

3. **Color Contrast**
   - Verify all text meets WCAG AA standards
   - Test with color blindness simulators
   - Verify focus indicators have sufficient contrast

### Responsive Tests

1. **Mobile (320px-767px)**
   - Verify single-column layout
   - Verify touch targets ≥ 44x44px
   - Verify no horizontal scroll
   - Test on real iOS and Android devices

2. **Tablet (768px-1023px)**
   - Verify two-column recipe grid
   - Verify form layout optimization
   - Test in portrait and landscape

3. **Desktop (1024px+)**
   - Verify three-column recipe grid
   - Verify optimal spacing and padding
   - Test at various viewport widths

## Integration Points

### Routing Integration

Add new route to `App.jsx`:

```jsx
<Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  <Route index element={<Dashboard />} />
  <Route path="generate" element={<RecipeGeneration />} />
  <Route path="recipes" element={<RecipeLibrary />} />
  <Route path="recipe/:recipeId" element={<RecipeView />} />
</Route>
```

### Navigation Integration

Add link to navigation menu (in MainLayout or Dashboard):

```jsx
<Link to="/app/generate">Generate Recipe</Link>
```

### Existing Component Reuse

1. **LoadingSpinner** - Use for loading states
2. **ErrorMessage** - Use for error display
3. **Recipe (RecipeView)** - Use for full recipe display
4. **ProtectedRoute** - Already wraps app routes

### Backend API Dependencies

1. **POST /preparing/generate**
   - Request: { prompt, written_ingredients, image_key, preparing_session_id }
   - Response: preparing_session_id (number)

2. **GET /preparing/{preparing_session_id}/get_options**
   - Response: Array of RecipePreview objects

3. **DELETE /preparing/{preparing_session_id}/finish**
   - Response: void

4. **GET /recipe/{recipe_id}/get**
   - Used by existing RecipeView component
   - Response: Full Recipe object

5. **POST /cooking/{recipe_id}/start**
   - For future cooking integration
   - Response: cooking_session_id (number)

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Lazy load RecipeGeneration component
   - Lazy load recipe preview images

2. **Debouncing**
   - Debounce ingredient input for character count
   - Debounce any real-time validation

3. **Caching**
   - Cache cuisine options list
   - Consider caching recent recipe options

4. **Image Optimization**
   - Use lazy loading for recipe images
   - Implement loading="lazy" attribute
   - Consider using WebP format

5. **Bundle Size**
   - Keep component dependencies minimal
   - Reuse existing components and utilities
   - Avoid large third-party libraries

### Loading States

1. **Initial Load** - Fast (component only)
2. **Form Submission** - Show spinner immediately
3. **Recipe Generation** - May take 3-10 seconds
4. **Recipe Options Fetch** - Should be < 1 second

### Error Recovery

- Implement exponential backoff for retries
- Provide clear feedback on what went wrong
- Allow users to modify inputs and retry
- Preserve form data on error

## Security Considerations

1. **Authentication**
   - All API calls use apiWithCookies (includes auth)
   - Protected route ensures user is authenticated

2. **Input Sanitization**
   - Sanitize user input before sending to backend
   - Backend should also validate and sanitize

3. **XSS Prevention**
   - React automatically escapes JSX content
   - Be cautious with dangerouslySetInnerHTML (avoid)

4. **CSRF Protection**
   - Handled by backend with cookies
   - apiWithCookies includes credentials

## Future Enhancements

1. **Image Processing**
   - Implement actual image upload to backend
   - AI analysis of uploaded ingredient photos
   - Extract ingredients from image automatically

2. **Recipe History**
   - Save generation history
   - Allow users to regenerate from history

3. **Dietary Restrictions**
   - Add optional filters for vegetarian, vegan, gluten-free, etc.
   - User can include in their natural language prompt

4. **Serving Size**
   - Add serving size input in prompt step
   - Pass to backend for ingredient scaling

5. **Cooking Time Preference**
   - Add time constraint as optional input
   - User can include in prompt: "quick 30-minute recipe"

6. **Prompt Suggestions**
   - Show example prompts to inspire users
   - Quick-select common prompts

7. **Recipe Refinement**
   - Allow users to refine generated recipes
   - "Make it spicier", "Add more vegetables", etc.

8. **Social Sharing**
   - Share generated recipes
   - Export to PDF or print
