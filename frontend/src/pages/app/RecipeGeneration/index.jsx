import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
        generateRecipes,
        getRecipeOptions,
        finishPreparingSession,
        getImageAnalysisBySessionId,
} from '../../../api/preparingApi';
import { saveRecipe } from '../../../api/recipeApi';
import { updateCollectionRecipes, getCollectionById } from '../../../api/collectionApi';
import ErrorMessage from '../../../components/ErrorMessage';
import PromptStep from './PromptStep';
import IngredientsStep from './IngredientsStep';
import RecipeOptionsStep from './RecipeOptionsStep';
import { ensureFadeInStyles } from './fadeInStyles';
import { SESSION_STORAGE_KEY } from './constants';

export default function RecipeGeneration() {
        const navigate = useNavigate();
        const location = useLocation();
        const collectionContext = location.state; // { collectionId, collectionName }
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

                        // Navigate back to collection if there's a collection context
                        if (collectionContext?.collectionId) {
                                navigate(`/app/collection/${collectionContext.collectionId}`);
                        }
                }
        }, [preparingSessionId, clearStoredSession, collectionContext, navigate]);

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
                setError(null);
                setSuccessMessage(null);
                const hasUploadedImage = sanitizedImageKey.length > 0;
                if (!hasUploadedImage) {
                        setImageAnalysis(null);
                }

                // Show 3 placeholder recipes immediately and navigate to step 3
                setRecipeOptions([
                        { id: -1, title: '', description: '' },
                        { id: -2, title: '', description: '' },
                        { id: -3, title: '', description: '' }
                ]);
                goToStep(3);

                try {
                        // Call generateRecipes in background while user sees placeholders
                        const sessionId = await generateRecipes(prompt, sanitizedIngredients, sanitizedImageKey, preparingSessionId);
                        setPreparingSessionId(sessionId);
                        storeSessionId(sessionId);

                        // Fetch actual recipe options and replace placeholders
                        await handleGetRecipeOptions(sessionId, false);

                        // Fetch image analysis in background without blocking UI
                        if (hasUploadedImage) {
                                handleFetchImageAnalysis(sessionId).catch(err => {
                                        console.error('Background image analysis fetch failed:', err);
                                });
                        }
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

                        // Remove placeholders and show error on step 3
                        setRecipeOptions([]);
                        setError(errorMessage);
                }
        };

        const handleGetRecipeOptions = useCallback(async (sessionId, shouldNavigate = true) => {
                try {
                        console.log('!!!Fetching recipe options for session:', sessionId);
                        const options = await getRecipeOptions(sessionId);
                        console.log('!!!Received recipe options:', options);
                        setRecipeOptions(options);
                        if (shouldNavigate) {
                                goToStep(3);
                        }
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
                        // Remove placeholders and show error
                        setRecipeOptions([]);
                        setError(errorMessage);
                        setSuccessMessage(null);
                }
        }, [goToStep]);

        const handleSaveRecipeOption = async (recipeId) => {
                setError(null);
                try {
                        await saveRecipe(recipeId);

                        // If we have a collection context, add the recipe to that collection
                        if (collectionContext?.collectionId) {
                                try {
                                        // Get current collection to get existing recipe IDs
                                        const collection = await getCollectionById(collectionContext.collectionId);
                                        const existingRecipeIds = collection.recipes.map(r => r.id);

                                        // Add new recipe to collection
                                        const updatedRecipeIds = [...existingRecipeIds, recipeId];
                                        await updateCollectionRecipes(collectionContext.collectionId, updatedRecipeIds);

                                        // Navigate back to the collection view
                                        navigate(`/app/collection/${collectionContext.collectionId}`);
                                } catch (collectionError) {
                                        console.error('Failed to add recipe to collection:', collectionError);
                                        // Still navigate to the recipe view if collection update fails
                                        setError('Recipe saved, but failed to add to collection.');
                                }
                        }
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
                if (typeof document === 'undefined') {
                        return undefined;
                }

                const { body } = document;
                const previousOverflow = body.style.overflow;
                body.style.overflow = 'hidden';

                return () => {
                        body.style.overflow = previousOverflow;
                };
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
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#02140c]/60 backdrop-blur-sm px-4 py-6 sm:px-6 lg:px-8 overflow-y-auto">
                        <div className="relative w-full max-w-5xl my-auto">
                                <div
                                        className="relative rounded-3xl border border-[#E5ECE8] bg-white shadow-2xl overflow-hidden"
                                        style={{
                                                backgroundImage: 'url(/cooking_background.jpg)',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                height: currentStep === 3 ? 'auto' : '80vh',
                                                minHeight: currentStep === 3 ? '80vh' : 'auto'
                                        }}
                                >
                                        <div className="px-6 pb-8 pt-8 sm:px-10 h-full flex flex-col">
                                                {/* Collection Context Banner */}
                                                {collectionContext?.collectionName && (
                                                        <div className="mb-6 rounded-lg border border-[#035035]/20 bg-[#035035]/10 p-4">
                                                                <p className="text-center text-sm text-[#035035]">
                                                                        <span className="font-semibold">Generiere Rezept für:</span> {collectionContext.collectionName}
                                                                </p>
                                                        </div>
                                                )}

                                                {/* Progress Bar */}
                                                <div className="mb-6">
                                                        <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                                                                <div
                                                                        className="h-full bg-gradient-to-r from-[#035035] to-[#A8C9B8] transition-all duration-500 ease-out"
                                                                        style={{ width: `${(currentStep / 3) * 100}%` }}
                                                                        role="progressbar"
                                                                        aria-valuenow={currentStep}
                                                                        aria-valuemin={1}
                                                                        aria-valuemax={3}
                                                                        aria-label={`Step ${currentStep} of 3`}
                                                                />
                                                        </div>
                                                </div>

                                                <div className={`flex flex-col flex-1 ${currentStep === 1 || currentStep === 2 ? 'justify-center items-center' : ''}`}>
                                                        <div
                                                                className={`rounded-2xl px-5 sm:px-7 pt-8 sm:pt-10 pb-8 sm:pb-10 shadow-[0_12px_32px_rgba(3,80,53,0.05)] w-full ${currentStep === 3 ? 'flex-1' : ''}`}
                                                                style={{
                                                                        background: 'rgba(255, 255, 255, 0.7)',
                                                                        backdropFilter: 'blur(20px)',
                                                                        WebkitBackdropFilter: 'blur(20px)',
                                                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                                                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
                                                                }}
                                                        >
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


                                                        {currentStep === 2 && error && (
                                                                <div className="my-6" role="alert" aria-live="assertive">
                                                                        <ErrorMessage message={error} onRetry={handleRetry} />
                                                                </div>
                                                        )}


                                                        {currentStep === 3 && !error && (
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


                                                        {currentStep === 3 && error && (
                                                                <div className="my-6" role="alert" aria-live="assertive">
                                                                        <ErrorMessage message={error} onRetry={handleRetry} />
                                                                </div>
                                                        )}

                                                        {currentStep === 3 && successMessage && (
                                                                <div className="mb-4 flex justify-center" role="status" aria-live="polite">
                                                                        <div className="flex items-center gap-2 rounded-full bg-[#035035]/10 px-4 py-2 text-[#035035]">
                                                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                <span className="text-sm font-medium">{successMessage}</span>
                                                                        </div>
                                                                </div>
                                                        )}
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        );
}
