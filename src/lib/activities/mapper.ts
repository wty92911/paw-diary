import { 
  ActivityFormData, 
  ActivityRecord, 
  ActivityMode,
  ActivityCategory 
} from '../types/activities';

/**
 * Activity Data Mapper Utilities
 * 
 * These utilities handle conversion between:
 * - ActivityFormData: Used by React Hook Form and UI components
 * - ActivityRecord: Database record format for persistence
 * 
 * This ensures clean separation between UI state and database schema.
 */

// Error types for mapping operations
export class MappingError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'MappingError';
  }
}

/**
 * Convert ActivityFormData to ActivityRecord for database storage
 * 
 * @param formData - Form data from React Hook Form
 * @param existingRecord - Optional existing record for updates (preserves id, created_at)
 * @returns ActivityRecord ready for database insertion/update
 */
export function toActivityRecord(
  formData: ActivityFormData, 
  existingRecord?: Partial<ActivityRecord>
): Omit<ActivityRecord, 'id' | 'created_at'> | ActivityRecord {
  try {
    // Validate required fields
    if (!formData.petId) {
      throw new MappingError('Pet ID is required', 'petId');
    }
    if (!formData.title?.trim()) {
      throw new MappingError('Title is required', 'title');
    }
    if (!formData.category) {
      throw new MappingError('Category is required', 'category');
    }
    if (!formData.templateId) {
      throw new MappingError('Template ID is required', 'templateId');
    }
    if (!formData.activityDate) {
      throw new MappingError('Activity date is required', 'activityDate');
    }

    // Extract block data, filtering out empty/undefined values
    const cleanedBlocks = Object.entries(formData.blocks || {})
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

    // Build the activity_data JSON structure
    const activityData = {
      templateId: formData.templateId,
      blocks: cleanedBlocks,
      mode: 'guided' as ActivityMode, // Default mode, could be passed in
    };

    // Create base record
    const baseRecord = {
      pet_id: formData.petId,
      category: formData.category,
      subcategory: formData.subcategory || '',
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      activity_date: formData.activityDate.toISOString(),
      activity_data: activityData,
      updated_at: new Date().toISOString(),
    };

    // If updating existing record, preserve certain fields
    if (existingRecord?.id) {
      return {
        ...baseRecord,
        id: existingRecord.id,
        created_at: existingRecord.created_at || new Date().toISOString(),
      } as ActivityRecord;
    }

    // For new records, don't include id/created_at (database will handle these)
    return baseRecord;

  } catch (error) {
    if (error instanceof MappingError) {
      throw error;
    }
    throw new MappingError(`Failed to convert form data to activity record: ${error}`);
  }
}

/**
 * Convert ActivityRecord to ActivityFormData for form editing
 * 
 * @param record - Database record
 * @returns ActivityFormData compatible with React Hook Form
 */
export function toFormData(record: ActivityRecord): ActivityFormData {
  try {
    // Validate record structure
    if (!record.id) {
      throw new MappingError('Record ID is required', 'id');
    }
    if (!record.pet_id) {
      throw new MappingError('Pet ID is required in record', 'pet_id');
    }
    if (!record.activity_data?.templateId) {
      throw new MappingError('Template ID is required in activity data', 'activity_data.templateId');
    }

    // Parse activity date
    let activityDate: Date;
    try {
      activityDate = new Date(record.activity_date);
      if (isNaN(activityDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      throw new MappingError('Invalid activity date format', 'activity_date');
    }

    // Extract blocks data with fallback to empty object
    const blocks = record.activity_data?.blocks || {};

    // Map category string back to enum
    let category: ActivityCategory;
    if (Object.values(ActivityCategory).includes(record.category as ActivityCategory)) {
      category = record.category as ActivityCategory;
    } else {
      console.warn(`Unknown category: ${record.category}, defaulting to Diet`);
      category = ActivityCategory.Diet;
    }

    // Build form data structure
    const formData: ActivityFormData = {
      petId: record.pet_id,
      category: category,
      subcategory: record.subcategory || '',
      templateId: record.activity_data.templateId,
      blocks: blocks,
      title: record.title || '',
      description: record.description || undefined,
      activityDate: activityDate,
    };

    // Extract structured data from blocks if present
    // This allows form components to work with typed data structures
    extractStructuredDataFromBlocks(formData, blocks);

    return formData;

  } catch (error) {
    if (error instanceof MappingError) {
      throw error;
    }
    throw new MappingError(`Failed to convert activity record to form data: ${error}`);
  }
}

/**
 * Extract structured data from blocks for specific data types
 * This helps form components work with properly typed data
 */
function extractStructuredDataFromBlocks(
  formData: ActivityFormData, 
  blocks: Record<string, any>
): void {
  // Extract measurements
  const measurements: Record<string, any> = {};
  Object.entries(blocks).forEach(([key, value]) => {
    if (key.startsWith('measurement_') && value) {
      measurements[key.replace('measurement_', '')] = value;
    }
  });
  if (Object.keys(measurements).length > 0) {
    formData.measurements = measurements;
  }

  // Extract attachments array
  const attachmentEntries = Object.entries(blocks)
    .filter(([key]) => key.startsWith('attachment_'))
    .map(([_, value]) => value)
    .filter(Boolean);
  
  if (attachmentEntries.length > 0) {
    formData.attachments = attachmentEntries;
  }

  // Extract cost data
  if (blocks.cost) {
    formData.cost = blocks.cost;
  }

  // Extract reminder data
  if (blocks.reminder) {
    formData.reminder = blocks.reminder;
  }

  // Extract recurrence data
  if (blocks.recurrence) {
    formData.recurrence = blocks.recurrence;
  }
}

/**
 * Utility function to validate ActivityFormData before mapping
 */
export function validateFormData(formData: Partial<ActivityFormData>): formData is ActivityFormData {
  const errors: string[] = [];

  if (!formData.petId) errors.push('Pet ID is required');
  if (!formData.title?.trim()) errors.push('Title is required');
  if (!formData.category) errors.push('Category is required');
  if (!formData.templateId) errors.push('Template ID is required');
  if (!formData.activityDate) errors.push('Activity date is required');

  if (errors.length > 0) {
    throw new MappingError(`Form validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Utility function to clean up form data before submission
 * Removes empty strings, null values, and normalizes data
 */
export function cleanFormData(formData: ActivityFormData): ActivityFormData {
  const cleaned = { ...formData };

  // Clean up string fields
  if (cleaned.title) cleaned.title = cleaned.title.trim();
  if (cleaned.description) {
    cleaned.description = cleaned.description.trim() || undefined;
  }
  if (cleaned.subcategory) cleaned.subcategory = cleaned.subcategory.trim();

  // Clean up blocks object
  if (cleaned.blocks) {
    cleaned.blocks = Object.entries(cleaned.blocks)
      .filter(([_, value]) => {
        // Remove empty, null, or undefined values
        if (value === null || value === undefined || value === '') return false;
        // Remove empty objects
        if (typeof value === 'object' && Object.keys(value).length === 0) return false;
        return true;
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
  }

  return cleaned;
}

/**
 * Utility to compare two ActivityFormData objects for changes
 * Useful for determining if form data has been modified
 */
export function hasFormDataChanged(
  original: ActivityFormData, 
  current: ActivityFormData
): boolean {
  // Quick reference check
  if (original === current) return false;

  // Check simple fields
  const simpleFields: (keyof ActivityFormData)[] = [
    'petId', 'category', 'subcategory', 'templateId', 'title', 'description'
  ];
  
  for (const field of simpleFields) {
    if (original[field] !== current[field]) {
      return true;
    }
  }

  // Check date (convert to ISO string for comparison)
  if (original.activityDate.getTime() !== current.activityDate.getTime()) {
    return true;
  }

  // Deep comparison of blocks (simplified)
  if (JSON.stringify(original.blocks) !== JSON.stringify(current.blocks)) {
    return true;
  }

  return false;
}

/**
 * Create a default ActivityFormData object
 * Useful for initializing new activity forms
 */
export function createDefaultFormData(petId: number, templateId: string): Partial<ActivityFormData> {
  return {
    petId,
    templateId,
    title: '',
    description: undefined,
    activityDate: new Date(),
    blocks: {},
  };
}

// Re-export types for convenience
export type { ActivityFormData, ActivityRecord, MappingError as ActivityMappingError };