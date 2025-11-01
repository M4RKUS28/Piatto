import { Clock } from 'lucide-react';
import { PiLeaf, PiEgg, PiCow } from 'react-icons/pi';

export const getFoodCategoryDisplay = (category, t) => {
  if (!category) return null;

  const normalized = category.toLowerCase();

  if (normalized === 'vegan') {
    return {
      icon: PiLeaf,
      label: t('foodCategory.vegan', { ns: 'common', defaultValue: 'Vegan' })
    };
  }

  if (normalized === 'vegetarian') {
    return {
      icon: PiEgg,
      label: t('foodCategory.vegetarian', { ns: 'common', defaultValue: 'Vegetarian' })
    };
  }

  const meatLabels = {
    beef: t('foodCategory.beef', { ns: 'common', defaultValue: 'Beef' }),
    pork: t('foodCategory.pork', { ns: 'common', defaultValue: 'Pork' }),
    chicken: t('foodCategory.chicken', { ns: 'common', defaultValue: 'Chicken' }),
    lamb: t('foodCategory.lamb', { ns: 'common', defaultValue: 'Lamb' }),
    fish: t('foodCategory.fish', { ns: 'common', defaultValue: 'Fish' }),
    seafood: t('foodCategory.seafood', { ns: 'common', defaultValue: 'Seafood' }),
    'mixed-meat': t('foodCategory.mixedMeat', { ns: 'common', defaultValue: 'Mixed Meat' }),
  };

  if (meatLabels[normalized]) {
    return {
      icon: PiCow,
      label: meatLabels[normalized]
    };
  }

  return null;
};

export const formatDifficulty = (difficulty, t) => {
  if (!difficulty) {
    return t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' });
  }

  const normalized = difficulty.toLowerCase();

  if (normalized === 'easy') {
    return t('difficulty.easy', { ns: 'common', defaultValue: 'Easy' });
  }

  if (normalized === 'medium') {
    return t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' });
  }

  if (normalized === 'hard') {
    return t('difficulty.hard', { ns: 'common', defaultValue: 'Hard' });
  }

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

export const getDifficultyColorClasses = (difficulty) => {
  const normalized = difficulty?.toLowerCase();

  switch (normalized) {
    case 'easy':
      return 'text-green-600 bg-green-600/10';
    case 'medium':
      return 'text-orange-500 bg-orange-500/10';
    case 'hard':
      return 'text-orange-700 bg-orange-700/10';
    default:
      return 'text-orange-500 bg-orange-500/10';
  }
};

export const formatTime = (minutes) => {
  if (!minutes && minutes !== 0) {
    return 'N/A';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins > 0) {
    return `${hours}h ${mins}min`;
  }

  return `${hours}h`;
};

export const TimeIcon = Clock;
