import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
        generateRecipes,
        getRecipeOptions,
        finishPreparingSession,
        getImageAnalysisBySessionId,
} from '../../../api/preparingApi';
import { saveRecipe } from '../../../api/recipeApi';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';
import PromptStep from './PromptStep';
import IngredientsStep from './IngredientsStep';
import RecipeOptionsStep from './RecipeOptionsStep';
import { ensureFadeInStyles } from './fadeInStyles';
import { SESSION_STORAGE_KEY } from './constants';
import { getImageUrl } from '../../../utils/imageUtils';

export default function RecipeGeneration() {
        const navigate = useNavigate();
        const [currentStep, setCurrentStep] = useState(1);
        const [prompt, setPrompt] = useState('');
        const [ingredients, setIngredients] = useState('');
        const [imageKey, setImageKey] = useState('');
        const [inputMethod, setInputMethod] = useState('text');
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);
        const [successMessage, setSuccessMessage] = useState(null);
        const [preparingSessionId, setPreparingSessionId] = useState(null);
        const [recipeOptions, setRecipeOptions] = useState([]);
        const [imageAnalysis, setImageAnalysis] = useState(null);
        const [isImagePanelOpen, setIsImagePanelOpen] = useState(true);
        const [finishingSession, setFinishingSession] = useState(false);


        const storeSessionId = useCallback((sessionId) => {
                if (typeof window === 'undefined') {
                        return;
                }
                try {
                        localStorage.setItem(SESSION_STORAGE_KEY, String(sessionId));
                } catch (storageError) {
                        console.error('Unable to persist preparing session ID:', storageError);
                }
        }, []);

        const clearStoredSession = useCallback(() => {
                if (typeof window === 'undefined') {
                        return;
                }
                try {
                        localStorage.removeItem(SESSION_STORAGE_KEY);
                } catch (storageError) {
                        console.error('Unable to clear stored preparing session ID:', storageError);
                }
        }, []);


        const showTemporarySuccess = useCallback((message) => {
                setSuccessMessage(message);
                if (typeof window !== 'undefined') {
                        window.setTimeout(() => {
                                setSuccessMessage(null);
                        }, 3000);
                }
        }, []);

        const goToStep = useCallback((step) => {
                if (step >= 1 && step <= 3) {
                        setCurrentStep(step);
                        setError(null);
                        setSuccessMessage(null);
                }
        }, []);

        const handleGoBack = () => {
                if (currentStep > 1) {
                        setCurrentStep(currentStep - 1);
                        setError(null);
                        setSuccessMessage(null);
                }
        };

        const handleFinishCurrentSession = useCallback(async () => {
                if (!preparingSessionId) {
                        return;
                }

                setFinishingSession(true);
                try {
                        await finishPreparingSession(preparingSessionId);
                } catch (finishError) {
                        console.error('Failed to finish preparing session:', finishError);
                        throw finishError;
                } finally {
                        setFinishingSession(false);
                        clearStoredSession();
                        setPreparingSessionId(null);
                        setRecipeOptions([]);
                        setImageAnalysis(null);
                        setIsImagePanelOpen(true);
                        setError(null);
                        setPrompt('');
                        setIngredients('');
                        setImageKey('');
                        setInputMethod('text');
                        setCurrentStep(1);
                }
        }, [preparingSessionId, clearStoredSession]);

        const handleFetchImageAnalysis = useCallback(async (sessionId) => {
                try {
                        const analysis = await getImageAnalysisBySessionId(sessionId);
                        if (analysis?.image_key) {
                                setImageAnalysis({
                                        imageKey: analysis.image_key,
                                        analyzedIngredients: analysis.analyzed_ingredients || '',
                                });
                                setIsImagePanelOpen(true);
                                return;
                        }
                        setImageAnalysis(null);
                } catch (analysisError) {
                        if (analysisError?.response?.status === 404) {
                                setImageAnalysis(null);
                                return;
                        }
                        console.error('Failed to get image analysis:', analysisError);
                        setImageAnalysis(null);
                }
        }, []);

        const handleGenerateRecipes = async ({ ingredientsOverride, imageKeyOverride } = {}) => {
                const nextIngredients = typeof ingredientsOverride === 'string' ? ingredientsOverride : ingredients;
                const nextImageKey = typeof imageKeyOverride === 'string' ? imageKeyOverride : imageKey;
                const sanitizedIngredients = typeof nextIngredients === 'string' ? nextIngredients.trim() : '';
                const sanitizedImageKey = typeof nextImageKey === 'string' ? nextImageKey.trim() : '';

                setIngredients(sanitizedIngredients);
                setImageKey(sanitizedImageKey);
                setLoading(true);
                setError(null);
                setSuccessMessage(null);
                const hasUploadedImage = sanitizedImageKey.length > 0;
                if (!hasUploadedImage) {
                        setImageAnalysis(null);
                }

                try {
                        const sessionId = await generateRecipes(prompt, sanitizedIngredients, sanitizedImageKey, preparingSessionId);
                        setPreparingSessionId(sessionId);
                        storeSessionId(sessionId);
                        await handleGetRecipeOptions(sessionId);
                        if (hasUploadedImage) {
                                await handleFetchImageAnalysis(sessionId);
                        }
                        showTemporarySuccess('Recipes generated successfully!');
                } catch (generationError) {
                        console.error('Recipe generation failed:', generationError);
                        console.error('Error details:', {
                                message: generationError.message,
                                response: generationError.response,
                                status: generationError.response?.status,
                                data: generationError.response?.data,
                                stack: generationError.stack,
                        });

                        let errorMessage = 'Failed to generate recipes. Please try again.';
                        if (!generationError.response) {
                                errorMessage = 'Network error. Please check your connection.';
                        } else if (generationError.response.status >= 500) {
                                errorMessage = 'Server error. Please try again later.';
                        } else if (generationError.response.status === 404) {
                                errorMessage = 'Resource not found. Please try again.';
                        } else if (generationError.response.status === 429) {
                                errorMessage = 'Too many requests. Please wait a moment.';
                        } else if (generationError.response.status === 400) {
                                errorMessage = 'Invalid request. Please check your inputs.';
                        }

                        setError(errorMessage);
                } finally {
                        setLoading(false);
                }
        };

        const handleGetRecipeOptions = useCallback(async (sessionId) => {
                try {
                        const options = await getRecipeOptions(sessionId);
                        setRecipeOptions(options);
                        goToStep(3);
                } catch (optionsError) {
                        console.error('Failed to get recipe options:', optionsError);
                        let errorMessage = 'Failed to load recipe options. Please try again.';
                        if (!optionsError.response) {
                                errorMessage = 'Network error. Please check your connection.';
                        } else if (optionsError.response.status >= 500) {
                                errorMessage = 'Server error. Please try again later.';
                        } else if (optionsError.response.status === 404) {
                                errorMessage = 'Recipe options not found. Please generate again.';
                        } else if (optionsError.response.status === 429) {
                                errorMessage = 'Too many requests. Please wait a moment.';
                        } else if (optionsError.response.status === 400) {
                                errorMessage = 'Invalid request. Please check your inputs.';
                        }
                        setError(errorMessage);
                        setSuccessMessage(null);
                }
        }, [goToStep]);

        const handleSaveRecipeOption = async (recipeId) => {
                setError(null);
                try {
                        await saveRecipe(recipeId);
                } catch (saveError) {
                        console.error('Failed to save recipe option:', saveError);
                        setError('Failed to save recipe. Please try again.');
                        throw saveError;
                }
        };

        const handleRetry = () => {
                setError(null);
                setSuccessMessage(null);
                handleGenerateRecipes();
        };

        const handleRecipeSelect = (recipeId) => {
                navigate(`/app/recipe/${recipeId}`);
        };

        const handleRegenerateRecipes = async () => {
                await handleGenerateRecipes();
        };

        useEffect(() => {
                ensureFadeInStyles();
        }, []);

        useEffect(() => {
                if (typeof window === 'undefined') {
                        return;
                }

                const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
                if (!storedSessionId) {
                        return;
                }

                const parsedId = Number(storedSessionId);
                if (!parsedId || Number.isNaN(parsedId)) {
                        clearStoredSession();
                        return;
                }

                setPreparingSessionId(parsedId);
                setLoading(true);

                (async () => {
                        try {
                                await handleGetRecipeOptions(parsedId);
                                await handleFetchImageAnalysis(parsedId);
                        } catch (restoreError) {
                                console.error('Failed to restore preparing session:', restoreError);
                                clearStoredSession();
                                setPreparingSessionId(null);
                                setError('Failed to restore your previous session. Please generate recipes again.');
                        } finally {
                                setLoading(false);
                        }
                })();
        }, [clearStoredSession, handleGetRecipeOptions, handleFetchImageAnalysis]);


        const analysisLines = imageAnalysis?.analyzedIngredients
                ? imageAnalysis.analyzedIngredients
                                .split(/\r?\n/)
                                .map((line) => line.trim())
                                .filter((line) => line.length > 0)
                : [];

        return (
                <div className="min-h-screen p-4 sm:p-6 lg:p-8">
                        <div className="max-w-4xl mx-auto">
                                <div className="mb-8">
                                        <div className="flex items-center justify-center gap-4">
                                                {[1, 2, 3].map((step) => (
                                                        <div key={step} className="flex items-center">
                                                                <div
                                                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep === step
                                                                                ? 'bg-[#035035] text-white'
                                                                                : currentStep > step
                                                                                ? 'bg-[#A8C9B8] text-white'
                                                                                : 'bg-[#F5F5F5] text-[#2D2D2D] opacity-50'}`}
                                                                        aria-current={currentStep === step ? 'step' : undefined}
                                                                >
                                                                        {step}
                                                                </div>
                                                                {step < 3 && (
                                                                        <div
                                                                                className={`w-16 h-1 mx-2 transition-all ${currentStep > step ? 'bg-[#A8C9B8]' : 'bg-[#F5F5F5]'}`}
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
                                                                setInputMethod(ingredientsText ? 'text' : 'image');
                                                                handleGenerateRecipes({
                                                                        ingredientsOverride: ingredientsText,
                                                                        imageKeyOverride: imgKey,
                                                                });
                                                        }}
                                                        onBack={handleGoBack}
                                                        initialIngredients={ingredients}
                                                        initialImageKey={imageKey}
                                                        initialInputMethod={inputMethod}
                                                        loading={loading}
                                                />
                                        )}

                                        {currentStep === 2 && loading && (
                                                <div className="flex flex-col items-center justify-center p-12 text-center" role="status" aria-live="polite">
                                                        <LoadingSpinner size="large" />
                                                        <p className="mt-4 text-lg text-[#035035] font-medium">Generating your recipe options...</p>
                                                        <p className="mt-2 text-sm text-[#2D2D2D] opacity-60">This may take a few moments</p>
                                                </div>
                                        )}

                                        {currentStep === 2 && error && (
                                                <div className="my-6" role="alert" aria-live="assertive">
                                                        <ErrorMessage message={error} onRetry={handleRetry} />
                                                </div>
                                        )}

                                        {currentStep === 2 && successMessage && (
                                                <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center" role="status" aria-live="polite">
                                                        <div className="mb-4 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#035035] bg-opacity-10 flex items-center justify-center">
                                                                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#035035]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                        </div>
                                                        <p className="text-[#035035] text-base sm:text-lg font-medium">{successMessage}</p>
                                                </div>
                                        )}

                                        {currentStep === 3 && !loading && !error && (
                                                <RecipeOptionsStep
                                                        recipeOptions={recipeOptions}
                                                        onRegenerate={handleRegenerateRecipes}
                                                        loading={loading}
                                                        onSaveRecipe={handleSaveRecipeOption}
                                                        onFinishSession={handleFinishCurrentSession}
                                                        sessionCompleting={finishingSession}
                                                        preparingSessionId={preparingSessionId}
                                                />
                                        )}

                                        {currentStep === 3 && loading && (
                                                <div className="flex flex-col items-center justify-center p-12 text-center" role="status" aria-live="polite">
                                                        <LoadingSpinner size="large" />
                                                        <p className="mt-4 text-lg text-[#035035] font-medium">Generating new recipe options...</p>
                                                        <p className="mt-2 text-sm text-[#2D2D2D] opacity-60">This may take a few moments</p>
                                                </div>
                                        )}

                                        {currentStep === 3 && error && (
                                                <div className="my-6" role="alert" aria-live="assertive">
                                                        <ErrorMessage message={error} onRetry={handleRetry} />
                                                </div>
                                        )}

                                        {currentStep === 3 && successMessage && (
                                                <div className="flex justify-center mb-4" role="status" aria-live="polite">
                                                        <div className="flex items-center gap-2 bg-[#035035] bg-opacity-10 text-[#035035] px-4 py-2 rounded-full">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="text-sm font-medium">{successMessage}</span>
                                                        </div>
                                                </div>
                                        )}
                                </div>

                                {process.env.NODE_ENV === 'development' && (
                                        <div className="mt-4 p-4 bg-[#F5F5F5] rounded-lg text-xs">
                                                <div className="font-semibold mb-2">Debug State:</div>
                                                <div>Current Step: {currentStep}</div>
                                                <div>Prompt: {prompt || '(empty)'}</div>
                                                <div>Ingredients: {ingredients || '(empty)'}</div>
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
