import { type ActivityMode } from '../lib/types/activities';
import { RouteValidator, type ActivityEditorQueryParams } from '../lib/types/routing';

/**
 * Activity Editor Query Parameter Utilities
 *
 * Provides utilities for parsing, validating, and managing query parameters
 * for the activity editor pages. Handles different editor modes and templates
 * with proper validation and defaults.
 *
 * Features:
 * - Parse and validate mode and template parameters from URLSearchParams
 * - URL state synchronization with editor mode switching
 * - Parameter validation with fallback defaults
 * - Type-safe parameter handling with runtime validation
 */

/**
 * Default values for activity editor parameters
 */
export const ACTIVITY_EDITOR_DEFAULTS = {
  mode: 'guided' as ActivityMode,
  template: undefined,
} as const;

/**
 * Valid activity editor modes
 */
export const VALID_ACTIVITY_MODES: readonly ActivityMode[] = ['quick', 'guided', 'advanced'];

/**
 * Configuration for activity editor parameter parsing
 */
export interface ActivityEditorParamsConfig {
  /** Default mode when none specified or invalid */
  defaultMode?: ActivityMode;
  /** Whether to validate template IDs (default: true) */
  validateTemplateId?: boolean;
  /** Whether to allow unknown parameters (default: false) */
  allowUnknownParams?: boolean;
}

/**
 * Result of parsing activity editor parameters
 */
export interface ParsedActivityEditorParams {
  /** Validated activity mode with fallback to default */
  mode: ActivityMode;
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
 * const { mode, template, warnings } = parseActivityEditorParams(searchParams);
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
  const {
    defaultMode = ACTIVITY_EDITOR_DEFAULTS.mode,
    validateTemplateId = true,
    allowUnknownParams = false,
  } = config;

  const warnings: string[] = [];
  let mode: ActivityMode = defaultMode;
  let template: string | undefined = undefined;

  // Parse and validate mode parameter
  const modeParam = searchParams.get('mode');
  if (modeParam) {
    if (isValidActivityMode(modeParam)) {
      mode = modeParam;
    } else {
      warnings.push(`Invalid mode '${modeParam}'. Using default '${defaultMode}'.`);
    }
  }

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
    const knownParams = new Set(['mode', 'template']);
    for (const [key] of searchParams) {
      if (!knownParams.has(key)) {
        warnings.push(`Unknown parameter '${key}' will be ignored.`);
      }
    }
  }

  return {
    mode,
    template,
    hasWarnings: warnings.length > 0,
    warnings,
  };
}

/**
 * Type guard to check if a string is a valid ActivityMode
 *
 * @param value - String to check
 * @returns True if the value is a valid ActivityMode
 */
export function isValidActivityMode(value: string): value is ActivityMode {
  return VALID_ACTIVITY_MODES.includes(value as ActivityMode);
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
 * const params = buildActivityEditorParams({ mode: 'quick', template: 'feeding' });
 * navigate(`/pets/1/activities/new?${params.toString()}`);
 * ```
 */
export function buildActivityEditorParams(
  params: Partial<ActivityEditorQueryParams>,
  config: ActivityEditorParamsConfig = {},
): URLSearchParams {
  const { validateTemplateId = true } = config;

  const searchParams = new URLSearchParams();

  // Add mode parameter if provided and valid
  if (params.mode) {
    if (isValidActivityMode(params.mode)) {
      searchParams.set('mode', params.mode);
    } else {
      console.warn(`Invalid mode '${params.mode}' ignored when building URL parameters.`);
    }
  }

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
 * Updates URLSearchParams with new activity editor mode while preserving other parameters
 *
 * @param currentParams - Current URLSearchParams
 * @param newMode - New activity mode to set
 * @returns Updated URLSearchParams
 *
 * @example
 * ```typescript
 * const [searchParams, setSearchParams] = useSearchParams();
 *
 * const handleModeSwitch = (mode: ActivityMode) => {
 *   const updatedParams = updateActivityMode(searchParams, mode);
 *   setSearchParams(updatedParams);
 * };
 * ```
 */
export function updateActivityMode(
  currentParams: URLSearchParams,
  newMode: ActivityMode,
): URLSearchParams {
  if (!isValidActivityMode(newMode)) {
    console.warn(`Invalid mode '${newMode}' ignored in updateActivityMode.`);
    return new URLSearchParams(currentParams);
  }

  const updatedParams = new URLSearchParams(currentParams);
  updatedParams.set('mode', newMode);
  return updatedParams;
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
 * Used for keeping URL in sync when mode or template changes programmatically
 *
 * @param currentParams - Current URLSearchParams
 * @param editorState - Current editor state to sync
 * @returns Updated URLSearchParams reflecting current state
 *
 * @example
 * ```typescript
 * const [searchParams, setSearchParams] = useSearchParams();
 * const [currentMode, setCurrentMode] = useState<ActivityMode>('guided');
 * const [selectedTemplate, setSelectedTemplate] = useState<string>('feeding');
 *
 * useEffect(() => {
 *   const syncedParams = syncActivityEditorParams(searchParams, {
 *     mode: currentMode,
 *     template: selectedTemplate
 *   });
 *   setSearchParams(syncedParams, { replace: true });
 * }, [currentMode, selectedTemplate]);
 * ```
 */
export function syncActivityEditorParams(
  currentParams: URLSearchParams,
  editorState: Partial<ActivityEditorQueryParams>,
): URLSearchParams {
  let updatedParams = new URLSearchParams(currentParams);

  // Update mode if provided
  if (editorState.mode) {
    updatedParams = updateActivityMode(updatedParams, editorState.mode);
  }

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
 * const newActivityUrl = createActivityEditorUrl(1, { mode: 'quick', template: 'feeding' });
 * // -> "/pets/1/activities/new?mode=quick&template=feeding"
 *
 * // For editing existing activity
 * const editActivityUrl = createActivityEditorUrl(1, { mode: 'advanced' }, true, 123);
 * // -> "/pets/1/activities/123/edit?mode=advanced"
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
  mode: ActivityMode;
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
    mode: queryResult.mode,
    template: queryResult.template,
    isEditMode: !!activityId,
    hasWarnings: warnings.length > 0,
    warnings,
  };
}
