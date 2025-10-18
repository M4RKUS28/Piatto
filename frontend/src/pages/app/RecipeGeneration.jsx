import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRecipes, getRecipeOptions, finishPreparingSession } from '../../api/preparingApi';
import { saveRecipe } from '../../api/recipeApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import RecipePreviewCard from '../../components/RecipePreviewCard';
import './RecipeGeneration.css';

/**
 * PromptStep Component
 * 
 * Step 1: Collects user's cooking prompt/intention
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback when form is submitted with valid prompt
 * @param {string} props.initialValue - Initial prompt value (for back navigation)
 * @param {boolean} props.loading - Loading state to disable form
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2, 10.5, 10.6
 */
function PromptStep({ onSubmit, initialValue = '', loading = false }) {
        const [promptText, setPromptText] = useState(initialValue);
        const [validationError, setValidationError] = useState('');

        /**
         * Validate the prompt input
         * Requirements: 1.3 - prompt required, minimum 3 characters
         */
        const validatePrompt = (value) => {
                if (!value || value.trim().length === 0) {
                        return 'Please tell us what you want to cook';
                }
                if (value.trim().length < 3) {
                        return 'Please enter at least 3 characters';
                }
                return '';
        };

        /**
         * Handle form submission
         * Requirements: 1.4 - validate and move to step 2
         */
        const handleSubmit = (e) => {
                e.preventDefault();

                const error = validatePrompt(promptText);
                if (error) {
                        setValidationError(error);
                        return;
                }

                setValidationError('');
                onSubmit(promptText.trim());
        };

        /**
         * Handle input change and clear validation error
         */
        const handleInputChange = (e) => {
                setPromptText(e.target.value);
                if (validationError) {
                        setValidationError('');
                }
        };

        return (
                <div>
                        <h2 className="text-3xl font-bold text-[#035035] mb-6 text-center">
                                What do you want to cook today?
                        </h2>
                        <p className="text-center text-[#2D2D2D] opacity-60 mb-8">
                                Describe what you're in the mood for, and we'll help you create the perfect recipe
                        </p>

                        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto" aria-label="Recipe prompt form">
                                <div className="mb-6">
                                        <label htmlFor="prompt-input" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                What do you want to cook?
                                        </label>
                                        <textarea
                                                id="prompt-input"
                                                value={promptText}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Something healthy for dinner, Quick pasta dish, Comfort food..."
                                                disabled={loading}
                                                rows={4}
                                                className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none font-['Inter'] text-base
                                                        ${validationError
                                                                ? 'border-[#FF9B7B] focus:border-[#FF9B7B]'
                                                                : 'border-[#F5F5F5] focus:border-[#035035]'
                                                        }
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                `}
                                                aria-invalid={validationError ? 'true' : 'false'}
                                                aria-describedby={validationError ? 'prompt-error' : undefined}
                                                aria-label="Enter what you want to cook"
                                        />
                                        {validationError && (
                                                <p
                                                        id="prompt-error"
                                                        className="mt-2 text-sm text-[#FF9B7B]"
                                                        role="alert"
                                                        aria-live="polite"
                                                >
                                                        {validationError}
                                                </p>
                                        )}
                                </div>

                                <div className="flex justify-center">
                                        <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-[#035035] text-white px-8 py-3 rounded-full font-semibold text-base
                                                        hover:scale-105 active:scale-95 transition-all duration-200
                                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                        min-w-[120px]
                                                "
                                                aria-label="Proceed to ingredients step"
                                        >
                                                {loading ? 'Loading...' : 'Next'}
                                        </button>
                                </div>
                        </form>
                </div>
        );
}

/**
 * IngredientsStep Component
 * 
 * Step 2: Collects user's available ingredients via text or image
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback when form is submitted with valid ingredients
 * @param {Function} props.onBack - Callback to return to previous step
 * @param {string} props.initialIngredients - Initial ingredients text value
 * @param {string} props.initialImageKey - Initial image key value
 * @param {string} props.initialInputMethod - Initial input method ('text' or 'image')
 * @param {boolean} props.loading - Loading state to disable form
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.5
 */
function IngredientsStep({
        onSubmit,
        onBack,
        initialIngredients = '',
        initialImageKey = '',
        initialInputMethod = 'text',
        loading = false
}) {
        const [inputMethod, setInputMethod] = useState(initialInputMethod);
        const [ingredientsText, setIngredientsText] = useState(initialIngredients);
        const [uploadedImage, setUploadedImage] = useState(null);
        const [imageKey, setImageKey] = useState(initialImageKey);
        const [validationError, setValidationError] = useState('');

        /**
         * Validate the ingredients input
         * Requirements: 2.5 - must provide either text (min 3 chars) OR image
         */
        const validateIngredients = () => {
                if (inputMethod === 'text') {
                        if (!ingredientsText || ingredientsText.trim().length === 0) {
                                return 'Please enter your ingredients';
                        }
                        if (ingredientsText.trim().length < 3) {
                                return 'Please enter at least 3 characters';
                        }
                } else if (inputMethod === 'image') {
                        if (!uploadedImage && !imageKey) {
                                return 'Please upload an image of your ingredients';
                        }
                }
                return '';
        };

        /**
         * Handle form submission
         * Requirements: 2.6 - validate and proceed to generate recipes
         */
        const handleSubmit = (e) => {
                e.preventDefault();

                const error = validateIngredients();
                if (error) {
                        setValidationError(error);
                        return;
                }

                setValidationError('');

                // Pass ingredients data based on input method
                if (inputMethod === 'text') {
                        onSubmit(ingredientsText.trim(), '');
                } else {
                        // For image mode, pass the image key (filename for now)
                        onSubmit('', imageKey);
                }
        };

        /**
         * Handle input method toggle
         * Requirements: 2.1 - toggle between text and image modes
         */
        const handleInputMethodChange = (method) => {
                setInputMethod(method);
                setValidationError('');
        };

        /**
         * Handle text input change
         */
        const handleTextChange = (e) => {
                setIngredientsText(e.target.value);
                if (validationError) {
                        setValidationError('');
                }
        };

        /**
         * Handle image upload
         * Requirements: 2.3, 2.4 - store uploaded image and set imageKey
         */
        const handleImageUpload = (e) => {
                const file = e.target.files?.[0];
                if (file) {
                        setUploadedImage(file);
                        // For now, use filename as placeholder for imageKey
                        // In future, this will be replaced with actual upload to backend
                        setImageKey(file.name);
                        if (validationError) {
                                setValidationError('');
                        }
                }
        };

        /**
         * Handle drag and drop for image upload
         */
        const handleDragOver = (e) => {
                e.preventDefault();
        };

        const handleDrop = (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                        setUploadedImage(file);
                        setImageKey(file.name);
                        if (validationError) {
                                setValidationError('');
                        }
                }
        };

        return (
                <div>
                        <h2 className="text-3xl font-bold text-[#035035] mb-6 text-center">
                                What ingredients do you have?
                        </h2>
                        <p className="text-center text-[#2D2D2D] opacity-60 mb-8">
                                Tell us what's in your kitchen, or upload a photo
                        </p>

                        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto" aria-label="Ingredients input form">
                                {/* Input Method Toggle - Requirements: 2.1 */}
                                <div className="flex gap-2 mb-6" role="tablist" aria-label="Ingredient input method">
                                        <button
                                                type="button"
                                                role="tab"
                                                id="text-input-tab"
                                                aria-selected={inputMethod === 'text'}
                                                aria-controls="text-input-panel"
                                                onClick={() => handleInputMethodChange('text')}
                                                onKeyDown={(e) => {
                                                        // Arrow key navigation for tabs
                                                        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                                                                e.preventDefault();
                                                                handleInputMethodChange('image');
                                                                document.getElementById('image-input-tab')?.focus();
                                                        }
                                                }}
                                                disabled={loading}
                                                className={`flex-1 px-6 py-3 rounded-full font-semibold text-base transition-all duration-200
                                                        ${inputMethod === 'text'
                                                                ? 'bg-[#035035] text-white border-2 border-[#035035]'
                                                                : 'bg-white text-[#035035] border-2 border-[#A8C9B8] hover:bg-[#A8C9B8] hover:text-white'
                                                        }
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                `}
                                        >
                                                Text Input
                                        </button>
                                        <button
                                                type="button"
                                                role="tab"
                                                id="image-input-tab"
                                                aria-selected={inputMethod === 'image'}
                                                aria-controls="image-input-panel"
                                                onClick={() => handleInputMethodChange('image')}
                                                onKeyDown={(e) => {
                                                        // Arrow key navigation for tabs
                                                        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                                                                e.preventDefault();
                                                                handleInputMethodChange('text');
                                                                document.getElementById('text-input-tab')?.focus();
                                                        }
                                                }}
                                                disabled={loading}
                                                className={`flex-1 px-6 py-3 rounded-full font-semibold text-base transition-all duration-200
                                                        ${inputMethod === 'image'
                                                                ? 'bg-[#035035] text-white border-2 border-[#035035]'
                                                                : 'bg-white text-[#035035] border-2 border-[#A8C9B8] hover:bg-[#A8C9B8] hover:text-white'
                                                        }
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                `}
                                        >
                                                Upload Image
                                        </button>
                                </div>

                                {/* Text Input Mode - Requirements: 2.2 */}
                                {inputMethod === 'text' && (
                                        <div id="text-input-panel" role="tabpanel" aria-labelledby="text-input-tab" className="mb-6">
                                                <label htmlFor="ingredients-input" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                        Enter your ingredients
                                                </label>
                                                <textarea
                                                        id="ingredients-input"
                                                        value={ingredientsText}
                                                        onChange={handleTextChange}
                                                        placeholder="Enter your ingredients, separated by commas..."
                                                        disabled={loading}
                                                        rows={6}
                                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-vertical font-['Inter'] text-base min-h-[120px]
                                                                ${validationError
                                                                        ? 'border-[#FF9B7B] focus:border-[#FF9B7B]'
                                                                        : 'border-[#F5F5F5] focus:border-[#035035]'
                                                                }
                                                                focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                        `}
                                                        aria-invalid={validationError ? 'true' : 'false'}
                                                        aria-describedby={validationError ? 'ingredients-error' : undefined}
                                                        aria-label="List of ingredients you have available"
                                                />
                                        </div>
                                )}

                                {/* Image Upload Mode - Requirements: 2.3, 2.4 */}
                                {inputMethod === 'image' && (
                                        <div id="image-input-panel" role="tabpanel" aria-labelledby="image-input-tab" className="mb-6">
                                                <label htmlFor="image-upload" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                                        Upload an image of your ingredients
                                                </label>
                                                <div
                                                        onDragOver={handleDragOver}
                                                        onDrop={handleDrop}
                                                        className={`border-2 rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                                                                ${uploadedImage || imageKey
                                                                        ? 'border-[#035035] border-solid bg-[#FFF8F0]'
                                                                        : validationError
                                                                                ? 'border-[#FF9B7B] border-dashed hover:border-[#FF9B7B] hover:bg-[#FFF8F0]'
                                                                                : 'border-[#A8C9B8] border-dashed hover:border-[#035035] hover:bg-[#FFF8F0]'
                                                                }
                                                        `}
                                                        onClick={() => document.getElementById('image-upload')?.click()}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        document.getElementById('image-upload')?.click();
                                                                }
                                                        }}
                                                        aria-label={uploadedImage || imageKey ? 'Image uploaded. Click to change image' : 'Click to upload image or drag and drop'}
                                                >
                                                        <input
                                                                id="image-upload"
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageUpload}
                                                                disabled={loading}
                                                                className="hidden"
                                                                aria-describedby={validationError ? 'ingredients-error' : undefined}
                                                                aria-label="Choose image file"
                                                        />

                                                        {uploadedImage || imageKey ? (
                                                                <div className="flex flex-col items-center gap-3">
                                                                        <svg className="w-12 h-12 text-[#035035]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <div>
                                                                                <p className="text-[#035035] font-semibold">Image uploaded successfully</p>
                                                                                <p className="text-sm text-[#2D2D2D] opacity-60 mt-1">
                                                                                        {uploadedImage?.name || imageKey}
                                                                                </p>
                                                                        </div>
                                                                        <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setUploadedImage(null);
                                                                                        setImageKey('');
                                                                                }}
                                                                                className="text-sm text-[#FF9B7B] hover:underline focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2"
                                                                                aria-label="Remove uploaded image and choose a different one"
                                                                        >
                                                                                Remove and upload different image
                                                                        </button>
                                                                </div>
                                                        ) : (
                                                                <div className="flex flex-col items-center gap-3">
                                                                        <svg className="w-12 h-12 text-[#A8C9B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                        </svg>
                                                                        <div>
                                                                                <p className="text-[#035035] font-semibold">
                                                                                        Click to upload or drag and drop
                                                                                </p>
                                                                                <p className="text-sm text-[#2D2D2D] opacity-60 mt-1">
                                                                                        Upload a photo of your fridge or ingredients
                                                                                </p>
                                                                        </div>
                                                                </div>
                                                        )}
                                                </div>
                                        </div>
                                )}

                                {/* Validation Error - Requirements: 2.6, 10.5 */}
                                {validationError && (
                                        <p
                                                id="ingredients-error"
                                                className="mb-6 text-sm text-[#FF9B7B]"
                                                role="alert"
                                                aria-live="polite"
                                        >
                                                {validationError}
                                        </p>
                                )}

                                {/* Action Buttons - Requirements: 2.6 */}
                                <div className="button-group">
                                        <button
                                                type="button"
                                                onClick={onBack}
                                                disabled={loading}
                                                className="bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold text-base
                                                        hover:bg-[#035035] hover:text-white transition-all duration-200
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                        min-w-[120px]
                                                "
                                                aria-label="Go back to prompt step"
                                        >
                                                Back
                                        </button>
                                        <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold text-base
                                                        hover:scale-105 active:scale-95 transition-all duration-200
                                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                        min-w-[160px]
                                                "
                                                aria-label="Generate recipe options based on your ingredients"
                                        >
                                                {loading ? 'Generating...' : 'Generate Recipes'}
                                        </button>
                                </div>
                        </form>
                </div>
        );
}

/**
 * RecipeOptionsStep Component
 * 
 * Step 3: Displays 3 generated recipe options for user selection
 * 
 * @param {Object} props
 * @param {Array} props.recipeOptions - Array of exactly 3 recipe preview objects
 * @param {Function} props.onRecipeSelect - Callback when a recipe is selected
 * @param {Function} props.onRegenerate - Callback to generate new recipes
 * @param {boolean} props.loading - Loading state for regeneration
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3
 */
function RecipeOptionsStep({ recipeOptions, onRecipeSelect, onRegenerate, loading = false }) {
        return (
                <div>
                        <h2 className="text-3xl font-bold text-[#035035] mb-6 text-center">
                                Choose Your Recipe
                        </h2>
                        <p className="text-center text-[#2D2D2D] opacity-60 mb-8">
                                Select one of these delicious options
                        </p>

                        {/* Recipe Grid - Requirements: 4.1, 8.1, 8.2, 8.3 */}
                        {/* Responsive: 1 column mobile, 2 columns tablet (3rd centered), 3 columns desktop */}
                        <div
                                className="recipe-options-grid"
                                role="list"
                                aria-label="Generated recipe options"
                        >
                                {recipeOptions.map((recipe, index) => (
                                        <div
                                                key={recipe.id}
                                                className="recipe-card-wrapper"
                                                role="listitem"
                                                style={{
                                                        // Staggered fade-in animation - Requirements: 8.3
                                                        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                                }}
                                        >
                                                <RecipePreviewCard
                                                        recipe={recipe}
                                                        onClick={onRecipeSelect}
                                                />
                                        </div>
                                ))}
                        </div>

                        {/* Regenerate Button - Requirements: 4.4, 4.5, 4.6 */}
                        <div className="regenerate-button-container">
                                <button
                                        type="button"
                                        onClick={onRegenerate}
                                        disabled={loading}
                                        className="bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold text-base
                                                hover:bg-[#035035] hover:text-white transition-all duration-200
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                min-w-[200px]
                                        "
                                        aria-label="Generate new recipe options with same ingredients"
                                >
                                        {loading ? 'Generating...' : 'Generate New Recipes'}
                                </button>
                        </div>
                </div>
        );
}

/**
 * RecipeGeneration Page Component
 * 
 * Multi-step workflow for generating AI-powered recipe suggestions:
 * - Step 1: User describes what they want to cook (prompt input)
 * - Step 2: User provides available ingredients (text or image)
 * - Step 3: User selects from 3 generated recipe options
 * 
 * Requirements: 1.1, 1.5, 2.1, 2.5, 3.2, 9.6
 */
export default function RecipeGeneration() {
        const navigate = useNavigate();
        // Step management (1: prompt, 2: ingredients, 3: recipe options)
        const [currentStep, setCurrentStep] = useState(1);

        // Form data state
        const [prompt, setPrompt] = useState('');
        const [ingredients, setIngredients] = useState('');
        const [imageKey, setImageKey] = useState('');
        const [inputMethod, setInputMethod] = useState('text'); // 'text' or 'image'

        // UI state
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);
        const [successMessage, setSuccessMessage] = useState(null);

        // Session and recipe data
        const [preparingSessionId, setPreparingSessionId] = useState(null);
        const [recipeOptions, setRecipeOptions] = useState([]);

        /**
         * Navigate to the next step
         * @param {number} step - The step number to navigate to (1, 2, or 3)
         */
        const goToStep = (step) => {
                if (step >= 1 && step <= 3) {
                        setCurrentStep(step);
                        setError(null); // Clear any errors when changing steps
                        setSuccessMessage(null); // Clear any success messages when changing steps
                }
        };

        /**
         * Handle going back to the previous step
         * Preserves all form data when navigating backwards
         * Requirements: 1.5, 9.5 (preserve form data)
         */
        const handleGoBack = () => {
                if (currentStep > 1) {
                        setCurrentStep(currentStep - 1);
                        setError(null);
                        setSuccessMessage(null);
                }
        };

        /**
         * Cleanup function to finish the preparing session
         * Called when component unmounts or when user navigates away
         * Requirements: 9.6
         */
        const handleCleanupSession = async () => {
                if (preparingSessionId) {
                        try {
                                await finishPreparingSession(preparingSessionId);
                                console.log('Preparing session cleaned up successfully');
                        } catch (error) {
                                // Log error but don't block user - cleanup is best effort
                                console.error('Failed to cleanup preparing session:', error);
                        }
                }
        };

        /**
         * Generate recipes based on user prompt and ingredients
         * Calls POST /preparing/generate and stores the session ID
         * Requirements: 3.1, 3.2, 3.3, 9.1, 9.2, 9.3, 9.4, 9.5
         */
        const handleGenerateRecipes = async () => {
                setLoading(true);
                setError(null);
                setSuccessMessage(null);

                try {
                        // Call POST /preparing/generate with prompt, ingredients, and image_key
                        // Requirements: 3.1
                        const sessionId = await generateRecipes(
                                prompt,
                                ingredients,
                                imageKey,
                                preparingSessionId // Pass existing session ID for regeneration
                        );

                        // Store preparing session ID in state
                        // Requirements: 3.3
                        setPreparingSessionId(sessionId);
                        console.log('Recipe generation started, session ID:', sessionId);

                        // Fetch recipe options after generation
                        await handleGetRecipeOptions(sessionId);

                        // Display success feedback when recipes are generated successfully
                        // Requirements: 9.5
                        setSuccessMessage('Recipes generated successfully!');

                        // Clear success message after 3 seconds
                        setTimeout(() => {
                                setSuccessMessage(null);
                        }, 3000);
                } catch (err) {
                        // Handle errors with appropriate messages
                        // Requirements: 9.1, 9.2, 9.3, 9.4
                        // Log all errors to console with full error details for debugging
                        // Requirements: 9.4
                        console.error('Recipe generation failed:', err);
                        console.error('Error details:', {
                                message: err.message,
                                response: err.response,
                                status: err.response?.status,
                                data: err.response?.data,
                                stack: err.stack
                        });

                        let errorMessage = 'Failed to generate recipes. Please try again.';

                        if (!err.response) {
                                // Network error - no response from server
                                // Requirements: 9.1
                                errorMessage = 'Network error. Please check your connection.';
                        } else if (err.response.status >= 500) {
                                // Server error (5xx)
                                // Requirements: 9.2
                                errorMessage = 'Server error. Please try again later.';
                        } else if (err.response.status === 404) {
                                // Not found error
                                // Requirements: 9.3
                                errorMessage = 'Resource not found. Please try again.';
                        } else if (err.response.status === 429) {
                                // Rate limit error
                                // Requirements: 9.3
                                errorMessage = 'Too many requests. Please wait a moment.';
                        } else if (err.response.status === 400) {
                                // Bad request
                                // Requirements: 9.3
                                errorMessage = 'Invalid request. Please check your inputs.';
                        }

                        // Preserve form data when errors occur so users don't lose their inputs
                        // Requirements: 9.5
                        // Form data (prompt, ingredients, imageKey) is already preserved in state
                        setError(errorMessage);
                } finally {
                        setLoading(false);
                }
        };

        /**
         * Get recipe options for the current preparing session
         * Calls GET /preparing/{id}/get_options and displays exactly 3 recipes
         * Requirements: 3.4, 3.5, 3.6, 9.1, 9.2, 9.3, 9.4
         */
        const handleGetRecipeOptions = async (sessionId) => {
                try {
                        // Call GET /preparing/{id}/get_options
                        // Requirements: 3.4
                        const options = await getRecipeOptions(sessionId);

                        // Store recipe options (should be exactly 3)
                        // Requirements: 3.5
                        setRecipeOptions(options);
                        console.log('Recipe options retrieved:', options.length, 'recipes');

                        // Move to step 3 to display recipe options
                        // Requirements: 3.6
                        goToStep(3);
                } catch (err) {
                        // Handle errors with appropriate messages
                        // Requirements: 9.1, 9.2, 9.3, 9.4
                        // Log all errors to console with full error details for debugging
                        // Requirements: 9.4
                        console.error('Failed to get recipe options:', err);
                        console.error('Error details:', {
                                message: err.message,
                                response: err.response,
                                status: err.response?.status,
                                data: err.response?.data,
                                stack: err.stack
                        });

                        let errorMessage = 'Failed to retrieve recipe options. Please try again.';

                        if (!err.response) {
                                // Network error - no response from server
                                // Requirements: 9.1
                                errorMessage = 'Network error. Please check your connection.';
                        } else if (err.response.status >= 500) {
                                // Server error (5xx)
                                // Requirements: 9.2
                                errorMessage = 'Server error. Please try again later.';
                        } else if (err.response.status === 404) {
                                // Not found error
                                // Requirements: 9.3
                                errorMessage = 'Recipe options not found. Please try generating again.';
                        } else if (err.response.status === 429) {
                                // Rate limit error
                                // Requirements: 9.3
                                errorMessage = 'Too many requests. Please wait a moment.';
                        } else if (err.response.status === 400) {
                                // Bad request
                                // Requirements: 9.3
                                errorMessage = 'Invalid request. Please check your inputs.';
                        }

                        setError(errorMessage);
                        throw err; // Re-throw to be caught by handleGenerateRecipes
                }
        };

        /**
         * Retry the recipe generation after an error
         * Clears error state and retries the operation
         * Requirements: 9.4
         */
        const handleRetry = () => {
                setError(null);
                setSuccessMessage(null);
                // Retry the generation with preserved form data
                // Requirements: 9.5 (form data is preserved in state)
                handleGenerateRecipes();
        };

        /**
         * Handle recipe selection
         * Navigate to recipe view and cleanup session
         * Requirements: 4.3, 6.1, 6.2, 6.3
         */
        const handleRecipeSelect = async (recipeId) => {
                console.log('Recipe selected:', recipeId);

                // Save recipe as permanent before cleanup
                // This prevents the recipe from being deleted during session cleanup
                try {
                        await saveRecipe(recipeId);
                        console.log('Recipe saved as permanent:', recipeId);
                } catch (error) {
                        console.error('Failed to save recipe:', error);
                        // Continue anyway - user can still view the recipe if it exists
                }

                // Cleanup session after saving
                // Requirements: 6.3
                await handleCleanupSession();

                // Navigate to recipe view
                // Requirements: 6.1, 6.2
                navigate(`/app/recipe/${recipeId}`);
        };

        /**
         * Handle recipe regeneration
         * Call generate API again with same prompt and ingredients
         * Requirements: 4.4, 4.5, 4.6
         */
        const handleRegenerateRecipes = async () => {
                console.log('Regenerating recipes with same prompt and ingredients');

                // Call generate recipes again - it will use the same prompt and ingredients
                // Requirements: 4.5
                await handleGenerateRecipes();
        };

        /**
         * Cleanup effect - calls DELETE /preparing/{id}/finish on unmount
         * Requirements: 9.6
         */
        useEffect(() => {
                return () => {
                        // Cleanup session when component unmounts
                        if (preparingSessionId) {
                                finishPreparingSession(preparingSessionId).catch((error) => {
                                        console.error('Cleanup on unmount failed:', error);
                                });
                        }
                };
        }, [preparingSessionId]);

        return (
                <div className="recipe-generation-page">
                        <div className="recipe-generation-step">
                                {/* Step Indicator */}
                                <div className="mb-8">
                                        <div className="flex items-center justify-center gap-4">
                                                {[1, 2, 3].map((step) => (
                                                        <div key={step} className="flex items-center">
                                                                <div
                                                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep === step
                                                                                ? 'bg-[#035035] text-white'
                                                                                : currentStep > step
                                                                                        ? 'bg-[#A8C9B8] text-white'
                                                                                        : 'bg-[#F5F5F5] text-[#2D2D2D] opacity-50'
                                                                                }`}
                                                                        aria-current={currentStep === step ? 'step' : undefined}
                                                                >
                                                                        {step}
                                                                </div>
                                                                {step < 3 && (
                                                                        <div
                                                                                className={`w-16 h-1 mx-2 transition-all ${currentStep > step ? 'bg-[#A8C9B8]' : 'bg-[#F5F5F5]'
                                                                                        }`}
                                                                        />
                                                                )}
                                                        </div>
                                                ))}
                                        </div>
                                        <div className="text-center mt-4 text-sm text-[#2D2D2D] opacity-60">
                                                {currentStep === 1 && 'Step 1: What do you want to cook?'}
                                                {currentStep === 2 && 'Step 2: What ingredients do you have?'}
                                                {currentStep === 3 && 'Step 3: Choose your recipe'}
                                        </div>
                                </div>

                                {/* Step Content */}
                                <div className="bg-white rounded-2xl border border-[#F5F5F5] p-8">
                                        {currentStep === 1 && (
                                                <PromptStep
                                                        onSubmit={(promptText) => {
                                                                setPrompt(promptText);
                                                                goToStep(2);
                                                        }}
                                                        initialValue={prompt}
                                                        loading={loading}
                                                />
                                        )}

                                        {currentStep === 2 && !loading && !error && (
                                                <IngredientsStep
                                                        onSubmit={(ingredientsText, imgKey) => {
                                                                setIngredients(ingredientsText);
                                                                setImageKey(imgKey);
                                                                // Update input method based on what was submitted
                                                                setInputMethod(ingredientsText ? 'text' : 'image');
                                                                // Call API to generate recipes
                                                                // Requirements: 3.1, 3.2
                                                                handleGenerateRecipes();
                                                        }}
                                                        onBack={handleGoBack}
                                                        initialIngredients={ingredients}
                                                        initialImageKey={imageKey}
                                                        initialInputMethod={inputMethod}
                                                        loading={loading}
                                                />
                                        )}

                                        {/* Loading State - Requirements: 3.2 */}
                                        {currentStep === 2 && loading && (
                                                <div className="recipe-generation-loading" role="status" aria-live="polite">
                                                        <LoadingSpinner size="large" />
                                                        <p className="text-lg text-[#035035] font-medium">
                                                                Generating your recipe options...
                                                        </p>
                                                        <p className="mt-2 text-sm text-[#2D2D2D] opacity-60">
                                                                This may take a few moments
                                                        </p>
                                                </div>
                                        )}

                                        {/* Error State - Requirements: 3.6, 9.1, 9.2, 9.3, 9.4 */}
                                        {currentStep === 2 && error && (
                                                <div className="recipe-generation-error" role="alert" aria-live="assertive">
                                                        <ErrorMessage message={error} onRetry={handleRetry} />
                                                </div>
                                        )}

                                        {/* Success Message - Requirements: 9.5 */}
                                        {currentStep === 2 && successMessage && (
                                                <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center" role="status" aria-live="polite">
                                                        <div className="mb-4 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#035035] bg-opacity-10 flex items-center justify-center">
                                                                <svg
                                                                        className="w-7 h-7 sm:w-8 sm:h-8 text-[#035035]"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                        aria-hidden="true"
                                                                >
                                                                        <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                </svg>
                                                        </div>
                                                        <p className="text-[#035035] text-base sm:text-lg font-medium">
                                                                {successMessage}
                                                        </p>
                                                </div>
                                        )}

                                        {currentStep === 3 && !loading && !error && (
                                                <RecipeOptionsStep
                                                        recipeOptions={recipeOptions}
                                                        onRecipeSelect={handleRecipeSelect}
                                                        onRegenerate={handleRegenerateRecipes}
                                                        loading={loading}
                                                />
                                        )}

                                        {/* Loading State for Step 3 (Regeneration) */}
                                        {currentStep === 3 && loading && (
                                                <div className="recipe-generation-loading" role="status" aria-live="polite">
                                                        <LoadingSpinner size="large" />
                                                        <p className="text-lg text-[#035035] font-medium">
                                                                Generating new recipe options...
                                                        </p>
                                                        <p className="mt-2 text-sm text-[#2D2D2D] opacity-60">
                                                                This may take a few moments
                                                        </p>
                                                </div>
                                        )}

                                        {/* Error State for Step 3 */}
                                        {currentStep === 3 && error && (
                                                <div className="recipe-generation-error" role="alert" aria-live="assertive">
                                                        <ErrorMessage message={error} onRetry={handleRetry} />
                                                </div>
                                        )}

                                        {/* Success Message for Step 3 - Requirements: 9.5 */}
                                        {currentStep === 3 && successMessage && (
                                                <div className="flex justify-center mb-4" role="status" aria-live="polite">
                                                        <div className="flex items-center gap-2 bg-[#035035] bg-opacity-10 text-[#035035] px-4 py-2 rounded-full">
                                                                <svg
                                                                        className="w-5 h-5"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                        aria-hidden="true"
                                                                >
                                                                        <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                </svg>
                                                                <span className="text-sm font-medium">{successMessage}</span>
                                                        </div>
                                                </div>
                                        )}
                                </div>

                                {/* Debug Info (remove in production) */}
                                {process.env.NODE_ENV === 'development' && (
                                        <div className="mt-4 p-4 bg-[#F5F5F5] rounded-lg text-xs">
                                                <div className="font-semibold mb-2">Debug State:</div>
                                                <div>Current Step: {currentStep}</div>
                                                <div>Prompt: {prompt || '(empty)'}</div>
                                                <div>Ingredients: {ingredients || '(empty)'}</div>
                                                <div>Image Key: {imageKey || '(empty)'}</div>
                                                <div>Input Method: {inputMethod}</div>
                                                <div>Session ID: {preparingSessionId || '(none)'}</div>
                                                <div>Recipe Options: {recipeOptions.length} items</div>
                                                <div>Loading: {loading ? 'Yes' : 'No'}</div>
                                                <div>Error: {error || '(none)'}</div>
                                        </div>
                                )}
                        </div>
                </div>
        );
}
