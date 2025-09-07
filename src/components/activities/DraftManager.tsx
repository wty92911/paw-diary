import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  DraftRecoveryDialog, 
  BulkDraftIndicator
} from './DraftIndicator';
import { useToast } from '../ui/toast';

// Types from backend
interface ActivityDraft {
  id: number;
  pet_id: number;
  category: string;
  title?: string;
  description?: string;
  activity_date?: string;
  created_at: string;
  updated_at: string;
}

interface DraftContextType {
  drafts: Map<number, ActivityDraft>;
  loadDrafts: (petId: number) => Promise<void>;
  saveDraft: (petId: number, draftData: any) => Promise<ActivityDraft | null>;
  deleteDraft: (petId: number, draftId: number) => Promise<boolean>;
  getDraftForActivity: (activityId: number) => ActivityDraft | undefined;
  getDraftsForPet: (petId: number) => ActivityDraft[];
  clearAllDrafts: (petId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export function useDraftContext() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraftContext must be used within a DraftProvider');
  }
  return context;
}

interface DraftProviderProps {
  children: React.ReactNode;
  petId?: number;
}

export function DraftProvider({ children, petId }: DraftProviderProps) {
  const [drafts, setDrafts] = useState<Map<number, ActivityDraft>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadDrafts = useCallback(async (targetPetId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const draftList: ActivityDraft[] = await invoke('get_activity_drafts', {
        petId: targetPetId,
        includeTemplates: false,
        limit: 50,
        offset: 0,
      });

      const draftMap = new Map<number, ActivityDraft>();
      draftList.forEach(draft => {
        draftMap.set(draft.id, draft);
      });
      
      setDrafts(draftMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drafts';
      setError(errorMessage);
      addToast({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const saveDraft = useCallback(async (targetPetId: number, draftData: any): Promise<ActivityDraft | null> => {
    try {
      const savedDraft: ActivityDraft = await invoke('save_activity_draft', {
        draftData: {
          pet_id: targetPetId,
          ...draftData,
        }
      });

      setDrafts(prev => new Map(prev.set(savedDraft.id, savedDraft)));
      return savedDraft;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save draft';
      setError(errorMessage);
      addToast({ type: 'error', message: errorMessage });
      return null;
    }
  }, [addToast]);

  const deleteDraft = useCallback(async (targetPetId: number, draftId: number): Promise<boolean> => {
    try {
      await invoke('delete_activity_draft', {
        petId: targetPetId,
        draftId,
      });

      setDrafts(prev => {
        const newMap = new Map(prev);
        newMap.delete(draftId);
        return newMap;
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete draft';
      setError(errorMessage);
      addToast({ type: 'error', message: errorMessage });
      return false;
    }
  }, [addToast]);

  const getDraftForActivity = useCallback((_activityId: number): ActivityDraft | undefined => {
    // This would need additional logic to match drafts to activities
    // For now, return undefined as we don't have that relationship
    return undefined;
  }, []);

  const getDraftsForPet = useCallback((targetPetId: number): ActivityDraft[] => {
    return Array.from(drafts.values()).filter(draft => draft.pet_id === targetPetId);
  }, [drafts]);

  const clearAllDrafts = useCallback(async (targetPetId: number) => {
    const petDrafts = getDraftsForPet(targetPetId);
    
    try {
      await Promise.all(
        petDrafts.map(draft => deleteDraft(targetPetId, draft.id))
      );
      
      addToast({ 
        type: 'success', 
        message: `Cleared ${petDrafts.length} draft${petDrafts.length > 1 ? 's' : ''}` 
      });
    } catch (err) {
      addToast({ 
        type: 'error', 
        message: 'Failed to clear all drafts' 
      });
    }
  }, [getDraftsForPet, deleteDraft, addToast]);

  // Load drafts when petId changes
  useEffect(() => {
    if (petId) {
      loadDrafts(petId);
    }
  }, [petId, loadDrafts]);

  return (
    <DraftContext.Provider value={{
      drafts,
      loadDrafts,
      saveDraft,
      deleteDraft,
      getDraftForActivity,
      getDraftsForPet,
      clearAllDrafts,
      isLoading,
      error,
    }}>
      {children}
    </DraftContext.Provider>
  );
}

// Hook for managing draft recovery
export function useDraftRecovery() {
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<ActivityDraft | null>(null);
  const { deleteDraft } = useDraftContext();

  const promptRecovery = useCallback((draft: ActivityDraft) => {
    setRecoveryDraft(draft);
    setShowRecoveryDialog(true);
  }, []);

  const handleRecover = useCallback((onRecover: (draft: ActivityDraft) => void) => {
    if (recoveryDraft) {
      onRecover(recoveryDraft);
      setShowRecoveryDialog(false);
      setRecoveryDraft(null);
    }
  }, [recoveryDraft]);

  const handleDiscard = useCallback(async () => {
    if (recoveryDraft) {
      await deleteDraft(recoveryDraft.pet_id, recoveryDraft.id);
      setShowRecoveryDialog(false);
      setRecoveryDraft(null);
    }
  }, [recoveryDraft, deleteDraft]);

  const RecoveryDialog = useCallback(({ onRecover }: { onRecover: (draft: ActivityDraft) => void }) => {
    if (!recoveryDraft) return null;

    return (
      <DraftRecoveryDialog
        isOpen={showRecoveryDialog}
        onClose={() => setShowRecoveryDialog(false)}
        onRecover={() => handleRecover(onRecover)}
        onDiscard={handleDiscard}
        draftInfo={{
          lastModified: new Date(recoveryDraft.updated_at),
          activityTitle: recoveryDraft.title,
          hasSignificantChanges: !!(recoveryDraft.title || recoveryDraft.description),
        }}
      />
    );
  }, [recoveryDraft, showRecoveryDialog, handleRecover, handleDiscard]);

  return {
    promptRecovery,
    RecoveryDialog,
    isShowingDialog: showRecoveryDialog,
  };
}

// Component for showing bulk draft indicators
interface DraftOverviewProps {
  petId: number;
  className?: string;
  showWhenEmpty?: boolean;
}

export function DraftOverview({ petId, className, showWhenEmpty = false }: DraftOverviewProps) {
  const { getDraftsForPet, clearAllDrafts } = useDraftContext();
  const { promptRecovery } = useDraftRecovery();
  
  const drafts = getDraftsForPet(petId);
  const draftCount = drafts.length;

  if (draftCount === 0 && !showWhenEmpty) return null;

  const handleRecoverAll = () => {
    // Prompt recovery for each draft individually
    drafts.forEach(draft => {
      promptRecovery(draft);
    });
  };

  const handleDiscardAll = async () => {
    if (confirm(`Are you sure you want to discard all ${draftCount} drafts? This cannot be undone.`)) {
      await clearAllDrafts(petId);
    }
  };

  return (
    <BulkDraftIndicator
      draftCount={draftCount}
      onRecoverAll={draftCount > 0 ? handleRecoverAll : undefined}
      onDiscardAll={draftCount > 0 ? handleDiscardAll : undefined}
      className={className}
    />
  );
}

// Hook for auto-saving drafts
export function useAutoSaveDraft(petId: number, delay: number = 3000) {
  const { saveDraft } = useDraftContext();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const timeoutRef = React.useRef<number | null>(null);

  const triggerAutoSave = useCallback(async (draftData: any) => {
    setIsDirty(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      
      try {
        const result = await saveDraft(petId, draftData);
        if (result) {
          setLastSaved(new Date());
          setIsDirty(false);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);
  }, [petId, saveDraft, delay]);

  const forceSave = useCallback(async (draftData: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsSaving(true);
    
    try {
      const result = await saveDraft(petId, draftData);
      if (result) {
        setLastSaved(new Date());
        setIsDirty(false);
      }
      return result;
    } catch (error) {
      console.error('Force save failed:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [petId, saveDraft]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    triggerAutoSave,
    forceSave,
    lastSaved,
    isSaving,
    isDirty,
  };
}