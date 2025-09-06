import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { LoadingSpinner } from '../ui/loading-spinner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  ActivityFormData, 
  ActivityTemplate,
  ActivityCategory 
} from '../../lib/types/activities';
import { activityFormValidationSchema } from '../../lib/validation/activityBlocks';
import { templateRegistry } from '../../lib/activityTemplates';
import { MultiBlockRenderer } from './BlockRenderer';
import { FormProvider as ActivityFormProvider } from './blocks/FormContext';

// GuidedFlowWizard props interface
interface GuidedFlowWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: ActivityFormData) => Promise<void>;
  petId: number;
  templateId: string;
  initialData?: Partial<ActivityFormData>;
}

// Pet context interface for display only
interface PetContext {
  id: number;
  name: string;
  photo?: string;
}

// Step information for the wizard
interface WizardStep {
  id: string;
  title: string;
  description: string;
  blockIndices: number[];
}

// GuidedFlowWizard component for step-by-step activity creation
const GuidedFlowWizard: React.FC<GuidedFlowWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  petId,
  templateId,
  initialData,
}) => {
  // State management
  const [selectedTemplate, setSelectedTemplate] = React.useState<ActivityTemplate | undefined>(
    templateRegistry.getTemplate(templateId)
  );
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());
  const [lastSavedDraft, setLastSavedDraft] = React.useState<Date>();

  // Mock pet data - in real implementation this would come from usePets hook
  const currentPet: PetContext = {
    id: petId,
    name: 'Current Pet', // Would be loaded from pet context
    photo: undefined,
  };

  // Generate wizard steps from template blocks
  const wizardSteps = React.useMemo<WizardStep[]>(() => {
    if (!selectedTemplate) return [];

    const blocks = selectedTemplate.blocks;
    const maxBlocksPerStep = 2; // Show 2 blocks per step maximum
    const steps: WizardStep[] = [];

    // Group blocks into steps
    for (let i = 0; i < blocks.length; i += maxBlocksPerStep) {
      const stepBlocks = blocks.slice(i, i + maxBlocksPerStep);
      const stepIndex = Math.floor(i / maxBlocksPerStep);
      
      steps.push({
        id: `step-${stepIndex + 1}`,
        title: `Step ${stepIndex + 1}`,
        description: stepBlocks.map(block => block.label).join(' & '),
        blockIndices: stepBlocks.map((_, blockIndex) => i + blockIndex),
      });
    }

    return steps;
  }, [selectedTemplate]);

  // React Hook Form setup with Zod validation
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormValidationSchema),
    defaultValues: {
      petId,
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

  // Update template when templateId changes
  React.useEffect(() => {
    if (templateId) {
      const template = templateRegistry.getTemplate(templateId);
      setSelectedTemplate(template);
      
      if (template) {
        setValue('category', template.category);
        setValue('subcategory', template.subcategory);
        setValue('templateId', template.id);
      }
    }
  }, [templateId, setValue]);

  // Step validation - check if current step is valid
  const isCurrentStepValid = React.useCallback(async () => {
    if (!selectedTemplate || !wizardSteps[currentStepIndex]) return false;

    const currentStep = wizardSteps[currentStepIndex];
    const blocksToValidate = currentStep.blockIndices.map(index => 
      selectedTemplate.blocks[index]
    );

    // Trigger validation for all fields in current step
    for (const block of blocksToValidate) {
      const fieldName = `blocks.${block.id}`;
      const result = await trigger(fieldName as any);
      if (!result) return false;
    }

    return true;
  }, [selectedTemplate, wizardSteps, currentStepIndex, trigger]);

  // Navigation handlers
  const goToNextStep = React.useCallback(async () => {
    const stepValid = await isCurrentStepValid();
    if (!stepValid) return;

    // Mark current step as completed
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));

    if (currentStepIndex < wizardSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, wizardSteps.length, isCurrentStepValid]);

  const goToPreviousStep = React.useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const goToStep = React.useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < wizardSteps.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, [wizardSteps.length]);

  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      // Reset form and close wizard on success
      form.reset();
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
      onClose();
    } catch (error) {
      console.error('Failed to save guided flow activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, form, onClose]);

  // Draft auto-save functionality
  const saveDraft = React.useCallback(async () => {
    if (!isDirty || !isValid) return;
    
    try {
      // Mock draft save - would integrate with useActivityDraft hook
      console.log('Saving guided flow draft...', getValues());
      setLastSavedDraft(new Date());
    } catch (error) {
      console.error('Failed to save guided flow draft:', error);
    }
  }, [isDirty, isValid, getValues]);

  // Auto-save draft every 2 seconds when dirty
  React.useEffect(() => {
    if (!isDirty || !isValid) return;

    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isDirty, isValid, saveDraft, watch()]);

  // Progress calculation
  const progressPercentage = wizardSteps.length > 0 
    ? Math.round(((completedSteps.size + (currentStepIndex + 1)) / (wizardSteps.length + 1)) * 100)
    : 0;

  const isLastStep = currentStepIndex === wizardSteps.length - 1;
  const canProceed = React.useMemo(() => isCurrentStepValid(), [isCurrentStepValid]);

  if (!selectedTemplate || wizardSteps.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guided Flow</DialogTitle>
          </DialogHeader>
          <div className="text-center text-muted-foreground">
            No template found or template has no blocks to display.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStep = wizardSteps[currentStepIndex];
  const currentBlocks = currentStep.blockIndices.map(index => 
    selectedTemplate.blocks[index]
  );

  return (
    <ActivityFormProvider
      control={control}
      errors={errors}
      watch={watch}
      setValue={setValue}
      getValues={getValues}
      trigger={trigger}
      template={selectedTemplate}
      petId={petId}
      mode="guided"
      isSubmitting={isSubmitting}
      isDirty={isDirty}
      isValid={isValid}
      saveDraft={saveDraft}
      isDraftSaving={false} // Would be managed by draft hook
      lastDraftSave={lastSavedDraft}
    >
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div>
                  <div>{selectedTemplate.label} - Guided Flow</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {currentStep.title}: {currentStep.description}
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Pet: {currentPet.name}
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Progress indicator */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{progressPercentage}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
              
              {/* Step indicators */}
              <div className="flex justify-center gap-2">
                {wizardSteps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      index === currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : completedSteps.has(index)
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    completedSteps.size === wizardSteps.length
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  ✓
                </button>
              </div>
            </div>

            {/* Current step content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentStep.title}</span>
                  <Badge variant="outline">
                    {currentStep.blockIndices.length} field{currentStep.blockIndices.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <MultiBlockRenderer
                    blocks={currentBlocks}
                    control={control}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Draft status */}
            {lastSavedDraft && (
              <div className="text-xs text-muted-foreground text-center py-2">
                Draft saved at {lastSavedDraft.toLocaleTimeString()}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={currentStepIndex === 0 || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                {!isLastStep ? (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!canProceed || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="min-w-20"
                  >
                    {isSubmitting ? (
                      <LoadingSpinner className="w-4 h-4" />
                    ) : (
                      'Save Activity'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ActivityFormProvider>
  );
};

export default GuidedFlowWizard;