import './RecipePreviewCard.css';
import { getImageUrl } from '../utils/imageUtils';
import { useTranslation } from 'react-i18next';

/**
 * RecipePreviewCard component displays a preview of a recipe option
 * with image, title, and description. Follows Piattio design system.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.recipe - Recipe object containing id, title, description, image_url
 * @param {Function} props.onClick - Callback function when card is clicked
 */
const RecipePreviewCard = ({ recipe, onClick }) => {
        const { t } = useTranslation('recipe');
        const handleClick = () => {
                if (onClick) {
                        onClick(recipe.id);
                }
        };

        const handleKeyDown = (e) => {
                // Handle Enter and Space key for accessibility
                if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                }
        };

        return (
                <div
                        className="recipe-preview-card"
                        onClick={handleClick}
                        onKeyDown={handleKeyDown}
                        role="button"
                        tabIndex={0}
                        aria-label={t('preview.ariaLabel', {
                                title: recipe.title,
                                description: recipe.description,
                                defaultValue: `Select recipe: ${recipe.title}. ${recipe.description ?? ''}`,
                        })}
                >
                        <img
                                src={getImageUrl(recipe.image_url)}
                                alt={t('preview.imageAlt', {
                                        title: recipe.title,
                                        defaultValue: `${recipe.title} - Recipe preview image`,
                                })}
                                className="recipe-preview-card__image"
                                loading="lazy"
                        />
                        <div className="recipe-preview-card__content">
                                <h3 className="recipe-preview-card__title">{recipe.title}</h3>
                                <p className="recipe-preview-card__description">{recipe.description}</p>
                        </div>
                </div>
        );
};

export default RecipePreviewCard;
