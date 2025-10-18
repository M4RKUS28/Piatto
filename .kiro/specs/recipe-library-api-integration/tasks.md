# Implementation Plan

- [x] 1. Create backend endpoint for listing user recipes
  - Add `get_recipes_by_user_id` function to `recipe_crud.py` that fetches all permanent recipes for a user
  - Add GET `/recipe/list` endpoint to `recipe.py` router that returns list of RecipePreview objects
  - Use `get_read_write_user_id` dependency for authentication
  - _Requirements: 1.1, 1.2_

- [x] 2. Create API service layer for recipes
  - Create `frontend/src/api/recipeApi.js` file
  - Implement `getUserRecipes()` function to fetch all user recipes
  - Implement `getRecipeById(recipeId)` function to fetch single recipe
  - Implement `saveRecipe(recipeId)` function to mark recipe as permanent
  - Implement `deleteRecipe(recipeId)` function to remove recipe
  - Implement `changeRecipeAI(recipeId, changePrompt)` function for AI modifications
  - Implement `changeRecipeManual(recipeId, updates)` function for manual updates
  - Use `apiWithCookies` from `baseApi.js` for all requests
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Create API service layer for cooking sessions
  - Create `frontend/src/api/cookingApi.js` file
  - Implement `startCookingSession(recipeId)` function to create cooking session
  - Implement `getCookingSession(sessionId)` function to fetch session details
  - Implement `updateCookingState(sessionId, newState)` function to update progress
  - Implement `askCookingQuestion(sessionId, prompt)` function for AI questions
  - Implement `getPromptHistory(sessionId)` function to fetch chat history
  - Implement `finishCookingSession(sessionId)` function to end session
  - Use `apiWithCookies` from `baseApi.js` for all requests
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

- [x] 4. Create shared UI components
- [x] 4.1 Create LoadingSpinner component
  - Create `frontend/src/components/LoadingSpinner.jsx`
  - Implement spinner with Forest Green (#035035) color
  - Use bouncy animation following brand style guide
  - Accept optional `size` prop (small, medium, large)
  - _Requirements: 8.1, 8.6_

- [x] 4.2 Create ErrorMessage component
  - Create `frontend/src/components/ErrorMessage.jsx`
  - Accept `message` and `onRetry` props
  - Display error message with Coral Sunset (#FF9B7B) accent
  - Include retry button that calls `onRetry` callback
  - Follow brand style guide for typography and spacing
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [x] 4.3 Create EmptyState component
  - Create `frontend/src/components/EmptyState.jsx`
  - Accept `title`, `message`, `actionLabel`, and `onAction` props
  - Display friendly empty state with illustration or icon
  - Include call-to-action button if `onAction` provided
  - Follow brand style guide for colors and typography
  - _Requirements: 1.4_

- [x] 5. Update RecipeLibrary component to fetch recipes from API
  - Add state management: `recipes`, `loading`, `error`, `searchQuery`
  - Implement `useEffect` to fetch recipes on mount using `getUserRecipes()`
  - Display LoadingSpinner while `loading` is true
  - Display ErrorMessage if `error` exists with retry functionality
  - Display EmptyState if no recipes exist after loading
  - Transform backend RecipePreview data to component format (map `title` to `name`, `image_url` to `image`)
  - Update recipe cards to use dynamic data from state
  - Update Link components to navigate to `/app/recipe/${recipe.id}` instead of hardcoded path
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 6. Implement client-side search functionality
  - Update search input onChange to filter recipes by title and description
  - Filter recipes in real-time as user types
  - Display "No results found" message when filtered list is empty
  - Clear filters when search query is empty
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Update routing to support dynamic recipe IDs
  - Update `frontend/src/App.jsx` to change recipe route from `/app/spaghetti` to `/app/recipe/:recipeId`
  - Ensure RecipeView component receives recipeId from URL params
  - _Requirements: 1.6, 2.1_

- [x] 8. Update RecipeView component to pass recipe ID to children
  - Import `useParams` from react-router-dom
  - Extract `recipeId` from URL params
  - Pass `recipeId` as prop to Recipe component
  - Pass `recipeId` as prop to Instructions component
  - Handle case where recipeId is invalid (not a number)
  - _Requirements: 2.1_

- [x] 9. Update Recipe component to fetch and display dynamic recipe data
- [x] 9.1 Add state management and data fetching
  - Add state: `recipe`, `loading`, `error`, `servings`, `activeTab`
  - Accept `recipeId` prop from parent
  - Implement `useEffect` to fetch recipe using `getRecipeById(recipeId)` when component mounts
  - Display LoadingSpinner while loading
  - Display ErrorMessage if error occurs with navigation back to library
  - _Requirements: 2.1, 2.2, 2.3, 2.7_

- [x] 9.2 Transform and display recipe data
  - Transform backend recipe format to component format
  - Map `ingredients` array: `{ name, quantity, unit }` to `{ amount, unit, name }`
  - Map `instructions` array: `{ Instruction, timer }` to `{ title, description, timer }`
  - Extract or default `baseServings` (use 4 as default if not provided)
  - Display recipe title, description, and image from fetched data
  - Update ingredients list to use transformed data
  - _Requirements: 2.4, 2.7_

- [x] 9.3 Update serving size calculations
  - Ensure `adjustIngredient` function works with backend data structure
  - Update servings state when user clicks +/- buttons
  - Recalculate all ingredient quantities based on new serving size
  - _Requirements: 2.6_

- [x] 9.4 Handle nutrition data conditionally
  - Check if nutrition data exists in recipe response
  - Hide nutrition tab if data is not available
  - Display nutrition label only when data exists
  - _Requirements: 2.7_

- [x] 10. Implement recipe action buttons
- [x] 10.1 Implement save recipe functionality
  - Add onClick handler to "Save Recipe" button
  - Call `saveRecipe(recipeId)` when clicked
  - Display success notification after save
  - Handle errors and display error message
  - _Requirements: 5.1, 5.2, 5.6_

- [x] 10.2 Implement delete recipe functionality
  - Add delete button to recipe view (in action buttons area)
  - Show confirmation dialog before deleting
  - Call `deleteRecipe(recipeId)` after confirmation
  - Navigate back to recipe library after successful deletion
  - Display success message
  - Handle errors and display error message
  - _Requirements: 5.3, 5.4, 5.6_

- [x] 11. Update Instructions component to support cooking sessions
- [x] 11.1 Add state management and props
  - Accept `recipeId` prop from parent
  - Add state: `cookingSessionId`, `currentStep`, `instructions`, `loading`, `error`
  - Add state for AI chat: `chatMessages`, `userQuestion`, `chatLoading`
  - _Requirements: 6.3, 6.4_

- [x] 11.2 Implement cooking session creation
  - Check if cooking session exists in state or URL params
  - If no session, display "Start Cooking" button
  - When button clicked, call `startCookingSession(recipeId)`
  - Store returned session ID in state
  - Update URL to include session ID (optional, for refresh persistence)
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 11.3 Fetch and display recipe instructions
  - Fetch recipe data using `getRecipeById(recipeId)` to get instructions
  - Transform instructions from backend format to component format
  - Display instruction steps with step numbers and descriptions
  - Show timer information if available in instruction data
  - _Requirements: 6.4_

- [x] 11.4 Implement step progression
  - Add "Mark as complete" or "Next step" button for each step
  - Track current step in state
  - When step completed, call `updateCookingState(sessionId, newState)`
  - Update UI to show completed steps (visual indicator)
  - Disable "Next" on last step or show "Finish cooking" button
  - _Requirements: 6.5_

- [x] 11.5 Implement AI assistant chat interface
  - Add chat UI below or beside instructions (collapsible panel)
  - Display chat messages from `chatMessages` state
  - Add input field for user questions
  - When user submits question, call `askCookingQuestion(sessionId, prompt)`
  - Add AI response to chat messages
  - Display loading indicator while waiting for response
  - Handle errors in chat (display error message in chat)
  - _Requirements: 6.6_

- [x] 11.6 Implement finish cooking session
  - Add "Finish Cooking" button at end of instructions
  - When clicked, call `finishCookingSession(sessionId)`
  - Clear session ID from state
  - Show completion message or navigate back to recipe library
  - _Requirements: 6.6_

- [x] 12. Implement responsive design optimizations
  - Verify RecipeLibrary grid layout: 1 column on mobile, 2 on tablet, 3 on desktop
  - Ensure all touch targets are minimum 44x44px on mobile
  - Test Recipe component on mobile: verify no horizontal scrolling
  - Test Instructions component on mobile: ensure readable text and proper spacing
  - Verify images are responsive and load efficiently
  - Test all components in portrait and landscape orientations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 13. Add error handling and loading states throughout
  - Verify all API calls have try-catch blocks
  - Ensure all loading states display LoadingSpinner
  - Ensure all error states display ErrorMessage with retry
  - Test 404 errors show appropriate messages
  - Test network errors show appropriate messages
  - Verify 401 errors trigger auth refresh (handled by interceptor)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 14. Final integration testing and polish
  - Test complete flow: Browse recipes → View recipe → Start cooking → Complete cooking
  - Test search functionality with various queries
  - Test save and delete recipe actions
  - Test serving size adjustments
  - Test AI assistant during cooking
  - Verify all error scenarios display correctly
  - Verify all loading states display correctly
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Test on real mobile devices (iOS and Android)
  - Verify performance meets targets (< 2s initial load on 3G)
  - _Requirements: All_
