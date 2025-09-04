import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ActivityCategory,
  ActivityFormData,
  ActivityCreateRequest,
  ActivityUpdateRequest,
  Activity,
} from '../lib/types';

// Import all category-specific schemas
import {
  healthActivitySchema,
  type HealthActivityFormData,
} from '../components/activities/forms/HealthActivityForm';
import {
  growthActivitySchema,
  type GrowthActivityFormData,
} from '../components/activities/forms/GrowthActivityForm';
import {
  dietActivitySchema,
  type DietActivityFormData,
} from '../components/activities/forms/DietActivityForm';
import {
  lifestyleActivitySchema,
  type LifestyleActivityFormData,
} from '../components/activities/forms/LifestyleActivityForm';
import {
  expenseActivitySchema,
  type ExpenseActivityFormData,
} from '../components/activities/forms/ExpenseActivityForm';

// Base activity form schema for common fields
const baseActivitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  category: z.nativeEnum(ActivityCategory),
  subcategory: z.string().min(1, 'Subcategory is required').max(100, 'Subcategory too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  cost: z.number().min(0, 'Cost cannot be negative').optional(),
  currency: z.string().max(3, 'Currency code too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  mood_rating: z.number().min(1).max(5).optional(),
});

// Combined schema that includes base fields and category-specific data
const createCombinedSchema = (category: ActivityCategory) => {
  const categorySchemas = {
    [ActivityCategory.Health]: healthActivitySchema,
    [ActivityCategory.Growth]: growthActivitySchema,
    [ActivityCategory.Diet]: dietActivitySchema,
    [ActivityCategory.Lifestyle]: lifestyleActivitySchema,
    [ActivityCategory.Expense]: expenseActivitySchema,
  };

  return baseActivitySchema.extend({
    activity_data: categorySchemas[category].optional(),
  });
};

// Union type for all category-specific form data
type CategoryFormData =
  | HealthActivityFormData
  | GrowthActivityFormData
  | DietActivityFormData
  | LifestyleActivityFormData
  | ExpenseActivityFormData;

// Extended form data interface
interface ExtendedActivityFormData extends ActivityFormData {
  activity_data?: CategoryFormData;
}

export interface UseActivityFormState {
  // Form state
  form: UseFormReturn<ExtendedActivityFormData>;
  selectedCategory?: ActivityCategory;
  isDirty: boolean;
  isValid: boolean;

  // Draft and persistence
  isDraftSaved: boolean;
  draftKey: string;
  lastSaved: number;

  // Attachments
  attachments: File[];
  uploadProgress: Record<string, number>;
  maxAttachments: number;
  maxFileSize: number;

  // UI state
  isSubmitting: boolean;
  error: string | null;
}

export interface UseActivityFormActions {
  // Category management
  setCategory: (category: ActivityCategory) => void;
  resetCategoryData: () => void;

  // Draft management
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;
  setAutoSave: (enabled: boolean) => void;

  // Attachment management
  addAttachments: (files: File[]) => void;
  removeAttachment: (index: number) => void;
  clearAttachments: () => void;
  setUploadProgress: (fileName: string, progress: number) => void;

  // Form operations
  resetForm: (data?: Partial<ExtendedActivityFormData>) => void;
  submitForm: (
    onSubmit: (data: ActivityCreateRequest | ActivityUpdateRequest) => Promise<void>,
  ) => Promise<void>;

  // Data transformation
  toCreateRequest: (petId: number) => ActivityCreateRequest;
  toUpdateRequest: (activityId: number) => ActivityUpdateRequest;
  fromActivity: (activity: Activity) => void;

  // Validation
  validateField: (field: keyof ExtendedActivityFormData) => Promise<boolean>;
  validateCategory: () => boolean;

  // State management
  clearError: () => void;
  setError: (error: string) => void;
}

const DRAFT_PREFIX = 'activity_form_draft_';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useActivityForm(
  initialCategory?: ActivityCategory,
  petId?: number,
  activityId?: number, // For editing existing activities
): UseActivityFormState & UseActivityFormActions {
  // Generate unique draft key
  const draftKey = useMemo(() => {
    const key = activityId ? `edit_${activityId}` : `new_${petId || 'unknown'}`;
    return `${DRAFT_PREFIX}${key}`;
  }, [activityId, petId]);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | undefined>(
    initialCategory,
  );
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgressState] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Create dynamic schema based on selected category
  const currentSchema = useMemo(() => {
    return selectedCategory ? createCombinedSchema(selectedCategory) : baseActivitySchema;
  }, [selectedCategory]);

  // Initialize form with dynamic schema
  const form = useForm<ExtendedActivityFormData>({
    resolver: zodResolver(currentSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      category: selectedCategory,
      subcategory: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      cost: undefined,
      currency: 'USD',
      location: '',
      mood_rating: undefined,
      activity_data: undefined,
    },
  });

  const { formState, watch, reset, handleSubmit, setValue, trigger } = form;
  const { isDirty, isValid } = formState;

  // Watch all form values for auto-save
  const watchedValues = watch();

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) return;

    const timeoutId = setTimeout(() => {
      saveDraft();
    }, AUTO_SAVE_INTERVAL);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, isDirty, autoSaveEnabled]);

  // Category management
  const setCategory = useCallback(
    (category: ActivityCategory) => {
      setSelectedCategory(category);
      setValue('category', category);

      // Reset category-specific data when changing categories
      setValue('activity_data', undefined);

      // Update subcategory to empty and let user select
      setValue('subcategory', '');

      // Trigger validation
      trigger(['category', 'subcategory']);
    },
    [setValue, trigger],
  );

  const resetCategoryData = useCallback(() => {
    setValue('activity_data', undefined);
    trigger('activity_data');
  }, [setValue, trigger]);

  // Draft management
  const saveDraft = useCallback(() => {
    try {
      const draftData = {
        ...watchedValues,
        attachments: attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })), // Store file metadata only
        savedAt: Date.now(),
      };

      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setIsDraftSaved(true);
      setLastSaved(Date.now());
      console.log('Draft saved successfully');
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  }, [draftKey, watchedValues, attachments]);

  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (!savedDraft) return false;

      const draftData = JSON.parse(savedDraft);

      // Restore form data
      reset(draftData);
      setSelectedCategory(draftData.category);
      setLastSaved(draftData.savedAt || 0);
      setIsDraftSaved(true);

      console.log('Draft loaded successfully');
      return true;
    } catch (err) {
      console.error('Failed to load draft:', err);
      return false;
    }
  }, [draftKey, reset]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setIsDraftSaved(false);
      setLastSaved(0);
      console.log('Draft cleared successfully');
    } catch (err) {
      console.error('Failed to clear draft:', err);
    }
  }, [draftKey]);

  const setAutoSave = useCallback((enabled: boolean) => {
    setAutoSaveEnabled(enabled);
  }, []);

  // Attachment management
  const addAttachments = useCallback(
    (files: File[]) => {
      const totalFiles = attachments.length + files.length;
      if (totalFiles > MAX_ATTACHMENTS) {
        setErrorState(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
        return;
      }

      const validFiles = files.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          setErrorState(
            `File ${file.name} is too large (max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`,
          );
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setAttachments(prev => [...prev, ...validFiles]);
        setErrorState(null);
      }
    },
    [attachments.length],
  );

  const removeAttachment = useCallback(
    (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));

      // Clear upload progress for removed file
      const removedFile = attachments[index];
      if (removedFile) {
        setUploadProgressState(prev => {
          const updated = { ...prev };
          delete updated[removedFile.name];
          return updated;
        });
      }
    },
    [attachments],
  );

  const clearAttachments = useCallback(() => {
    setAttachments([]);
    setUploadProgressState({});
  }, []);

  const setUploadProgress = useCallback((fileName: string, progress: number) => {
    setUploadProgressState(prev => ({
      ...prev,
      [fileName]: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  // Form operations
  // Data transformation functions (defined before submitForm)
  const toCreateRequest = useCallback(
    (targetPetId: number): ActivityCreateRequest => {
      const formData = form.getValues();

      // Combine date and time into ISO datetime
      const activityDate = new Date(`${formData.date}T${formData.time}`).toISOString();

      return {
        pet_id: targetPetId,
        category: formData.category,
        subcategory: formData.subcategory,
        title: formData.title,
        description: formData.description,
        activity_date: activityDate,
        activity_data: formData.activity_data as Record<string, unknown>,
        cost: formData.cost,
        currency: formData.currency,
        location: formData.location,
        mood_rating: formData.mood_rating as 1 | 2 | 3 | 4 | 5,
      };
    },
    [form],
  );

  const toUpdateRequest = useCallback(
    (_targetActivityId: number): ActivityUpdateRequest => {
      const formData = form.getValues();

      // Combine date and time into ISO datetime
      const activityDate = new Date(`${formData.date}T${formData.time}`).toISOString();

      return {
        title: formData.title,
        subcategory: formData.subcategory,
        description: formData.description,
        activity_date: activityDate,
        activity_data: formData.activity_data as Record<string, unknown>,
        cost: formData.cost,
        currency: formData.currency,
        location: formData.location,
        mood_rating: formData.mood_rating as 1 | 2 | 3 | 4 | 5,
      };
    },
    [form],
  );

  const resetForm = useCallback(
    (data?: Partial<ExtendedActivityFormData>) => {
      const defaultData: ExtendedActivityFormData = {
        title: '',
        category: selectedCategory || ActivityCategory.Health,
        subcategory: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        cost: undefined,
        currency: 'USD',
        location: '',
        mood_rating: undefined,
        activity_data: undefined,
        ...data,
      };

      reset(defaultData);
      clearAttachments();
      clearDraft();
      setErrorState(null);
    },
    [selectedCategory, reset, clearAttachments, clearDraft],
  );

  const submitForm = useCallback(
    async (onSubmit: (data: ActivityCreateRequest | ActivityUpdateRequest) => Promise<void>) => {
      setIsSubmitting(true);
      setErrorState(null);

      try {
        await handleSubmit(async () => {
          const requestData = activityId ? toUpdateRequest(activityId) : toCreateRequest(petId!);

          await onSubmit(requestData);
          clearDraft(); // Clear draft after successful submission
        })();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit form';
        setErrorState(errorMessage);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleSubmit, activityId, petId, clearDraft, toUpdateRequest, toCreateRequest],
  );

  const fromActivity = useCallback(
    (activity: Activity) => {
      const activityDate = new Date(activity.activity_date);

      const formData: ExtendedActivityFormData = {
        title: activity.title,
        category: activity.category,
        subcategory: activity.subcategory,
        description: activity.description || '',
        date: activityDate.toISOString().split('T')[0],
        time: activityDate.toTimeString().slice(0, 5),
        cost: activity.cost,
        currency: activity.currency || 'USD',
        location: activity.location || '',
        mood_rating: activity.mood_rating,
        activity_data: activity.activity_data,
      };

      reset(formData);
      setSelectedCategory(activity.category);
    },
    [reset],
  );

  // Validation
  const validateField = useCallback(
    async (field: keyof ExtendedActivityFormData): Promise<boolean> => {
      return trigger(field);
    },
    [trigger],
  );

  const validateCategory = useCallback((): boolean => {
    return selectedCategory !== undefined;
  }, [selectedCategory]);

  // State management
  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const setError = useCallback((newError: string) => {
    setErrorState(newError);
  }, []);

  // Load draft on mount if available
  useEffect(() => {
    if (!activityId) {
      // Only load drafts for new activities
      loadDraft();
    }
  }, [loadDraft, activityId]);

  return {
    // State
    form,
    selectedCategory,
    isDirty,
    isValid,
    isDraftSaved,
    draftKey,
    lastSaved,
    attachments,
    uploadProgress,
    maxAttachments: MAX_ATTACHMENTS,
    maxFileSize: MAX_FILE_SIZE,
    isSubmitting,
    error,

    // Actions
    setCategory,
    resetCategoryData,
    saveDraft,
    loadDraft,
    clearDraft,
    setAutoSave,
    addAttachments,
    removeAttachment,
    clearAttachments,
    setUploadProgress,
    resetForm,
    submitForm,
    toCreateRequest,
    toUpdateRequest,
    fromActivity,
    validateField,
    validateCategory,
    clearError,
    setError,
  };
}
