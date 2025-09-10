import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  // Initialize template from templateId (if provided) or initialData
  const initialTemplate = templateId 
    ? templateRegistry.getTemplate(templateId)
    : (initialData && initialData.category && initialData.subcategory
      ? templateRegistry.getTemplateByCategory(initialData.category, initialData.subcategory)
      : templateRegistry.getTemplatesByCategory(ActivityCategory.Diet)[0]); // fallback
  
  // State management
  const [selectedTemplate, setSelectedTemplate] = React.useState<ActivityTemplate | undefined>(initialTemplate);
  const [currentMode, setCurrentMode] = React.useState<ActivityMode>(mode);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
    const defaultBlocks: Record<string, any> = {};
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
            defaultBlocks[block.id] = {
              date: new Date(),
              time: '',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
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
      // Update blocks with proper default values for new template
      const newBlocks = getDefaultBlocks();
      const currentBlocks = getValues('blocks');
      
      // Merge existing values with new defaults (preserve user input)
      const mergedBlocks = { ...newBlocks, ...currentBlocks };
      setValue('blocks', mergedBlocks);
      
      setTimeout(() => {
        trigger();
      }, 100);
    }
  }, [selectedTemplate, trigger, getDefaultBlocks, setValue, getValues]);

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
          const isEmpty = blockValue === undefined || blockValue === null || blockValue === '' || 
            (typeof blockValue === 'object' && Object.keys(blockValue).length === 0);
          
          if (isEmpty) {
            missingRequiredBlocks.push(block.label || block.id);
          }
        });
    }
    
    const canSave = hasTemplate && hasPet && !hasFormErrors && missingRequiredBlocks.length === 0;
    
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
        missingRequiredBlocks.length > 0 ? `Complete: ${missingRequiredBlocks.join(', ')}` :
        hasFormErrors ? 'Fix form errors' :
        'Unknown validation issue'
      ) : null
    };
  }, [selectedTemplate, petId, errors, watchedValues]);

  const isSaveDisabled = isSubmitting || !formValidation.canSave;

  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    setIsSubmitting(true);
    
    try {
      if (!formValidation.canSave) {
        console.warn('Form validation failed:', formValidation.errorMessage);
        return;
      }

      await onSave(data);
    } catch (error) {
      console.error('Failed to save activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, formValidation]);



  // Mode switching handlers
  const switchToGuided = () => setCurrentMode('guided');

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
          // Draft functionality removed
        }}
        isDraftSaving={false}
        lastDraftSave={undefined}
      >
        <div className={className}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Picker Trigger for new activities */}
            {renderTemplatePickerTrigger()}
            
            {renderModeInterface()}
            
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
            
            {isSubmitting && (
              <Alert className="border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <AlertDescription className="text-blue-700">
                    Saving your activity...
                  </AlertDescription>
                </div>
              </Alert>
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