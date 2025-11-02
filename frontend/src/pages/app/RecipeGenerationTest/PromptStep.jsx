import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Clock, Heart, Salad, Soup, Cake } from 'lucide-react';

export default function PromptStep({ onSubmit, initialValue = '', loading = false }) {
	const { t } = useTranslation('recipeGeneration');
	const [promptText, setPromptText] = useState(initialValue);
	const [validationError, setValidationError] = useState('');

	const validatePrompt = (value) => {
		if (!value || value.trim().length === 0) {
			return t('prompt.validation.empty', 'Please tell us what you want to cook');
		}
		if (value.trim().length < 3) {
			return t('prompt.validation.tooShort', 'Please enter at least 3 characters');
		}
		return '';
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		const error = validatePrompt(promptText);
		if (error) {
			setValidationError(error);
			return;
		}

		setValidationError('');
		onSubmit(promptText.trim());
	};

	const handleInputChange = (event) => {
		setPromptText(event.target.value);
		if (validationError) {
			setValidationError('');
		}
	};

	const examplePrompts = [
		{ text: 'Quick & Easy Pasta', icon: Clock, color: 'bg-gradient-to-br from-[#FF9B7B] to-[#FF8B6B]' },
		{ text: 'Healthy Dinner', icon: Salad, color: 'bg-gradient-to-br from-[#A8C9B8] to-[#8BB9A8]' },
		{ text: 'Comfort Food', icon: Heart, color: 'bg-gradient-to-br from-[#FFB88C] to-[#FFA86C]' },
		{ text: 'Vegetarian Meal', icon: Salad, color: 'bg-gradient-to-br from-[#9DC88D] to-[#7DB87D]' },
		{ text: 'Warming Soup', icon: Soup, color: 'bg-gradient-to-br from-[#F4A261] to-[#E76F51]' },
		{ text: 'Sweet Dessert', icon: Cake, color: 'bg-gradient-to-br from-[#FF8FA3] to-[#FF6B85]' },
	];

	const handleExampleClick = (example) => {
		setPromptText(example);
		if (validationError) {
			setValidationError('');
		}
	};

	return (
		<div className="space-y-6">
			<h2 className="text-2xl sm:text-3xl font-bold text-[#035035] text-center">
				{t('prompt.title', 'What do you want to cook today?')}
			</h2>
			<p className="text-sm sm:text-base text-center text-[#2D2D2D] opacity-70">
				{t('prompt.subtitle', 'Describe what you\'re in the mood for, and we\'ll help you create the perfect recipe')}
			</p>

			<form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6" aria-label="Recipe prompt form">
				{/* Example Prompts */}
				<div className="flex flex-wrap gap-2 justify-center">
					{examplePrompts.map((example, index) => {
						const Icon = example.icon;
						return (
							<button
								key={index}
								type="button"
								onClick={() => handleExampleClick(example.text)}
								disabled={loading}
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
					<div className="absolute -top-1 -left-1 w-full h-full bg-gradient-to-br from-[#FF9B7B]/20 to-[#A8C9B8]/20 rounded-xl blur-xl -z-10"></div>
					<label htmlFor="prompt-input" className="block text-sm font-medium text-[#2D2D2D] mb-2 flex items-center gap-2">
						<Sparkles className="w-4 h-4 text-[#FF9B7B]" />
						{t('prompt.label', 'What do you want to cook?')}
					</label>
					<textarea
						id="prompt-input"
						value={promptText}
						onChange={handleInputChange}
						placeholder={t('prompt.placeholder', 'e.g., Something healthy for dinner, Quick pasta dish, Comfort food...')}
						disabled={loading}
						rows={4}
						className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none font-['Inter'] text-base bg-white
							${validationError ? 'border-[#D96332] focus:border-[#D96332]' : 'border-[#F5F5F5] focus:border-[#035035]'}
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
							className="mt-2 text-sm text-[#D96332]"
							role="alert"
							aria-live="polite"
						>
							{validationError}
						</p>
					)}
				</div>

				<div className="flex flex-col sm:flex-row justify-center">
					<button
						type="submit"
						disabled={loading}
						className="w-full sm:w-auto bg-[#035035] text-white px-8 py-3 rounded-full font-semibold text-base
							hover:scale-105 active:scale-95 transition-all duration-200 text-center shadow-lg
							disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
							focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
							min-w-[120px]
						"
						aria-label="Proceed to ingredients step"
					>
						{loading ? t('prompt.loading', 'Loading...') : t('prompt.next', 'Next')}
					</button>
				</div>
			</form>
		</div>
	);
}
