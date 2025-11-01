import { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './LoadingSpinner';
import { getImageUrl } from '../utils/imageUtils';

export default function RecipeDetailsModal({
	isOpen,
	onClose,
	recipe,
	isLoading = false,
	error = null,
	onRetry,
}) {
	const { t } = useTranslation('recipeGeneration');

	useEffect(() => {
		if (!isOpen) {
			return undefined;
		}

		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				onClose?.();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose]);

	const ingredients = recipe?.ingredients ?? [];
	const importantNotes = recipe?.important_notes ?? '';
	const overviewRaw = recipe?.cooking_overview ?? '';

	const overviewItems = useMemo(() => {
		if (!overviewRaw) {
			return [];
		}

		if (overviewRaw.includes('\n')) {
			return overviewRaw.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
		}

		if (overviewRaw.includes('•')) {
			return overviewRaw.split('•').map(item => item.trim()).filter(Boolean);
		}

		const periodSplit = overviewRaw
			.split(/\.(?![^()]*\))/)
			.map(item => item.replace(/\.+$/u, '').trim())
			.filter(Boolean);
		if (periodSplit.length > 1) {
			return periodSplit;
		}

		const commaSplit = overviewRaw.split(/[,;]+/).map(item => item.trim()).filter(Boolean);
		if (commaSplit.length > 1) {
			return commaSplit;
		}

		return [overviewRaw.trim()].filter(Boolean);
	}, [overviewRaw]);

	const handleOverlayClick = (event) => {
		if (event.target === event.currentTarget) {
			onClose?.();
		}
	};

	const formatIngredientAmount = (ingredient) => {
		const { quantity, unit } = ingredient ?? {};
		if (quantity != null && unit) {
			return `${quantity} ${unit}`;
		}
		if (quantity != null) {
			return `${quantity}`;
		}
		if (unit) {
			return unit;
		}
		return '';
	};

	const showImage = Boolean(recipe?.image_url);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
			onClick={handleOverlayClick}
			role="dialog"
			aria-modal="true"
			aria-label={recipe?.title || t('options.details.title', 'Recipe details')}
		>
			<div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={event => event.stopPropagation()}>
				<div className="flex flex-col sm:flex-row">
					{showImage && (
						<div className="sm:w-1/3 bg-[#F5F5F5] flex items-center justify-center">
							<img
								src={getImageUrl(recipe.image_url)}
								alt={recipe?.title || t('options.details.title', 'Recipe details')}
								className="w-full h-48 sm:h-full object-cover"
							/>
						</div>
					)}
					<div className={`flex-1 p-6 sm:p-8 ${showImage ? '' : ''}`}>
						<div className="flex items-start justify-between gap-4 mb-4">
							<div className="space-y-1">
								<h2 className="text-xl sm:text-2xl font-bold text-[#035035]">
									{recipe?.title || t('options.details.title', 'Recipe details')}
								</h2>
								{recipe?.description && (
									<p className="text-sm sm:text-base text-[#2D2D2D] opacity-70 leading-relaxed">
										{recipe.description}
									</p>
								)}
							</div>
							<button
								type="button"
								onClick={() => onClose?.()}
								className="p-2 rounded-full text-[#2D2D2D] hover:bg-[#F5F5F5] transition-colors"
								aria-label={t('options.details.close', 'Close')}
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-6">
							{isLoading && (
								<div className="flex flex-col items-center justify-center py-8">
									<LoadingSpinner size="large" />
									<p className="mt-3 text-sm text-[#2D2D2D] opacity-70 text-center">
										{t('options.details.loading', 'Loading recipe details...')}
									</p>
								</div>
							)}

							{!isLoading && error && (
								<div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
									<p className="text-sm mb-3">{error}</p>
									{onRetry && (
										<button
											type="button"
											onClick={() => onRetry?.()}
											className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
										>
											{t('options.details.retry', 'Retry')}
										</button>
									)}
								</div>
							)}

							{!isLoading && !error && (
								<div className="space-y-6">
									<section>
										<h3 className="text-base font-semibold text-[#035035] mb-3">
											{t('options.details.ingredients', 'Ingredients')}
										</h3>
										{ingredients.length > 0 ? (
											<ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
												{ingredients.map((ingredient, index) => (
													<li key={ingredient.id ?? `${ingredient.name}-${index}`} className="flex items-start justify-between gap-3 text-sm text-[#2D2D2D]">
														<span className="font-medium text-[#035035]">
															{ingredient.name}
														</span>
														<span className="text-right whitespace-nowrap text-[#2D2D2D] opacity-70">
															{formatIngredientAmount(ingredient)}
														</span>
													</li>
												))}
											</ul>
										) : (
											<p className="text-sm text-[#2D2D2D] opacity-70">
												{t('options.details.noIngredients', 'No ingredients available.')}
											</p>
										)}
									</section>

									<section>
										<h3 className="text-base font-semibold text-[#035035] mb-2">
											{t('options.details.importantNotes', 'Important notes')}
										</h3>
										<p className="text-sm text-[#2D2D2D] leading-relaxed whitespace-pre-line bg-[#F5F5F5] rounded-2xl p-4">
											{importantNotes}
										</p>
									</section>

									<section>
										<h3 className="text-base font-semibold text-[#035035] mb-2">
											{t('options.details.cookingOverview', 'Cooking overview')}
										</h3>
										{overviewItems.length > 1 ? (
											<ol className="list-decimal list-inside space-y-1 text-sm text-[#2D2D2D]">
												{overviewItems.map((item, index) => (
													<li key={`${item}-${index}`}>{item}</li>
												))}
											</ol>
										) : (
											<p className="text-sm text-[#2D2D2D] leading-relaxed whitespace-pre-line">
												{overviewItems[0] || overviewRaw}
											</p>
										)}
									</section>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
