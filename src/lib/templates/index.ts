// Central export file for all activity templates
export { default as dietTemplates, dietQuickLogTemplates } from './dietTemplates';
export { default as growthTemplates, growthQuickLogTemplates } from './growthTemplates';
export { default as healthTemplates, healthQuickLogTemplates } from './healthTemplates';
export { default as lifestyleTemplates, lifestyleQuickLogTemplates } from './lifestyleTemplates';
export { default as expenseTemplates, expenseQuickLogTemplates } from './expenseTemplates';

// Re-export types
export type { ActivityTemplate, QuickLogTemplate } from '../types/activities';