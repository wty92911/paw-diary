import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pet } from '../../lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Calendar, Clock, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Note: Specialized form components are available in ./forms/ 
// but not integrated in this basic activity form

// Base activity form schema
const baseActivityFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  category: z.enum(['health', 'growth', 'diet', 'lifestyle', 'expense']),
  subcategory: z.string().min(1, 'Subcategory is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  cost: z.number().optional(),
  location: z.string().optional(),
});

// Activity form schema (basic version)
const activityFormSchema = baseActivityFormSchema;

type ActivityFormData = z.infer<typeof activityFormSchema>;
type ActivityFormDataWithDetails = ActivityFormData & { 
  activity_data?: any;
  petId: number; 
};

// Activity categories and subcategories
const ACTIVITY_CATEGORIES = {
  health: {
    label: 'Health',
    subcategories: [
      'Vet Visit',
      'Vaccination',
      'Checkup',
      'Medication',
      'Symptom',
      'Treatment',
      'Surgery',
      'Dental Care',
      'Grooming',
      'Weight Check',
      'Other',
    ],
  },
  growth: {
    label: 'Growth',
    subcategories: [
      'Weight Measurement',
      'Height Measurement',
      'Milestone',
      'Development',
      'First Time',
      'Behavior Change',
      'Training Progress',
      'Other',
    ],
  },
  diet: {
    label: 'Diet',
    subcategories: [
      'Feeding',
      'Treats',
      'Food Change',
      'Water Intake',
      'Special Diet',
      'Appetite Change',
      'Other',
    ],
  },
  lifestyle: {
    label: 'Lifestyle',
    subcategories: [
      'Walk',
      'Play',
      'Exercise',
      'Training',
      'Socialization',
      'Travel',
      'Rest',
      'Behavior',
      'Other',
    ],
  },
  expense: {
    label: 'Expense',
    subcategories: ['Food', 'Toys', 'Medical', 'Grooming', 'Training', 'Accessories', 'Other'],
  },
};

interface ActivityFormProps {
  pet: Pet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ActivityFormDataWithDetails) => Promise<void>;
  isSubmitting?: boolean;
  inlineMode?: boolean;
  initialCategory?: keyof typeof ACTIVITY_CATEGORIES;
}

export function ActivityForm({
  pet,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  inlineMode = false,
  initialCategory,
}: ActivityFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof ACTIVITY_CATEGORIES>(initialCategory || 'lifestyle');

  // Base form for common fields
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(baseActivityFormSchema),
    defaultValues: {
      title: '',
      category: initialCategory || 'lifestyle',
      subcategory: '',
      description: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      time: new Date().toTimeString().slice(0, 5), // Current time
      cost: undefined,
      location: '',
    },
  });

  // Watch form values for dynamic updates
  const watchedCategory = watch('category');
  const watchedSubcategory = watch('subcategory');

  // Update selected category when category changes
  React.useEffect(() => {
    if (watchedCategory !== selectedCategory) {
      setSelectedCategory(watchedCategory);
      setValue('subcategory', ''); // Reset subcategory when category changes
    }
  }, [watchedCategory, selectedCategory, setValue]);


  // Handle form submission
  const handleFormSubmit = async (data: ActivityFormData) => {
    try {
      // Ensure activity is bound to the specific pet
      const activityData: ActivityFormDataWithDetails = {
        ...data,
        activity_data: {}, // Basic form doesn't collect detailed category data
        petId: pet.id,
      } as ActivityFormDataWithDetails;
      
      await onSubmit(activityData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit activity:', error);
    }
  };

  // Form content component with enhanced category-specific forms
  const formContent = (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Basic Information */}
      <div className="space-y-4 pb-4 border-b">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Activity Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Morning walk, Vet checkup, Weight check"
            {...register('title')}
            className={cn(errors.title && 'border-red-300 focus:border-red-500')}
          />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={watchedCategory}
            onValueChange={value => {
              setValue('category', value as ActivityFormData['category']);
              setSelectedCategory(value as keyof typeof ACTIVITY_CATEGORIES);
            }}
          >
            <SelectTrigger id="category" className={cn(errors.category && 'border-red-300')}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
        </div>

        {/* Subcategory */}
        {watchedCategory && (
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory *</Label>
            <Select
              value={watchedSubcategory}
              onValueChange={value => setValue('subcategory', value)}
            >
              <SelectTrigger id="subcategory" className={cn(errors.subcategory && 'border-red-300')}>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES[watchedCategory].subcategories.map((subcategory: string) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subcategory && <p className="text-sm text-red-600">{errors.subcategory.message}</p>}
          </div>
        )}

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={cn(errors.date && 'border-red-300 focus:border-red-500')}
            />
            {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Time *
            </Label>
            <Input
              id="time"
              type="time"
              {...register('time')}
              className={cn(errors.time && 'border-red-300 focus:border-red-500')}
            />
            {errors.time && <p className="text-sm text-red-600">{errors.time.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional details about this activity..."
            rows={3}
            {...register('description')}
            className={cn(errors.description && 'border-red-300 focus:border-red-500')}
          />
          {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g., Home, Park, Vet Clinic"
            {...register('location')}
            className={cn(errors.location && 'border-red-300 focus:border-red-500')}
          />
          {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
        </div>

        {/* Basic cost field for expense/health */}
        {(watchedCategory === 'expense' || watchedCategory === 'health') && (
          <div className="space-y-2">
            <Label htmlFor="cost">
              {watchedCategory === 'expense' ? 'Amount' : 'Cost'} ($)
            </Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('cost', { valueAsNumber: true })}
              className={cn(errors.cost && 'border-red-300 focus:border-red-500')}
            />
            {errors.cost && <p className="text-sm text-red-600">{errors.cost.message}</p>}
          </div>
        )}
      </div>

      {/* Category-specific forms */}
      <div className="space-y-4">
        {/* Category-specific additional fields */}
        {watchedCategory === 'health' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 font-medium">💊 Health Details Available</span>
            </div>
            <p className="text-sm text-red-700">
              For detailed health tracking including medications, symptoms, and vet information, 
              the comprehensive Health Activity Form is available. This basic form captures essential information.
            </p>
          </div>
        )}
        
        {watchedCategory === 'growth' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 font-medium">📏 Growth Tracking Available</span>
            </div>
            <p className="text-sm text-green-700">
              For detailed growth measurements, milestone tracking, and photo comparisons, 
              the comprehensive Growth Activity Form is available. This basic form captures essential information.
            </p>
          </div>
        )}
        
        {watchedCategory === 'diet' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 font-medium">🍽️ Diet Tracking Available</span>
            </div>
            <p className="text-sm text-blue-700">
              For detailed nutrition tracking, food preferences, and portion analysis, 
              the comprehensive Diet Activity Form is available. This basic form captures essential information.
            </p>
          </div>
        )}
        
        {watchedCategory === 'lifestyle' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-600 font-medium">🏃 Activity Tracking Available</span>
            </div>
            <p className="text-sm text-purple-700">
              For detailed activity timing, mood tracking, and social interactions, 
              the comprehensive Lifestyle Activity Form is available. This basic form captures essential information.
            </p>
          </div>
        )}
        
        {watchedCategory === 'expense' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-600 font-medium">💰 Expense Tracking Available</span>
            </div>
            <p className="text-sm text-orange-700">
              For detailed expense categorization, receipt management, and budget tracking, 
              the comprehensive Expense Activity Form is available. This basic form captures essential information.
            </p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </>
          )}
        </Button>
      </div>
    </form>
  );

  // Return inline mode or dialog mode
  if (inlineMode) {
    return formContent;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-600" />
            Add Activity for {pet.name}
          </DialogTitle>
          <DialogDescription>
            Record a new activity, health check, or milestone for {pet.name}. Fill out the basic information and add category-specific details below.
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}