/* eslint-disable react-refresh/only-export-components */
// FormContext provides both the context and related hooks
// Splitting them would cause circular dependencies
import React, { createContext, useContext, type ReactNode } from 'react';
import {
  type Control,
  type FieldErrors,
  type UseFormWatch, 
  type UseFormSetValue,
  type UseFormGetValues,
  type UseFormTrigger,
  type FieldPath
} from 'react-hook-form';
import { type ActivityFormData, type ActivityTemplate, type ActivityBlockData } from '../../../lib/types/activities';

// Form context interface
export interface FormContextValue {
  // React Hook Form methods
  control: Control<ActivityFormData>;
  errors: FieldErrors<ActivityFormData>;
  watch: UseFormWatch<ActivityFormData>;
  setValue: UseFormSetValue<ActivityFormData>;
  getValues: UseFormGetValues<ActivityFormData>;
  trigger: UseFormTrigger<ActivityFormData>;
  
  // Activity-specific state
  template?: ActivityTemplate;
  petId?: number;
  mode: 'quick' | 'guided' | 'advanced';
  
  // Form state
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  
  // Block interaction helpers
  focusField: (fieldName: FieldPath<ActivityFormData>) => void;
  scrollToField: (fieldName: FieldPath<ActivityFormData>) => void;
  validateField: (fieldName: FieldPath<ActivityFormData>) => Promise<boolean>;
  
  // Draft management
  saveDraft: () => Promise<void>;
  isDraftSaving: boolean;
  lastDraftSave?: Date;

  // Form actions
  onFieldChange: (fieldName: FieldPath<ActivityFormData>, value: ActivityBlockData) => void;
  onFieldBlur: (fieldName: FieldPath<ActivityFormData>) => void;
  onFieldFocus: (fieldName: FieldPath<ActivityFormData>) => void;
}

// Create the context
const FormContext = createContext<FormContextValue | undefined>(undefined);

// Props for the FormProvider
export interface FormProviderProps {
  children: ReactNode;
  control: Control<ActivityFormData>;
  errors: FieldErrors<ActivityFormData>;
  watch: UseFormWatch<ActivityFormData>;
  setValue: UseFormSetValue<ActivityFormData>;
  getValues: UseFormGetValues<ActivityFormData>;
  trigger: UseFormTrigger<ActivityFormData>;
  template?: ActivityTemplate;
  petId?: number;
  mode: 'quick' | 'guided' | 'advanced';
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  saveDraft?: () => Promise<void>;
  isDraftSaving?: boolean;
  lastDraftSave?: Date;
}

// FormProvider component
export const FormProvider: React.FC<FormProviderProps> = ({
  children,
  control,
  errors,
  watch,
  setValue,
  getValues,
  trigger,
  template,
  petId,
  mode,
  isSubmitting,
  isDirty,
  isValid,
  saveDraft,
  isDraftSaving = false,
  lastDraftSave,
}) => {
  // Helper function to focus a field
  const focusField = React.useCallback((fieldName: FieldPath<ActivityFormData>) => {
    const element = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, []);

  // Helper function to scroll to a field
  const scrollToField = React.useCallback((fieldName: FieldPath<ActivityFormData>) => {
    const element = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Helper function to validate a specific field
  const validateField = React.useCallback(async (fieldName: FieldPath<ActivityFormData>) => {
    try {
      return await trigger(fieldName);
    } catch (error) {
      console.error('Field validation error:', error);
      return false;
    }
  }, [trigger]);

  // Default draft save function
  const defaultSaveDraft = React.useCallback(async () => {
    console.warn('No draft save function provided');
  }, []);

  // Field change handler with auto-save
  const onFieldChange = React.useCallback((fieldName: FieldPath<ActivityFormData>, value: ActivityBlockData) => {
    setValue(fieldName, value);

    // Auto-save draft after a delay (debounced in the parent component)
    if (saveDraft && isDirty) {
      saveDraft();
    }
  }, [setValue, saveDraft, isDirty]);

  // Field blur handler
  const onFieldBlur = React.useCallback((fieldName: FieldPath<ActivityFormData>) => {
    // Validate field on blur
    validateField(fieldName);
    
    // Save draft on blur
    if (saveDraft && isDirty) {
      saveDraft();
    }
  }, [validateField, saveDraft, isDirty]);

  // Field focus handler
  const onFieldFocus = React.useCallback((fieldName: FieldPath<ActivityFormData>) => {
    // Could be used for analytics or UI feedback
    console.debug(`Field focused: ${fieldName}`);
  }, []);

  const contextValue: FormContextValue = {
    // React Hook Form methods
    control,
    errors,
    watch,
    setValue,
    getValues,
    trigger,
    
    // Activity-specific state
    template,
    petId,
    mode,
    
    // Form state
    isSubmitting,
    isDirty,
    isValid,
    
    // Block interaction helpers
    focusField,
    scrollToField,
    validateField,
    
    // Draft management
    saveDraft: saveDraft || defaultSaveDraft,
    isDraftSaving,
    lastDraftSave,
    
    // Form actions
    onFieldChange,
    onFieldBlur,
    onFieldFocus,
  };

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

// Hook to use the form context
export const useFormContext = (): FormContextValue => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

// Hook to get field-specific props
export const useFieldProps = (fieldName: FieldPath<ActivityFormData>) => {
  const { errors, onFieldChange, onFieldBlur, onFieldFocus, validateField } = useFormContext();

  const errorObj = errors as Record<string, { message?: string }>;
  const error = errorObj[fieldName]?.message;
  const hasError = !!error;

  return {
    error,
    hasError,
    onChange: (value: ActivityBlockData) => onFieldChange(fieldName, value),
    onBlur: () => onFieldBlur(fieldName),
    onFocus: () => onFieldFocus(fieldName),
    validate: () => validateField(fieldName),
    'aria-invalid': hasError ? 'true' : 'false',
    'aria-describedby': hasError ? `${fieldName}-error` : undefined,
  };
};

// Hook for block-level form state
export const useBlockState = (blockId: string) => {
  const { watch, errors, setValue, getValues } = useFormContext();

  const value = watch(blockId as FieldPath<ActivityFormData>);
  const errorObj = errors as Record<string, { message?: string }>;
  const error = errorObj[blockId]?.message;
  const hasError = !!error;

  const updateValue = React.useCallback((newValue: ActivityBlockData) => {
    setValue(blockId as FieldPath<ActivityFormData>, newValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [blockId, setValue]);
  
  const getValue = React.useCallback(() => {
    return getValues(blockId as FieldPath<ActivityFormData>);
  }, [blockId, getValues]);
  
  return {
    value,
    error,
    hasError,
    updateValue,
    getValue,
  };
};

// Hook for template-aware form state
export const useTemplateContext = () => {
  const { template, mode, petId } = useFormContext();
  
  const getBlockConfig = React.useCallback((blockType: string) => {
    if (!template) return undefined;
    
    const block = template.blocks.find(b => b.type === blockType);
    return block?.config;
  }, [template]);
  
  const isBlockRequired = React.useCallback((blockType: string) => {
    if (!template) return false;
    
    const block = template.blocks.find(b => b.type === blockType);
    return block?.required || false;
  }, [template]);
  
  const getBlockById = React.useCallback((blockId: string) => {
    if (!template) return undefined;
    
    return template.blocks.find(b => b.id === blockId);
  }, [template]);
  
  return {
    template,
    mode,
    petId,
    getBlockConfig,
    isBlockRequired,
    getBlockById,
  };
};

// Hook for draft state management
export const useDraftState = () => {
  const { 
    saveDraft, 
    isDraftSaving, 
    lastDraftSave, 
    isDirty,
    isValid 
  } = useFormContext();
  
  const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(true);
  
  // Auto-save effect (debounced)
  React.useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !isValid) return;
    
    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 3000); // 3 second delay
    
    return () => clearTimeout(timeoutId);
  }, [isDirty, isValid, autoSaveEnabled, saveDraft]);
  
  return {
    saveDraft,
    isDraftSaving,
    lastDraftSave,
    autoSaveEnabled,
    setAutoSaveEnabled,
  };
};

export default FormContext;