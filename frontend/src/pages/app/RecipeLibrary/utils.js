import { Wine, CupSoda } from 'lucide-react';
import { PiLeaf, PiEgg, PiCow } from 'react-icons/pi';

// Helper function to get food category display (icon and label)
export const getFoodCategoryDisplay = (category, t) => {
  if (!category) return null;

  const normalized = category.toLowerCase().replace(/_/g, '-');

  if (normalized === 'vegan') {
    return { icon: PiLeaf, label: t('foodCategory.vegan', { ns: 'common', defaultValue: 'Vegan' }) };
  }
  if (normalized === 'vegetarian') {
    return { icon: PiEgg, label: t('foodCategory.vegetarian', { ns: 'common', defaultValue: 'Vegetarian' }) };
  }

  if (normalized === 'alcoholic') {
    return { icon: Wine, label: t('foodCategory.alcoholic', { ns: 'common', defaultValue: 'Alcoholic' }) };
  }

  if (normalized === 'non-alcoholic') {
    return { icon: CupSoda, label: t('foodCategory.nonAlcoholic', { ns: 'common', defaultValue: 'Non-alcoholic' }) };
  }

  // Meat categories
  const meatLabels = {
    'beef': t('foodCategory.beef', { ns: 'common', defaultValue: 'Beef' }),
    'pork': t('foodCategory.pork', { ns: 'common', defaultValue: 'Pork' }),
    'chicken': t('foodCategory.chicken', { ns: 'common', defaultValue: 'Chicken' }),
    'lamb': t('foodCategory.lamb', { ns: 'common', defaultValue: 'Lamb' }),
    'fish': t('foodCategory.fish', { ns: 'common', defaultValue: 'Fish' }),
    'seafood': t('foodCategory.seafood', { ns: 'common', defaultValue: 'Seafood' }),
    'mixed-meat': t('foodCategory.mixedMeat', { ns: 'common', defaultValue: 'Mixed Meat' }),
  };

  if (meatLabels[normalized]) {
    return { icon: PiCow, label: meatLabels[normalized] };
  }

  return null;
};

// Helper function to format difficulty
export const formatDifficulty = (difficulty, t) => {
  if (!difficulty) return t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' });
  const lowerDifficulty = difficulty.toLowerCase();

  if (lowerDifficulty === 'easy') return t('difficulty.easy', { ns: 'common', defaultValue: 'Easy' });
  if (lowerDifficulty === 'medium') return t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' });
  if (lowerDifficulty === 'hard') return t('difficulty.hard', { ns: 'common', defaultValue: 'Hard' });

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

// Helper function to get difficulty color classes
export const getDifficultyColorClasses = (difficulty) => {
  const lowerDifficulty = difficulty?.toLowerCase();

  switch (lowerDifficulty) {
    case 'easy':
      return 'text-green-600 bg-green-600/10';
    case 'medium':
      return 'text-orange-500 bg-orange-500/10';
    case 'hard':
      return 'text-orange-700 bg-orange-700/10';
    default:
      return 'text-orange-500 bg-orange-500/10'; // Default to medium
  }
};

// Helper function to format time
export const formatTime = (minutes) => {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};
