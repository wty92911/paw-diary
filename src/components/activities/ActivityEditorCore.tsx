import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useActivityDraftSimple } from '../../hooks/useActivityDraftSimple';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { LoadingSpinner } from '../ui/loading-spinner';
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
import { EditorModeSwitch } from './EditorModeSwitch';
import { TemplatePicker } from './TemplatePicker';

// Enhanced props for page context
export interface ActivityEditorCoreProps extends Omit<ActivityEditorProps, 'onCancel'> {
  onCancel: () => void;
  onNavigationAttempt?: (hasUnsavedChanges: boolean) => void;
  showHeader?: boolean;
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
  onCancel,
  onNavigationAttempt,
  initialData,
  showHeader = true,
  className,
}) => {
  // State management
  const [selectedTemplate, setSelectedTemplate] = React.useState<ActivityTemplate | undefined>(
    templateId ? templateRegistry.getTemplate(templateId) : undefined
  );
  const [currentMode, setCurrentMode] = React.useState<ActivityMode>(mode);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Draft management
  const draft = useActivityDraftSimple({
    petId,
    activityId,
    mode,
    templateId,
  });

  // Load draft data if available
  const draftData = React.useMemo(() => draft.loadDraft(), [draft]);

  // React Hook Form setup with Zod validation
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormValidationSchema),
    defaultValues: {
      petId: petId,
      category: selectedTemplate?.category || ActivityCategory.Diet,
      subcategory: selectedTemplate?.subcategory || '',
      templateId: selectedTemplate?.id || '',
      title: '',
      description: '',
      activityDate: new Date(),
      blocks: {},
      ...initialData,
      ...draftData, // Apply draft data if available
    },
    mode: 'onChange', // Validate on change for better UX
  });

  const { control, handleSubmit, formState, watch, setValue, getValues, trigger } = form;
  const { errors, isDirty, isValid } = formState;

  // Track unsaved changes
  React.useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

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
      }
    }
  }, [watchedTemplateId, selectedTemplate, setValue]);

  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      setHasUnsavedChanges(false); // Clear unsaved changes on successful save
      draft.clearDraft(); // Clear draft after successful save
    } catch (error) {
      console.error('Failed to save activity:', error);
      // Error handling could be improved with proper error context
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, draft]);

  // Enhanced cancel handler with unsaved changes confirmation
  const handleCancel = React.useCallback(() => {
    if (hasUnsavedChanges && onNavigationAttempt) {
      onNavigationAttempt(true);
    } else {
      onCancel();
    }
  }, [hasUnsavedChanges, onCancel, onNavigationAttempt]);

  // Auto-save draft every 3 seconds when dirty and valid
  React.useEffect(() => {
    if (!isDirty || !isValid) return;

    const timeoutId = setTimeout(() => {
      draft.saveDraft(getValues());
    }, 3000); // 3 seconds as per requirements

    return () => clearTimeout(timeoutId);
  }, [isDirty, isValid, draft, getValues, watch()]);

  // Mode switching handlers
  const switchToGuided = () => setCurrentMode('guided');
  const switchToAdvanced = () => setCurrentMode('advanced');

  // Handle template selection
  const handleTemplateSelect = (template: ActivityTemplate | null) => {
    setSelectedTemplate(template || undefined);
    if (template) {
      setValue('templateId', template.id);
      setValue('category', template.category);
      setValue('subcategory', template.subcategory);
    }
  };

  // Handle mode changes from the EditorModeSwitch
  const handleModeChange = (newMode: ActivityMode) => {
    setCurrentMode(newMode);
  };

  // Render template picker for new activities
  const renderTemplatePicker = () => {
    if (activityId) return null; // Don't show for editing existing activities

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Select Activity Type</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplatePicker
            selectedTemplateId={selectedTemplate?.id}
            onTemplateSelect={handleTemplateSelect}
            petId={petId}
            syncWithUrl={false} // We handle URL sync in the page component
            compact={false}
          />
        </CardContent>
      </Card>
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
          .slice(0, 2);
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
        {/* Editor Mode Switch */}
        <EditorModeSwitch
          currentMode={currentMode}
          onModeChange={handleModeChange}
          syncWithUrl={false} // Page component handles URL sync
          className="mb-4"
        />

        {/* Template info header - only show if showHeader is true */}
        {showHeader && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTemplate.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{selectedTemplate.label}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {selectedTemplate.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {currentMode}
                      </Badge>
                      {hasUnsavedChanges && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          Modified
                        </Badge>
                      )}
                      {draft.hasDraft && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

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
                  <Button variant="outline" size="sm" onClick={switchToAdvanced}>
                    Full Editor
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
            {/* Template Picker for new activities */}
            {renderTemplatePicker()}
            
            {renderModeInterface()}
            
            {renderDraftStatus()}

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {currentMode !== 'quick' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMode('quick')}
                  >
                    Quick Mode
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isValid || isSubmitting}
                  className="min-w-20 bg-orange-600 hover:bg-orange-700"
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