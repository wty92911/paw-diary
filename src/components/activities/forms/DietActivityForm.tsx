import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import {
  Apple,
  Star,
  AlertTriangle,
  Clock,
  Scale,
  Search,
  Heart,
  Plus,
  X,
  ChefHat,
  Utensils,
  Droplets,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================================================
// DIET ACTIVITY VALIDATION SCHEMA
// ============================================================================

export const dietActivitySchema = z
  .object({
    // Food identification
    food_brand: z.string().max(100, 'Food brand name too long').optional(),
    food_product: z.string().max(100, 'Food product name too long').optional(),
    food_category: z
      .enum([
        'dry_kibble',
        'wet_food',
        'raw_food',
        'treats',
        'supplements',
        'human_food',
        'prescription_diet',
        'other',
      ])
      .optional(),

    // Portion tracking
    portion_amount: z
      .number()
      .min(0.1, 'Portion must be at least 0.1')
      .max(1000, 'Portion too large')
      .optional(),
    portion_unit: z.string().max(20, 'Unit name too long').optional(),
    portion_visual_guide: z
      .enum(['palm_size', 'thumb_size', 'cup_quarter', 'cup_half', 'cup_full', 'other'])
      .optional(),

    // Feeding schedule
    feeding_time: z.string().optional(),
    feeding_schedule: z.string().max(200, 'Schedule description too long').optional(),
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'treat', 'supplement']).optional(),

    // Ratings and preferences
    food_rating: z
      .number()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5')
      .optional(),
    appetite_level: z.enum(['poor', 'fair', 'good', 'excellent', 'ravenous']).optional(),
    eating_speed: z.enum(['very_slow', 'slow', 'normal', 'fast', 'very_fast']).optional(),

    // Allergic reactions and health
    allergic_reaction: z.boolean().optional(),
    reaction_symptoms: z.array(z.string().max(50)).max(10, 'Too many symptoms').optional(),
    reaction_severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    reaction_onset_time: z.string().max(50).optional(),

    // Ingredients and nutrition
    ingredients: z.array(z.string().max(50)).max(20, 'Too many ingredients').optional(),
    avoided_ingredients: z.array(z.string().max(50)).max(10).optional(),

    // Nutritional information
    nutrition_info: z
      .object({
        calories_per_serving: z.number().min(1).max(2000).optional(),
        protein_percentage: z.number().min(0).max(100).optional(),
        fat_percentage: z.number().min(0).max(100).optional(),
        carb_percentage: z.number().min(0).max(100).optional(),
        moisture_percentage: z.number().min(0).max(100).optional(),
      })
      .optional(),

    // Water intake
    water_intake_ml: z.number().min(1).max(5000).optional(),
    water_source: z.enum(['bowl', 'fountain', 'wet_food', 'other']).optional(),

    // Additional tracking
    food_temperature: z.enum(['cold', 'room_temp', 'warm']).optional(),
    feeding_location: z.string().max(50).optional(),
    feeding_notes: z.string().max(1000).optional(),
  })
  .refine(
    data => {
      // Portion validation
      if (data.portion_amount && !data.portion_unit) return false;
      if (data.portion_unit && !data.portion_amount) return false;
      // Reaction validation - if allergic reaction, should have symptoms or severity
      if (data.allergic_reaction && !data.reaction_symptoms?.length && !data.reaction_severity)
        return false;
      return true;
    },
    {
      message: 'Complete information required for portions and reactions',
    },
  );

export type DietActivityFormData = z.infer<typeof dietActivitySchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface DietActivityFormProps {
  form: UseFormReturn<DietActivityFormData>;
  showFoodDatabase?: boolean;
  showNutritionInfo?: boolean;
  showAllergyTracking?: boolean;
  showWaterIntake?: boolean;
  compact?: boolean;
  onFoodSearch?: (query: string) => Promise<Array<{ brand: string; product: string }>>;
  onIngredientAdd?: (ingredient: string) => void;
  onReactionReport?: () => void;
}

// ============================================================================
// CONSTANTS AND OPTIONS
// ============================================================================

const FOOD_CATEGORIES = [
  { value: 'dry_kibble', label: 'Dry Kibble', icon: '🥣' },
  { value: 'wet_food', label: 'Wet Food', icon: '🥫' },
  { value: 'raw_food', label: 'Raw Food', icon: '🥩' },
  { value: 'treats', label: 'Treats', icon: '🦴' },
  { value: 'supplements', label: 'Supplements', icon: '💊' },
  { value: 'human_food', label: 'Human Food', icon: '🍖' },
  { value: 'prescription_diet', label: 'Prescription Diet', icon: '🏥' },
  { value: 'other', label: 'Other', icon: '❓' },
];

const PORTION_UNITS = [
  { value: 'grams', label: 'grams (g)', type: 'weight' },
  { value: 'ounces', label: 'ounces (oz)', type: 'weight' },
  { value: 'cups', label: 'cups', type: 'volume' },
  { value: 'ml', label: 'milliliters (ml)', type: 'volume' },
  { value: 'pieces', label: 'pieces/treats', type: 'count' },
  { value: 'scoops', label: 'scoops', type: 'volume' },
];

const VISUAL_GUIDES = [
  { value: 'palm_size', label: 'Palm-sized portion', description: 'About the size of your palm' },
  {
    value: 'thumb_size',
    label: 'Thumb-sized portion',
    description: 'About the size of your thumb',
  },
  { value: 'cup_quarter', label: '1/4 cup', description: 'Quarter cup measurement' },
  { value: 'cup_half', label: '1/2 cup', description: 'Half cup measurement' },
  { value: 'cup_full', label: '1 full cup', description: 'One full cup measurement' },
  { value: 'other', label: 'Other size', description: 'Custom portion size' },
];

const APPETITE_LEVELS = [
  { value: 'poor', label: '😒 Poor appetite', color: 'text-red-600' },
  { value: 'fair', label: '😐 Fair appetite', color: 'text-yellow-600' },
  { value: 'good', label: '🙂 Good appetite', color: 'text-green-600' },
  { value: 'excellent', label: '😋 Excellent appetite', color: 'text-blue-600' },
  { value: 'ravenous', label: '🤤 Ravenous appetite', color: 'text-purple-600' },
];

const EATING_SPEEDS = [
  { value: 'very_slow', label: 'Very slow eater' },
  { value: 'slow', label: 'Slow eater' },
  { value: 'normal', label: 'Normal pace' },
  { value: 'fast', label: 'Fast eater' },
  { value: 'very_fast', label: 'Very fast (gulping)' },
];

const REACTION_SYMPTOMS = [
  'Vomiting',
  'Diarrhea',
  'Itching',
  'Hives',
  'Swelling',
  'Difficulty breathing',
  'Excessive drooling',
  'Loss of appetite',
  'Lethargy',
  'Skin rash',
];

const COMMON_INGREDIENTS = [
  'Chicken',
  'Beef',
  'Fish',
  'Rice',
  'Wheat',
  'Corn',
  'Soy',
  'Eggs',
  'Dairy',
  'Lamb',
  'Turkey',
  'Sweet potato',
  'Peas',
  'Carrots',
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌆' },
  { value: 'snack', label: 'Snack', icon: '🍪' },
  { value: 'treat', label: 'Treat', icon: '🦴' },
  { value: 'supplement', label: 'Supplement', icon: '💊' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DietActivityForm({
  form,
  showFoodDatabase = true,
  showNutritionInfo = true,
  showAllergyTracking = true,
  showWaterIntake = true,
  compact = false,
  onFoodSearch,
  onIngredientAdd,
  onReactionReport,
}: DietActivityFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const allergicReaction = watch('allergic_reaction');
  const ingredients = watch('ingredients') || [];
  const reactionSymptoms = watch('reaction_symptoms') || [];
  const foodRating = watch('food_rating');
  const foodCategory = watch('food_category');

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const addIngredient = (ingredient: string) => {
    if (!ingredients.includes(ingredient) && ingredients.length < 20) {
      setValue('ingredients', [...ingredients, ingredient]);
      onIngredientAdd?.(ingredient);
    }
  };

  const removeIngredient = (index: number) => {
    setValue(
      'ingredients',
      ingredients.filter((_, i) => i !== index),
    );
  };

  const addReactionSymptom = (symptom: string) => {
    if (!reactionSymptoms.includes(symptom) && reactionSymptoms.length < 10) {
      setValue('reaction_symptoms', [...reactionSymptoms, symptom]);
    }
  };

  const removeReactionSymptom = (index: number) => {
    setValue(
      'reaction_symptoms',
      reactionSymptoms.filter((_, i) => i !== index),
    );
  };

  const handleAllergyToggle = (checked: boolean) => {
    setValue('allergic_reaction', checked);
    if (checked) {
      onReactionReport?.();
    }
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderFoodIdentificationSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Apple className="w-5 h-5 text-orange-600" />
          Food Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Food category */}
          <div className="space-y-2">
            <Label>Food Category</Label>
            <Select
              value={foodCategory || ''}
              onValueChange={value =>
                setValue('food_category', value as DietActivityFormData['food_category'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select food type" />
              </SelectTrigger>
              <SelectContent>
                {FOOD_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meal type */}
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <Select
              value={watch('meal_type') || ''}
              onValueChange={value =>
                setValue('meal_type', value as DietActivityFormData['meal_type'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Food brand */}
          <div className="space-y-2">
            <Label htmlFor="food_brand">Food Brand</Label>
            <div className="flex gap-2">
              <Input
                id="food_brand"
                {...register('food_brand')}
                placeholder="Royal Canin, Hills, etc."
                className="flex-1"
              />
              {showFoodDatabase && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onFoodSearch?.(watch('food_brand') || '')}
                >
                  <Search className="w-4 h-4" />
                </Button>
              )}
            </div>
            {errors.food_brand && (
              <p className="text-sm text-red-600">{errors.food_brand.message}</p>
            )}
          </div>

          {/* Food product */}
          <div className="space-y-2">
            <Label htmlFor="food_product">Food Product</Label>
            <Input
              id="food_product"
              {...register('food_product')}
              placeholder="Adult Cat Food, Puppy Formula, etc."
            />
            {errors.food_product && (
              <p className="text-sm text-red-600">{errors.food_product.message}</p>
            )}
          </div>
        </div>

        {/* Feeding time and location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Feeding Time
            </Label>
            <Input type="time" {...register('feeding_time')} />
          </div>

          <div className="space-y-2">
            <Label>Feeding Location</Label>
            <Input {...register('feeding_location')} placeholder="Kitchen, outside, etc." />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPortionTrackingSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="w-5 h-5 text-blue-600" />
          Portion Size
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Portion amount and unit */}
          <div className="space-y-2">
            <Label>Portion Amount</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                {...register('portion_amount', { valueAsNumber: true })}
                placeholder="100"
                className="flex-1"
              />
              <Select
                value={watch('portion_unit') || ''}
                onValueChange={value => setValue('portion_unit', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {PORTION_UNITS.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.portion_amount && (
              <p className="text-sm text-red-600">{errors.portion_amount.message}</p>
            )}
          </div>

          {/* Visual guide */}
          <div className="space-y-2">
            <Label>Visual Serving Guide</Label>
            <Select
              value={watch('portion_visual_guide') || ''}
              onValueChange={value =>
                setValue(
                  'portion_visual_guide',
                  value as DietActivityFormData['portion_visual_guide'],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose visual guide" />
              </SelectTrigger>
              <SelectContent>
                {VISUAL_GUIDES.map(guide => (
                  <SelectItem key={guide.value} value={guide.value}>
                    <div className="text-left">
                      <div className="font-medium">{guide.label}</div>
                      <div className="text-xs text-gray-500">{guide.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feeding schedule */}
        <div className="space-y-2">
          <Label>Feeding Schedule</Label>
          <Input {...register('feeding_schedule')} placeholder="Twice daily, free feeding, etc." />
        </div>
      </CardContent>
    </Card>
  );

  const renderRatingAndPreferencesSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-yellow-500" />
          Food Rating & Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Food rating */}
          <div className="space-y-2">
            <Label>Food Rating</Label>
            <Select
              value={foodRating?.toString() || ''}
              onValueChange={value => setValue('food_rating', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Rate food" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>
                    <span className="flex items-center gap-1">
                      <span>{'⭐'.repeat(rating)}</span>
                      <span>
                        {rating} star{rating > 1 ? 's' : ''}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Appetite level */}
          <div className="space-y-2">
            <Label>Appetite Level</Label>
            <Select
              value={watch('appetite_level') || ''}
              onValueChange={value =>
                setValue('appetite_level', value as DietActivityFormData['appetite_level'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Appetite" />
              </SelectTrigger>
              <SelectContent>
                {APPETITE_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    <span className={level.color}>{level.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eating speed */}
          <div className="space-y-2">
            <Label>Eating Speed</Label>
            <Select
              value={watch('eating_speed') || ''}
              onValueChange={value =>
                setValue('eating_speed', value as DietActivityFormData['eating_speed'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Eating pace" />
              </SelectTrigger>
              <SelectContent>
                {EATING_SPEEDS.map(speed => (
                  <SelectItem key={speed.value} value={speed.value}>
                    {speed.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Food temperature */}
        <div className="space-y-2">
          <Label>Food Temperature</Label>
          <div className="flex gap-4">
            {['cold', 'room_temp', 'warm'].map(temp => (
              <label key={temp} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...register('food_temperature')}
                  value={temp}
                  className="w-4 h-4"
                />
                <span className="capitalize">
                  {temp === 'room_temp' ? 'Room temperature' : temp}
                </span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderIngredientsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ChefHat className="w-5 h-5 text-green-600" />
          Ingredients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current ingredients */}
        {ingredients.length > 0 && (
          <div className="space-y-2">
            <Label>Ingredients in this food</Label>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {ingredient}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => removeIngredient(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick ingredient buttons */}
        <div className="space-y-2">
          <Label>Common ingredients (click to add)</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_INGREDIENTS.map(ingredient => (
              <Button
                key={ingredient}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => addIngredient(ingredient)}
                disabled={ingredients.includes(ingredient) || ingredients.length >= 20}
              >
                <Plus className="w-3 h-3 mr-1" />
                {ingredient}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAllergyTrackingSection = () => {
    if (!showAllergyTracking) return null;

    return (
      <Card className={cn(allergicReaction && 'border-red-200 bg-red-50')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle
              className={cn('w-5 h-5', allergicReaction ? 'text-red-600' : 'text-yellow-600')}
            />
            Allergic Reaction Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Allergic reaction checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allergic_reaction"
              checked={allergicReaction || false}
              onCheckedChange={handleAllergyToggle}
            />
            <Label htmlFor="allergic_reaction" className="font-medium">
              Pet had an allergic reaction to this food
            </Label>
          </div>

          {allergicReaction && (
            <>
              <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Allergic Reaction Detected</span>
                </div>
                <p className="text-sm text-red-700">
                  Please document the reaction details below and consider consulting with a
                  veterinarian.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reaction severity */}
                <div className="space-y-2">
                  <Label>Reaction Severity</Label>
                  <Select
                    value={watch('reaction_severity') || ''}
                    onValueChange={value =>
                      setValue(
                        'reaction_severity',
                        value as DietActivityFormData['reaction_severity'],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">🟡 Mild</SelectItem>
                      <SelectItem value="moderate">🟠 Moderate</SelectItem>
                      <SelectItem value="severe">🔴 Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Onset time */}
                <div className="space-y-2">
                  <Label>Onset Time</Label>
                  <Input
                    {...register('reaction_onset_time')}
                    placeholder="5 minutes, 2 hours, etc."
                  />
                </div>
              </div>

              {/* Reaction symptoms */}
              <div className="space-y-2">
                <Label>Symptoms</Label>
                {reactionSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {reactionSymptoms.map((symptom, index) => (
                      <Badge key={index} variant="destructive" className="flex items-center gap-1">
                        {symptom}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-red-100"
                          onClick={() => removeReactionSymptom(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {REACTION_SYMPTOMS.map(symptom => (
                    <Button
                      key={symptom}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => addReactionSymptom(symptom)}
                      disabled={reactionSymptoms.includes(symptom) || reactionSymptoms.length >= 10}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {symptom}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderWaterIntakeSection = () => {
    if (!showWaterIntake) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Droplets className="w-5 h-5 text-blue-500" />
            Water Intake
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Water amount */}
            <div className="space-y-2">
              <Label>Water Intake (ml)</Label>
              <Input
                type="number"
                {...register('water_intake_ml', { valueAsNumber: true })}
                placeholder="250"
                min="1"
                max="5000"
              />
              {errors.water_intake_ml && (
                <p className="text-sm text-red-600">{errors.water_intake_ml.message}</p>
              )}
            </div>

            {/* Water source */}
            <div className="space-y-2">
              <Label>Water Source</Label>
              <Select
                value={watch('water_source') || ''}
                onValueChange={value =>
                  setValue('water_source', value as DietActivityFormData['water_source'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select water source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bowl">🥣 Water bowl</SelectItem>
                  <SelectItem value="fountain">⛲ Water fountain</SelectItem>
                  <SelectItem value="wet_food">🥫 From wet food</SelectItem>
                  <SelectItem value="other">❓ Other source</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderNotesSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="w-5 h-5 text-gray-600" />
          Additional Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Feeding Notes</Label>
          <Textarea
            {...register('feeding_notes')}
            placeholder="Any additional observations about feeding, behavior, preferences, etc."
            rows={4}
          />
          {errors.feeding_notes && (
            <p className="text-sm text-red-600">{errors.feeding_notes.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderNutritionInfoSection = () => {
    if (!showNutritionInfo) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nutritional Information (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Calories */}
            <div className="space-y-2">
              <Label>Calories per serving</Label>
              <Input
                type="number"
                {...register('nutrition_info.calories_per_serving', { valueAsNumber: true })}
                placeholder="200"
              />
            </div>

            {/* Protein */}
            <div className="space-y-2">
              <Label>Protein %</Label>
              <Input
                type="number"
                step="0.1"
                {...register('nutrition_info.protein_percentage', { valueAsNumber: true })}
                placeholder="28.0"
              />
            </div>

            {/* Fat */}
            <div className="space-y-2">
              <Label>Fat %</Label>
              <Input
                type="number"
                step="0.1"
                {...register('nutrition_info.fat_percentage', { valueAsNumber: true })}
                placeholder="15.0"
              />
            </div>

            {/* Carbohydrates */}
            <div className="space-y-2">
              <Label>Carbs %</Label>
              <Input
                type="number"
                step="0.1"
                {...register('nutrition_info.carb_percentage', { valueAsNumber: true })}
                placeholder="5.0"
              />
            </div>

            {/* Moisture */}
            <div className="space-y-2">
              <Label>Moisture %</Label>
              <Input
                type="number"
                step="0.1"
                {...register('nutrition_info.moisture_percentage', { valueAsNumber: true })}
                placeholder="10.0"
              />
            </div>
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
      {renderFoodIdentificationSection()}
      {renderPortionTrackingSection()}
      {renderRatingAndPreferencesSection()}
      {renderIngredientsSection()}
      {renderAllergyTrackingSection()}
      {renderWaterIntakeSection()}
      {renderNutritionInfoSection()}
      {renderNotesSection()}
    </div>
  );
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useDietActivityForm = (defaultValues?: Partial<DietActivityFormData>) => {
  return {
    defaultValues: {
      food_category: 'dry_kibble',
      meal_type: 'breakfast',
      food_rating: 3,
      appetite_level: 'good',
      eating_speed: 'normal',
      food_temperature: 'room_temp',
      allergic_reaction: false,
      water_source: 'bowl',
      ingredients: [],
      reaction_symptoms: [],
      ...defaultValues,
    } as DietActivityFormData,
    schema: dietActivitySchema,
  };
};
