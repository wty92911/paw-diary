import { ActivityCategory } from '../types/activities';

/**
 * Category color theme system for consistent visual representation of activity categories
 * across the application (cards, badges, stripes, icons, etc.)
 */

// Primary category colors for backgrounds, badges, and prominent elements
export const CATEGORY_COLORS = {
  [ActivityCategory.Health]: {
    primary: 'bg-red-500',
    light: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    hover: 'hover:bg-red-50',
    ring: 'ring-red-200',
    gradient: 'from-red-400 to-red-600'
  },
  [ActivityCategory.Growth]: {
    primary: 'bg-blue-500',
    light: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    hover: 'hover:bg-blue-50',
    ring: 'ring-blue-200',
    gradient: 'from-blue-400 to-blue-600'
  },
  [ActivityCategory.Diet]: {
    primary: 'bg-green-500',
    light: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    hover: 'hover:bg-green-50',
    ring: 'ring-green-200',
    gradient: 'from-green-400 to-green-600'
  },
  [ActivityCategory.Lifestyle]: {
    primary: 'bg-purple-500',
    light: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    hover: 'hover:bg-purple-50',
    ring: 'ring-purple-200',
    gradient: 'from-purple-400 to-purple-600'
  },
  [ActivityCategory.Expense]: {
    primary: 'bg-orange-500',
    light: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    hover: 'hover:bg-orange-50',
    ring: 'ring-orange-200',
    gradient: 'from-orange-400 to-orange-600'
  },
} as const;

// Category stripe colors for card left borders and dividers
export const CATEGORY_STRIPES = {
  [ActivityCategory.Health]: 'border-l-red-500',
  [ActivityCategory.Growth]: 'border-l-blue-500',
  [ActivityCategory.Diet]: 'border-l-green-500',
  [ActivityCategory.Lifestyle]: 'border-l-purple-500',
  [ActivityCategory.Expense]: 'border-l-orange-500',
} as const;

// Category icons for visual identification and branding
export const CATEGORY_ICONS = {
  [ActivityCategory.Health]: '🏥',
  [ActivityCategory.Growth]: '📏',
  [ActivityCategory.Diet]: '🍽️',
  [ActivityCategory.Lifestyle]: '🎾',
  [ActivityCategory.Expense]: '💰',
} as const;

// Category semantic colors (CSS custom properties compatible)
export const CATEGORY_CSS_VARS = {
  [ActivityCategory.Health]: {
    '--category-primary': '#ef4444', // red-500
    '--category-light': '#fef2f2', // red-50
    '--category-text': '#b91c1c', // red-700
    '--category-border': '#fca5a5', // red-300
  },
  [ActivityCategory.Growth]: {
    '--category-primary': '#3b82f6', // blue-500
    '--category-light': '#eff6ff', // blue-50
    '--category-text': '#1d4ed8', // blue-700
    '--category-border': '#93c5fd', // blue-300
  },
  [ActivityCategory.Diet]: {
    '--category-primary': '#10b981', // green-500
    '--category-light': '#f0fdf4', // green-50
    '--category-text': '#15803d', // green-700
    '--category-border': '#86efac', // green-300
  },
  [ActivityCategory.Lifestyle]: {
    '--category-primary': '#8b5cf6', // purple-500
    '--category-light': '#faf5ff', // purple-50
    '--category-text': '#7c3aed', // purple-700
    '--category-border': '#c4b5fd', // purple-300
  },
  [ActivityCategory.Expense]: {
    '--category-primary': '#f97316', // orange-500
    '--category-light': '#fff7ed', // orange-50
    '--category-text': '#c2410c', // orange-700
    '--category-border': '#fdba74', // orange-300
  },
} as const;

/**
 * Get comprehensive theme object for a category
 */
export function getCategoryTheme(category: ActivityCategory) {
  return {
    colors: CATEGORY_COLORS[category],
    stripe: CATEGORY_STRIPES[category],
    icon: CATEGORY_ICONS[category],
    cssVars: CATEGORY_CSS_VARS[category],
  };
}

/**
 * Get category color for specific use cases
 */
export function getCategoryColor(
  category: ActivityCategory,
  variant: 'primary' | 'light' | 'text' | 'border' | 'hover' | 'ring' | 'gradient' = 'primary'
) {
  return CATEGORY_COLORS[category][variant];
}

/**
 * Get category stripe class for borders
 */
export function getCategoryStripe(category: ActivityCategory) {
  return CATEGORY_STRIPES[category];
}

/**
 * Get category icon emoji
 */
export function getCategoryIcon(category: ActivityCategory) {
  return CATEGORY_ICONS[category];
}

/**
 * Generate category badge class names
 */
export function getCategoryBadgeClasses(
  category: ActivityCategory,
  variant: 'solid' | 'outline' | 'soft' = 'solid'
) {
  const colors = CATEGORY_COLORS[category];
  
  switch (variant) {
    case 'solid':
      return `${colors.primary} text-white`;
    case 'outline':
      return `${colors.border} ${colors.text} border bg-transparent`;
    case 'soft':
      return `${colors.light} ${colors.text}`;
    default:
      return `${colors.primary} text-white`;
  }
}

/**
 * Generate category card background classes with proper states
 */
export function getCategoryCardClasses(
  category: ActivityCategory,
  options: {
    isPinned?: boolean;
    hasHealthFlag?: boolean;
    isPressed?: boolean;
  } = {}
) {
  const { isPinned, hasHealthFlag, isPressed } = options;
  
  let classes = `${CATEGORY_STRIPES[category]} transition-all duration-200 hover:shadow-md cursor-pointer`;
  
  if (isPressed) {
    classes += ` ring-2 ring-primary ring-opacity-50`;
  }
  
  if (isPinned) {
    classes += ` ring-1 ring-amber-300 bg-amber-50/50`;
  }
  
  if (hasHealthFlag) {
    classes += ` shadow-md ring-1 ${CATEGORY_COLORS[ActivityCategory.Health].ring} ${CATEGORY_COLORS[ActivityCategory.Health].light}/30`;
  }
  
  return classes;
}

/**
 * Generate status indicator classes for health flags, pinned items, etc.
 */
export function getStatusIndicatorClasses(
  type: 'health' | 'pinned' | 'urgent' | 'completed'
) {
  switch (type) {
    case 'health':
      return 'bg-red-100 text-red-600';
    case 'pinned':
      return 'text-amber-500';
    case 'urgent':
      return 'bg-orange-100 text-orange-600';
    case 'completed':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Export all category values for validation and iteration
 */
export const ALL_CATEGORIES = Object.values(ActivityCategory) as ActivityCategory[];

/**
 * Validate if a string is a valid activity category
 */
export function isValidCategory(category: string): category is ActivityCategory {
  return ALL_CATEGORIES.includes(category as ActivityCategory);
}

/**
 * Get a readable category name (same as enum for now, but could be localized)
 */
export function getCategoryDisplayName(category: ActivityCategory): string {
  return category;
}