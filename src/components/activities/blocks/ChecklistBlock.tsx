import React from 'react';
import { Control, FieldError } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import { Plus, X, CheckSquare, Square, RotateCcw } from 'lucide-react';
import { ActivityFormData, ActivityBlockDef } from '../../../lib/types/activities';
import { Field } from './Field';
import { useFormContext } from './FormContext';

// Checklist item interface
interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: Date;
  order: number;
  notes?: string;
}

// Checklist value interface
interface ChecklistValue {
  items: ChecklistItem[];
  title?: string;
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
}

// Predefined checklist templates for different activities
const CHECKLIST_TEMPLATES = {
  vet_visit: {
    title: 'Vet Visit Checklist',
    items: [
      'Bring medical records',
      'List current medications',
      'Prepare questions for vet',
      'Bring vaccination records',
      'Check for any new symptoms',
      'Discuss diet and exercise',
      'Schedule next appointment',
    ],
  },
  grooming: {
    title: 'Grooming Checklist',
    items: [
      'Brush fur thoroughly',
      'Trim nails',
      'Clean ears',
      'Brush teeth',
      'Check for skin issues',
      'Bath with appropriate shampoo',
      'Dry and brush again',
    ],
  },
  travel: {
    title: 'Travel Preparation',
    items: [
      'Pack food and treats',
      'Bring water and bowls',
      'Pack medications',
      'Prepare carrier/crate',
      'Bring favorite toy/blanket',
      'Health certificate (if needed)',
      'Emergency contact info',
    ],
  },
  training: {
    title: 'Training Session',
    items: [
      'Prepare treats for rewards',
      'Review previous commands',
      'Practice basic commands',
      'Work on new behavior',
      'End on positive note',
      'Record progress',
      'Plan next session',
    ],
  },
  new_pet: {
    title: 'New Pet Setup',
    items: [
      'Set up feeding area',
      'Prepare sleeping area',
      'Pet-proof the house',
      'Buy essential supplies',
      'Find local veterinarian',
      'Plan first vet visit',
      'Research pet insurance',
    ],
  },
} as const;

// Checklist block specific props
interface ChecklistBlockProps {
  block: ActivityBlockDef & { type: 'checklist' };
  control?: Control<ActivityFormData>;
  error?: FieldError;
}

// ChecklistBlock component for tracking task completion
const ChecklistBlock: React.FC<ChecklistBlockProps> = ({
  block,
  error,
}) => {
  const { watch, setValue } = useFormContext();
  const fieldName = `blocks.${block.id}` as const;
  const currentValue: ChecklistValue | undefined = watch(fieldName);

  // State management
  const [newItemText, setNewItemText] = React.useState('');
  const [showTemplates, setShowTemplates] = React.useState(false);

  // Initialize default value
  React.useEffect(() => {
    if (!currentValue) {
      setValue(fieldName, {
        items: [],
        completedCount: 0,
        totalCount: 0,
        completionPercentage: 0,
      });
    }
  }, [currentValue, fieldName, setValue]);

  // Update completion stats
  const updateCompletionStats = React.useCallback((items: ChecklistItem[]) => {
    const completedCount = items.filter(item => item.isCompleted).length;
    const totalCount = items.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      completedCount,
      totalCount,
      completionPercentage,
    };
  }, []);

  // Handle item completion toggle
  const handleItemToggle = React.useCallback((itemId: string) => {
    if (!currentValue) return;

    const updatedItems = currentValue.items.map(item =>
      item.id === itemId
        ? {
            ...item,
            isCompleted: !item.isCompleted,
            completedAt: !item.isCompleted ? new Date() : undefined,
          }
        : item
    );

    const stats = updateCompletionStats(updatedItems);
    const updatedValue: ChecklistValue = {
      ...currentValue,
      items: updatedItems,
      ...stats,
    };

    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue, updateCompletionStats]);

  // Add new checklist item
  const handleAddItem = React.useCallback(() => {
    if (!newItemText.trim() || !currentValue) return;

    const newItem: ChecklistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newItemText.trim(),
      isCompleted: false,
      order: currentValue.items.length,
    };

    const updatedItems = [...currentValue.items, newItem];
    const stats = updateCompletionStats(updatedItems);
    const updatedValue: ChecklistValue = {
      ...currentValue,
      items: updatedItems,
      ...stats,
    };

    setValue(fieldName, updatedValue);
    setNewItemText('');
  }, [newItemText, currentValue, fieldName, setValue, updateCompletionStats]);

  // Remove checklist item
  const handleRemoveItem = React.useCallback((itemId: string) => {
    if (!currentValue) return;

    const updatedItems = currentValue.items
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }));

    const stats = updateCompletionStats(updatedItems);
    const updatedValue: ChecklistValue = {
      ...currentValue,
      items: updatedItems,
      ...stats,
    };

    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue, updateCompletionStats]);

  // Load template
  const handleLoadTemplate = React.useCallback((templateKey: keyof typeof CHECKLIST_TEMPLATES) => {
    const template = CHECKLIST_TEMPLATES[templateKey];
    
    const templateItems: ChecklistItem[] = template.items.map((text, index) => ({
      id: `template-${Date.now()}-${index}`,
      text,
      isCompleted: false,
      order: index,
    }));

    const stats = updateCompletionStats(templateItems);
    const updatedValue: ChecklistValue = {
      items: templateItems,
      title: template.title,
      ...stats,
    };

    setValue(fieldName, updatedValue);
    setShowTemplates(false);
  }, [fieldName, setValue, updateCompletionStats]);

  // Reset all items to incomplete
  const handleResetAll = React.useCallback(() => {
    if (!currentValue) return;

    const resetItems = currentValue.items.map(item => ({
      ...item,
      isCompleted: false,
      completedAt: undefined,
    }));

    const stats = updateCompletionStats(resetItems);
    const updatedValue: ChecklistValue = {
      ...currentValue,
      items: resetItems,
      ...stats,
    };

    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue, updateCompletionStats]);

  // Mark all items as complete
  const handleCompleteAll = React.useCallback(() => {
    if (!currentValue) return;

    const now = new Date();
    const completedItems = currentValue.items.map(item => ({
      ...item,
      isCompleted: true,
      completedAt: now,
    }));

    const stats = updateCompletionStats(completedItems);
    const updatedValue: ChecklistValue = {
      ...currentValue,
      items: completedItems,
      ...stats,
    };

    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue, updateCompletionStats]);

  // Handle enter key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  if (!currentValue) return null;

  return (
    <Field
      label={block.label}
      required={block.required}
      error={error?.message}
      hint={block.config?.hint || 'Create a checklist to track task completion'}
      blockType="checklist"
      id={`checklist-${block.id}`}
    >
      <div className="space-y-4">
        {/* Checklist header */}
        <div className="space-y-3">
          {/* Title */}
          {currentValue.title && (
            <div className="text-sm font-medium">{currentValue.title}</div>
          )}

          {/* Progress */}
          {currentValue.totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>
                  {currentValue.completedCount} / {currentValue.totalCount} ({currentValue.completionPercentage}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentValue.completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-xs"
            >
              Templates
            </Button>
            {currentValue.items.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCompleteAll}
                  className="text-xs"
                  disabled={currentValue.completionPercentage === 100}
                >
                  <CheckSquare className="w-3 h-3 mr-1" />
                  Complete All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  className="text-xs"
                  disabled={currentValue.completionPercentage === 0}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Template selector */}
        {showTemplates && (
          <div className="space-y-2 border rounded-md p-3 bg-muted/30">
            <div className="text-sm font-medium">Quick Templates</div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(CHECKLIST_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLoadTemplate(key as keyof typeof CHECKLIST_TEMPLATES)}
                  className="justify-start text-left"
                >
                  <div>
                    <div className="font-medium text-xs">{template.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.items.length} items
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(false)}
              className="w-full text-xs"
            >
              Close
            </Button>
          </div>
        )}

        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add new checklist item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddItem}
            disabled={!newItemText.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Checklist items */}
        {currentValue.items.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentValue.items
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2 border rounded-md transition-all ${
                    item.isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-background border-border hover:bg-muted/30'
                  }`}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={item.isCompleted}
                    onCheckedChange={() => handleItemToggle(item.id)}
                    className="flex-shrink-0"
                  />

                  {/* Item text */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm ${
                        item.isCompleted
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {item.text}
                    </div>
                    {item.completedAt && (
                      <div className="text-xs text-muted-foreground">
                        Completed: {item.completedAt.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Item number */}
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {index + 1}
                  </Badge>

                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
          </div>
        )}

        {/* Completion status */}
        {currentValue.totalCount > 0 && (
          <div className="text-center">
            {currentValue.completionPercentage === 100 ? (
              <Badge variant="default" className="text-sm">
                <CheckSquare className="w-3 h-3 mr-1" />
                All tasks completed! 🎉
              </Badge>
            ) : currentValue.completionPercentage > 0 ? (
              <Badge variant="secondary" className="text-sm">
                <Square className="w-3 h-3 mr-1" />
                {currentValue.totalCount - currentValue.completedCount} tasks remaining
              </Badge>
            ) : (
              <div className="text-sm text-muted-foreground">
                Click items to mark them as complete
              </div>
            )}
          </div>
        )}
      </div>
    </Field>
  );
};

export default ChecklistBlock;