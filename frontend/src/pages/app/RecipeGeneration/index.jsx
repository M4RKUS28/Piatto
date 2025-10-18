import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
        generateRecipes,
        getRecipeOptions,
        finishPreparingSession,
        getImageAnalysisBySessionId,
        removeRecipeFromCurrent,
        addRecipeToCurrent,
} from '../../../api/preparingApi';
import { saveRecipe, unsaveRecipe } from '../../../api/recipeApi';
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
        const [recipeStatuses, setRecipeStatuses] = useState({});
        const [recipeActionInProgress, setRecipeActionInProgress] = useState({});
        const [statusMessagesVisible, setStatusMessagesVisible] = useState({});
        const statusMessageTimeoutsRef = useRef({});
        const [finishingSession, setFinishingSession] = useState(false);

        const clearStatusMessageTimeout = useCallback((recipeId) => {
                const timeoutId = statusMessageTimeoutsRef.current?.[recipeId];
                if (timeoutId) {
                        clearTimeout(timeoutId);
                        delete statusMessageTimeoutsRef.current[recipeId];
                }
        }, []);

        const clearAllStatusMessageTimeouts = useCallback(() => {
                Object.values(statusMessageTimeoutsRef.current || {}).forEach((timeoutId) => {
                        if (timeoutId) {
                                clearTimeout(timeoutId);
                        }
                });
                statusMessageTimeoutsRef.current = {};
        }, []);

        const triggerStatusMessage = useCallback((recipeId) => {
                if (typeof window === 'undefined') {
                        return;
                }
                clearStatusMessageTimeout(recipeId);
                setStatusMessagesVisible((prev) => ({
                        ...prev,
                        [recipeId]: true,
                }));
                statusMessageTimeoutsRef.current[recipeId] = window.setTimeout(() => {
                        setStatusMessagesVisible((prev) => ({
                                ...prev,
                                [recipeId]: false,
                        }));
                        delete statusMessageTimeoutsRef.current[recipeId];
                }, 3000);
        }, [clearStatusMessageTimeout]);

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

        const resetRecipeStateForOptions = useCallback((options) => {
                clearAllStatusMessageTimeouts();
                if (!Array.isArray(options)) {
                        setRecipeStatuses({});
                        setRecipeActionInProgress({});
                        setStatusMessagesVisible({});
                        return;
                }
                const initialStatuses = options.reduce((accumulator, recipe) => {
                        accumulator[recipe.id] = 'pending';
                        return accumulator;
                }, {});
                const initialVisibility = options.reduce((accumulator, recipe) => {
                        accumulator[recipe.id] = false;
                        return accumulator;
                }, {});
                setRecipeStatuses(initialStatuses);
                setRecipeActionInProgress({});
                setStatusMessagesVisible(initialVisibility);
        }, [clearAllStatusMessageTimeouts]);

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
                } finally {
                        setFinishingSession(false);
                        clearStoredSession();
                        clearAllStatusMessageTimeouts();
                        setPreparingSessionId(null);
                        setRecipeOptions([]);
                        setRecipeStatuses({});
                        setRecipeActionInProgress({});
                        setStatusMessagesVisible({});
                        setImageAnalysis(null);
                        setIsImagePanelOpen(true);
                        setError(null);
                        setPrompt('');
                        setIngredients('');
                        setImageKey('');
                        setInputMethod('text');
                        setCurrentStep(1);
                        showTemporarySuccess('Session completed.');
                }
        }, [preparingSessionId, clearStoredSession, showTemporarySuccess, clearAllStatusMessageTimeouts]);

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
                        resetRecipeStateForOptions(options);
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
        }, [resetRecipeStateForOptions, goToStep]);

        const handleSaveRecipeOption = async (recipeId) => {
                if (!preparingSessionId || recipeStatuses[recipeId] !== 'pending') {
                        return;
                }

                setError(null);
                setRecipeActionInProgress((prev) => ({
                        ...prev,
                        [recipeId]: 'save',
                }));

                let saveCompleted = false;
                try {
                        await saveRecipe(recipeId);
                        saveCompleted = true;
                        await removeRecipeFromCurrent(preparingSessionId, recipeId);
                        setRecipeStatuses((prev) => ({
                                ...prev,
                                [recipeId]: 'saved',
                        }));
                        triggerStatusMessage(recipeId);
                        showTemporarySuccess('Recipe saved to your library.');
                } catch (saveError) {
                        console.error('Failed to save recipe option:', saveError);
                        if (saveCompleted) {
                                try {
                                        await unsaveRecipe(recipeId);
                                } catch (undoError) {
                                        console.error('Failed to revert recipe save after error:', undoError);
                                }
                        }
                        try {
                                await addRecipeToCurrent(preparingSessionId, recipeId);
                        } catch (restoreError) {
                                console.error('Failed to restore recipe to current list after save error:', restoreError);
                        }
                        setError('Failed to save recipe. Please try again.');
                } finally {
                        setRecipeActionInProgress((prev) => ({
                                ...prev,
                                [recipeId]: null,
                        }));
                }
        };

        const handleDiscardRecipeOption = async (recipeId) => {
                if (!preparingSessionId || recipeStatuses[recipeId] !== 'pending') {
                        return;
                }

                setError(null);
                setRecipeActionInProgress((prev) => ({
                        ...prev,
                        [recipeId]: 'discard',
                }));
                try {
                        await removeRecipeFromCurrent(preparingSessionId, recipeId);
                        setRecipeStatuses((prev) => ({
                                ...prev,
                                [recipeId]: 'discarded',
                        }));
                        triggerStatusMessage(recipeId);
                } catch (discardError) {
                        console.error('Failed to discard recipe option:', discardError);
                        setError('Failed to discard recipe. Please try again.');
                } finally {
                        setRecipeActionInProgress((prev) => ({
                                ...prev,
                                [recipeId]: null,
                        }));
                }
        };

        const handleUndoRecipeStatus = async (recipeId) => {
                const currentStatus = recipeStatuses[recipeId];
                if (!preparingSessionId || !currentStatus || currentStatus === 'pending') {
                        return;
                }

                clearStatusMessageTimeout(recipeId);
                setError(null);
                setRecipeActionInProgress((prev) => ({
                        ...prev,
                        [recipeId]: 'undo',
                }));

                try {
                        if (currentStatus === 'saved') {
                                await unsaveRecipe(recipeId);
                        }
                        await addRecipeToCurrent(preparingSessionId, recipeId);
                        setRecipeStatuses((prev) => ({
                                ...prev,
                                [recipeId]: 'pending',
                        }));
                        setStatusMessagesVisible((prev) => ({
                                ...prev,
                                [recipeId]: false,
                        }));
                } catch (undoError) {
                        console.error(`Failed to undo ${currentStatus} recipe:`, undoError);
                        setError(`Failed to undo ${currentStatus === 'saved' ? 'save' : 'discard'}. Please try again.`);
                        triggerStatusMessage(recipeId);
                } finally {
                        setRecipeActionInProgress((prev) => ({
                                ...prev,
                                [recipeId]: null,
                        }));
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

        useEffect(() => () => {
                clearAllStatusMessageTimeouts();
        }, [clearAllStatusMessageTimeouts]);

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

        useEffect(() => {
                if (!preparingSessionId || finishingSession) {
                        return;
                }

                const statusValues = Object.values(recipeStatuses);
                if (!statusValues.length) {
                        return;
                }

                const allProcessed = statusValues.every((status) => status !== 'pending');
                if (!allProcessed) {
                        return;
                }

                (async () => {
                        await handleFinishCurrentSession();
                })();
        }, [recipeStatuses, preparingSessionId, finishingSession, handleFinishCurrentSession]);

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
                                                <>
                                                        <RecipeOptionsStep
                                                                recipeOptions={recipeOptions}
                                                                onRecipeSelect={handleRecipeSelect}
                                                                onRegenerate={handleRegenerateRecipes}
                                                                loading={loading}
                                                                onSaveRecipe={handleSaveRecipeOption}
                                                                onDiscardRecipe={handleDiscardRecipeOption}
                                                                recipeStatuses={recipeStatuses}
                                                                recipeActionInProgress={recipeActionInProgress}
                                                                statusMessagesVisible={statusMessagesVisible}
                                                                onUndoStatus={handleUndoRecipeStatus}
                                                                sessionCompleting={finishingSession}
                                                        />
                                                        {imageAnalysis?.imageKey && (
                                                                <div className="mt-8 border border-[#F5F5F5] rounded-2xl bg-[#FFF8F0] overflow-hidden">
                                                                        <button
                                                                                type="button"
                                                                                className="w-full flex justify-between items-center bg-transparent border-none p-5 font-semibold text-base text-[#035035] cursor-pointer text-left hover:bg-[#FFF8F0]/50 transition-colors"
                                                                                onClick={() => setIsImagePanelOpen((prev) => !prev)}
                                                                                aria-expanded={isImagePanelOpen}
                                                                                aria-controls="image-analysis-panel"
                                                                        >
                                                                                <span>Uploaded Image Analysis</span>
                                                                                <svg className={`transition-transform duration-200 ${isImagePanelOpen ? 'rotate-180' : ''}`} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                                                        <path d="M5 8L10 13L15 8" stroke="#035035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                </svg>
                                                                        </button>
                                                                        {isImagePanelOpen && (
                                                                                <div id="image-analysis-panel" className="flex flex-col md:flex-row gap-6 p-5 pt-0 border-t border-[#F0E6D8]">
                                                                                        <div className="flex-1">
                                                                                                <img src={getImageUrl(imageAnalysis.imageKey)} alt="Uploaded ingredients" className="w-full max-h-80 object-cover rounded-xl" loading="lazy" />
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                                <h3 className="text-lg font-semibold text-[#035035] mb-3">Analyzed ingredients</h3>
                                                                                                {analysisLines.length > 1 ? (
                                                                                                        <ul className="list-disc pl-5 space-y-1 text-[#2D2D2D]">
                                                                                                                {analysisLines.map((line, index) => (
                                                                                                                        <li key={`${line}-${index}`}>{line}</li>
                                                                                                                ))}
                                                                                                        </ul>
                                                                                                ) : (
                                                                                                        <p className="text-[#2D2D2D]">{imageAnalysis.analyzedIngredients || 'No analyzed ingredients available.'}</p>
                                                                                                )}
                                                                                        </div>
                                                                                </div>
                                                                        )}
                                                                </div>
                                                        )}
                                                </>
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
