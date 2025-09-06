import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogOverlay, 
  DialogPortal, 
  DialogClose 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { X } from 'lucide-react';
import { 
  ActivityFormData, 
  ActivityTemplate,
  ActivityCategory 
} from '../../lib/types/activities';
import { activityFormValidationSchema } from '../../lib/validation/activityBlocks';
import { templateRegistry } from '../../lib/activityTemplates';
import { MultiBlockRenderer } from './BlockRenderer';
import { FormProvider as ActivityFormProvider } from './blocks/FormContext';

// QuickLogSheet props interface
interface QuickLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: ActivityFormData) => Promise<void>;
  petId: number;
  templateId?: string;
  category?: ActivityCategory;
}

// Custom Sheet-like dialog content for bottom slide animation
const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <div
      ref={ref}
      className={`fixed inset-x-0 bottom-0 z-50 grid gap-4 border-t bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom rounded-t-lg ${className}`}
      {...props}
    >
      {children}
      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogClose>
    </div>
  </DialogPortal>
));

// QuickLogSheet component for fast activity logging
const QuickLogSheet: React.FC<QuickLogSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  petId,
  templateId,
  category,
}) => {
  // State management
  const [selectedTemplate, setSelectedTemplate] = React.useState<ActivityTemplate | null>(null);
  const [quickTemplates, setQuickTemplates] = React.useState<ActivityTemplate[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [interactionCount, setInteractionCount] = React.useState(0);

  // Load quick-enabled templates
  React.useEffect(() => {
    const allTemplates = templateRegistry.getAllTemplates();
    const quickEnabledTemplates = allTemplates.filter(template => template.isQuickLogEnabled);
    
    // Filter by category if provided
    const filteredTemplates = category
      ? quickEnabledTemplates.filter(template => template.category === category)
      : quickEnabledTemplates;
    
    setQuickTemplates(filteredTemplates);
    
    // Auto-select template if provided or pick first available
    if (templateId) {
      const template = templateRegistry.getTemplate(templateId);
      if (template?.isQuickLogEnabled) {
        setSelectedTemplate(template);
      }
    } else if (filteredTemplates.length > 0) {
      setSelectedTemplate(filteredTemplates[0]);
    }
  }, [templateId, category]);

  // React Hook Form setup
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormValidationSchema),
    defaultValues: {
      petId,
      category: selectedTemplate?.category || ActivityCategory.Diet,
      subcategory: selectedTemplate?.subcategory || '',
      templateId: selectedTemplate?.id || '',
      title: '',
      activityDate: new Date(),
      blocks: {},
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, formState, watch, setValue, getValues, trigger, reset } = form;
  const { errors, isDirty, isValid } = formState;

  // Update form when template changes
  React.useEffect(() => {
    if (selectedTemplate) {
      setValue('category', selectedTemplate.category);
      setValue('subcategory', selectedTemplate.subcategory);
      setValue('templateId', selectedTemplate.id);
      
      // Auto-fill title with template label if empty
      if (!getValues('title')) {
        setValue('title', selectedTemplate.label);
      }
    }
  }, [selectedTemplate, setValue, getValues]);

  // Track interactions for ≤3 interaction requirement
  const trackInteraction = React.useCallback(() => {
    setInteractionCount(prev => prev + 1);
  }, []);

  // Template selection handler
  const handleTemplateSelect = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
    trackInteraction();
  };

  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    setIsSubmitting(true);
    trackInteraction();
    
    try {
      await onSave(data);
      reset();
      setInteractionCount(0);
      onClose();
    } catch (error) {
      console.error('Failed to save quick log:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, reset, onClose, trackInteraction]);

  // Get only first 2 blocks for quick mode
  const getQuickBlocks = () => {
    if (!selectedTemplate) return [];
    return selectedTemplate.blocks.slice(0, 2);
  };

  // Check if we can save (≤3 interactions)
  const canSave = isValid && interactionCount <= 3;
  const remainingInteractions = Math.max(0, 3 - interactionCount);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="max-h-[80vh] overflow-y-auto">
        <ActivityFormProvider
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
          getValues={getValues}
          trigger={trigger}
          template={selectedTemplate || undefined}
          petId={petId}
          mode="quick"
          isSubmitting={isSubmitting}
          isDirty={isDirty}
          isValid={isValid}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Quick Log</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {remainingInteractions} interactions left
                  </Badge>
                  {selectedTemplate && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedTemplate.category}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Pet: Current Pet {/* Would integrate with pet context */}
              </div>
            </div>

            {/* Template selector */}
            {!templateId && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {quickTemplates.slice(0, 6).map((template) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                        size="sm"
                        className="h-auto p-2 flex flex-col items-center gap-1"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <span className="text-lg">{template.icon}</span>
                        <span className="text-xs font-medium">{template.label}</span>
                      </Button>
                    ))}
                  </div>
                  
                  {quickTemplates.length > 6 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      +{quickTemplates.length - 6} more activities available in full mode
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick form blocks */}
            {selectedTemplate && (
              <div className="space-y-4">
                {/* Selected template info */}
                <Card className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedTemplate.icon}</span>
                      <div>
                        <div className="font-medium">{selectedTemplate.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedTemplate.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Render maximum 2 blocks */}
                <MultiBlockRenderer
                  blocks={getQuickBlocks()}
                  control={control}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />

                {/* Interaction tracking feedback */}
                <div className="text-center">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full ${
                          step <= interactionCount 
                            ? 'bg-primary' 
                            : 'bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  {interactionCount > 3 && (
                    <p className="text-xs text-amber-600">
                      Too many interactions - try guided mode for complex entries
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Would switch to guided mode - placeholder
                    console.log('Switch to guided mode');
                    trackInteraction();
                  }}
                  disabled={isSubmitting}
                >
                  More Details
                </Button>
                
                <Button
                  type="submit"
                  disabled={!canSave || isSubmitting || !selectedTemplate}
                  className="min-w-16"
                  onClick={trackInteraction}
                >
                  {isSubmitting ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>

            {/* Quick tips */}
            <div className="text-xs text-muted-foreground text-center pt-2">
              💡 Quick Log saves with ≤3 taps. Need more fields? Try "More Details"
            </div>
          </form>
        </ActivityFormProvider>
      </SheetContent>
    </Dialog>
  );
};

export default QuickLogSheet;