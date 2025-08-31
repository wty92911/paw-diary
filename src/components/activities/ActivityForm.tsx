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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Calendar, Clock, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Activity form schema
const activityFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  category: z.enum(['health', 'growth', 'diet', 'lifestyle', 'expense']),
  subcategory: z.string().min(1, 'Subcategory is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  cost: z.number().optional(),
  location: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

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
      'Other',
    ],
  },
  growth: {
    label: 'Growth',
    subcategories: [
      'Weight Check',
      'Height Measurement',
      'Growth Milestone',
      'Development Stage',
      'Size Comparison',
      'Other',
    ],
  },
  diet: {
    label: 'Diet',
    subcategories: [
      'Meal',
      'Treat',
      'Water Intake',
      'Food Change',
      'Supplements',
      'Special Diet',
      'Other',
    ],
  },
  lifestyle: {
    label: 'Lifestyle',
    subcategories: [
      'Walk',
      'Play Time',
      'Training',
      'Socialization',
      'Exercise',
      'Rest',
      'Travel',
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
  onSubmit: (data: ActivityFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ActivityForm({
  pet,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: ActivityFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof ACTIVITY_CATEGORIES>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: '',
      category: 'lifestyle',
      subcategory: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      cost: undefined,
      location: '',
    },
  });

  const watchedCategory = watch('category');

  // Update selected category when form value changes
  React.useEffect(() => {
    setSelectedCategory(watchedCategory as keyof typeof ACTIVITY_CATEGORIES);
    // Reset subcategory when category changes
    setValue('subcategory', '');
  }, [watchedCategory, setValue]);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setSelectedCategory(undefined);
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: ActivityFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit activity:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-600" />
            Add Activity for {pet.name}
          </DialogTitle>
          <DialogDescription>
            Record a new activity, health check, or milestone for {pet.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
              onValueChange={value => setValue('category', value as ActivityFormData['category'])}
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
          {selectedCategory && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Type *</Label>
              <Select
                value={watch('subcategory')}
                onValueChange={value => setValue('subcategory', value)}
              >
                <SelectTrigger
                  id="subcategory"
                  className={cn(errors.subcategory && 'border-red-300')}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_CATEGORIES[selectedCategory].subcategories.map(subcategory => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subcategory && (
                <p className="text-sm text-red-600">{errors.subcategory.message}</p>
              )}
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
              placeholder="Add details about this activity..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Cost and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (¥)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('cost', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Home, Vet clinic, Park"
                {...register('location')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
