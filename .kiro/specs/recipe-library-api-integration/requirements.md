# Requirements Document

## Introduction

This feature integrates the Recipe Library frontend with the existing backend APIs to replace hardcoded recipe data with dynamic data fetched from the server. The integration will enable users to view their saved recipes, see recipe details, and interact with the AI cooking assistant for any recipe in their library. The implementation will follow the existing frontend conventions and styling guidelines while ensuring a seamless user experience across desktop and mobile devices.

## Requirements

### Requirement 1: Recipe Library List Integration

**User Story:** As a user, I want to see my saved recipes in the Recipe Library so that I can browse and select recipes I've previously created or saved.

#### Acceptance Criteria

1. WHEN the Recipe Library page loads THEN the system SHALL fetch all permanent recipes for the authenticated user from the backend
2. WHEN recipes are being fetched THEN the system SHALL display a loading state with appropriate visual feedback
3. WHEN the API request fails THEN the system SHALL display an error message and provide a retry option
4. WHEN no recipes exist THEN the system SHALL display an empty state message encouraging users to create their first recipe
5. WHEN recipes are successfully loaded THEN the system SHALL display each recipe with its title, description, image, and metadata (time, servings, difficulty if available)
6. WHEN a user clicks on a recipe card THEN the system SHALL navigate to the recipe detail view with the selected recipe ID

### Requirement 2: Recipe Detail View Integration

**User Story:** As a user, I want to view detailed information about a specific recipe so that I can see ingredients, instructions, and nutritional information.

#### Acceptance Criteria

1. WHEN the Recipe detail page loads with a recipe ID THEN the system SHALL fetch the complete recipe data from the backend API
2. WHEN recipe data is being fetched THEN the system SHALL display a loading state
3. WHEN the API request fails THEN the system SHALL display an error message with navigation back to the library
4. WHEN recipe data is successfully loaded THEN the system SHALL display the recipe title, description, image, ingredients list, and instructions
5. WHEN the recipe has timing information THEN the system SHALL display preparation and cooking times
6. WHEN the user adjusts serving sizes THEN the system SHALL recalculate ingredient quantities proportionally
7. WHEN the recipe data structure differs from expected format THEN the system SHALL handle missing fields gracefully with default values

### Requirement 3: API Service Layer Implementation

**User Story:** As a developer, I want a dedicated API service for recipe operations so that API calls are centralized and follow the existing frontend patterns.

#### Acceptance Criteria

1. WHEN implementing the recipe API service THEN the system SHALL use the existing `apiWithCookies` instance from `baseApi.js`
2. WHEN making API calls THEN the system SHALL follow the existing error handling patterns in the codebase
3. WHEN the API service is created THEN it SHALL include functions for: fetching all user recipes, fetching a single recipe by ID, saving a recipe, and deleting a recipe
4. WHEN API responses are received THEN the system SHALL transform backend data structures to match frontend component expectations
5. WHEN authentication tokens expire THEN the system SHALL leverage the existing token refresh interceptor

### Requirement 4: Recipe Library Search and Filter

**User Story:** As a user, I want to search and filter my recipes so that I can quickly find specific dishes.

#### Acceptance Criteria

1. WHEN a user types in the search box THEN the system SHALL filter recipes by title and description in real-time
2. WHEN search results are empty THEN the system SHALL display a "no results found" message
3. WHEN the search query is cleared THEN the system SHALL display all recipes again
4. IF filter functionality is implemented THEN the system SHALL allow filtering by category, difficulty, or cooking time
5. WHEN filters are applied THEN the system SHALL update the displayed recipes accordingly

### Requirement 5: Recipe Actions Integration

**User Story:** As a user, I want to perform actions on recipes (save, delete, start cooking) so that I can manage my recipe collection.

#### Acceptance Criteria

1. WHEN a user clicks "Save Recipe" on a recipe detail page THEN the system SHALL call the save recipe API endpoint
2. WHEN a recipe is successfully saved THEN the system SHALL display a success notification
3. WHEN a user deletes a recipe THEN the system SHALL prompt for confirmation before calling the delete API
4. WHEN a recipe is successfully deleted THEN the system SHALL remove it from the library view and display a confirmation message
5. WHEN a user starts cooking a recipe THEN the system SHALL create a cooking session via the cooking API and navigate to the instructions view
6. WHEN API actions fail THEN the system SHALL display appropriate error messages without breaking the UI

### Requirement 6: Cooking Session Integration

**User Story:** As a user, I want to start a cooking session for any recipe in my library so that the AI assistant can guide me through the cooking process.

#### Acceptance Criteria

1. WHEN a user clicks "Start Cooking" on a recipe THEN the system SHALL call the `/cooking/{recipe_id}/start` endpoint
2. WHEN a cooking session is created THEN the system SHALL receive a cooking session ID
3. WHEN the cooking session is active THEN the system SHALL navigate to the Instructions view with the session ID
4. WHEN the Instructions view loads THEN it SHALL fetch the cooking session state and recipe instructions
5. WHEN a user progresses through cooking steps THEN the system SHALL update the cooking session state via the API
6. WHEN a user asks a question during cooking THEN the system SHALL call the `/cooking/ask_question` endpoint with the session ID and prompt

### Requirement 7: Responsive Design and Mobile Optimization

**User Story:** As a user on any device, I want the Recipe Library to work seamlessly so that I can access my recipes from desktop or mobile.

#### Acceptance Criteria

1. WHEN the Recipe Library is viewed on mobile devices THEN the system SHALL display recipes in a single-column layout
2. WHEN the Recipe Library is viewed on tablet devices THEN the system SHALL display recipes in a two-column grid
3. WHEN the Recipe Library is viewed on desktop devices THEN the system SHALL display recipes in a three-column grid
4. WHEN touch targets are rendered on mobile THEN they SHALL be at least 44x44px for easy interaction
5. WHEN images are loaded THEN the system SHALL use responsive image techniques for optimal performance
6. WHEN the Recipe detail view is displayed on mobile THEN all content SHALL be readable without horizontal scrolling

### Requirement 8: Error Handling and Loading States

**User Story:** As a user, I want clear feedback when data is loading or when errors occur so that I understand the system status.

#### Acceptance Criteria

1. WHEN any API request is in progress THEN the system SHALL display a loading indicator
2. WHEN a network error occurs THEN the system SHALL display a user-friendly error message
3. WHEN a 404 error occurs for a recipe THEN the system SHALL display "Recipe not found" and provide navigation back to the library
4. WHEN a 401 error occurs THEN the system SHALL leverage the existing auth interceptor to refresh tokens or redirect to login
5. WHEN an unexpected error occurs THEN the system SHALL log the error and display a generic error message with a retry option
6. WHEN loading states are displayed THEN they SHALL follow the brand style guide with appropriate animations
