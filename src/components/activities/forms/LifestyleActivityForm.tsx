import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  ENERGY_LEVEL_OPTIONS,
  type LifestyleActivityData,
  type SocialInteraction,
} from '../../../lib/types';
import { X, Play, Pause, Square, Clock, MapPin, Users, GraduationCap, Plus } from 'lucide-react';

// Lifestyle activity schema
export const lifestyleActivitySchema = z.object({
  duration_minutes: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours')
    .optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  energy_level: z.number().min(1).max(5).optional(),
  weather_conditions: z.string().max(100).optional(),
  activity_type: z.string().max(100).optional(),
  social_interactions: z
    .array(
      z.object({
        type: z.enum(['pet', 'human', 'stranger']),
        description: z.string().max(200).optional(),
        duration_minutes: z.number().min(1).max(480).optional(),
        reaction: z.string().max(100).optional(),
      }),
    )
    .max(10)
    .optional(),
  training_progress: z
    .object({
      skill: z.string().max(100).optional(),
      level: z.enum(['beginner', 'intermediate', 'advanced', 'mastered']).optional(),
      success_rate: z.number().min(0).max(100).optional(),
      notes: z.string().max(500).optional(),
    })
    .optional(),
});

export type LifestyleActivityFormData = z.infer<typeof lifestyleActivitySchema>;

interface LifestyleActivityFormProps {
  initialData?: LifestyleActivityData;
  onSave?: (data: LifestyleActivityFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// Timer utility functions
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeForInput = (date: Date): string => {
  return date.toTimeString().slice(0, 5); // HH:MM format
};

// Activity type options for lifestyle activities
const ACTIVITY_TYPE_OPTIONS = [
  'Walking',
  'Running',
  'Playing',
  'Training',
  'Grooming',
  'Resting',
  'Swimming',
  'Hiking',
  'Socializing',
  'Learning',
  'Exploring',
  'Other',
];

// Weather condition options
const WEATHER_CONDITIONS = [
  '☀️ Sunny',
  '⛅ Partly Cloudy',
  '☁️ Cloudy',
  '🌧️ Rainy',
  '⛈️ Stormy',
  '❄️ Snowy',
  '🌫️ Foggy',
  '💨 Windy',
  '🌡️ Hot',
  '🧊 Cold',
];

// Training skill options
const TRAINING_SKILLS = [
  'Sit',
  'Stay',
  'Down',
  'Come',
  'Heel',
  'Shake',
  'Roll Over',
  'Fetch',
  'Drop It',
  'Leave It',
  'Wait',
  'Touch',
  'Spin',
  'Bow',
  'Play Dead',
  'Other',
];

export const LifestyleActivityForm: React.FC<LifestyleActivityFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isSubmitting = false,
}) => {
  const [timerState, setTimerState] = useState<{
    isRunning: boolean;
    startTime?: Date;
    elapsedSeconds: number;
  }>({
    isRunning: false,
    elapsedSeconds: 0,
  });

  const [currentWeather, setCurrentWeather] = useState<string>('');
  const [socialInteractions, setSocialInteractions] = useState<SocialInteraction[]>([]);
  const [showTrainingSection, setShowTrainingSection] = useState<boolean>(false);
  const intervalRef = useRef<number | undefined>(undefined);

  const form = useForm<LifestyleActivityFormData>({
    resolver: zodResolver(lifestyleActivitySchema),
    defaultValues: {
      duration_minutes: initialData?.duration_minutes,
      start_time: initialData?.start_time,
      end_time: initialData?.end_time,
      energy_level: initialData?.energy_level,
      weather_conditions: initialData?.weather_conditions || currentWeather,
      activity_type: initialData?.activity_type,
      social_interactions: initialData?.social_interactions || [],
      training_progress: initialData?.training_progress,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Timer functionality
  const startTimer = useCallback(() => {
    const now = new Date();
    setTimerState({
      isRunning: true,
      startTime: now,
      elapsedSeconds: 0,
    });
    setValue('start_time', formatTimeForInput(now));

    intervalRef.current = setInterval(() => {
      setTimerState(prev => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
  }, [setValue]);

  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const now = new Date();
    const durationMinutes = Math.ceil(timerState.elapsedSeconds / 60);

    setValue('end_time', formatTimeForInput(now));
    setValue('duration_minutes', durationMinutes);

    setTimerState({
      isRunning: false,
      elapsedSeconds: 0,
    });
  }, [timerState.elapsedSeconds, setValue]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimerState({
      isRunning: false,
      elapsedSeconds: 0,
    });
    setValue('start_time', '');
    setValue('end_time', '');
    setValue('duration_minutes', undefined);
  }, [setValue]);

  // Auto-detect weather (mock implementation - in real app would use geolocation + weather API)
  useEffect(() => {
    const detectWeather = () => {
      const hour = new Date().getHours();
      const weatherOptions = ['☀️ Sunny', '⛅ Partly Cloudy', '☁️ Cloudy'];
      const randomWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

      // Simulate time-based weather
      if (hour >= 6 && hour < 18) {
        setCurrentWeather(randomWeather);
      } else {
        setCurrentWeather('🌙 Clear Night');
      }
    };

    detectWeather();
  }, []);

  // Social interaction management
  const addSocialInteraction = () => {
    const newInteraction: SocialInteraction = {
      type: 'pet',
      description: '',
      duration_minutes: undefined,
      reaction: '',
    };
    const updated = [...socialInteractions, newInteraction];
    setSocialInteractions(updated);
    setValue('social_interactions', updated);
  };

  const updateSocialInteraction = (
    index: number,
    field: keyof SocialInteraction,
    value: unknown,
  ) => {
    const updated = socialInteractions.map((interaction, i) =>
      i === index ? { ...interaction, [field]: value } : interaction,
    );
    setSocialInteractions(updated);
    setValue('social_interactions', updated);
  };

  const removeSocialInteraction = (index: number) => {
    const updated = socialInteractions.filter((_, i) => i !== index);
    setSocialInteractions(updated);
    setValue('social_interactions', updated);
  };

  // Initialize social interactions from form data
  useEffect(() => {
    if (initialData?.social_interactions) {
      setSocialInteractions(initialData.social_interactions);
    }
  }, [initialData]);

  // Initialize training section visibility
  useEffect(() => {
    if (initialData?.training_progress && Object.keys(initialData.training_progress).length > 0) {
      setShowTrainingSection(true);
    }
  }, [initialData]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const onSubmit = (data: LifestyleActivityFormData) => {
    onSave?.(data);
  };

  return (
    <div className="space-y-6">
      {/* Duration Tracking Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Duration Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-mono">{formatDuration(timerState.elapsedSeconds)}</div>
            <div className="flex gap-2">
              {!timerState.isRunning ? (
                <Button
                  type="button"
                  onClick={startTimer}
                  className="flex items-center gap-1"
                  variant="outline"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={pauseTimer}
                  className="flex items-center gap-1"
                  variant="outline"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button
                type="button"
                onClick={stopTimer}
                className="flex items-center gap-1"
                variant="outline"
                disabled={timerState.elapsedSeconds === 0}
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
              <Button type="button" onClick={resetTimer} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </div>

          {/* Manual Time Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" type="time" {...register('start_time')} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" type="time" {...register('end_time')} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="1"
                max="1440"
                {...register('duration_minutes', { valueAsNumber: true })}
                className="w-full"
              />
              {errors.duration_minutes && (
                <p className="text-sm text-red-500">{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Type and Energy Level */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity_type">Activity Type</Label>
              <Select onValueChange={value => setValue('activity_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPE_OPTIONS.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Energy Level</Label>
              <div className="flex gap-2">
                {ENERGY_LEVEL_OPTIONS.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={watch('energy_level') === option.value ? 'default' : 'outline'}
                    className="flex-1 flex flex-col items-center gap-1 p-2 h-auto"
                    onClick={() => setValue('energy_level', option.value)}
                  >
                    <span className="text-lg">{option.label}</span>
                    <span className="text-xs">{option.description}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location and Weather */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weather_conditions">Weather Conditions</Label>
            <Select
              onValueChange={value => setValue('weather_conditions', value)}
              defaultValue={currentWeather}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weather conditions" />
              </SelectTrigger>
              <SelectContent>
                {WEATHER_CONDITIONS.map(weather => (
                  <SelectItem key={weather} value={weather}>
                    {weather}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Social Interactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Interactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialInteractions.map((interaction, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label>Interaction {index + 1}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSocialInteraction(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    onValueChange={value =>
                      updateSocialInteraction(index, 'type', value as 'pet' | 'human' | 'stranger')
                    }
                    defaultValue={interaction.type}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pet">🐾 Other Pet</SelectItem>
                      <SelectItem value="human">👥 Human</SelectItem>
                      <SelectItem value="stranger">🆕 Stranger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="480"
                    value={interaction.duration_minutes || ''}
                    onChange={e =>
                      updateSocialInteraction(
                        index,
                        'duration_minutes',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  maxLength={200}
                  value={interaction.description || ''}
                  onChange={e => updateSocialInteraction(index, 'description', e.target.value)}
                  placeholder="Describe the interaction..."
                />
              </div>

              <div className="space-y-2">
                <Label>Reaction</Label>
                <Input
                  maxLength={100}
                  value={interaction.reaction || ''}
                  onChange={e => updateSocialInteraction(index, 'reaction', e.target.value)}
                  placeholder="How did your pet react?"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addSocialInteraction}
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Social Interaction
          </Button>
        </CardContent>
      </Card>

      {/* Training Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Training Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-training"
              checked={showTrainingSection}
              onCheckedChange={checked => setShowTrainingSection(checked === true)}
            />
            <Label htmlFor="show-training">Include training progress tracking</Label>
          </div>

          {showTrainingSection && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skill</Label>
                  <Select onValueChange={value => setValue('training_progress.skill', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_SKILLS.map(skill => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    onValueChange={value =>
                      setValue(
                        'training_progress.level',
                        value as 'beginner' | 'intermediate' | 'advanced' | 'mastered',
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">🟢 Beginner</SelectItem>
                      <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                      <SelectItem value="advanced">🟠 Advanced</SelectItem>
                      <SelectItem value="mastered">🔴 Mastered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="success_rate">Success Rate (%)</Label>
                <Input
                  id="success_rate"
                  type="number"
                  min="0"
                  max="100"
                  {...register('training_progress.success_rate', { valueAsNumber: true })}
                  placeholder="Enter success rate (0-100)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="training_notes">Training Notes</Label>
                <Textarea
                  id="training_notes"
                  {...register('training_progress.notes')}
                  placeholder="Add notes about the training session..."
                  maxLength={500}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6">
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : 'Save Lifestyle Activity'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
