import { z } from 'zod';
import { ActivityMode } from './activities';

/**
 * Routing Types for Activity Pages
 * 
 * Provides type-safe routing interfaces and validation utilities
 * for the new pet-contextual activity page system.
 */

// Route parameter interfaces for URL extraction
export interface PetActivityRouteParams {
  petId: string;
  activityId?: string;
}

// Query parameter interfaces for activity editor configuration
export interface ActivityEditorQueryParams {
  template?: string;
  mode?: ActivityMode;
}

// Combined route parameters for complete type safety
export interface ActivityPageRouteParams extends PetActivityRouteParams {
  queryParams?: ActivityEditorQueryParams;
}

// Zod schemas for runtime validation
export const PetActivityRouteParamsSchema = z.object({
  petId: z.string().min(1, 'Pet ID is required'),
  activityId: z.string().optional(),
});

export const ActivityEditorQueryParamsSchema = z.object({
  template: z.string().optional(),
  mode: z.enum(['quick', 'guided', 'advanced']).optional(),
});

// Route validation utilities
export class RouteValidator {
  /**
   * Validates pet activity route parameters
   */
  static validatePetActivityParams(params: unknown): PetActivityRouteParams {
    return PetActivityRouteParamsSchema.parse(params);
  }

  /**
   * Validates activity editor query parameters
   */
  static validateActivityEditorQuery(params: unknown): ActivityEditorQueryParams {
    return ActivityEditorQueryParamsSchema.parse(params);
  }

  /**
   * Validates pet ID is numeric and converts to number
   */
  static validatePetId(petId: string): number {
    const numericId = parseInt(petId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error(`Invalid pet ID: ${petId}. Must be a positive number.`);
    }
    return numericId;
  }

  /**
   * Validates activity ID is numeric and converts to number
   */
  static validateActivityId(activityId: string): number {
    const numericId = parseInt(activityId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error(`Invalid activity ID: ${activityId}. Must be a positive number.`);
    }
    return numericId;
  }

  /**
   * Sanitizes and validates template ID
   */
  static validateTemplateId(templateId: string): string {
    const sanitized = templateId.trim().toLowerCase();
    if (!/^[a-z0-9-_]+$/.test(sanitized)) {
      throw new Error(`Invalid template ID: ${templateId}. Must contain only letters, numbers, hyphens, and underscores.`);
    }
    return sanitized;
  }
}

// Route building utilities
export class RouteBuilder {
  /**
   * Builds pet profile route
   */
  static petProfile(petId: number): string {
    return `/pets/${petId}`;
  }

  /**
   * Builds activities list route
   */
  static activitiesList(petId: number): string {
    return `/pets/${petId}/activities`;
  }

  /**
   * Builds new activity route with optional parameters
   */
  static newActivity(petId: number, options?: ActivityEditorQueryParams): string {
    const baseUrl = `/pets/${petId}/activities/new`;
    if (!options || (!options.mode && !options.template)) {
      return baseUrl;
    }

    const params = new URLSearchParams();
    if (options.mode) {
      params.set('mode', options.mode);
    }
    if (options.template) {
      params.set('template', options.template);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Builds edit activity route
   */
  static editActivity(petId: number, activityId: number): string {
    return `/pets/${petId}/activities/${activityId}/edit`;
  }
}

// Navigation breadcrumb types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

// Breadcrumb building utilities
export class BreadcrumbBuilder {
  /**
   * Builds breadcrumbs for activities list page
   */
  static forActivitiesList(_petName: string, petId: number): BreadcrumbItem[] {
    return [
      {
        label: 'Profile',
        href: RouteBuilder.petProfile(petId),
        active: false,
      },
      {
        label: 'Activities',
        active: true,
      },
    ];
  }

  /**
   * Builds breadcrumbs for new activity page
   */
  static forNewActivity(_petName: string, petId: number, mode?: ActivityMode): BreadcrumbItem[] {
    const modeLabel = mode ? ` (${mode.charAt(0).toUpperCase() + mode.slice(1)})` : '';
    
    return [
      {
        label: 'Profile',
        href: RouteBuilder.petProfile(petId),
        active: false,
      },
      {
        label: 'Activities',
        href: RouteBuilder.activitiesList(petId),
        active: false,
      },
      {
        label: `New Activity${modeLabel}`,
        active: true,
      },
    ];
  }

  /**
   * Builds breadcrumbs for edit activity page
   */
  static forEditActivity(_petName: string, petId: number, activityTitle?: string): BreadcrumbItem[] {
    const activityLabel = activityTitle ? `Edit: ${activityTitle}` : 'Edit Activity';
    
    return [
      {
        label: 'Profile',
        href: RouteBuilder.petProfile(petId),
        active: false,
      },
      {
        label: 'Activities',
        href: RouteBuilder.activitiesList(petId),
        active: false,
      },
      {
        label: activityLabel,
        active: true,
      },
    ];
  }
}

// Error types for routing
export class RouteValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'RouteValidationError';
  }
}

export class RouteNotFoundError extends Error {
  constructor(path: string) {
    super(`Route not found: ${path}`);
    this.name = 'RouteNotFoundError';
  }
}

// Export everything for convenience
export * from './activities';