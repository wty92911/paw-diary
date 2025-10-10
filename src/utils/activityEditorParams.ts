import { RouteValidator, type ActivityEditorQueryParams } from '../lib/types/routing';

/**
 * Activity Editor Query Parameter Utilities
 *
 * Provides utilities for parsing, validating, and managing query parameters
 * for the activity editor pages. Handles template selection and validation.
 *
 * Features:
 * - Parse and validate template parameters from URLSearchParams
 * - URL state synchronization with template changes
 * - Parameter validation with fallback defaults
 * - Type-safe parameter handling with runtime validation
 */

/**
 * Default values for activity editor parameters
 */
export const ACTIVITY_EDITOR_DEFAULTS = {
  template: undefined,
} as const;

/**
 * Configuration for activity editor parameter parsing
 */
export interface ActivityEditorParamsConfig {
  /** Whether to validate template IDs (default: true) */
  validateTemplateId?: boolean;
  /** Whether to allow unknown parameters (default: false) */
  allowUnknownParams?: boolean;
}

/**
 * Result of parsing activity editor parameters
 */
export interface ParsedActivityEditorParams {
  /** Validated template ID or undefined */
  template?: string;
  /** Whether any parameters were invalid and defaults were used */
  hasWarnings: boolean;
  /** List of validation warnings if any */
  warnings: string[];
}

/**
 * Parses and validates activity editor query parameters from URLSearchParams
 *
 * @param searchParams - URLSearchParams from useSearchParams hook
 * @param config - Optional configuration for parsing behavior
 * @returns Parsed and validated parameters with warnings
 *
 * @example
 * ```typescript
 * const [searchParams] = useSearchParams();
 * const { template, warnings } = parseActivityEditorParams(searchParams);
 *
 * if (warnings.length > 0) {
 *   console.warn('Parameter validation warnings:', warnings);
 * }
 * ```
 */
export function parseActivityEditorParams(
  searchParams: URLSearchParams,
  config: ActivityEditorParamsConfig = {},
): ParsedActivityEditorParams {
  const { validateTemplateId = true, allowUnknownParams = false } = config;

  const warnings: string[] = [];
  let template: string | undefined = undefined;

  // Parse and validate template parameter
  const templateParam = searchParams.get('template');
  if (templateParam) {
    try {
      if (validateTemplateId) {
        template = RouteValidator.validateTemplateId(templateParam);
      } else {
        template = templateParam.trim();
      }
    } catch (error) {
      warnings.push(`Invalid template '${templateParam}': ${(error as Error).message}`);
    }
  }

  // Check for unknown parameters if not allowed
  if (!allowUnknownParams) {
    const knownParams = new Set(['template']);
    for (const [key] of searchParams) {
      if (!knownParams.has(key)) {
        warnings.push(`Unknown parameter '${key}' will be ignored.`);
      }
    }
  }

  return {
    template,
    hasWarnings: warnings.length > 0,
    warnings,
  };
}

/**
 * Creates URLSearchParams for activity editor with validated parameters
 *
 * @param params - Activity editor query parameters
 * @param config - Optional configuration for parameter building
 * @returns URLSearchParams object ready for navigation
 *
 * @example
 * ```typescript
 * navigate(`/pets/1/activities/new?${params.toString()}`);
 * ```
 */
export function buildActivityEditorParams(
  params: Partial<ActivityEditorQueryParams>,
  config: ActivityEditorParamsConfig = {},
): URLSearchParams {
  const { validateTemplateId = true } = config;

  const searchParams = new URLSearchParams();

  // Add template parameter if provided
  if (params.template) {
    try {
      const templateId = validateTemplateId
        ? RouteValidator.validateTemplateId(params.template)
        : params.template.trim();

      if (templateId) {
        searchParams.set('template', templateId);
      }
    } catch (error) {
      console.warn(`Invalid template '${params.template}' ignored:`, (error as Error).message);
    }
  }

  return searchParams;
}

/**
 * Updates URLSearchParams with new template while preserving other parameters
 *
 * @param currentParams - Current URLSearchParams
 * @param newTemplate - New template ID to set (or null to remove)
 * @param config - Optional configuration for template validation
 * @returns Updated URLSearchParams
 *
 * @example
 * ```typescript
 * const [searchParams, setSearchParams] = useSearchParams();
 *
 * const handleTemplateChange = (templateId: string | null) => {
 *   const updatedParams = updateActivityTemplate(searchParams, templateId);
 *   setSearchParams(updatedParams);
 * };
 * ```
 */
export function updateActivityTemplate(
  currentParams: URLSearchParams,
  newTemplate: string | null,
  config: Pick<ActivityEditorParamsConfig, 'validateTemplateId'> = {},
): URLSearchParams {
  const { validateTemplateId = true } = config;
  const updatedParams = new URLSearchParams(currentParams);

  if (newTemplate === null || newTemplate === '') {
    // Remove template parameter
    updatedParams.delete('template');
  } else {
    try {
      const templateId = validateTemplateId
        ? RouteValidator.validateTemplateId(newTemplate)
        : newTemplate.trim();

      updatedParams.set('template', templateId);
    } catch (error) {
      console.warn(`Invalid template '${newTemplate}' ignored:`, (error as Error).message);
    }
  }

  return updatedParams;
}

/**
 * Synchronizes URL parameters with current editor state
 * Used for keeping URL in sync when template changes programmatically
 *
 * @param currentParams - Current URLSearchParams
 * @param editorState - Current editor state to sync
 * @returns Updated URLSearchParams reflecting current state
 *
 * @example
 * ```typescript
 * const [searchParams, setSearchParams] = useSearchParams();
 * const [selectedTemplate, setSelectedTemplate] = useState<string>('feeding');
 *
 * useEffect(() => {
 *   const syncedParams = syncActivityEditorParams(searchParams, {
 *     template: selectedTemplate
 *   });
 *   setSearchParams(syncedParams, { replace: true });
 * }, [selectedTemplate]);
 * ```
 */
export function syncActivityEditorParams(
  currentParams: URLSearchParams,
  editorState: Partial<ActivityEditorQueryParams>,
): URLSearchParams {
  let updatedParams = new URLSearchParams(currentParams);

  // Update template if provided (or remove if null/undefined)
  if (editorState.template !== undefined) {
    updatedParams = updateActivityTemplate(updatedParams, editorState.template || null);
  }

  return updatedParams;
}

/**
 * Creates a complete activity editor URL with validated parameters
 *
 * @param petId - Pet ID for the route
 * @param params - Query parameters for the editor
 * @param isEdit - Whether this is an edit URL (requires activityId)
 * @param activityId - Activity ID for edit mode
 * @returns Complete URL string
 *
 * @example
 * ```typescript
 * // For new activity
 * // -> "/pets/1/activities/new?template=feeding"
 *
 * // For editing existing activity
 * // -> "/pets/1/activities/123/edit"
 * ```
 */
export function createActivityEditorUrl(
  petId: number,
  params: Partial<ActivityEditorQueryParams> = {},
  isEdit: boolean = false,
  activityId?: number,
): string {
  // Validate petId
  if (!petId || petId <= 0) {
    throw new Error(`Invalid pet ID: ${petId}. Must be a positive number.`);
  }

  // Validate activityId for edit mode
  if (isEdit && (!activityId || activityId <= 0)) {
    throw new Error(`Invalid activity ID: ${activityId}. Must be a positive number for edit mode.`);
  }

  // Build base URL
  const basePath = isEdit
    ? `/pets/${petId}/activities/${activityId}/edit`
    : `/pets/${petId}/activities/new`;

  // Build query parameters
  const searchParams = buildActivityEditorParams(params);
  const queryString = searchParams.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Extracts and validates route parameters from React Router params
 * Combines path parameters (petId, activityId) with query parameters
 *
 * @param routeParams - Parameters from useParams hook
 * @param searchParams - Parameters from useSearchParams hook
 * @returns Validated route and query parameters
 *
 * @example
 * ```typescript
 * const routeParams = useParams<{ petId: string; activityId?: string }>();
 * const [searchParams] = useSearchParams();
 *
 * const { petId, activityId, mode, template, warnings } = extractActivityEditorRouteParams(
 *   routeParams,
 *   searchParams
 * );
 * ```
 */
export function extractActivityEditorRouteParams(
  routeParams: { petId?: string; activityId?: string },
  searchParams: URLSearchParams,
): {
  petId: number;
  activityId?: number;
  template?: string;
  isEditMode: boolean;
  hasWarnings: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Validate pet ID
  let petId: number;
  try {
    if (!routeParams.petId) {
      throw new Error('Pet ID is required');
    }
    petId = RouteValidator.validatePetId(routeParams.petId);
  } catch (error) {
    throw new Error(`Invalid pet ID: ${(error as Error).message}`);
  }

  // Validate activity ID if present
  let activityId: number | undefined;
  if (routeParams.activityId) {
    try {
      activityId = RouteValidator.validateActivityId(routeParams.activityId);
    } catch (error) {
      throw new Error(`Invalid activity ID: ${(error as Error).message}`);
    }
  }

  // Parse query parameters
  const queryResult = parseActivityEditorParams(searchParams);
  warnings.push(...queryResult.warnings);

  return {
    petId,
    activityId,
    template: queryResult.template,
    isEditMode: !!activityId,
    hasWarnings: warnings.length > 0,
    warnings,
  };
}
