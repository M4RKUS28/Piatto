# Implementation Plan

- [x] 1. Create API integration layer for preparing and cooking endpoints
  - Create `frontend/src/api/preparingApi.js` with functions for generateRecipes, getRecipeOptions, and finishPreparingSession
  - Create `frontend/src/api/cookingApi.js` with functions for startCookingSession, getCookingSession, updateCookingState, askCookingQuestion, and finishCookingSession
  - Follow existing API patterns from recipeApi.js and baseApi.js
  - Include proper error handling and JSDoc comments
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Create RecipePreviewCard component
  - Create `frontend/src/components/RecipePreviewCard.jsx` component
  - Implement props interface: recipe (object with id, title, description, image_url), onClick (function)
  - Apply Piattio design system styling: 16px border radius, soft shadows, hover effects (translateY -4px, stronger shadow)
  - Implement responsive image with aspect-ratio 16/9 and object-fit cover
  - Add 300ms transition with ease-out easing for hover effects
  - Ensure accessibility: proper alt text, keyboard navigation, focus indicators
  - _Requirements: 4.1, 4.2, 4.3, 10.1, 10.2, 10.3, 10.4, 10.7_

- [x] 3. Create RecipeGeneration page with multi-step state management
  - Create `frontend/src/pages/app/RecipeGeneration.jsx` main page component
  - Implement state management with useState for currentStep (1, 2, or 3), prompt, ingredients, imageKey, inputMethod, loading, error, preparingSessionId, recipeOptions
  - Create step navigation logic to move between steps 1, 2, and 3
  - Implement handleGoBack function to return to previous step while preserving data
  - Add useEffect cleanup to call DELETE /preparing/{id}/finish on unmount
  - _Requirements: 1.1, 1.5, 2.1, 2.5, 3.2, 9.6_

- [x] 4. Implement Step 1: Prompt Input
  - Create PromptStep component (inline or separate) with heading "What do you want to cook today?"
  - Add text input or textarea with placeholder "e.g., Something healthy for dinner, Quick pasta dish, Comfort food..."
  - Implement validation: prompt required, minimum 3 characters
  - Add "Next" button that validates and moves to step 2
  - Display inline validation errors with red borders and error messages
  - Apply form styling: 12px border radius, 2px borders, Forest Green focus states
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2, 10.5, 10.6_

- [x] 5. Implement Step 2: Ingredients Input with text and image options
  - Create IngredientsStep component with heading "What ingredients do you have?"
  - Add toggle/tabs to switch between "Text Input" and "Upload Image" modes
  - Implement text mode: textarea with placeholder "Enter your ingredients, separated by commas..."
  - Implement image mode: image upload dropzone or file input with visual feedback
  - Store uploaded image and set imageKey in state (for now, use filename or placeholder)
  - Implement validation: must provide either text (min 3 chars) OR image
  - Add "Back" button (secondary style) and "Generate Recipes" button (primary style)
  - Display inline validation errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.5_

- [x] 6. Implement recipe generation workflow
  - Implement handleGenerateRecipes function to call POST /preparing/generate with prompt, written_ingredients, and image_key
  - Store preparingSessionId in state after successful generation
  - Implement handleGetRecipeOptions function to call GET /preparing/{id}/get_options
  - Display LoadingSpinner component during API calls with message "Generating your recipe options..."
  - Handle errors with ErrorMessage component and retry functionality
  - Move to step 3 when recipe options are successfully retrieved
  - Ensure exactly 3 recipe options are displayed
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Implement Step 3: Recipe options display and selection
  - Create RecipeOptionsStep component with heading "Choose Your Recipe"
  - Create responsive recipe grid: 1 column mobile, 2 columns tablet (with 3rd centered), 3 columns desktop
  - Map recipeOptions array to exactly 3 RecipePreviewCard components
  - Implement handleRecipeSelect function to navigate to /app/recipe/:recipeId using useNavigate
  - Call handleCleanupSession to DELETE /preparing/{id}/finish when recipe is selected
  - Apply grid styling with 24px gap and proper responsive breakpoints
  - Add staggered fade-in animation for recipe cards (100ms delay between each)
  - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3_

- [x] 8. Implement recipe regeneration functionality
  - Add "Generate New Recipes" button below recipe grid in step 3
  - Implement handleRegenerateRecipes function to call POST /preparing/generate again with same prompt and ingredients
  - Update preparingSessionId with new session ID
  - Fetch new recipe options and update recipeOptions state
  - Display loading state during regeneration
  - Keep user on step 3 to show new options
  - _Requirements: 4.4, 4.5, 4.6_

- [x] 9. Add routing and navigation integration
  - Update `frontend/src/App.jsx` to add new route: /app/generate pointing to RecipeGeneration component
  - Ensure route is wrapped in ProtectedRoute within MainLayout
  - Add navigation link to RecipeGeneration page in Dashboard or MainLayout navigation
  - Test navigation flow: Dashboard → Generate (Step 1) → Step 2 → Step 3 → Recipe View
  - _Requirements: 6.1, 6.2_

- [x] 10. Implement session cleanup and lifecycle management
  - Implement handleCleanupSession function to call finishPreparingSession API
  - Call cleanup when user navigates away from the page
  - Call cleanup when user selects a recipe
  - Handle cleanup errors gracefully (log but don't block user)
  - Ensure cleanup is called in useEffect cleanup function
  - _Requirements: 9.6_

- [x] 11. Implement comprehensive error handling
  - Add error handling for network errors (no response): display "Network error. Please check your connection."
  - Add error handling for server errors (5xx): display "Server error. Please try again later."
  - Add error handling for client errors (4xx): display appropriate messages (400, 404, 429)
  - Implement retry functionality with handleRetry function that clears error and retries operation
  - Log all errors to console with full error details for debugging
  - Display success feedback when recipes are generated successfully
  - Preserve form data when errors occur so users don't lose their inputs
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Implement responsive design and mobile optimization
  - Apply mobile-first CSS with breakpoints: 320px-767px (mobile), 768px-1023px (tablet), 1024px+ (desktop)
  - Ensure all touch targets meet minimum 44x44px size requirement on mobile
  - Test single-column layout on mobile for all steps
  - Test two-column recipe grid on tablet with 3rd card centered
  - Test three-column recipe grid on desktop
  - Implement responsive typography: scale headings appropriately for mobile
  - Add proper spacing using 8px-based scale from styleguide
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.6_

- [x] 13. Implement accessibility features
  - Add proper ARIA labels to all form inputs and buttons
  - Ensure keyboard navigation works: Tab through inputs, Enter to submit, Arrow keys for toggles
  - Add visible focus indicators (2px Forest Green outline) to all interactive elements
  - Associate form labels with inputs using htmlFor and id attributes
  - Ensure error messages are announced to screen readers with aria-live regions
  - Add alt text to all images in RecipePreviewCard
  - Test color contrast ratios meet WCAG 2.1 AA standards (4.5:1 for body text, 3:1 for large text)
  - Add aria-current to indicate current step in workflow
  - _Requirements: 8.5, 8.6_

- [ ]* 14. Implement recipe saving functionality
  - Add "Save Recipe" button to recipe view (may already exist in RecipeView.jsx)
  - Implement handleSaveRecipe function to call POST /recipe/{recipe_id}/save
  - Display success message when recipe is saved
  - Ensure saved recipes appear in recipe library
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 15. Add integration with cooking functionality
  - Add "Start Cooking" button to recipe view (may already exist in Recipe.jsx)
  - Implement handleStartCooking function to call POST /cooking/{recipe_id}/start
  - Navigate to cooking interface with cooking_session_id after session creation
  - Integrate with existing cooking interface component
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 16. Write unit tests for step validation and API functions
  - Write tests for step 1 prompt validation: required field, minimum length
  - Write tests for step 2 ingredients validation: text OR image required
  - Write tests for input method toggle functionality
  - Write tests for API integration functions with mocked responses
  - Write tests for error handling with different status codes
  - Write tests for session cleanup on unmount
  - _Requirements: All requirements (validation)_

- [ ]* 17. Write integration tests for complete workflow
  - Write test for complete generation flow: step 1 → step 2 → step 3 → select recipe
  - Write test for back navigation: step 2 → back → step 1 with preserved data
  - Write test for regeneration: view options → regenerate → new options displayed
  - Write test for error recovery: trigger error → display error → retry → success
  - Write test for session cleanup: generate recipes → navigate away → verify cleanup called
  - _Requirements: All requirements (end-to-end validation)_

- [ ]* 18. Perform accessibility testing
  - Test keyboard navigation through entire workflow
  - Test with screen reader (NVDA, JAWS, or VoiceOver)
  - Verify all form labels and error messages are properly announced
  - Test color contrast with accessibility tools
  - Test with color blindness simulators
  - Verify focus indicators are visible and meet contrast requirements
  - Verify step indicators are announced properly
  - _Requirements: 8.5, 8.6_

- [ ]* 19. Perform responsive testing on real devices
  - Test on real iOS device (iPhone) in Safari
  - Test on real Android device in Chrome
  - Test on tablet device (iPad or Android tablet) in both orientations
  - Test on desktop browsers (Chrome, Firefox, Safari, Edge)
  - Verify no horizontal scrolling on any device
  - Verify touch targets are easily tappable on mobile
  - Verify text is readable without zooming
  - Test image upload on mobile devices
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
