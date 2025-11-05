import { useState } from 'react';
import { useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Carrot } from 'lucide-react';
import axios from 'axios';

export default function IngredientsStep({
	onSubmit,
	onBack,
	initialIngredients = '',
	loading = false,
}) {
	const { t } = useTranslation('recipeGeneration');
	const { user } = useAuth();
	const [ingredientsText, setIngredientsText] = useState(initialIngredients);
	const [analyzing, setAnalyzing] = useState(false);
	const [validationError, setValidationError] = useState('');
	const [showPopup, setShowPopup] = useState(false);
	const popupTimeoutRef = useRef(null);

	const validateIngredients = () => {
		// Allow empty textarea
		if (ingredientsText && ingredientsText.trim().length > 0 && ingredientsText.trim().length < 3) {
			return t('ingredients.validation.tooShort', 'Please enter at least 3 characters');
		}
		return '';
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		const error = validateIngredients();
		if (error) {
			setValidationError(error);
			return;
		}

		setValidationError('');
		onSubmit(ingredientsText.trim(), '');
	};

	const handleTextChange = (event) => {
		setIngredientsText(event.target.value);
		if (validationError) {
			setValidationError('');
		}
	};


	return (
		<div className="flex flex-col h-full relative">
			{/* Subtle background decoration */}
			<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-[#A8C9B8]/8 to-transparent rounded-full blur-3xl"></div>
				<div className="absolute bottom-20 right-10 w-[32rem] h-[32rem] bg-gradient-to-br from-[#FF9B7B]/8 to-transparent rounded-full blur-3xl"></div>
				<div className="absolute top-1/2 right-1/4 w-[40rem] h-[40rem] bg-gradient-to-br from-[#FFD88C]/6 to-transparent rounded-full blur-3xl"></div>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col h-full" aria-label={t('ingredients.aria.form', 'Ingredients input form')}>
				<div className="flex-1 overflow-y-auto pr-2">
					<div className="space-y-6 max-w-2xl mx-auto">
						<h2 className="text-2xl sm:text-3xl font-bold text-[#035035] text-center tracking-tight">
							{t('ingredients.title', 'What ingredients do you have?')}
						</h2>
						<p className="text-sm sm:text-base text-center text-[#2D2D2D] opacity-70 font-medium">
							{t('ingredients.subtitle', 'Tell us what\'s in your kitchen. You can also analyze a photo to extract ingredients.')}
						</p>

						{/* AI Image Analysis Box */}
						<div className="relative">
							<input
								id="image-upload"
								type="file"
								accept="image/*"
								style={{ display: 'none' }}
								onChange={async (event) => {
									const file = event.target.files?.[0];
									if (!file) return;
									if (!user?.id) {
										setValidationError(t('ingredients.validation.notLoggedIn', 'You must be logged in to analyze an image'));
										return;
									}
									setValidationError('');
									setAnalyzing(true);
									try {
										const formData = new FormData();
										formData.append('file', file);
										// You may need to adjust the API base URL
										const response = await axios.post('/api/preparing/image-analysis', formData, {
											headers: {
												'Content-Type': 'multipart/form-data',
											},
										});
										const result = response.data;
										if (
											(typeof result === 'string' && (result.trim().toLowerCase() === 'none' || result.trim().toUpperCase() === 'NONE')) ||
											(Array.isArray(result) && result.length === 0)
										) {
											setShowPopup(true);
											if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
											popupTimeoutRef.current = setTimeout(() => setShowPopup(false), 3000);
										} else if (typeof result === 'string' && result.length > 0) {
											setIngredientsText((prev) => prev ? prev + ', ' + result : result);
										} else if (Array.isArray(result)) {
											setIngredientsText((prev) => prev ? prev + ', ' + result.join(', ') : result.join(', '));
										} else {
											setValidationError(t('ingredients.validation.noIngredients', 'Image analysis did not return ingredients'));
										}
									} catch {
										setValidationError(t('ingredients.validation.imageAnalysisFailed', 'Image analysis failed. Please try again.'));
									} finally {
										setAnalyzing(false);
									}
								}}
								disabled={loading || analyzing}
							/>
							<button
								type="button"
								onClick={() => document.getElementById('image-upload')?.click()}
								disabled={loading || analyzing}
								className="w-full bg-white border-3 border-dashed border-[#A8C9B8] rounded-xl px-6 py-3 hover:border-[#035035] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2 min-h-[100px]"
								aria-label={t('ingredients.aria.analyzeImage', 'Analyze image to extract ingredients')}
							>
								<div className="flex items-center justify-center gap-4 h-full">
									{analyzing ? (
										<svg className="w-10 h-10 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<circle cx="12" cy="12" r="10" stroke="#A8C9B8" strokeWidth="4" fill="none" />
										</svg>
									) : (
										<div className="w-12 h-12 flex items-center justify-center bg-[#035035] rounded-full flex-shrink-0">
											<img
												src="/wired-outline-61-camera-in-reveal.gif"
												alt="Camera animation"
												className="w-8 h-8"
											/>
										</div>
									)}
									<div className="text-left flex-1 py-6">
										<p className="text-base font-bold text-[#035035] mb-0.5">
											{analyzing ? t('ingredients.analyzing', 'Analyzing image...') : t('ingredients.analyzeImage', 'Analyze Image')}
										</p>
										<p className="text-xs text-[#2D2D2D]/70 font-medium">
											{t('ingredients.aiAnalysisDescription', 'Analyze your pantry or fridge with AI')}
										</p>
									</div>
								</div>
							</button>
						</div>

						{/* Divider */}
						<div className="flex items-center justify-center my-6">
							<div className="flex-1 border-t-2 border-dashed border-[#FF9B7B]"></div>
							<span className="px-4 text-sm text-[#2D2D2D]/50 font-medium">OR</span>
							<div className="flex-1 border-t-2 border-dashed border-[#FF9B7B]"></div>
						</div>

						{/* Ingredients Input */}
						<div className="relative">
							<div className="absolute -top-1 -left-1 w-full h-full bg-gradient-to-br from-[#A8C9B8]/20 to-[#FF9B7B]/20 rounded-xl blur-xl -z-10"></div>
							<label htmlFor="ingredients-input" className="block text-xs sm:text-sm font-semibold text-[#2D2D2D] mb-3 flex items-center gap-2">
								<Carrot className="w-4 h-4 text-[#A8C9B8]" />
								{t('ingredients.label', 'Enter your ingredients')}
							</label>
							<div className="relative">
								<textarea
									id="ingredients-input"
									value={ingredientsText}
									onChange={handleTextChange}
									placeholder={t('ingredients.placeholder', 'Enter your ingredients, separated by commas...')}
									disabled={loading || analyzing}
									rows={4}
									className={`w-full px-5 py-4 pr-12 rounded-xl border-2 transition-all resize-vertical text-base min-h-[100px] bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#2D2D2D]/40 ${validationError ? 'border-[#FF9B7B] focus:border-[#FF9B7B]' : 'border-[#F5F5F5] focus:border-[#035035]'}`}
									style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
									aria-invalid={validationError ? 'true' : 'false'}
									aria-describedby={validationError ? 'ingredients-error' : undefined}
									aria-label={t('ingredients.aria.ingredientsInput', 'List of ingredients you have available')}
								/>
								{analyzing && (
									<div
										className="absolute pointer-events-none flex flex-col gap-2"
										style={{
											left: '16px',
											top: ingredientsText.trim() ? `${12 + (ingredientsText.split('\n').length * 24)}px` : '12px',
											width: 'calc(100% - 64px)',
										}}
									>
										<div className="h-5 rounded-md bg-gray-200 relative overflow-hidden">
											<div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%]" />
										</div>
										<div className="h-5 rounded-md bg-gray-200 relative overflow-hidden">
											<div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: '0.1s' }} />
										</div>
										<div className="h-5 rounded-md bg-gray-200 relative overflow-hidden" style={{ width: '60%' }}>
											<div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: '0.2s' }} />
										</div>
									</div>
								)}
								{showPopup && (
									<div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-[#FF9B7B] text-white px-4 py-2 rounded shadow-lg z-10 animate-fade-in">
										{t('ingredients.noIngredientsDetected', 'No ingredients detected in image.')}
									</div>
								)}
							</div>
						</div>

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
					</div>
				</div>

				<div className="flex-shrink-0 flex flex-col sm:flex-row justify-center gap-3 pt-3 border-t border-gray-200 mt-3">
					<button
						type="button"
						onClick={onBack}
						disabled={loading || analyzing}
						className="w-full sm:w-auto bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold text-base
							hover:bg-[#035035] hover:text-white transition-all duration-200
							disabled:opacity-50 disabled:cursor-not-allowed
							focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
							min-w-[120px]"
						aria-label={t('ingredients.aria.back', 'Go back to prompt step')}
					>
						{t('ingredients.back', 'Back')}
					</button>
					<button
						type="submit"
						disabled={loading || analyzing}
						className="w-full sm:w-auto bg-[#035035] text-white px-6 py-3 rounded-full font-semibold text-base
							hover:scale-105 active:scale-95 transition-all duration-200
							disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
							focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
							min-w-[160px]"
						aria-label={t('ingredients.aria.submit', 'Generate recipe options based on your ingredients')}
					>
						{loading ? t('ingredients.generating', 'Generating...') : analyzing ? t('ingredients.analyzing', 'Analyzing image...') : t('ingredients.generateRecipes', 'Generate Recipes')}
					</button>
				</div>
			</form>
		</div>
	);
}
