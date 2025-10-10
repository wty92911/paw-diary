import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { LoadingSpinner } from '../ui/loading-spinner';
import { type ActivityBlockData } from '../../lib/types/activities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { ChevronDown, Activity, AlertCircle } from 'lucide-react';
import {
  type ActivityEditorProps,
  type ActivityFormData,
  type ActivityTemplate,
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
  templateId,
  activityId,
  petId,
  onSave,
  initialData,
  className,
}) => {
  // Initialize template from templateId (if provided) or initialData
  const initialTemplate = templateId
    ? templateRegistry.getTemplate(templateId)
    : (initialData && initialData.category && initialData.subcategory
      ? templateRegistry.getTemplateByCategory(initialData.category, initialData.subcategory)
      : templateRegistry.getTemplatesByCategory(ActivityCategory.Diet)[0]); // fallback

  // State management
  const [selectedTemplate, setSelectedTemplate] = React.useState<ActivityTemplate | undefined>(initialTemplate);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = React.useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);


  // Create dynamic validation schema based on selected template
  const createValidationSchema = React.useMemo(() => {
    if (!selectedTemplate) {
      return activityFormValidationSchema;
    }

    // Create dynamic blocks validation based on template requirements
    const blocksSchema = z.object(
      selectedTemplate.blocks.reduce((acc, block) => {
        if (block.required) {
          // For required blocks, ensure they have a value
          acc[block.id] = z.any().refine(
            (value) => value !== undefined && value !== null && value !== '',
            { message: `${block.label || block.id} is required` }
          );
        } else {
          // For optional blocks, allow any value or undefined
          acc[block.id] = z.any().optional();
        }
        return acc;
      }, {} as Record<string, z.ZodSchema>)
    ).partial(); // Allow partial object since not all blocks may be present initially

    return activityFormValidationSchema.extend({
      blocks: blocksSchema,
    });
  }, [selectedTemplate]);

  // Create default blocks values based on template
  const getDefaultBlocks = React.useCallback(() => {
    const defaultBlocks: Record<string, ActivityBlockData> = {};
    if (selectedTemplate) {
      selectedTemplate.blocks.forEach(block => {
        // Set appropriate default values based on block type
        switch (block.type) {
          case 'title':
          case 'notes':
          case 'subcategory':
            defaultBlocks[block.id] = '';
            break;
          case 'time':
            // Time blocks use Date objects in forms
            defaultBlocks[block.id] = new Date();
            break;
          case 'measurement':
            defaultBlocks[block.id] = {
              value: 0,
              unit: '',
              measurementType: '',
            };
            break;
          case 'portion':
            defaultBlocks[block.id] = {
              amount: 0,
              unit: '',
              portionType: '',
            };
            break;
          default:
            defaultBlocks[block.id] = '';
        }
      });
    }
    return defaultBlocks;
  }, [selectedTemplate]);

  // React Hook Form setup with dynamic Zod validation
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(createValidationSchema),
    defaultValues: {
      petId: petId,
      category: selectedTemplate?.category || ActivityCategory.Diet,
      subcategory: selectedTemplate?.subcategory || '',
      blocks: initialData?.blocks || getDefaultBlocks(),
      ...initialData,
    },
    mode: 'onChange', // Validate on change (less aggressive than 'all')
    reValidateMode: 'onChange',
  });

  const { control, handleSubmit, formState, watch, setValue, getValues, trigger } = form;
  const { errors, isDirty, isValid } = formState;


  // Watch for template changes via category and subcategory
  const watchedCategory = watch('category');
  const watchedSubcategory = watch('subcategory');
  
  React.useEffect(() => {
    if (watchedCategory && watchedSubcategory) {
      const newTemplate = templateRegistry.getTemplateByCategory(watchedCategory, watchedSubcategory);
      if (newTemplate && newTemplate.id !== selectedTemplate?.id) {
        setSelectedTemplate(newTemplate);
        
        // Trigger form validation after template change
        setTimeout(() => {
          trigger();
        }, 100);
      }
    }
  }, [watchedCategory, watchedSubcategory, selectedTemplate, trigger]);

  // Re-validate when selected template changes (for dynamic schema)
  React.useEffect(() => {
    if (selectedTemplate) {
      const currentBlocks = getValues('blocks');

      // Only apply defaults if we don't have initial data (new activity mode)
      // In edit mode, preserve all existing values
      if (!activityId || !initialData?.blocks) {
        // New activity: merge defaults with any user input
        const newBlocks = getDefaultBlocks();
        const mergedBlocks = { ...newBlocks, ...currentBlocks };
        setValue('blocks', mergedBlocks);
      }

      setTimeout(() => {
        trigger();
      }, 100);
    }
  }, [selectedTemplate, trigger, getDefaultBlocks, setValue, getValues, activityId, initialData]);

  // Watch all form fields to trigger validation on any change
  const watchedValues = watch();
  
  // Single source of truth for form validation state
  const formValidation = React.useMemo(() => {
    // Basic requirements
    const hasTemplate = !!selectedTemplate;
    const hasPet = !!(petId && petId > 0);
    const hasFormErrors = Object.keys(errors).length > 0;
    
    // Check required blocks using current form values
    const missingRequiredBlocks: string[] = [];
    if (selectedTemplate) {
      selectedTemplate.blocks
        .filter(block => block.required)
        .forEach(block => {
          const blockValue = watchedValues.blocks?.[block.id];

          // Check if value is empty
          let isEmpty = false;
          if (blockValue === undefined || blockValue === null || blockValue === '') {
            isEmpty = true;
          } else if (blockValue instanceof Date) {
            // Date objects are valid values
            isEmpty = false;
          } else if (typeof blockValue === 'object') {
            // Special handling for measurement blocks
            if ('value' in blockValue && 'unit' in blockValue && 'measurementType' in blockValue) {
              // MeasurementData: check if value is 0, empty, or invalid
              const numValue = blockValue.value as number;
              isEmpty = numValue === undefined || numValue === null || numValue === 0 || isNaN(numValue);
            }
            // Special handling for portion blocks
            else if ('amount' in blockValue && 'unit' in blockValue) {
              // PortionData: check if amount is 0, empty, or invalid
              const amount = blockValue.amount as number;
              isEmpty = amount === undefined || amount === null || amount === 0 || isNaN(amount);
            }
            else {
              // Other objects: check if empty
              isEmpty = Object.keys(blockValue).length === 0;
            }
          }

          if (isEmpty) {
            missingRequiredBlocks.push(block.label || block.id);
          }
        });
    }
    
    const canSave = hasTemplate && hasPet && !hasFormErrors && missingRequiredBlocks.length === 0;

    // Get first form error message for better user feedback
    let firstErrorMessage: string | null = null;
    if (hasFormErrors && errors.blocks) {
      const firstError = Object.values(errors.blocks).find(err => err?.message);
      if (firstError && typeof firstError.message === 'string') {
        firstErrorMessage = firstError.message;
      }
    }

    return {
      hasTemplate,
      hasPet,
      hasFormErrors,
      missingRequiredBlocks,
      canSave,
      // Simple error message - only show what needs to be fixed
      errorMessage: !canSave ? (
        !hasTemplate ? 'Select an activity type' :
        !hasPet ? 'Select a pet' :
        missingRequiredBlocks.length > 0 ? `Please complete: ${missingRequiredBlocks.join(', ')}` :
        hasFormErrors && firstErrorMessage ? firstErrorMessage :
        hasFormErrors ? 'Please fix the form errors above' :
        'Unknown validation issue'
      ) : null
    };
  }, [selectedTemplate, petId, errors, watchedValues]);

  const isSaveDisabled = isSubmitting || !formValidation.canSave;

  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    // Reset states at the beginning
    setShowSuccessAlert(false);
    setIsSubmitting(true);

    try {
      if (!formValidation.canSave) {
        console.warn('Form validation failed:', formValidation.errorMessage);
        setIsSubmitting(false);
        return;
      }

      await onSave(data);

      // Show success alert only for editing (activityId exists)
      if (activityId) {
        setIsSubmitting(false);
        setShowSuccessAlert(true);
        // Success alert will be visible for 1.5 seconds before parent navigates away
      }
    } catch (error) {
      console.error('Failed to save activity:', error);
      setIsSubmitting(false);
      setShowSuccessAlert(false);
    }
  }, [onSave, formValidation, activityId]);



  // Handle template selection
  const handleTemplateSelect = (template: ActivityTemplate | null) => {
    setSelectedTemplate(template as ActivityTemplate);
    if (template) {
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

  // Render activity blocks
  const renderBlocks = () => {
    if (!selectedTemplate) {
      return (
        <Alert>
          <AlertDescription>
            Please select a template to continue with activity recording.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {/* Dynamic blocks based on template */}
        <MultiBlockRenderer
          blocks={selectedTemplate.blocks}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />
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
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        isValid={isValid}
        saveDraft={async () => {
          // Draft functionality removed
        }}
        isDraftSaving={false}
        lastDraftSave={undefined}
      >
        <div className={className}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Picker Trigger for new activities */}
            {renderTemplatePickerTrigger()}
            
            {renderBlocks()}
            
            {/* Draft status removed */}

            {/* Only show error when save is disabled and form is not submitting */}
            {isSaveDisabled && !isSubmitting && formValidation.errorMessage && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  {formValidation.errorMessage}
                </AlertDescription>
              </Alert>
            )}
            
            {isSubmitting && !showSuccessAlert && (
              <Alert className="border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  <AlertDescription className="text-blue-700">
                    Saving your activity...
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {showSuccessAlert && (
              <Alert className="border-green-200 bg-green-50">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <AlertDescription className="text-green-700">
                    Activity updated successfully
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="relative pt-6 border-t border-gray-200">
              {/* Center - Save button */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  disabled={isSaveDisabled}
                  className={`w-48 ${formValidation.canSave ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-400'}`}
                  title={!formValidation.canSave ? formValidation.errorMessage || 'Complete form to save' : ''}
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