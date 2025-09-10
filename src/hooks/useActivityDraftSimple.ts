import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityFormData } from '../lib/types/activities';

// Simplified draft metadata interface
interface DraftMetadata {
  lastSaved: Date;
  petId: number;
  activityId?: number;
  mode: string;
  templateId?: string;
}

// Complete draft structure for the activity editor
interface ActivityDraft {
  data: Partial<ActivityFormData>;
  metadata: DraftMetadata;
}

// Hook return type
interface UseActivityDraftReturn {
  // Draft state
  hasDraft: boolean;
  lastSaved: Date | null;
  isDraftSaving: boolean;

  // Draft operations
  saveDraft: (data: Partial<ActivityFormData>) => Promise<void>;
  loadDraft: () => Partial<ActivityFormData> | null;
  clearDraft: () => void;

  // Auto-save control
  enableAutoSave: (enabled: boolean) => void;
  isAutoSaveEnabled: boolean;
}

/**
 * useActivityDraftSimple - Simplified hook for automatic draft saving and recovery
 *
 * This is a focused implementation for the Activity Pages feature that provides:
 * - Automatic draft saving every 30 seconds when form is dirty
 * - Draft recovery on page reload or navigation return
 * - Draft cleanup after successful save
 * - Support for multiple drafts per pet/activity combination
 *
 * Usage in ActivityEditorCore:
 * ```tsx
 * const draft = useActivityDraftSimple({
 *   petId: 1,
 *   activityId: undefined, // or specific ID for editing
 *   mode: 'guided',
 *   templateId: 'meal-template'
 * });
 *
 * // Use in auto-save effect
 * useEffect(() => {
 *   if (isDirty && isValid) {
 *     draft.saveDraft(getValues());
 *   }
 * }, [isDirty, isValid, getValues()]);
 * ```
 */
export function useActivityDraftSimple({
  petId,
  activityId,
  mode,
  templateId,
}: {
  petId: number;
  activityId?: number;
  mode: string;
  templateId?: string;
}): UseActivityDraftReturn {
  // State management
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);

  // Refs for auto-save management
  const savingPromise = useRef<Promise<void> | null>(null);

  // Generate unique draft key for localStorage
  const getDraftKey = useCallback(() => {
    const baseKey = `activity-draft-${petId}`;
    if (activityId) {
      return `${baseKey}-edit-${activityId}`;
    }
    return `${baseKey}-new-${mode}-${templateId || 'default'}`;
  }, [petId, activityId, mode, templateId]);

  // Check for existing draft on mount
  useEffect(() => {
    const draftKey = getDraftKey();
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const draft: ActivityDraft = JSON.parse(stored);
        setHasDraft(true);
        setLastSaved(new Date(draft.metadata.lastSaved));
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
      // Clean up corrupted draft
      localStorage.removeItem(draftKey);
    }
  }, [getDraftKey]);

  // Save draft to localStorage
  const saveDraft = useCallback(
    async (data: Partial<ActivityFormData>) => {
      if (!isAutoSaveEnabled) return;

      const draftKey = getDraftKey();

      // If already saving, wait for it to complete before saving new data
      if (savingPromise.current) {
        await savingPromise.current;
      }

      setIsDraftSaving(true);

      const savePromise = new Promise<void>(resolve => {
        try {
          const draft: ActivityDraft = {
            data: {
              ...data,
              // Ensure core fields are preserved
              petId: data.petId || petId,
            },
            metadata: {
              lastSaved: new Date(),
              petId,
              activityId,
              mode,
              templateId,
            },
          };

          localStorage.setItem(draftKey, JSON.stringify(draft));

          setHasDraft(true);
          setLastSaved(draft.metadata.lastSaved);

          resolve();
        } catch (error) {
          console.error('Failed to save draft:', error);
          resolve(); // Don't throw, just log the error
        }
      });

      savingPromise.current = savePromise;

      await savePromise;

      setIsDraftSaving(false);
      savingPromise.current = null;
    },
    [getDraftKey, petId, activityId, mode, templateId, isAutoSaveEnabled],
  );

  // Load draft from localStorage
  const loadDraft = useCallback((): Partial<ActivityFormData> | null => {
    const draftKey = getDraftKey();
    try {
      const stored = localStorage.getItem(draftKey);
      if (!stored) return null;

      const draft: ActivityDraft = JSON.parse(stored);

      // Verify draft is for the correct context
      if (
        draft.metadata.petId !== petId ||
        draft.metadata.activityId !== activityId ||
        draft.metadata.mode !== mode ||
        draft.metadata.templateId !== templateId
      ) {
        // Draft is for different context, ignore it
        return null;
      }

      return draft.data;
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return null;
    }
  }, [getDraftKey, petId, activityId, mode, templateId]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    const draftKey = getDraftKey();
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      setLastSaved(null);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }, [getDraftKey]);

  // Enable/disable auto-save
  const enableAutoSave = useCallback((enabled: boolean) => {
    setIsAutoSaveEnabled(enabled);
  }, []);

  return {
    // Draft state
    hasDraft,
    lastSaved,
    isDraftSaving,

    // Draft operations
    saveDraft,
    loadDraft,
    clearDraft,

    // Auto-save control
    enableAutoSave,
    isAutoSaveEnabled,
  };
}

/**
 * Utility function to clean up old drafts (can be called on app startup)
 */
export function cleanupOldActivityDrafts(maxAgeHours: number = 24) {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    const draftKeys = keys.filter(key => key.startsWith('activity-draft-'));

    for (const key of draftKeys) {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const draft: ActivityDraft = JSON.parse(stored);
        const savedDate = new Date(draft.metadata.lastSaved);

        if (savedDate < cutoffTime) {
          localStorage.removeItem(key);
          console.log(`Cleaned up old draft: ${key}`);
        }
      } catch (error) {
        // Remove corrupted drafts
        localStorage.removeItem(key);
        console.warn(`Removed corrupted draft: ${key}`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup old drafts:', error);
  }
}

export default useActivityDraftSimple;
