import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
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

// Pet context interface for display only
interface PetContext {
  id: number;
  name: string;
  photo?: string;
}

// ActivityEditor main controller component
const ActivityEditor: React.FC<ActivityEditorProps> = ({
  mode,
  templateId,
  activityId,
  petId,
  onSave,
  onCancel,
  initialData,
}) => {
  // State management
  const [selectedTemplate, setSelectedTemplate] = React.useState<ActivityTemplate | undefined>(
    templateId ? templateRegistry.getTemplate(templateId) : undefined
  );
  const [currentMode, setCurrentMode] = React.useState<ActivityMode>(mode);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [lastSavedDraft, setLastSavedDraft] = React.useState<Date>();

  // Mock pet data - in real implementation this would come from usePets hook
  const currentPet: PetContext = {
    id: petId,
    name: 'Current Pet', // Would be loaded from pet context
    photo: undefined,
  };

  // React Hook Form setup with Zod validation
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormValidationSchema),
    defaultValues: {
      petId: currentPet.id,
      category: selectedTemplate?.category || ActivityCategory.Diet,
      subcategory: selectedTemplate?.subcategory || '',
      templateId: selectedTemplate?.id || '',
      title: '',
      description: '',
      activityDate: new Date(),
      blocks: {},
      ...initialData,
    },
    mode: 'onChange', // Validate on change for better UX
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
      }
    }
  }, [watchedTemplateId, selectedTemplate, setValue]);


  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      // Don't reset form here - let parent handle success state
    } catch (error) {
      console.error('Failed to save activity:', error);
      // Error handling would be improved with proper error context
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave]);

  // Draft auto-save functionality
  const saveDraft = React.useCallback(async () => {
    if (!isDirty || !isValid) return;
    
    try {
      // Mock draft save - would integrate with useActivityDraft hook
      console.log('Saving draft...', getValues());
      setLastSavedDraft(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [isDirty, isValid, getValues]);

  // Auto-save draft every 3 seconds when dirty
  React.useEffect(() => {
    if (!isDirty || !isValid) return;

    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [isDirty, isValid, saveDraft, watch()]);

  // Mode switching handlers
  const switchToGuided = () => setCurrentMode('guided');
  const switchToAdvanced = () => setCurrentMode('advanced');

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

    const blocksToRender = currentMode === 'quick' 
      ? selectedTemplate.blocks.slice(0, 2) // Only first 2 blocks for quick mode
      : selectedTemplate.blocks;

    return (
      <div className="space-y-4">
        {/* Template info header */}
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
                  </div>
                </div>
              </div>
              
              {/* Pet context display */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                  🐾
                </div>
                {currentPet.name}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Dynamic blocks based on template */}
        <MultiBlockRenderer
          blocks={blocksToRender}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {/* Mode switching options */}
        {currentMode === 'quick' && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Need more details?</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={switchToGuided}>
                    More Details
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
    if (!lastSavedDraft) return null;

    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        Draft saved at {lastSavedDraft.toLocaleTimeString()}
      </div>
    );
  };

  const isEditing = !!activityId;
  const modalTitle = isEditing 
    ? `Edit ${selectedTemplate?.label || 'Activity'}`
    : `New ${selectedTemplate?.label || 'Activity'}`;

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
        petId={currentPet.id}
        mode={currentMode}
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        isValid={isValid}
        saveDraft={saveDraft}
        isDraftSaving={false} // Would be managed by draft hook
        lastDraftSave={lastSavedDraft}
      >
        <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {modalTitle}
                {isDirty && <Badge variant="secondary" className="text-xs">Modified</Badge>}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {renderModeInterface()}
              
              {renderDraftStatus()}

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
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

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!isValid || isSubmitting}
                    className="min-w-20"
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
          </DialogContent>
        </Dialog>

      </ActivityFormProvider>
    </FormProvider>
  );
};

export default ActivityEditor;