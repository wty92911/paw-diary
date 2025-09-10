import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useActivityDraftSimple } from '../../hooks/useActivityDraftSimple';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { LoadingSpinner } from '../ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { ChevronDown, Activity, AlertCircle } from 'lucide-react';
import { 
  ActivityEditorProps, 
  ActivityFormData, 
  ActivityTemplate, 
  ActivityMode,
  ActivityCategory 
} from '../../lib/types/activities';
import { activityFormValidationSchema } from '../../lib/validation/activityBlocks';
import { templateRegistry } from '../../lib/activityTemplates';
import { MultiBlockRenderer } from './BlockRenderer';
import { FormProvider as ActivityFormProvider } from './blocks/FormContext';
import { TemplatePicker } from './TemplatePicker';

// Enhanced props for page context
export interface ActivityEditorCoreProps extends Omit<ActivityEditorProps, 'onCancel'> {
  className?: string;
}

/**
 * ActivityEditorCore - Enhanced ActivityEditor for full-screen page usage
 * 
 * This component extracts the core functionality from ActivityEditor but removes
 * the Dialog wrapper and adds enhancements for page context usage including:
 * - Pet context validation
 * - Unsaved changes detection
 * - Full-screen layout optimization
 * - Enhanced navigation handling
 */
const ActivityEditorCore: React.FC<ActivityEditorCoreProps> = ({
  mode,
  templateId,
  activityId,
  petId,
  onSave,
  initialData,
  className,
}) => {
  // State management
  const [selectedTemplate, setSelectedTemplate] = React.useState<ActivityTemplate>(
    templateRegistry.getTemplate(templateId as string)
  );
  const [currentMode, setCurrentMode] = React.useState<ActivityMode>(mode);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // Draft management
  const draft = useActivityDraftSimple({
    petId,
    activityId,
    mode,
    templateId,
  });

  // Load draft data if available
  // const draftData = React.useMemo(() => draft.loadDraft(), [draft]);

  // React Hook Form setup with Zod validation
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormValidationSchema),
    defaultValues: {
      petId: petId,
      category: selectedTemplate?.category || ActivityCategory.Diet,
      subcategory: selectedTemplate?.subcategory || '',
      templateId: selectedTemplate?.id || '',
      blocks: {},
      ...initialData,
      // ...draftData, // Apply draft data if available
    },
    mode: 'onChange', // Validate on change (less aggressive than 'all')
    reValidateMode: 'onChange',
  });

  const { control, handleSubmit, formState, watch, setValue, getValues, trigger } = form;
  const { errors, isDirty, isValid } = formState;


  // Watch for template changes
  const watchedTemplateId = watch('templateId');
  
  React.useEffect(() => {
    if (watchedTemplateId && watchedTemplateId !== selectedTemplate?.id) {
      const newTemplate = templateRegistry.getTemplate(watchedTemplateId);
      setSelectedTemplate(newTemplate);
      
      // Update form values when template changes
      if (newTemplate) {
        setValue('category', newTemplate.category);
        setValue('subcategory', newTemplate.subcategory);
        
        // Trigger form validation after template change
        setTimeout(() => {
          trigger();
        }, 100);
      }
    }
  }, [watchedTemplateId, selectedTemplate, setValue, getValues, trigger]);

  // Check for missing required fields before submission
  const checkRequiredFields = React.useCallback(() => {
    const missingFields: string[] = [];
    
    if (selectedTemplate) {
      selectedTemplate.blocks
        .filter(block => block.required)
        .forEach(block => {
          const blockValue = getValues(`blocks.${block.id}` as any);
          if (blockValue === undefined || blockValue === null || blockValue === '') {
            missingFields.push(block.label || block.id);
          }
        });
    }
    
    return missingFields;
  }, [selectedTemplate, getValues]);

  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    // Pre-submission validation check
    const missingRequired = checkRequiredFields();
    if (missingRequired.length > 0) {
      console.warn('Missing required fields:', missingRequired);
      // Trigger form validation to show errors
      trigger();
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Saving activity:', data);
      await onSave(data);
      draft.clearDraft(); // Clear draft after successful save
    } catch (error) {
      console.error('Failed to save activity:', error);
      // Error handling could be improved with proper error context
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, draft, checkRequiredFields, trigger]);


  // Auto-save draft every 3 seconds when dirty and valid
  React.useEffect(() => {
    if (!isDirty || !isValid) return;

    const timeoutId = setTimeout(() => {
      draft.saveDraft(getValues());
    }, 3000); // 3 seconds as per requirements

    return () => clearTimeout(timeoutId);
  }, [isDirty, isValid, draft, getValues]);

  // Mode switching handlers
  const switchToGuided = () => setCurrentMode('guided');

  // Handle template selection
  const handleTemplateSelect = (template: ActivityTemplate | null) => {
    setSelectedTemplate(template as ActivityTemplate);
    if (template) {
      setValue('templateId', template.id);
      setValue('category', template.category);
      setValue('subcategory', template.subcategory);
      setIsTemplateDialogOpen(false); // Close dialog after selection
    }
  };


  // Render template picker trigger for new activities
  const renderTemplatePickerTrigger = () => {
    if (activityId) return null; // Don't show for editing existing activities

    if (!selectedTemplate) {
      // Show prominent selection prompt when no template is selected
      return (
        <div className="mb-6 text-center py-8">
          <Activity className="w-12 h-12 mx-auto text-orange-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Choose Activity Type</h3>
          <p className="text-sm text-gray-600 mb-6">Select what type of activity you want to record</p>
          
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Activity className="w-4 h-4 mr-2" />
                Select Activity Type
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="max-w-4xl max-h-[80vh] overflow-y-auto"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>Select Activity Type</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <TemplatePicker
                  selectedTemplateId={selectedTemplate ? (selectedTemplate as ActivityTemplate).id : undefined}
                  onTemplateSelect={handleTemplateSelect}
                  petId={petId}
                  syncWithUrl={false}
                  compact={false}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    // Show compact template info with change option when template is selected
    return (
      <div className="mb-4 flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3">
          <span className="text-xl">{selectedTemplate.icon}</span>
          <div>
            <h4 className="font-medium text-orange-900">{selectedTemplate.label}</h4>
            <p className="text-sm text-orange-700">{selectedTemplate.category}</p>
          </div>
        </div>
        
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100">
              Change Type
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-4xl max-h-[80vh] overflow-y-auto"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Select Activity Type</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <TemplatePicker
                selectedTemplateId={selectedTemplate ? (selectedTemplate as ActivityTemplate).id : undefined}
                onTemplateSelect={handleTemplateSelect}
                petId={petId}
                syncWithUrl={false}
                compact={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Render mode-specific interface
  const renderModeInterface = () => {
    if (!selectedTemplate) {
      return (
        <Alert>
          <AlertDescription>
            Please select a template to continue with activity recording.
          </AlertDescription>
        </Alert>
      );
    }

    // Determine which blocks to render based on mode
    let blocksToRender;
    switch (currentMode) {
      case 'quick':
        // Quick mode: Only required blocks or first 2 blocks
        blocksToRender = selectedTemplate.blocks
          .filter(block => block.required)
        if (blocksToRender.length === 0) {
          // Fallback to first 2 blocks if no required blocks
          blocksToRender = selectedTemplate.blocks.slice(0, 2);
        }
        break;
      case 'guided':
        // Guided mode: All template blocks
        blocksToRender = selectedTemplate.blocks;
        break;
      case 'advanced':
        // Advanced mode: All blocks with extended features
        blocksToRender = selectedTemplate.blocks;
        break;
      default:
        blocksToRender = selectedTemplate.blocks;
    }

    return (
      <div className="space-y-6">
        {/* Dynamic blocks based on template and mode */}
        <MultiBlockRenderer
          blocks={blocksToRender}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {/* Mode expansion options for quick mode */}
        {currentMode === 'quick' && selectedTemplate.blocks.length > 2 && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Need more details? This template has {selectedTemplate.blocks.length} total fields.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={switchToGuided}>
                    Show All Fields
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render draft status
  const renderDraftStatus = () => {
    if (!draft.lastSaved && !draft.isDraftSaving) return null;

    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        {draft.isDraftSaving ? (
          <span>Saving draft...</span>
        ) : draft.lastSaved ? (
          <span>Draft saved at {draft.lastSaved.toLocaleTimeString()}</span>
        ) : null}
      </div>
    );
  };

  const isEditing = !!activityId;

  return (
    <FormProvider {...form}>
      <ActivityFormProvider
        control={control}
        errors={errors}
        watch={watch}
        setValue={setValue}
        getValues={getValues}
        trigger={trigger}
        template={selectedTemplate}
        petId={petId}
        mode={currentMode}
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        isValid={isValid}
        saveDraft={async () => {
          if (isDirty) {
            await draft.saveDraft(getValues());
          }
        }}
        isDraftSaving={draft.isDraftSaving}
        lastDraftSave={draft.lastSaved || undefined}
      >
        <div className={className}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Picker Trigger for new activities */}
            {renderTemplatePickerTrigger()}
            
            {renderModeInterface()}
            
            {renderDraftStatus()}

            {/* Form validation hints - Clear and actionable */}
            {(!isValid || isSubmitting) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                    <p className="text-sm text-amber-700">Saving your activity...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-medium text-amber-800">
                        Form validation failed - please fix the issues below:
                      </h4>
                    </div>
                    
                    {/* Check required form fields systematically */}
                    <div className="space-y-2">
                      {/* 1. Template selection is required */}
                      {!selectedTemplate && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <span className="text-red-500">✗</span>
                          <span className="text-sm text-red-700">
                            <strong>Activity Type Required:</strong> Please select an activity type first
                          </span>
                        </div>
                      )}
                      
                      {/* 2. Pet ID validation */}
                      {(!petId || petId < 1) && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <span className="text-red-500">✗</span>
                          <span className="text-sm text-red-700">
                            <strong>Pet Required:</strong> A valid pet must be selected
                          </span>
                        </div>
                      )}
                      
                      {/* 3. Category validation */}
                      {selectedTemplate && errors.category && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <span className="text-red-500">✗</span>
                          <span className="text-sm text-red-700">
                            <strong>Category Error:</strong> {(errors.category as any)?.message || 'Activity category is required'}
                          </span>
                        </div>
                      )}
                      
                      {/* 4. Subcategory validation */}
                      {selectedTemplate && errors.subcategory && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <span className="text-red-500">✗</span>
                          <span className="text-sm text-red-700">
                            <strong>Subcategory Error:</strong> {(errors.subcategory as any)?.message || 'Activity subcategory is required (1-100 characters)'}
                          </span>
                        </div>
                      )}
                      
                      {/* 5. Template ID validation */}
                      {selectedTemplate && errors.templateId && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <span className="text-red-500">✗</span>
                          <span className="text-sm text-red-700">
                            <strong>Template Error:</strong> {(errors.templateId as any)?.message || 'Valid template ID is required'}
                          </span>
                        </div>
                      )}
                      
                      
                      {/* 8. Required template blocks validation */}
                      {selectedTemplate && selectedTemplate.blocks
                        .filter(block => block.required)
                        .map(block => {
                          const blockValue = watch(`blocks.${block.id}` as any);
                          const isEmpty = blockValue === undefined || blockValue === null || blockValue === '';
                          const hasError = errors.blocks?.[block.id];
                          const blockError = hasError ? (typeof hasError === 'object' && hasError && 'message' in hasError ? (hasError as any).message : 'Invalid value') : null;
                          
                          if (!isEmpty && !hasError) {
                            return (
                              <div key={block.id} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                                <span className="text-green-500">✓</span>
                                <span className="text-sm text-green-700">
                                  <strong>{block.label || block.id}:</strong> Completed
                                </span>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={block.id} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                              <span className="text-red-500">✗</span>
                              <span className="text-sm text-red-700">
                                 <strong>{block.label || block.id} Required:</strong> {
                                   (typeof blockError === 'string' ? blockError : blockError?.message) || `This field is required for ${selectedTemplate.label}`
                                 }
                              </span>
                            </div>
                          );
                        })
                      }
                      
                      {/* 9. Other validation errors */}
                      {Object.entries(errors)
                        .filter(([key]) => !['blocks', 'title', 'templateId', 'category', 'subcategory', 'activityDate'].includes(key))
                        .map(([key, error]) => (
                          <div key={key} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                            <span className="text-red-500">✗</span>
                            <span className="text-sm text-red-700">
                              <strong>{key.charAt(0).toUpperCase() + key.slice(1)} Error:</strong> {
                                typeof error === 'object' && error && 'message' in error 
                                  ? (error as any).message 
                                  : `Field "${key}" has an issue`
                              }
                            </span>
                          </div>
                        ))
                      }
                    </div>
                    
                    {/* Success message when form is complete */}
                    {isValid && Object.keys(errors).length === 0 && selectedTemplate && petId && petId >= 1 && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-sm text-green-700 font-medium">
                            All required fields completed! Form is ready to save.
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Validation requirements summary */}
                    <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded border">
                      <p className="font-medium mb-1">To save this activity, you need:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Select an activity type</li>
                        <li>Have a valid pet selected</li>
                        <li>Provide an activity title (1-200 characters)</li>
                        <li>Set activity date (cannot be in future)</li>
                        {selectedTemplate && selectedTemplate.blocks.filter(b => b.required).length > 0 && (
                          <li>Complete all required fields for "{selectedTemplate.label}"</li>
                        )}
                      </ul>
                      {!isValid && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-amber-600">
                            Show technical details {Object.keys(errors).length === 0 ? '(Form appears complete but validation fails)' : ''}
                          </summary>
                          <div className="mt-1 text-xs space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>Form valid: <span className={isValid ? 'text-green-600' : 'text-red-600'}>{String(isValid)}</span></div>
                              <div>Error count: <span className={Object.keys(errors).length === 0 ? 'text-green-600' : 'text-red-600'}>{Object.keys(errors).length}</span></div>
                              <div>Template: <span className={selectedTemplate ? 'text-green-600' : 'text-red-600'}>{selectedTemplate?.label || 'None'}</span></div>
                              <div>Pet ID: <span className={petId && petId >= 1 ? 'text-green-600' : 'text-red-600'}>{petId || 'Missing'}</span></div>
                            </div>
                            
                            {selectedTemplate && (
                              <div>
                                <p className="font-medium">Required blocks status:</p>
                                {selectedTemplate.blocks.filter(b => b.required).map(block => {
                                  const blockValue = getValues(`blocks.${block.id}` as any);
                                  const isEmpty = blockValue === undefined || blockValue === null || blockValue === '';
                                  const hasError = errors.blocks?.[block.id];
                                  return (
                                    <div key={block.id} className="ml-2">
                                      <span className={!isEmpty && !hasError ? 'text-green-600' : 'text-red-600'}>
                                        {block.label || block.id}: {isEmpty ? 'Empty' : hasError ? 'Error' : 'OK'}
                                        {!isEmpty && (
                                          <span className="ml-1 text-gray-500">
                                            ({typeof blockValue === 'object' ? 'Object' : String(blockValue).slice(0, 20)}{String(blockValue).length > 20 ? '...' : ''})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            <details className="mt-2">
                              <summary className="cursor-pointer">All form values</summary>
                              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                                {JSON.stringify(getValues(), null, 2)}
                              </pre>
                            </details>
                            
                            <details className="mt-2">
                              <summary className="cursor-pointer">All form errors</summary>
                              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs bg-red-100 p-2 rounded">
                                {JSON.stringify(errors, null, 2)}
                              </pre>
                            </details>
                            
                            <details className="mt-2">
                              <summary className="cursor-pointer">Complete form state debug</summary>
                              <div className="mt-1 text-xs space-y-1">
                                <div>isValid: <span className={isValid ? 'text-green-600' : 'text-red-600'}>{String(isValid)}</span></div>
                                <div>isDirty: <span className={isDirty ? 'text-green-600' : 'text-red-600'}>{String(isDirty)}</span></div>
                                <div>isSubmitted: {String(formState.isSubmitted)}</div>
                                <div>isSubmitting: {String(formState.isSubmitting)}</div>
                                <div>isValidating: {String(formState.isValidating)}</div>
                                <div>submitCount: {formState.submitCount}</div>
                                <div>touchedFields: {JSON.stringify(formState.touchedFields)}</div>
                                <div>dirtyFields: {JSON.stringify(formState.dirtyFields)}</div>
                                <div className="mt-2">
                                  <p className="font-medium">Manual validation test:</p>
                                  <button 
                                    type="button" 
                                    className="px-2 py-1 bg-blue-100 rounded text-xs"
                                    onClick={async () => {
                                      console.log('=== Manual validation test ===');
                                      console.log('Current values:', getValues());
                                      console.log('Current errors:', errors);
                                      const result = await trigger();
                                      console.log('Trigger result:', result);
                                      console.log('Errors after trigger:', formState.errors);
                                    }}
                                  >
                                    Run manual validation
                                  </button>
                                </div>
                              </div>
                            </details>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="relative pt-6 border-t border-gray-200">
              {/* Left side - Quick Mode button (absolute positioning) */}
              {currentMode !== 'quick' && (
                <div className="absolute left-0 top-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMode('quick')}
                  >
                    Quick Mode
                  </Button>
                </div>
              )}

              {/* Center - Save button with conditional offset */}
              <div className={`flex justify-center ${currentMode !== 'quick' ? 'pl-20' : ''}`}>
                <Button 
                  type="submit" 
                  disabled={!isValid || isSubmitting}
                  className="w-48 bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    isEditing ? 'Update' : 'Save'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

      </ActivityFormProvider>
    </FormProvider>
  );
};

export default ActivityEditorCore;