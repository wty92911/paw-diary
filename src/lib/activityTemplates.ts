import { ActivityTemplate, ActivityCategory, TemplateRegistry } from './types/activities';

// Import templates from separate category files
import {
  dietTemplates,
  growthTemplates,
  healthTemplates,
  lifestyleTemplates,
  expenseTemplates,
} from './templates';

// Combine all templates from separate files
export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  ...dietTemplates,
  ...growthTemplates,
  ...healthTemplates,
  ...lifestyleTemplates,
  ...expenseTemplates,
];

// Template registry implementation
export class ActivityTemplateRegistry implements TemplateRegistry {
  templates: ActivityTemplate[] = ACTIVITY_TEMPLATES;
  categories: ActivityCategory[] = Object.values(ActivityCategory);

  getTemplate(id: string): ActivityTemplate {
    return this.templates.find(template => template.id === id) as ActivityTemplate;
  }

  getTemplatesByCategory(category: ActivityCategory): ActivityTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  getAllTemplates(): ActivityTemplate[] {
    return this.templates;
  }

  getTemplatesBySubcategory(category: ActivityCategory, subcategory: string): ActivityTemplate[] {
    return this.templates.filter(
      template => template.category === category && template.subcategory === subcategory,
    );
  }

  searchTemplates(query: string): ActivityTemplate[] {
    const searchTerm = query.toLowerCase();
    return this.templates.filter(
      template =>
        template.label.toLowerCase().includes(searchTerm) ||
        template.subcategory.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.category.toLowerCase().includes(searchTerm),
    );
  }
}

// Singleton instance for global access
export const templateRegistry = new ActivityTemplateRegistry();

// Helper functions for template operations
export function getTemplateById(id: string): ActivityTemplate | undefined {
  return templateRegistry.getTemplate(id);
}

export function getTemplatesByCategory(category: ActivityCategory): ActivityTemplate[] {
  return templateRegistry.getTemplatesByCategory(category);
}

export function getAllCategories(): ActivityCategory[] {
  return templateRegistry.categories;
}

// Template validation utilities
export function validateTemplate(template: ActivityTemplate): boolean {
  if (!template.id || !template.category || !template.subcategory || !template.label) {
    return false;
  }

  if (!Array.isArray(template.blocks) || template.blocks.length === 0) {
    return false;
  }

  // Validate each block has required properties
  return template.blocks.every(
    block => block.id && block.type && typeof block.required === 'boolean',
  );
}

export function getRequiredBlocks(template: ActivityTemplate): string[] {
  return template.blocks.filter(block => block.required).map(block => block.id);
}

export function getOptionalBlocks(template: ActivityTemplate): string[] {
  return template.blocks.filter(block => !block.required).map(block => block.id);
}

// Constants for template system
export const TEMPLATE_CATEGORIES = Object.values(ActivityCategory);

export const COMMON_BLOCK_CONFIGURATIONS = {
  time: {
    showDate: true,
    showTime: true,
    defaultToNow: true,
    allowFuture: false,
  },
  notes: {
    maxLength: 500,
    placeholder: 'Add notes...',
  },
  attachment: {
    maxFiles: 3,
    showOCR: false,
    allowReordering: true,
  },
};

export default templateRegistry;
