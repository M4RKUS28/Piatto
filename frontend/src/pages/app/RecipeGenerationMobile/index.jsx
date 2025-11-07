import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation('recipeGeneration');
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
	const [preparingSessionId, setPreparingSessionId] = useState(null);
	const [recipeOptions, setRecipeOptions] = useState([]);
	const [, setImageAnalysis] = useState(null);
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
			setError(null);
			setPrompt('');
			setIngredients('');
			setImageKey('');
			setInputMethod('text');
			setCurrentStep(1);

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
		if (loading) {
			return;
		}

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
			console.error('Error details:', {
				message: generationError.message,
				response: generationError.response,
				status: generationError.response?.status,
				data: generationError.response?.data,
				stack: generationError.stack,
			});

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
			console.log('!!!Fetching recipe options for session:', sessionId);
			const options = await getRecipeOptions(sessionId);
			console.log('!!!Received recipe options:', options);
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

			if (collectionContext?.collectionId) {
				try {
					const collection = await getCollectionById(collectionContext.collectionId);
					const existingRecipeIds = collection.recipes.map(r => r.id);
					const updatedRecipeIds = [...existingRecipeIds, recipeId];
					await updateCollectionRecipes(collectionContext.collectionId, updatedRecipeIds);
					navigate(`/app/collection/${collectionContext.collectionId}`);
				} catch (collectionError) {
					console.error('Failed to add recipe to collection:', collectionError);
					setError(t('errors.savedButCollectionFailed', 'Recipe saved, but failed to add to collection.'));
				}
			}
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
				setError(t('errors.restoreFailed', 'Failed to restore your previous session. Please generate recipes again.'));
			} finally {
				setLoading(false);
			}
		})();
	}, [clearStoredSession, handleGetRecipeOptions, handleFetchImageAnalysis, t]);


	return (
		<div className="min-h-screen p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
				{/* Collection Context Banner */}
				{collectionContext?.collectionName && (
					<div className="p-4 sm:p-5 bg-[#035035] bg-opacity-10 border border-[#035035] border-opacity-20 rounded-xl">
						<p className="text-sm sm:text-base text-[#035035] text-center">
							<span className="font-semibold">{t('collectionBanner.generatingFor', 'Generating recipe for:')}</span> {collectionContext.collectionName}
						</p>
					</div>
				)}

				<div className="space-y-4">
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

				<div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 sm:p-6 lg:p-8">
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
				</div>
			</div>
		</div>
	);
}
