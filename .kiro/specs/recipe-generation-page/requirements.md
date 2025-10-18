# Requirements Document

## Introduction

This feature introduces a Recipe Generation page in the frontend that allows users to generate new recipes using AI assistance. The page provides a conversational, step-by-step workflow where users first describe what they want to cook, then provide their available ingredients (via text or image), and finally select from 3 AI-generated recipe options. The system leverages the existing backend preparing.py API to generate recipe options, which users can then view, save, and start cooking using the existing recipe viewing and cooking functionality.

## Requirements

### Requirement 1: Recipe Prompt Input

**User Story:** As a user, I want to describe what I want to cook today, so that the AI can understand my cooking intentions and preferences.

#### Acceptance Criteria

1. WHEN the user navigates to the recipe generation page THEN the system SHALL display a clean interface with a text input asking "What do you want to cook today?"
2. WHEN the user enters their cooking prompt THEN the system SHALL accept free-form text input (e.g., "I want something healthy for dinner", "Quick pasta dish", "Comfort food")
3. WHEN the user submits an empty prompt THEN the system SHALL display a validation error indicating the prompt is required
4. WHEN the user submits a valid prompt THEN the system SHALL proceed to the ingredients input step
5. WHEN the user wants to go back THEN the system SHALL provide a way to return to the prompt input step

### Requirement 2: Ingredients Input

**User Story:** As a user, I want to provide my available ingredients via text or image, so that the AI can generate recipes based on what I actually have.

#### Acceptance Criteria

1. WHEN the user completes the prompt step THEN the system SHALL display an ingredients input interface with options for text input or image upload
2. WHEN the user chooses text input THEN the system SHALL provide a textarea with placeholder "Enter your ingredients, separated by commas..."
3. WHEN the user chooses image upload THEN the system SHALL provide an image upload interface to capture fridge contents or ingredient photos
4. WHEN the user uploads an image THEN the system SHALL store the image_key for the generation request
5. WHEN the user submits without providing ingredients THEN the system SHALL display a validation error
6. WHEN the user submits valid ingredients THEN the system SHALL proceed to generate recipe options

### Requirement 3: AI Recipe Generation Process

**User Story:** As a user, I want the system to generate 3 recipe options based on my prompt and ingredients, so that I can choose the recipe that best matches my preferences.

#### Acceptance Criteria

1. WHEN the user submits both prompt and ingredients THEN the system SHALL call POST /preparing/generate with prompt, written_ingredients, and optional image_key
2. WHEN the generation request is processing THEN the system SHALL display a loading state with message "Generating your recipe options..."
3. WHEN the generation completes successfully THEN the system SHALL receive a preparing_session_id from the backend
4. WHEN the preparing_session_id is received THEN the system SHALL call GET /preparing/{preparing_session_id}/get_options to retrieve exactly 3 recipe previews
5. WHEN recipe options are retrieved THEN the system SHALL display 3 recipe preview cards showing title, description, and image
6. WHEN the generation fails THEN the system SHALL display an error message with retry functionality

### Requirement 4: Recipe Preview Selection and Regeneration

**User Story:** As a user, I want to view and select from 3 generated recipe options, or generate new options if I don't like any of them, so that I can find the perfect recipe.

#### Acceptance Criteria

1. WHEN recipe previews are displayed THEN the system SHALL show exactly 3 recipes with title, description, and image in card format
2. WHEN the user hovers over a recipe card THEN the system SHALL provide visual feedback (scale, shadow, or highlight effect)
3. WHEN the user clicks on a recipe preview THEN the system SHALL navigate to the full recipe view page using the recipe ID
4. WHEN the user doesn't like any options THEN the system SHALL provide a "Generate New Recipes" button
5. WHEN the user clicks "Generate New Recipes" THEN the system SHALL call POST /preparing/generate again with the same prompt and ingredients to get 3 new options
6. WHEN new recipes are generated THEN the system SHALL update the preparing_session_id and display the new recipe options

### Requirement 5: Recipe Saving and Library Integration

**User Story:** As a user, I want to save generated recipes to my library, so that I can access them later without regenerating.

#### Acceptance Criteria

1. WHEN the user views a generated recipe THEN the system SHALL provide a "Save Recipe" button
2. WHEN the user clicks "Save Recipe" THEN the system SHALL call POST /recipe/{recipe_id}/save to save the recipe to their library
3. WHEN the recipe is saved successfully THEN the system SHALL display a success message
4. WHEN the user navigates to their recipe library THEN the system SHALL display all saved recipes including newly saved ones
5. WHEN the user wants to delete a saved recipe THEN the system SHALL use the existing DELETE /recipe/{recipe_id}/delete endpoint

### Requirement 6: Integration with Existing Recipe Viewing

**User Story:** As a user, I want to seamlessly view the full details of a generated recipe, so that I can see ingredients, instructions, and cooking steps.

#### Acceptance Criteria

1. WHEN the user selects a recipe preview THEN the system SHALL navigate to the existing RecipeView component with the selected recipe_id
2. WHEN the recipe view loads THEN the system SHALL use the existing GET /recipe/{recipe_id}/get endpoint to fetch full recipe details
3. WHEN the recipe is displayed THEN the system SHALL show all recipe information including ingredients, instructions, and image
4. WHEN the user is in recipe view THEN the system SHALL provide options to save, start cooking, or go back to recipe options

### Requirement 7: Integration with Cooking Functionality

**User Story:** As a user, I want to start cooking a generated recipe, so that I can follow step-by-step instructions with timer support.

#### Acceptance Criteria

1. WHEN the user views a generated recipe THEN the system SHALL provide a "Start Cooking" button
2. WHEN the user clicks "Start Cooking" THEN the system SHALL call POST /cooking/{recipe_id}/start to create a cooking session
3. WHEN the cooking session is created THEN the system SHALL receive a cooking_session_id
4. WHEN the cooking session starts THEN the system SHALL navigate to the cooking interface with the session ID
5. WHEN the user is cooking THEN the system SHALL use existing cooking API endpoints (change_state, ask_question, finish) for session management

### Requirement 8: Responsive Design and Accessibility

**User Story:** As a user on any device, I want the recipe generation page to work seamlessly on mobile and desktop, so that I can generate recipes regardless of my device.

#### Acceptance Criteria

1. WHEN the user accesses the page on mobile (320px-767px) THEN the system SHALL display a single-column layout with full-width inputs
2. WHEN the user accesses the page on tablet (768px-1023px) THEN the system SHALL display an optimized two-column layout where appropriate
3. WHEN the user accesses the page on desktop (1024px+) THEN the system SHALL display a multi-column layout with optimal spacing
4. WHEN the user interacts with touch targets on mobile THEN the system SHALL ensure all buttons and inputs meet the minimum 44x44px size requirement
5. WHEN the user navigates with keyboard THEN the system SHALL provide proper focus indicators and tab order
6. WHEN the page loads THEN the system SHALL meet WCAG 2.1 AA accessibility standards including color contrast and semantic HTML

### Requirement 9: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when errors occur during recipe generation, so that I understand what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the system SHALL display a user-friendly error message indicating connection issues
2. WHEN the backend returns a 500 error THEN the system SHALL display a message suggesting the user try again later
3. WHEN the backend returns a 404 error THEN the system SHALL display a message indicating the resource was not found
4. WHEN an error occurs THEN the system SHALL provide a "Try Again" button to retry the operation
5. WHEN the user successfully generates recipes THEN the system SHALL provide positive feedback (success message or visual confirmation)
6. WHEN the preparing session is complete THEN the system SHALL call DELETE /preparing/{preparing_session_id}/finish to clean up the session

### Requirement 10: Design Consistency

**User Story:** As a user, I want the recipe generation page to match the existing application design, so that I have a consistent and familiar experience.

#### Acceptance Criteria

1. WHEN the page renders THEN the system SHALL use the Piattio color palette (Forest Green #035035, Coral Sunset #FF9B7B, Cream #FFF8F0, etc.)
2. WHEN displaying typography THEN the system SHALL use Poppins for headings and Inter for body text as defined in the styleguide
3. WHEN showing buttons THEN the system SHALL use rounded corners (24px border-radius) and appropriate hover effects (scale 1.05x)
4. WHEN displaying cards THEN the system SHALL use 16-24px border radius with soft shadows (0 4px 12px rgba(0, 0, 0, 0.08))
5. WHEN showing form inputs THEN the system SHALL use 12px border radius with 2px borders and Forest Green focus states
6. WHEN applying spacing THEN the system SHALL use the 8px-based spacing scale defined in the styleguide
7. WHEN adding animations THEN the system SHALL use durations of 200-300ms with appropriate easing functions
