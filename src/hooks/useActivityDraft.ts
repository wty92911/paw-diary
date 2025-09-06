import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityCategory } from '../lib/types/activities';

// Draft interface
export interface ActivityDraft {
  id: string; // Draft ID for identification
  petId: number;
  category: ActivityCategory;
  subcategory: string;
  title: string;
  timestamp: Date;
  blocks: Record<string, any>;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  lastModified: Date;
  version: number; // For conflict resolution
}

// Draft creation input
export interface ActivityDraftInput {
  petId: number;
  category: ActivityCategory;
  subcategory?: string;
  title?: string;
  timestamp?: Date;
  blocks?: Record<string, any>;
  notes?: string;
  tags?: string[];
}

// Draft storage service
class ActivityDraftService {
  private readonly STORAGE_KEY = 'paw-diary-activity-drafts';
  private readonly MAX_DRAFTS_PER_PET = 5;
  private readonly DRAFT_EXPIRY_DAYS = 7;

  // Load all drafts from localStorage
  private loadDrafts(): Record<string, ActivityDraft> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const drafts = JSON.parse(stored);

        // Convert date strings back to Date objects
        Object.values(drafts).forEach((draft: any) => {
          draft.timestamp = new Date(draft.timestamp);
          draft.createdAt = new Date(draft.createdAt);
          draft.lastModified = new Date(draft.lastModified);
        });

        return drafts;
      }
    } catch (error) {
      console.warn('Failed to load activity drafts:', error);
    }
    return {};
  }

  // Save drafts to localStorage
  private saveDrafts(drafts: Record<string, ActivityDraft>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.warn('Failed to save activity drafts:', error);
    }
  }

  // Generate unique draft ID
  private generateDraftId(): string {
    return `draft-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // Clean expired drafts
  private cleanExpiredDrafts(): void {
    const drafts = this.loadDrafts();
    const now = new Date();
    const expiryTime = this.DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    let hasExpired = false;
    Object.keys(drafts).forEach(id => {
      const draft = drafts[id];
      if (now.getTime() - draft.lastModified.getTime() > expiryTime) {
        delete drafts[id];
        hasExpired = true;
      }
    });

    if (hasExpired) {
      this.saveDrafts(drafts);
    }
  }

  // Create new draft
  createDraft(input: ActivityDraftInput): ActivityDraft {
    this.cleanExpiredDrafts();

    const now = new Date();
    const draft: ActivityDraft = {
      id: this.generateDraftId(),
      petId: input.petId,
      category: input.category,
      subcategory: input.subcategory || '',
      title: input.title || '',
      timestamp: input.timestamp || now,
      blocks: input.blocks || {},
      notes: input.notes,
      tags: input.tags,
      createdAt: now,
      lastModified: now,
      version: 1,
    };

    const drafts = this.loadDrafts();
    drafts[draft.id] = draft;

    // Limit drafts per pet
    this.limitDraftsPerPet(drafts, input.petId);

    this.saveDrafts(drafts);
    return draft;
  }

  // Update existing draft
  updateDraft(id: string, updates: Partial<ActivityDraftInput>): ActivityDraft | null {
    const drafts = this.loadDrafts();
    const existing = drafts[id];

    if (!existing) {
      return null;
    }

    const updatedDraft: ActivityDraft = {
      ...existing,
      ...updates,
      timestamp: updates.timestamp ? new Date(updates.timestamp) : existing.timestamp,
      lastModified: new Date(),
      version: existing.version + 1,
    };

    drafts[id] = updatedDraft;
    this.saveDrafts(drafts);
    return updatedDraft;
  }

  // Get draft by ID
  getDraft(id: string): ActivityDraft | null {
    const drafts = this.loadDrafts();
    return drafts[id] || null;
  }

  // Get all drafts for a pet
  getDraftsForPet(petId: number): ActivityDraft[] {
    this.cleanExpiredDrafts();
    const drafts = this.loadDrafts();

    return Object.values(drafts)
      .filter(draft => draft.petId === petId)
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  // Delete draft
  deleteDraft(id: string): boolean {
    const drafts = this.loadDrafts();
    if (drafts[id]) {
      delete drafts[id];
      this.saveDrafts(drafts);
      return true;
    }
    return false;
  }

  // Delete all drafts for a pet
  deleteDraftsForPet(petId: number): void {
    const drafts = this.loadDrafts();
    let hasDeleted = false;

    Object.keys(drafts).forEach(id => {
      if (drafts[id].petId === petId) {
        delete drafts[id];
        hasDeleted = true;
      }
    });

    if (hasDeleted) {
      this.saveDrafts(drafts);
    }
  }

  // Limit number of drafts per pet
  private limitDraftsPerPet(drafts: Record<string, ActivityDraft>, petId: number): void {
    const petDrafts = Object.values(drafts)
      .filter(draft => draft.petId === petId)
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    // Remove excess drafts (keep most recent)
    if (petDrafts.length > this.MAX_DRAFTS_PER_PET) {
      const toRemove = petDrafts.slice(this.MAX_DRAFTS_PER_PET);
      toRemove.forEach(draft => {
        delete drafts[draft.id];
      });
    }
  }

  // Check if draft has unsaved changes compared to a reference
  hasUnsavedChanges(draft: ActivityDraft, reference: Partial<ActivityDraftInput>): boolean {
    // Simple comparison of key fields
    const fieldsToCheck: Array<keyof ActivityDraftInput> = ['title', 'subcategory', 'notes'];

    for (const field of fieldsToCheck) {
      if (draft[field] !== reference[field]) {
        return true;
      }
    }

    // Compare timestamps (within 1 minute tolerance)
    if (reference.timestamp) {
      const timeDiff = Math.abs(
        draft.timestamp.getTime() - new Date(reference.timestamp).getTime(),
      );
      if (timeDiff > 60000) {
        // 1 minute
        return true;
      }
    }

    // Compare blocks (shallow comparison)
    if (reference.blocks) {
      const draftBlocks = Object.keys(draft.blocks);
      const refBlocks = Object.keys(reference.blocks);

      if (draftBlocks.length !== refBlocks.length) {
        return true;
      }

      for (const blockId of draftBlocks) {
        if (JSON.stringify(draft.blocks[blockId]) !== JSON.stringify(reference.blocks[blockId])) {
          return true;
        }
      }
    }

    // Compare tags
    if (reference.tags) {
      const draftTags = draft.tags || [];
      if (
        draftTags.length !== reference.tags.length ||
        !draftTags.every((tag, index) => tag === reference.tags![index])
      ) {
        return true;
      }
    }

    return false;
  }

  // Get statistics
  getStats(): {
    totalDrafts: number;
    draftsByPet: Record<number, number>;
    oldestDraft: Date | null;
    newestDraft: Date | null;
  } {
    const drafts = Object.values(this.loadDrafts());
    const draftsByPet: Record<number, number> = {};

    drafts.forEach(draft => {
      draftsByPet[draft.petId] = (draftsByPet[draft.petId] || 0) + 1;
    });

    const sortedByDate = drafts.sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime());

    return {
      totalDrafts: drafts.length,
      draftsByPet,
      oldestDraft: sortedByDate.length > 0 ? sortedByDate[0].lastModified : null,
      newestDraft:
        sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].lastModified : null,
    };
  }
}

// Global service instance
const draftService = new ActivityDraftService();

// Hook options interface
export interface UseActivityDraftOptions {
  autoSave?: boolean;
  autoSaveDelay?: number; // milliseconds
  onSave?: (draft: ActivityDraft) => void;
  onError?: (error: Error) => void;
}

// Main draft hook
export function useActivityDraft(
  initialData?: ActivityDraftInput,
  options: UseActivityDraftOptions = {},
) {
  const {
    autoSave = true,
    autoSaveDelay = 2000, // 2 seconds
    onSave,
    onError,
  } = options;

  // State
  const [draft, setDraft] = useState<ActivityDraft | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for auto-save
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalDataRef = useRef<ActivityDraftInput | null>(null);

  // Initialize draft
  useEffect(() => {
    if (initialData && !draft) {
      try {
        const newDraft = draftService.createDraft(initialData);
        setDraft(newDraft);
        setLastSaved(newDraft.lastModified);
        originalDataRef.current = { ...initialData };
        onSave?.(newDraft);
      } catch (error) {
        onError?.(error as Error);
      }
    }
  }, [initialData, draft, onSave, onError]);

  // Auto-save logic
  useEffect(() => {
    if (!autoSave || !draft || !isDirty) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      await saveDraft();
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [draft, isDirty, autoSave, autoSaveDelay]);

  // Save draft function
  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!draft) return false;

    setIsSaving(true);
    try {
      const savedDraft = draftService.updateDraft(draft.id, {
        petId: draft.petId,
        category: draft.category,
        subcategory: draft.subcategory,
        title: draft.title,
        timestamp: draft.timestamp,
        blocks: draft.blocks,
        notes: draft.notes,
        tags: draft.tags,
      });

      if (savedDraft) {
        setDraft(savedDraft);
        setIsDirty(false);
        setLastSaved(savedDraft.lastModified);
        onSave?.(savedDraft);
        return true;
      }
      return false;
    } catch (error) {
      onError?.(error as Error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [draft, onSave, onError]);

  // Update draft fields
  const updateField = useCallback(
    <K extends keyof ActivityDraftInput>(field: K, value: ActivityDraftInput[K]) => {
      if (!draft) return;

      const updatedDraft = { ...draft, [field]: value };
      setDraft(updatedDraft);
      setIsDirty(true);
    },
    [draft],
  );

  // Update blocks
  const updateBlock = useCallback(
    (blockId: string, blockData: any) => {
      if (!draft) return;

      const updatedBlocks = { ...draft.blocks, [blockId]: blockData };
      const updatedDraft = { ...draft, blocks: updatedBlocks };
      setDraft(updatedDraft);
      setIsDirty(true);
    },
    [draft],
  );

  // Remove block
  const removeBlock = useCallback(
    (blockId: string) => {
      if (!draft) return;

      const updatedBlocks = { ...draft.blocks };
      delete updatedBlocks[blockId];
      const updatedDraft = { ...draft, blocks: updatedBlocks };
      setDraft(updatedDraft);
      setIsDirty(true);
    },
    [draft],
  );

  // Reset draft to last saved state
  const resetDraft = useCallback(() => {
    if (!draft) return;

    const savedDraft = draftService.getDraft(draft.id);
    if (savedDraft) {
      setDraft(savedDraft);
      setIsDirty(false);
    }
  }, [draft]);

  // Delete current draft
  const deleteDraft = useCallback(() => {
    if (!draft) return false;

    const deleted = draftService.deleteDraft(draft.id);
    if (deleted) {
      setDraft(null);
      setIsDirty(false);
      setLastSaved(null);
    }
    return deleted;
  }, [draft]);

  // Check if has unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!draft || !originalDataRef.current) return false;
    return draftService.hasUnsavedChanges(draft, originalDataRef.current);
  }, [draft]);

  // Force save (bypass auto-save delay)
  const forceSave = useCallback(async (): Promise<boolean> => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    return await saveDraft();
  }, [saveDraft]);

  return {
    // State
    draft,
    isDirty,
    isSaving,
    lastSaved,

    // Actions
    updateField,
    updateBlock,
    removeBlock,
    saveDraft: forceSave,
    resetDraft,
    deleteDraft,

    // Utilities
    hasUnsavedChanges: hasUnsavedChanges(),

    // Auto-save info
    autoSaveEnabled: autoSave,
    autoSaveDelay,
  };
}

// Hook to load existing draft
export function useLoadActivityDraft(draftId: string) {
  const [draft, setDraft] = useState<ActivityDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      const loadedDraft = draftService.getDraft(draftId);
      setDraft(loadedDraft);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  return { draft, isLoading, error };
}

// Hook to list drafts for a pet
export function useActivityDrafts(petId: number) {
  const [drafts, setDrafts] = useState<ActivityDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDrafts = useCallback(() => {
    setIsLoading(true);
    try {
      const petDrafts = draftService.getDraftsForPet(petId);
      setDrafts(petDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  const deleteDraft = useCallback(
    (draftId: string) => {
      const success = draftService.deleteDraft(draftId);
      if (success) {
        refreshDrafts();
      }
      return success;
    },
    [refreshDrafts],
  );

  const deleteAllDrafts = useCallback(() => {
    draftService.deleteDraftsForPet(petId);
    refreshDrafts();
  }, [petId, refreshDrafts]);

  return {
    drafts,
    isLoading,
    refreshDrafts,
    deleteDraft,
    deleteAllDrafts,
  };
}

// Hook for draft statistics
export function useActivityDraftStats() {
  const [stats, setStats] = useState(draftService.getStats());

  const refreshStats = useCallback(() => {
    setStats(draftService.getStats());
  }, []);

  useEffect(() => {
    refreshStats();

    // Refresh stats periodically
    const interval = setInterval(refreshStats, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return { stats, refreshStats };
}

// Export service for direct access
export { draftService as activityDraftService };
