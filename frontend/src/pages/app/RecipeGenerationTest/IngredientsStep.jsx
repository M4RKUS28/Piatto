import { useState } from 'react';
import { useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Drumstick, Carrot, Milk, Beef, Pizza, Egg } from 'lucide-react';
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

	const exampleIngredients = [
		{ text: 'Chicken, Rice, Vegetables', icon: Drumstick, color: 'bg-gradient-to-br from-[#FFB88C] to-[#FFA86C]' },
		{ text: 'Pasta, Tomatoes, Garlic', icon: Pizza, color: 'bg-gradient-to-br from-[#FF9B7B] to-[#FF8B6B]' },
		{ text: 'Eggs, Flour, Milk', icon: Egg, color: 'bg-gradient-to-br from-[#F4E4C1] to-[#E9D4A1]' },
		{ text: 'Beef, Potatoes, Onions', icon: Beef, color: 'bg-gradient-to-br from-[#D4846A] to-[#C4745A]' },
		{ text: 'Tofu, Vegetables, Soy Sauce', icon: Carrot, color: 'bg-gradient-to-br from-[#A8C9B8] to-[#8BB9A8]' },
		{ text: 'Cheese, Bread, Butter', icon: Milk, color: 'bg-gradient-to-br from-[#FFD88C] to-[#FFC86C]' },
	];

	const handleExampleClick = (example) => {
		setIngredientsText(example);
		if (validationError) {
			setValidationError('');
		}
	};


	return (
		<div className="space-y-6">
			<h2 className="text-2xl sm:text-3xl font-bold text-[#035035] text-center">
				{t('ingredients.title', 'What ingredients do you have?')}
			</h2>
			<p className="text-sm sm:text-base text-center text-[#2D2D2D] opacity-70">
				{t('ingredients.subtitle', 'Tell us what\'s in your kitchen. You can also analyze a photo to extract ingredients.')}
			</p>

			<form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6" aria-label={t('ingredients.aria.form', 'Ingredients input form')}>
				{/* Example Ingredients */}
				<div className="flex flex-wrap gap-2 justify-center">
					{exampleIngredients.map((example, index) => {
						const Icon = example.icon;
						return (
							<button
								key={index}
								type="button"
								onClick={() => handleExampleClick(example.text)}
								disabled={loading || analyzing}
								className={`${example.color} text-white px-4 py-2 rounded-full font-medium text-sm
									hover:scale-105 active:scale-95 transition-all duration-200 shadow-md
									disabled:opacity-50 disabled:cursor-not-allowed
									flex items-center gap-2
								`}
							>
								<Icon className="w-4 h-4" />
								<span>{example.text}</span>
							</button>
						);
					})}
				</div>

				<div className="relative">
					<div className="absolute -top-1 -left-1 w-full h-full bg-gradient-to-br from-[#A8C9B8]/20 to-[#FF9B7B]/20 rounded-xl blur-xl -z-10"></div>
					<label htmlFor="ingredients-input" className="block text-xs sm:text-sm font-medium text-[#2D2D2D] mb-2 flex items-center gap-2">
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
							rows={6}
							className={`w-full px-3 sm:px-4 py-3 pr-12 rounded-xl border-2 transition-all resize-vertical font-['Inter'] text-sm sm:text-base min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${validationError ? 'border-[#FF9B7B] focus:border-[#FF9B7B]' : 'border-[#F5F5F5] focus:border-[#035035]'}`}
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
							className="absolute bottom-3 left-3 bg-[#035035] rounded-full px-3 py-2 shadow-md hover:bg-[#046a47] focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							aria-label={t('ingredients.aria.analyzeImage', 'Analyze image to extract ingredients')}
						>
							{analyzing ? (
								<svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="10" stroke="#A8C9B8" strokeWidth="4" fill="none" />
								</svg>
							) : (
								<>
									<img src="/wired-outline-61-camera-in-reveal.gif" alt="Upload ingredients image" className="w-6 h-6" />
									<span className="text-white font-semibold text-xs sm:text-sm">{t('ingredients.analyzeImage', 'Analyze Image')}</span>
								</>
							)}
						</button>
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

				<div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
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
