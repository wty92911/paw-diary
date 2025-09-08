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
  const draftData = React.useMemo(() => draft.loadDraft(), [draft]);

  // React Hook Form setup with Zod validation
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormValidationSchema),
    defaultValues: {
      petId: petId,
      category: selectedTemplate?.category || ActivityCategory.Diet,
      subcategory: selectedTemplate?.subcategory || '',
      templateId: selectedTemplate?.id || '',
      title: selectedTemplate?.label || '',
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
        // Auto-fill title with template label if current title is empty
        const currentTitle = getValues('title');
        if (!currentTitle || currentTitle.trim() === '') {
          setValue('title', newTemplate.label);
        }
      }
    }
  }, [watchedTemplateId, selectedTemplate, setValue, getValues]);

  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      draft.clearDraft(); // Clear draft after successful save
    } catch (error) {
      console.error('Failed to save activity:', error);
      // Error handling could be improved with proper error context
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, draft]);


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

            {/* Form validation hints - Always show when button is disabled */}
            {(!isValid || isSubmitting) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-medium text-amber-800">
                    {isSubmitting ? '正在保存中...' : '保存按钮已禁用，请检查：'}
                  </h4>
                </div>
                
                {isSubmitting ? (
                  <p className="text-sm text-amber-700">请稍等，正在保存您的活动记录...</p>
                ) : (
                  <div className="space-y-2">
                    {/* Show specific field errors */}
                    {Object.keys(errors).length > 0 ? (
                      <ul className="text-sm text-amber-700 space-y-1">
                        {Object.entries(errors).map(([key, error]) => (
                          <li key={key} className="flex items-start gap-1">
                            <span className="text-amber-400">•</span>
                            <span>
                              {key === 'title' && '标题不能为空'}
                              {key === 'templateId' && '请先选择活动类型'}
                              {key === 'category' && '请选择活动分类'}
                              {key === 'subcategory' && '请选择活动子分类'}
                              {key === 'petId' && '宠物信息缺失'}
                              {key === 'activityDate' && '请选择有效的活动日期'}
                              {!['title', 'templateId', 'category', 'subcategory', 'petId', 'activityDate'].includes(key) && 
                                (String(error?.message) || `${key} 字段有问题`)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-amber-700">
                        <p className="mb-2">请检查以下内容是否完整：</p>
                        <ul className="space-y-1">
                          <li>• {selectedTemplate ? '✓ 已选择活动类型' : '✗ 请先选择活动类型'}</li>
                          <li>• {petId ? '✓ 宠物信息正常' : '✗ 宠物信息缺失'}</li>
                          <li>• 请确保所有必填字段都已填写</li>
                        </ul>
                      </div>
                    )}
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