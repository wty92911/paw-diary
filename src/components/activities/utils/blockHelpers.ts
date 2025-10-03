/**
 * Block helper utilities - separated from BlockRenderer for Fast Refresh
 */

import { type ActivityBlockType, type ActivityBlockDef, type ActivityBlockData } from '../../../lib/types/activities';

/**
 * Get human-readable display name for a block
 */
export const getBlockDisplayName = (block: ActivityBlockDef): string => {
  return block.label || block.type.charAt(0).toUpperCase() + block.type.slice(1);
};

/**
 * Get icon name for a block type
 */
export const getBlockIcon = (blockType: ActivityBlockType): string => {
  const iconMap: Record<ActivityBlockType, string> = {
    title: '✏️',
    notes: '📝',
    subcategory: '🏷️',
    time: '🕐',
    measurement: '📏',
    rating: '⭐',
    portion: '🥣',
    timer: '⏱️',
    location: '📍',
    weather: '🌤️',
    checklist: '✅',
    attachment: '📎',
    cost: '💰',
    reminder: '🔔',
    people: '👥',
    recurrence: '🔄',
  };
  return iconMap[blockType] || '📋';
};

/**
 * Validate block data against its definition
 */
export const validateBlockData = (block: ActivityBlockDef, data: ActivityBlockData): boolean => {
  if (block.required && (data === undefined || data === null || data === '')) {
    return false;
  }
  // Additional validation can be added here based on block type
  return true;
};

/**
 * Get all available block types
 */
export const getAvailableBlockTypes = (): ActivityBlockType[] => {
  return [
    'title',
    'notes',
    'subcategory',
    'time',
    'measurement',
    'rating',
    'portion',
    'timer',
    'location',
    'weather',
    'checklist',
    'attachment',
    'cost',
    'reminder',
    'people',
    'recurrence',
  ];
};

/**
 * Type guard to check if a string is a valid ActivityBlockType
 */
export const isBlockTypeSupported = (blockType: string): blockType is ActivityBlockType => {
  return getAvailableBlockTypes().includes(blockType as ActivityBlockType);
};
