import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Ruler,
  Weight,
  Camera,
  Star,
  Calendar,
  Target,
  Upload,
  X,
  ArrowUpDown,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================================================
// GROWTH ACTIVITY VALIDATION SCHEMA
// ============================================================================

export const growthActivitySchema = z
  .object({
    // Weight measurements
    weight_value: z
      .number()
      .min(0.1, 'Weight must be at least 0.1')
      .max(200, 'Weight too large')
      .optional(),
    weight_unit: z.enum(['kg', 'lbs']).optional(),
    weight_context: z.string().max(100, 'Weight context too long').optional(),

    // Height measurements
    height_value: z
      .number()
      .min(1, 'Height must be at least 1')
      .max(500, 'Height too large')
      .optional(),
    height_unit: z.enum(['cm', 'in']).optional(),

    // Length measurements (for pets that are measured lying down)
    length_value: z.number().min(1).max(500).optional(),
    length_unit: z.enum(['cm', 'in']).optional(),

    // Milestone tracking
    milestone_type: z.string().max(100, 'Milestone type too long').optional(),
    milestone_description: z.string().max(500, 'Milestone description too long').optional(),
    milestone_achieved: z.boolean().optional(),
    milestone_date: z.string().optional(),

    // Development stage
    development_stage: z
      .enum(['newborn', 'infant', 'juvenile', 'adolescent', 'adult', 'senior', 'geriatric'])
      .optional(),
    expected_adult_weight: z.number().min(0.1).max(200).optional(),
    expected_adult_weight_unit: z.enum(['kg', 'lbs']).optional(),

    // Photo comparison
    comparison_photos: z.array(z.instanceof(File)).max(5, 'Maximum 5 comparison photos').optional(),
    photo_context: z.string().max(200, 'Photo context too long').optional(),

    // Growth metrics
    growth_rate: z.enum(['slow', 'normal', 'fast', 'concerning']).optional(),
    body_condition: z.enum(['underweight', 'ideal', 'overweight', 'obese']).optional(),

    // Measurement environment
    measurement_conditions: z
      .object({
        location: z.string().max(50).optional(),
        time_of_day: z.string().max(20).optional(),
        before_after_meal: z.enum(['before', 'after', 'n/a']).optional(),
        measurement_method: z.string().max(100).optional(),
      })
      .optional(),

    // Progress notes
    growth_notes: z.string().max(1000, 'Growth notes too long').optional(),
    concerns: z.string().max(500, 'Concerns too long').optional(),
  })
  .refine(
    data => {
      // Weight validation
      if (data.weight_value && !data.weight_unit) return false;
      if (data.weight_unit && !data.weight_value) return false;
      // Height validation
      if (data.height_value && !data.height_unit) return false;
      if (data.height_unit && !data.height_value) return false;
      // Length validation
      if (data.length_value && !data.length_unit) return false;
      if (data.length_unit && !data.length_value) return false;
      // Expected adult weight validation
      if (data.expected_adult_weight && !data.expected_adult_weight_unit) return false;
      if (data.expected_adult_weight_unit && !data.expected_adult_weight) return false;
      return true;
    },
    {
      message: 'Measurement value and unit must be provided together',
    },
  );

export type GrowthActivityFormData = z.infer<typeof growthActivitySchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface GrowthActivityFormProps {
  form: UseFormReturn<GrowthActivityFormData>;
  showMeasurements?: boolean;
  showMilestones?: boolean;
  showPhotoComparison?: boolean;
  showGrowthAnalysis?: boolean;
  compact?: boolean;
  onPhotoAdd?: (files: File[]) => void;
  onPhotoRemove?: (index: number) => void;
  onMeasurementChange?: (type: 'weight' | 'height' | 'length', value: number, unit: string) => void;
}

// ============================================================================
// CONSTANTS AND OPTIONS
// ============================================================================

const DEVELOPMENT_STAGES = [
  { value: 'newborn', label: 'Newborn (0-4 weeks)', color: 'bg-pink-100 text-pink-800' },
  { value: 'infant', label: 'Infant (1-3 months)', color: 'bg-blue-100 text-blue-800' },
  { value: 'juvenile', label: 'Juvenile (3-6 months)', color: 'bg-green-100 text-green-800' },
  {
    value: 'adolescent',
    label: 'Adolescent (6-18 months)',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { value: 'adult', label: 'Adult (1-7 years)', color: 'bg-orange-100 text-orange-800' },
  { value: 'senior', label: 'Senior (7+ years)', color: 'bg-purple-100 text-purple-800' },
  { value: 'geriatric', label: 'Geriatric (12+ years)', color: 'bg-gray-100 text-gray-800' },
];

const MILESTONE_TYPES = [
  'First solid food',
  'Eyes opened',
  'First steps',
  'First tooth',
  'Weaning',
  'Sexual maturity',
  'Full adult size',
  'First grooming',
  'Litter box trained',
  'House trained',
  'Social milestone',
  'Other',
];

const GROWTH_RATES = [
  { value: 'slow', label: 'Slower than expected', color: 'text-blue-600' },
  { value: 'normal', label: 'Normal growth rate', color: 'text-green-600' },
  { value: 'fast', label: 'Faster than expected', color: 'text-yellow-600' },
  { value: 'concerning', label: 'Concerning pattern', color: 'text-red-600' },
];

const BODY_CONDITIONS = [
  { value: 'underweight', label: 'Underweight', color: 'text-blue-600' },
  { value: 'ideal', label: 'Ideal weight', color: 'text-green-600' },
  { value: 'overweight', label: 'Overweight', color: 'text-yellow-600' },
  { value: 'obese', label: 'Obese', color: 'text-red-600' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const convertWeight = (value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number => {
  if (from === to) return value;
  if (from === 'kg' && to === 'lbs') return value * 2.20462;
  if (from === 'lbs' && to === 'kg') return value / 2.20462;
  return value;
};

const convertLength = (value: number, from: 'cm' | 'in', to: 'cm' | 'in'): number => {
  if (from === to) return value;
  if (from === 'cm' && to === 'in') return value / 2.54;
  if (from === 'in' && to === 'cm') return value * 2.54;
  return value;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GrowthActivityForm({
  form,
  showMeasurements = true,
  showMilestones = true,
  showPhotoComparison = true,
  showGrowthAnalysis = true,
  compact = false,
  onPhotoAdd,
  onPhotoRemove,
  onMeasurementChange,
}: GrowthActivityFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const weightValue = watch('weight_value');
  const weightUnit = watch('weight_unit');
  const heightValue = watch('height_value');
  const heightUnit = watch('height_unit');
  const developmentStage = watch('development_stage');
  const milestoneType = watch('milestone_type');
  const comparisonPhotos = watch('comparison_photos') || [];

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleMeasurementChange = (
    type: 'weight' | 'height' | 'length',
    value: number,
    unit: string,
  ) => {
    onMeasurementChange?.(type, value, unit);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const currentPhotos = comparisonPhotos;
      const newPhotos = [...currentPhotos, ...files].slice(0, 5); // Max 5 photos
      setValue('comparison_photos', newPhotos);
      onPhotoAdd?.(files);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = comparisonPhotos.filter((_, i) => i !== index);
    setValue('comparison_photos', newPhotos);
    onPhotoRemove?.(index);
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderDevelopmentStageBadge = () => {
    if (!developmentStage) return null;

    const stage = DEVELOPMENT_STAGES.find(s => s.value === developmentStage);
    if (!stage) return null;

    return <Badge className={cn('mb-2', stage.color)}>{stage.label}</Badge>;
  };

  const renderMeasurementsSection = () => {
    if (!showMeasurements) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ruler className="w-5 h-5 text-green-600" />
            Physical Measurements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weight measurement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Weight className="w-4 h-4" />
                Current Weight
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  {...register('weight_value', {
                    valueAsNumber: true,
                    onChange: e => {
                      const value = parseFloat(e.target.value);
                      if (value && weightUnit) {
                        handleMeasurementChange('weight', value, weightUnit);
                      }
                    },
                  })}
                  placeholder="5.2"
                  className="flex-1"
                />
                <Select
                  value={weightUnit || ''}
                  onValueChange={(value: 'kg' | 'lbs') => {
                    setValue('weight_unit', value);
                    if (weightValue) {
                      handleMeasurementChange('weight', weightValue, value);
                    }
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {weightValue && weightUnit && (
                <p className="text-xs text-gray-600">
                  ={' '}
                  {weightUnit === 'kg'
                    ? convertWeight(weightValue, 'kg', 'lbs').toFixed(1) + ' lbs'
                    : convertWeight(weightValue, 'lbs', 'kg').toFixed(1) + ' kg'}
                </p>
              )}
              {errors.weight_value && (
                <p className="text-sm text-red-600">{errors.weight_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight_context">Weight Context</Label>
              <Input
                id="weight_context"
                {...register('weight_context')}
                placeholder="Before meal, after grooming, etc."
              />
              {errors.weight_context && (
                <p className="text-sm text-red-600">{errors.weight_context.message}</p>
              )}
            </div>
          </div>

          {/* Height measurement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <ArrowUpDown className="w-4 h-4" />
                Height/Length
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  {...register('height_value', {
                    valueAsNumber: true,
                    onChange: e => {
                      const value = parseFloat(e.target.value);
                      if (value && heightUnit) {
                        handleMeasurementChange('height', value, heightUnit);
                      }
                    },
                  })}
                  placeholder="35"
                  className="flex-1"
                />
                <Select
                  value={heightUnit || ''}
                  onValueChange={(value: 'cm' | 'in') => {
                    setValue('height_unit', value);
                    if (heightValue) {
                      handleMeasurementChange('height', heightValue, value);
                    }
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {heightValue && heightUnit && (
                <p className="text-xs text-gray-600">
                  ={' '}
                  {heightUnit === 'cm'
                    ? convertLength(heightValue, 'cm', 'in').toFixed(1) + ' in'
                    : convertLength(heightValue, 'in', 'cm').toFixed(1) + ' cm'}
                </p>
              )}
              {errors.height_value && (
                <p className="text-sm text-red-600">{errors.height_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Expected Adult Weight</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  {...register('expected_adult_weight', { valueAsNumber: true })}
                  placeholder="8.0"
                  className="flex-1"
                />
                <Select
                  value={watch('expected_adult_weight_unit') || ''}
                  onValueChange={(value: 'kg' | 'lbs') =>
                    setValue('expected_adult_weight_unit', value)
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Measurement conditions */}
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3">Measurement Conditions</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    {...register('measurement_conditions.location')}
                    placeholder="Home, vet clinic, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time of Day</Label>
                  <Input
                    {...register('measurement_conditions.time_of_day')}
                    placeholder="Morning, evening, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meal Timing</Label>
                  <Select
                    value={watch('measurement_conditions.before_after_meal') || ''}
                    onValueChange={(value: 'before' | 'after' | 'n/a') =>
                      setValue('measurement_conditions.before_after_meal', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before meal</SelectItem>
                      <SelectItem value="after">After meal</SelectItem>
                      <SelectItem value="n/a">Not applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  };

  const renderMilestonesSection = () => {
    if (!showMilestones) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-yellow-600" />
            Growth Milestones
            {renderDevelopmentStageBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Development stage */}
          <div className="space-y-2">
            <Label>Development Stage</Label>
            <Select
              value={developmentStage || ''}
              onValueChange={value =>
                setValue('development_stage', value as GrowthActivityFormData['development_stage'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select development stage" />
              </SelectTrigger>
              <SelectContent>
                {DEVELOPMENT_STAGES.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Milestone type */}
            <div className="space-y-2">
              <Label>Milestone Type</Label>
              <Select
                value={milestoneType || ''}
                onValueChange={(value: string) => setValue('milestone_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.milestone_type && (
                <p className="text-sm text-red-600">{errors.milestone_type.message}</p>
              )}
            </div>

            {/* Milestone date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Milestone Date
              </Label>
              <Input type="date" {...register('milestone_date')} />
            </div>
          </div>

          {/* Milestone description */}
          <div className="space-y-2">
            <Label>Milestone Description</Label>
            <Textarea
              {...register('milestone_description')}
              placeholder="Describe the milestone achievement or observation..."
              rows={3}
            />
            {errors.milestone_description && (
              <p className="text-sm text-red-600">{errors.milestone_description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPhotoComparisonSection = () => {
    if (!showPhotoComparison) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="w-5 h-5 text-blue-600" />
            Photo Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo upload */}
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Label htmlFor="comparison_photos" className="cursor-pointer">
                <div className="flex items-center space-x-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload Comparison Photos</span>
                </div>
              </Label>
              <Input
                id="comparison_photos"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <p className="text-xs text-gray-600 text-center">
                Upload progress photos (max 5 images, 10MB each)
              </p>
            </div>

            {/* Photo previews */}
            {comparisonPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {comparisonPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Comparison ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-gray-600 mt-1 text-center">Photo {index + 1}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Photo context */}
            <div className="space-y-2">
              <Label>Photo Context</Label>
              <Input
                {...register('photo_context')}
                placeholder="Same angle as previous photos, good lighting, etc."
              />
              {errors.photo_context && (
                <p className="text-sm text-red-600">{errors.photo_context.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGrowthAnalysisSection = () => {
    if (!showGrowthAnalysis) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Growth Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Growth rate */}
            <div className="space-y-2">
              <Label>Growth Rate Assessment</Label>
              <Select
                value={watch('growth_rate') || ''}
                onValueChange={value =>
                  setValue('growth_rate', value as GrowthActivityFormData['growth_rate'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assess growth rate" />
                </SelectTrigger>
                <SelectContent>
                  {GROWTH_RATES.map(rate => (
                    <SelectItem key={rate.value} value={rate.value}>
                      <span className={rate.color}>{rate.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body condition */}
            <div className="space-y-2">
              <Label>Body Condition</Label>
              <Select
                value={watch('body_condition') || ''}
                onValueChange={value =>
                  setValue('body_condition', value as GrowthActivityFormData['body_condition'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assess body condition" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_CONDITIONS.map(condition => (
                    <SelectItem key={condition.value} value={condition.value}>
                      <span className={condition.color}>{condition.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Growth notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              Growth Observations
            </Label>
            <Textarea
              {...register('growth_notes')}
              placeholder="Note any changes, patterns, or observations about growth..."
              rows={3}
            />
            {errors.growth_notes && (
              <p className="text-sm text-red-600">{errors.growth_notes.message}</p>
            )}
          </div>

          {/* Concerns */}
          <div className="space-y-2">
            <Label className="text-orange-700">Concerns or Questions</Label>
            <Textarea
              {...register('concerns')}
              placeholder="Any concerns about growth rate, size, or development..."
              rows={2}
            />
            {errors.concerns && <p className="text-sm text-red-600">{errors.concerns.message}</p>}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={cn('space-y-6', compact && 'space-y-4')}>
      {renderMeasurementsSection()}
      {renderMilestonesSection()}
      {renderPhotoComparisonSection()}
      {renderGrowthAnalysisSection()}
    </div>
  );
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useGrowthActivityForm = (defaultValues?: Partial<GrowthActivityFormData>) => {
  return {
    defaultValues: {
      development_stage: 'adult',
      growth_rate: 'normal',
      body_condition: 'ideal',
      milestone_achieved: false,
      comparison_photos: [],
      measurement_conditions: {
        before_after_meal: 'n/a',
      },
      ...defaultValues,
    } as GrowthActivityFormData,
    schema: growthActivitySchema,
  };
};
