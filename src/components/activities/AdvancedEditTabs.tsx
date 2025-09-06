import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { LoadingSpinner } from '../ui/loading-spinner';
import { 
  FileText, 
  Edit3, 
  Paperclip, 
  Clock, 
  DollarSign, 
  History,
  AlertCircle 
} from 'lucide-react';
import { 
  ActivityFormData, 
  ActivityTemplate,
  ActivityCategory,
  ActivityBlockType 
} from '../../lib/types/activities';
import { activityFormValidationSchema } from '../../lib/validation/activityBlocks';
import { templateRegistry } from '../../lib/activityTemplates';
import { MultiBlockRenderer } from './BlockRenderer';
import { FormProvider as ActivityFormProvider } from './blocks/FormContext';

// AdvancedEditTabs props interface
interface AdvancedEditTabsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: ActivityFormData) => Promise<void>;
  petId: number;
  templateId: string;
  activityId?: string; // For editing existing activities
  initialData?: Partial<ActivityFormData>;
}

// Pet context interface for display only
interface PetContext {
  id: number;
  name: string;
  photo?: string;
}

// Tab configuration with icons and block type filters
interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  blockTypes: ActivityBlockType[];
  description: string;
  isAlwaysVisible?: boolean; // Some tabs like Summary are always shown
}

// Tab configurations for Advanced Edit
const TAB_CONFIGS: TabConfig[] = [
  {
    id: 'summary',
    label: 'Summary',
    icon: FileText,
    blockTypes: ['title', 'notes', 'subcategory', 'time'],
    description: 'Basic activity information',
    isAlwaysVisible: true,
  },
  {
    id: 'details',
    label: 'Details',
    icon: Edit3,
    blockTypes: ['measurement', 'rating', 'portion', 'location', 'weather', 'people'],
    description: 'Detailed measurements and context',
    isAlwaysVisible: true,
  },
  {
    id: 'attachments',
    label: 'Attachments',
    icon: Paperclip,
    blockTypes: ['attachment'],
    description: 'Photos, videos, and documents',
  },
  {
    id: 'reminders',
    label: 'Reminders',
    icon: Clock,
    blockTypes: ['reminder', 'recurrence'],
    description: 'Future reminders and recurring patterns',
  },
  {
    id: 'costs',
    label: 'Costs',
    icon: DollarSign,
    blockTypes: ['cost'],
    description: 'Financial tracking and expenses',
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    blockTypes: ['checklist', 'timer'],
    description: 'Activity progression and checklists',
  },
];

// AdvancedEditTabs component for comprehensive activity editing
const AdvancedEditTabs: React.FC<AdvancedEditTabsProps> = ({
  isOpen,
  onClose,
  onSave,
  petId,
  templateId,
  activityId,
  initialData,
}) => {
  // State management
  const [selectedTemplate, setSelectedTemplate] = React.useState<ActivityTemplate | undefined>(
    templateRegistry.getTemplate(templateId)
  );
  const [activeTab, setActiveTab] = React.useState('summary');
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

  // Calculate visible tabs based on template blocks
  const visibleTabs = React.useMemo(() => {
    if (!selectedTemplate) return [];

    const templateBlockTypes = new Set(
      selectedTemplate.blocks.map(block => block.type)
    );

    return TAB_CONFIGS.filter(tabConfig => {
      // Always show tabs marked as always visible
      if (tabConfig.isAlwaysVisible) return true;
      
      // Show tab if any of its block types are present in template
      return tabConfig.blockTypes.some(blockType => 
        templateBlockTypes.has(blockType)
      );
    });
  }, [selectedTemplate]);

  // Get blocks for current tab
  const getBlocksForTab = React.useCallback((tabId: string) => {
    if (!selectedTemplate) return [];

    const tabConfig = TAB_CONFIGS.find(tab => tab.id === tabId);
    if (!tabConfig) return [];

    return selectedTemplate.blocks.filter(block => 
      tabConfig.blockTypes.includes(block.type)
    );
  }, [selectedTemplate]);

  // Form submission handler
  const onSubmit = React.useCallback(async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      // Don't reset form here - let parent handle success state
      onClose();
    } catch (error) {
      console.error('Failed to save advanced edit activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, onClose]);

  // Draft auto-save functionality
  const saveDraft = React.useCallback(async () => {
    if (!isDirty || !isValid) return;
    
    try {
      // Mock draft save - would integrate with useActivityDraft hook
      console.log('Saving advanced edit draft...', getValues());
      setLastSavedDraft(new Date());
    } catch (error) {
      console.error('Failed to save advanced edit draft:', error);
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

  // Ensure active tab is valid when visible tabs change
  React.useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  if (!selectedTemplate) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advanced Editor</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-center text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            No template found. Please select a valid activity template.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isEditing = !!activityId;
  const modalTitle = isEditing 
    ? `Edit ${selectedTemplate.label}`
    : `New ${selectedTemplate.label}`;

  const currentTabBlocks = getBlocksForTab(activeTab);

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
      mode="advanced"
      isSubmitting={isSubmitting}
      isDirty={isDirty}
      isValid={isValid}
      saveDraft={saveDraft}
      isDraftSaving={false} // Would be managed by draft hook
      lastDraftSave={lastSavedDraft}
    >
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    {modalTitle}
                    {isDirty && <Badge variant="secondary" className="text-xs">Modified</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Advanced Editor - {selectedTemplate.category}
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Pet: {currentPet.name}
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tabbed interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
                {visibleTabs.map(tab => {
                  const Icon = tab.icon;
                  const tabBlocks = getBlocksForTab(tab.id);
                  const hasError = tabBlocks.some(block => 
                    errors.blocks?.[block.id as keyof typeof errors.blocks]
                  );
                  
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`flex items-center gap-2 ${
                        hasError ? 'text-destructive' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tabBlocks.length > 0 && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          {tabBlocks.length}
                        </Badge>
                      )}
                      {hasError && (
                        <AlertCircle className="w-3 h-3 text-destructive" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {visibleTabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id} lazy>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {tab.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {currentTabBlocks.length > 0 ? (
                        <div className="space-y-4">
                          <MultiBlockRenderer
                            blocks={currentTabBlocks}
                            control={control}
                            errors={errors}
                            watch={watch}
                            setValue={setValue}
                          />
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <tab.icon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p>No {tab.label.toLowerCase()} fields for this activity type.</p>
                          <p className="text-sm">
                            Fields will appear here when supported by the selected template.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Draft status */}
            {lastSavedDraft && (
              <div className="text-xs text-muted-foreground text-center py-2">
                Draft saved at {lastSavedDraft.toLocaleTimeString()}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {visibleTabs.length} tabs available • Advanced editing mode
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
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
                    isEditing ? 'Update Activity' : 'Save Activity'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ActivityFormProvider>
  );
};

export default AdvancedEditTabs;