import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { AlertTriangle, Heart, Stethoscope, Calendar, Weight, Plus, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================================================
// HEALTH ACTIVITY VALIDATION SCHEMA
// ============================================================================

export const healthActivitySchema = z
  .object({
    // Basic health information
    veterinarian_name: z.string().max(100, 'Veterinarian name too long').optional(),
    clinic_name: z.string().max(100, 'Clinic name too long').optional(),

    // Medical details
    symptoms: z.array(z.string().max(100)).max(10, 'Too many symptoms listed').optional(),
    diagnosis: z.string().max(500, 'Diagnosis too long').optional(),
    treatment: z.string().max(500, 'Treatment description too long').optional(),

    // Follow-up and scheduling
    next_appointment: z
      .string()
      .optional()
      .refine(date => {
        if (!date) return true;
        const parsed = new Date(date);
        const now = new Date();
        return parsed >= now;
      }, 'Next appointment must be in the future'),

    // Priority and urgency
    is_critical: z.boolean().optional(),
    priority_level: z.enum(['low', 'medium', 'high', 'urgent']).optional(),

    // Weight monitoring
    weight_value: z.number().min(0.1).max(200).optional(),
    weight_unit: z.enum(['kg', 'lbs']).optional(),
    body_condition_score: z.number().min(1).max(9).optional(),

    // Medications
    medications: z
      .array(
        z.object({
          name: z.string().min(1, 'Medication name required').max(100),
          dosage: z.string().max(50).optional(),
          frequency: z.string().max(100).optional(),
          duration: z.string().max(100).optional(),
          notes: z.string().max(200).optional(),
        }),
      )
      .max(10, 'Too many medications listed')
      .optional(),

    // Medical cost tracking
    medical_cost_breakdown: z
      .object({
        consultation: z.number().min(0).optional(),
        medication: z.number().min(0).optional(),
        procedures: z.number().min(0).optional(),
        tests: z.number().min(0).optional(),
        other: z.number().min(0).optional(),
      })
      .optional(),
  })
  .refine(
    data => {
      // If weight_value is provided, weight_unit is required
      if (data.weight_value && !data.weight_unit) return false;
      if (data.weight_unit && !data.weight_value) return false;
      return true;
    },
    {
      message: 'Weight value and unit must be provided together',
      path: ['weight_value'],
    },
  );

export type HealthActivityFormData = z.infer<typeof healthActivitySchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface HealthActivityFormProps {
  // Form integration
  form: UseFormReturn<HealthActivityFormData>;

  // Display options
  showCriticalAlert?: boolean;
  showCostBreakdown?: boolean;
  showMedications?: boolean;
  compact?: boolean;

  // Callbacks
  onCriticalToggle?: (isCritical: boolean) => void;
  onMedicationAdd?: () => void;
  onMedicationRemove?: (index: number) => void;
}

// ============================================================================
// SUBCATEGORY OPTIONS
// ============================================================================

// Health subcategories are now defined in the main types file
// const HEALTH_SUBCATEGORIES = [...];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

const COMMON_SYMPTOMS = [
  'Vomiting',
  'Diarrhea',
  'Lethargy',
  'Loss of appetite',
  'Coughing',
  'Sneezing',
  'Limping',
  'Excessive drinking',
  'Weight loss',
  'Fever',
  'Difficulty breathing',
  'Seizures',
  'Excessive scratching',
  'Hair loss',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HealthActivityForm({
  form,
  showCriticalAlert = true,
  showCostBreakdown = true,
  showMedications = true,
  compact = false,
  onCriticalToggle,
  onMedicationAdd,
  onMedicationRemove,
}: HealthActivityFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const isCritical = watch('is_critical');
  const priorityLevel = watch('priority_level');
  const symptoms = watch('symptoms') || [];
  const medications = watch('medications') || [];

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCriticalToggle = (checked: boolean) => {
    setValue('is_critical', checked);
    if (checked) {
      setValue('priority_level', 'urgent');
    }
    onCriticalToggle?.(checked);
  };

  const addSymptom = (symptom: string) => {
    const currentSymptoms = watch('symptoms') || [];
    if (!currentSymptoms.includes(symptom) && currentSymptoms.length < 10) {
      setValue('symptoms', [...currentSymptoms, symptom]);
    }
  };

  const removeSymptom = (index: number) => {
    const currentSymptoms = watch('symptoms') || [];
    setValue(
      'symptoms',
      currentSymptoms.filter((_, i) => i !== index),
    );
  };

  const addMedication = () => {
    const currentMedications = watch('medications') || [];
    if (currentMedications.length < 10) {
      setValue('medications', [
        ...currentMedications,
        {
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          notes: '',
        },
      ]);
      onMedicationAdd?.();
    }
  };

  const removeMedication = (index: number) => {
    const currentMedications = watch('medications') || [];
    setValue(
      'medications',
      currentMedications.filter((_, i) => i !== index),
    );
    onMedicationRemove?.(index);
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderCriticalAlert = () => {
    if (!showCriticalAlert || !isCritical) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="font-medium text-red-800">Critical Health Event</span>
        </div>
        <p className="text-sm text-red-700 mt-1">
          This has been flagged as a critical health event. Ensure all details are documented
          thoroughly.
        </p>
      </div>
    );
  };

  const renderPriorityBadge = () => {
    if (!priorityLevel) return null;

    const priority = PRIORITY_LEVELS.find(p => p.value === priorityLevel);
    if (!priority) return null;

    return <Badge className={cn('mb-2', priority.color)}>{priority.label}</Badge>;
  };

  const renderBasicHealthInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Stethoscope className="w-5 h-5 text-red-600" />
          Medical Information
          {renderPriorityBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical health flag */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_critical"
            checked={isCritical || false}
            onCheckedChange={handleCriticalToggle}
          />
          <Label htmlFor="is_critical" className="text-sm font-medium flex items-center gap-1">
            <Heart className="w-4 h-4 text-red-500" />
            Critical Health Event
          </Label>
        </div>

        {/* Priority level */}
        <div className="space-y-2">
          <Label htmlFor="priority_level">Priority Level</Label>
          <Select
            value={priorityLevel || ''}
            onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
              setValue('priority_level', value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority level" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_LEVELS.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>
                  <span className={cn('px-2 py-1 rounded text-xs', priority.color)}>
                    {priority.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Veterinarian */}
          <div className="space-y-2">
            <Label htmlFor="veterinarian_name">Veterinarian</Label>
            <Input
              id="veterinarian_name"
              {...register('veterinarian_name')}
              placeholder="Dr. Jane Smith"
            />
            {errors.veterinarian_name && (
              <p className="text-sm text-red-600">{errors.veterinarian_name.message}</p>
            )}
          </div>

          {/* Clinic */}
          <div className="space-y-2">
            <Label htmlFor="clinic_name">Veterinary Clinic</Label>
            <Input
              id="clinic_name"
              {...register('clinic_name')}
              placeholder="Happy Paws Animal Hospital"
            />
            {errors.clinic_name && (
              <p className="text-sm text-red-600">{errors.clinic_name.message}</p>
            )}
          </div>
        </div>

        {/* Diagnosis */}
        <div className="space-y-2">
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Input
            id="diagnosis"
            {...register('diagnosis')}
            placeholder="Routine checkup - healthy"
          />
          {errors.diagnosis && <p className="text-sm text-red-600">{errors.diagnosis.message}</p>}
        </div>

        {/* Treatment */}
        <div className="space-y-2">
          <Label htmlFor="treatment">Treatment Plan</Label>
          <Textarea
            id="treatment"
            {...register('treatment')}
            placeholder="Prescribed medication, follow-up instructions..."
            rows={3}
          />
          {errors.treatment && <p className="text-sm text-red-600">{errors.treatment.message}</p>}
        </div>

        {/* Next Appointment */}
        <div className="space-y-2">
          <Label htmlFor="next_appointment" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Next Appointment
          </Label>
          <Input id="next_appointment" type="date" {...register('next_appointment')} />
          {errors.next_appointment && (
            <p className="text-sm text-red-600">{errors.next_appointment.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderSymptomsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Symptoms & Observations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current symptoms */}
        {symptoms.length > 0 && (
          <div className="space-y-2">
            <Label>Current Symptoms</Label>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {symptom}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => removeSymptom(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick symptom buttons */}
        <div className="space-y-2">
          <Label>Common Symptoms (click to add)</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map(symptom => (
              <Button
                key={symptom}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => addSymptom(symptom)}
                disabled={symptoms.includes(symptom) || symptoms.length >= 10}
              >
                <Plus className="w-3 h-3 mr-1" />
                {symptom}
              </Button>
            ))}
          </div>
        </div>

        {errors.symptoms && <p className="text-sm text-red-600">{errors.symptoms.message}</p>}
      </CardContent>
    </Card>
  );

  const renderWeightSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Weight className="w-5 h-5 text-blue-600" />
          Weight Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weight measurement */}
          <div className="space-y-2">
            <Label htmlFor="weight_value">Weight</Label>
            <div className="flex gap-2">
              <Input
                id="weight_value"
                type="number"
                step="0.1"
                {...register('weight_value', { valueAsNumber: true })}
                placeholder="5.2"
                className="flex-1"
              />
              <Select
                value={watch('weight_unit') || ''}
                onValueChange={(value: 'kg' | 'lbs') => setValue('weight_unit', value)}
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
            {errors.weight_value && (
              <p className="text-sm text-red-600">{errors.weight_value.message}</p>
            )}
          </div>

          {/* Body condition score */}
          <div className="space-y-2">
            <Label htmlFor="body_condition_score">Body Condition Score (1-9)</Label>
            <Select
              value={watch('body_condition_score')?.toString() || ''}
              onValueChange={value => setValue('body_condition_score', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select BCS" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(score => (
                  <SelectItem key={score} value={score.toString()}>
                    {score} - {score <= 3 ? 'Underweight' : score >= 7 ? 'Overweight' : 'Ideal'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.body_condition_score && (
              <p className="text-sm text-red-600">{errors.body_condition_score.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMedicationsSection = () => {
    if (!showMedications) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Medications</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMedication}
              disabled={medications.length >= 10}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Medication
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {medications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No medications recorded. Click "Add Medication" to get started.
            </p>
          ) : (
            medications.map((_, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">Medication #{index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Medication Name *</Label>
                      <Input
                        {...register(`medications.${index}.name`)}
                        placeholder="e.g., Amoxicillin"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dosage</Label>
                      <Input
                        {...register(`medications.${index}.dosage`)}
                        placeholder="e.g., 250mg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Input
                        {...register(`medications.${index}.frequency`)}
                        placeholder="e.g., Twice daily"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        {...register(`medications.${index}.duration`)}
                        placeholder="e.g., 7 days"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Notes</Label>
                    <Textarea
                      {...register(`medications.${index}.notes`)}
                      placeholder="Additional instructions or side effects to watch for..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCostBreakdown = () => {
    if (!showCostBreakdown) return null;

    const costCategories = [
      { key: 'consultation', label: 'Consultation Fee', icon: '👩‍⚕️' },
      { key: 'medication', label: 'Medications', icon: '💊' },
      { key: 'procedures', label: 'Procedures', icon: '🔬' },
      { key: 'tests', label: 'Tests & Diagnostics', icon: '🧪' },
      { key: 'other', label: 'Other Expenses', icon: '💰' },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medical Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {costCategories.map(category => (
              <div key={category.key} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.label}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register(
                    `medical_cost_breakdown.${category.key}` as keyof HealthActivityFormData,
                    { valueAsNumber: true },
                  )}
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>

          {/* Total calculation display */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center font-medium">
              <span>Total Medical Expenses:</span>
              <span className="text-lg">
                $
                {Object.values(watch('medical_cost_breakdown') || {})
                  .reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0)
                  .toFixed(2)}
              </span>
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
      {renderCriticalAlert()}
      {renderBasicHealthInfo()}
      {renderSymptomsSection()}
      {renderWeightSection()}
      {renderMedicationsSection()}
      {renderCostBreakdown()}
    </div>
  );
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useHealthActivityForm = (defaultValues?: Partial<HealthActivityFormData>) => {
  return {
    defaultValues: {
      priority_level: 'medium',
      is_critical: false,
      symptoms: [],
      medications: [],
      medical_cost_breakdown: {
        consultation: undefined,
        medication: undefined,
        procedures: undefined,
        tests: undefined,
        other: undefined,
      },
      ...defaultValues,
    } as HealthActivityFormData,
    schema: healthActivitySchema,
  };
};
