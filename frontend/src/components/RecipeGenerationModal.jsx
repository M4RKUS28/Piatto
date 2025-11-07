import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle } from 'lucide-react';
import {
  generateRecipes,
  getRecipeOptions,
  finishPreparingSession,
  getImageAnalysisBySessionId,
} from '../api/preparingApi';
import { saveRecipe } from '../api/recipeApi';
import ErrorMessage from './ErrorMessage';
import PromptStep from '../pages/app/RecipeGenerationDesktop/PromptStep';
import IngredientsStep from '../pages/app/RecipeGenerationDesktop/IngredientsStep';
import RecipeOptionsStep from '../pages/app/RecipeGenerationDesktop/RecipeOptionsStep';
import { ensureFadeInStyles } from '../pages/app/RecipeGenerationDesktop/fadeInStyles';
import { SESSION_STORAGE_KEY } from '../pages/app/RecipeGenerationDesktop/constants';

export default function RecipeGenerationModal({ isOpen, onClose }) {
  const { t } = useTranslation('recipeGeneration');
  const [currentStep, setCurrentStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [imageKey, setImageKey] = useState('');
  const [inputMethod, setInputMethod] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preparingSessionId, setPreparingSessionId] = useState(null);
  const [recipeOptions, setRecipeOptions] = useState([]);
  const [, setImageAnalysis] = useState(null);
  const [finishingSession, setFinishingSession] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const storeSessionId = useCallback((sessionId) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, String(sessionId));
    } catch (storageError) {
      console.error('Unable to persist preparing session ID:', storageError);
    }
  }, []);

  const clearStoredSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (storageError) {
      console.error('Unable to clear stored preparing session ID:', storageError);
    }
  }, []);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
      setError(null);
    }
  }, []);

  const handleGoBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleFinishCurrentSession = useCallback(async () => {
    if (!preparingSessionId) return;

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
      setError(null);
      setPrompt('');
      setIngredients('');
      setImageKey('');
      setInputMethod('text');
      setCurrentStep(1);

      // Close modal and refresh page
      onClose();
      window.location.reload();
    }
  }, [preparingSessionId, clearStoredSession, onClose]);

  const handleBackToIngredients = useCallback(async () => {
    if (!preparingSessionId) {
      setCurrentStep(2);
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
      setPreparingSessionId(null);
      setRecipeOptions([]);
      setImageAnalysis(null);
      setError(null);
      // Keep prompt, ingredients, imageKey, and inputMethod
      setCurrentStep(2);
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

  const handleGenerateRecipes = async ({ ingredientsOverride, imageKeyOverride, sessionIdOverride } = {}) => {
    if (loading) return;

    const nextIngredients = typeof ingredientsOverride === 'string' ? ingredientsOverride : ingredients;
    const nextImageKey = typeof imageKeyOverride === 'string' ? imageKeyOverride : imageKey;
    const sanitizedIngredients = typeof nextIngredients === 'string' ? nextIngredients.trim() : '';
    const sanitizedImageKey = typeof nextImageKey === 'string' ? nextImageKey.trim() : '';

    setIngredients(sanitizedIngredients);
    setImageKey(sanitizedImageKey);
    setError(null);
    const hasUploadedImage = sanitizedImageKey.length > 0;
    if (!hasUploadedImage) {
      setImageAnalysis(null);
    }

    setRecipeOptions([
      { id: -1, title: '', description: '' },
      { id: -2, title: '', description: '' },
      { id: -3, title: '', description: '' },
    ]);
    goToStep(3);

    try {
      setLoading(true);
      const sessionIdForRequest = typeof sessionIdOverride === 'number' ? sessionIdOverride : preparingSessionId;
      const sessionId = await generateRecipes(
        prompt,
        sanitizedIngredients,
        sanitizedImageKey,
        sessionIdForRequest
      );
      setPreparingSessionId(sessionId);
      storeSessionId(sessionId);

      await handleGetRecipeOptions(sessionId, false);

      if (hasUploadedImage) {
        handleFetchImageAnalysis(sessionId).catch(err => {
          console.error('Background image analysis fetch failed:', err);
        });
      }
    } catch (generationError) {
      console.error('Recipe generation failed:', generationError);
      let errorMessage = t('errors.generateFailed', 'Failed to generate recipes. Please try again.');
      if (!generationError.response) {
        errorMessage = t('errors.networkError', 'Network error. Please check your connection.');
      } else if (generationError.response.status >= 500) {
        errorMessage = t('errors.serverError', 'Server error. Please try again later.');
      } else if (generationError.response.status === 404) {
        errorMessage = t('errors.notFound', 'Resource not found. Please try again.');
      } else if (generationError.response.status === 429) {
        errorMessage = t('errors.tooManyRequests', 'Too many requests. Please wait a moment.');
      } else if (generationError.response.status === 400) {
        errorMessage = t('errors.invalidRequest', 'Invalid request. Please check your inputs.');
      }

      setRecipeOptions([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecipeOptions = useCallback(async (sessionId, shouldNavigate = true) => {
    try {
      const options = await getRecipeOptions(sessionId);
      setRecipeOptions(options);
      if (shouldNavigate) {
        goToStep(3);
      }
    } catch (optionsError) {
      console.error('Failed to get recipe options:', optionsError);
      let errorMessage = t('errors.loadOptionsFailed', 'Failed to load recipe options. Please try again.');
      if (!optionsError.response) {
        errorMessage = t('errors.networkError', 'Network error. Please check your connection.');
      } else if (optionsError.response.status >= 500) {
        errorMessage = t('errors.serverError', 'Server error. Please try again later.');
      } else if (optionsError.response.status === 404) {
        errorMessage = t('errors.optionsNotFound', 'Recipe options not found. Please generate again.');
      } else if (optionsError.response.status === 429) {
        errorMessage = t('errors.tooManyRequests', 'Too many requests. Please wait a moment.');
      } else if (optionsError.response.status === 400) {
        errorMessage = t('errors.invalidRequest', 'Invalid request. Please check your inputs.');
      }
      setRecipeOptions([]);
      setError(errorMessage);
    }
  }, [goToStep, t]);

  const handleSaveRecipeOption = async (recipeId) => {
    setError(null);
    try {
      await saveRecipe(recipeId);
      // After saving, finish the session and close modal
      await handleFinishCurrentSession();
    } catch (saveError) {
      console.error('Failed to save recipe option:', saveError);
      setError(t('errors.saveFailed', 'Failed to save recipe. Please try again.'));
      throw saveError;
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGenerateRecipes();
  };

  const handleRegenerateRecipes = async (sessionIdOverride) => {
    await handleGenerateRecipes({
      sessionIdOverride: typeof sessionIdOverride === 'number' ? sessionIdOverride : preparingSessionId,
    });
  };

  const handleCloseAttempt = () => {
    // If we're in step 3 (recipe options), show confirmation
    if (currentStep === 3 && preparingSessionId) {
      setShowConfirmClose(true);
    } else {
      // For steps 1 and 2, just close without confirmation
      onClose();
    }
  };

  const handleConfirmClose = async () => {
    setShowConfirmClose(false);
    setIsClosing(true);
    if (preparingSessionId) {
      try {
        await finishPreparingSession(preparingSessionId);
        clearStoredSession();
      } catch (error) {
        console.error('Failed to finish session on close:', error);
      }
    }
    // Reset state
    setPreparingSessionId(null);
    setRecipeOptions([]);
    setImageAnalysis(null);
    setError(null);
    setPrompt('');
    setIngredients('');
    setImageKey('');
    setInputMethod('text');
    setCurrentStep(1);
    setIsClosing(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  useEffect(() => {
    ensureFadeInStyles();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined') return;

    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedSessionId) return;

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
        setError(t('errors.restoreFailed', 'Failed to restore your previous session. Please generate recipes again.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, clearStoredSession, handleGetRecipeOptions, handleFetchImageAnalysis, t]);

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseAttempt}
        />

        {/* Loading Overlay when closing */}
        {isClosing && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-[#035035] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-semibold text-[#035035]">
                {t('modal.closing', 'Closing...')}
              </p>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="relative rounded-3xl shadow-2xl w-[80%] h-[95%] overflow-hidden flex flex-col bg-gradient-to-br from-[#F9F6F1] via-[#FDFCFA] to-[#F5F0E8]">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, #8B7355 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}></div>

          {/* Header */}
          <div className="relative flex items-center justify-between p-6 border-b border-[#E8DFD0] flex-shrink-0 bg-[#F5EFE6]/80 backdrop-blur-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#035035]">
              {t('modal.title', 'Generate New Recipe')}
            </h2>
            <button
              onClick={handleCloseAttempt}
              className="text-[#2D2D2D] hover:text-[#035035] transition-colors text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              aria-label={t('modal.close', 'Close')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="relative flex-1 flex flex-col p-6 overflow-hidden">
            <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
              {/* Step Indicators */}
              {currentStep !== 3 && (
                <div className="space-y-4 mb-6 flex-shrink-0">
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all ${currentStep === step
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
                            className={`w-12 sm:w-16 h-1 mx-2 transition-all ${currentStep > step ? 'bg-[#A8C9B8]' : 'bg-[#F5F5F5]'}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-xs sm:text-sm text-[#2D2D2D] opacity-60">
                    {currentStep === 1 && t('steps.step1', 'Step 1: What do you want to cook?')}
                    {currentStep === 2 && t('steps.step2', 'Step 2: What ingredients do you have?')}
                    {currentStep === 3 && t('steps.step3', 'Step 3: Choose your recipe')}
                  </div>
                </div>
              )}

              {/* Steps Content */}
              <div className="flex-1 flex flex-col min-h-0">
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
                  onBack={handleBackToIngredients}
                />
              )}

              {currentStep === 3 && error && (
                <div className="my-6" role="alert" aria-live="assertive">
                  <ErrorMessage message={error} onRetry={handleRetry} />
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for closing in Step 3 */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={handleCancelClose}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#035035] mb-2">
                  {t('confirmClose.title', 'Cancel Recipe Generation?')}
                </h3>
                <p className="text-[#2D2D2D] opacity-80 mb-6">
                  {t('confirmClose.message', 'Are you sure you want to cancel? Your current recipe options will be lost.')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelClose}
                    className="flex-1 px-4 py-3 rounded-full border-2 border-[#F5F5F5] text-[#2D2D2D] font-semibold hover:bg-[#F5F5F5] transition-all"
                  >
                    {t('confirmClose.keep', 'Keep Working')}
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    className="flex-1 px-4 py-3 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all"
                  >
                    {t('confirmClose.cancel', 'Yes, Cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
