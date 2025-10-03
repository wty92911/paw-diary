import React from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Play, Square, Timer, Clock } from 'lucide-react';
import { type BlockProps, type TimerData } from '../../../lib/types/activities';
import { Field } from './Field';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

// Timer block configuration
interface TimerBlockConfig {
  hint?: string;
  presetDurations?: number[]; // in minutes
}

// TimerBlock component for duration tracking activities
const TimerBlock: React.FC<BlockProps<TimerBlockConfig>> = ({
  control,
  name,
  label = 'Timer',
  required = false,
  config = {},
}) => {
  const fieldName = name;

  return (
    <Controller
      control={control}
      name={fieldName}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState: { error } }) => {
        const currentValue: TimerData | undefined = field.value as unknown as TimerData | undefined;
        const [isRunning, setIsRunning] = React.useState(false);
        const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
        const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

        // Initialize default value
        React.useEffect(() => {
          if (!currentValue) {
            field.onChange({
              type: 'stopwatch',
              duration: 0,
            });
          }
        }, [currentValue, field]);

        // Timer tick effect
        React.useEffect(() => {
          if (isRunning && currentValue?.startTime) {
            intervalRef.current = setInterval(() => {
              const elapsed = Math.floor((Date.now() - currentValue.startTime!.getTime()) / 1000);
              setElapsedSeconds(elapsed);
            }, 1000);
          } else {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }

          return () => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          };
        }, [isRunning, currentValue?.startTime]);

        // Start timer
        const handleStart = () => {
          if (!currentValue) return;

          const now = new Date();
          field.onChange({
            ...currentValue,
            startTime: currentValue.startTime || now,
          });
          setIsRunning(true);
        };

        // Stop timer
        const handleStop = () => {
          if (!currentValue) return;

          const now = new Date();
          const durationMinutes = currentValue.startTime
            ? Math.round((now.getTime() - currentValue.startTime.getTime()) / 60000)
            : 0;

          field.onChange({
            ...currentValue,
            endTime: now,
            duration: durationMinutes,
          });
          setIsRunning(false);
          setElapsedSeconds(0);
        };

        // Reset timer
        const handleReset = () => {
          if (!currentValue) return;

          field.onChange({
            ...currentValue,
            startTime: undefined,
            endTime: undefined,
            duration: 0,
          });
          setIsRunning(false);
          setElapsedSeconds(0);
        };

        // Handle type change
        const handleTypeChange = (type: 'duration' | 'stopwatch' | 'start_end') => {
          if (!currentValue) return;

          field.onChange({
            ...currentValue,
            type,
          });
        };

        // Handle duration input (for duration type)
        const handleDurationChange = (minutes: number) => {
          if (!currentValue) return;

          field.onChange({
            ...currentValue,
            duration: minutes,
          });
        };

        // Handle notes change
        const handleNotesChange = (notes: string) => {
          if (!currentValue) return;

          field.onChange({
            ...currentValue,
            notes: notes || undefined,
          });
        };

        // Format time display (seconds to MM:SS)
        const formatTime = (seconds: number): string => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        // Format datetime for input
        const formatDateTimeForInput = (date?: Date): string => {
          if (!date) return '';
          return date.toISOString().slice(0, 16);
        };

        // Parse datetime from input
        const parseDateTimeFromInput = (dateTimeString: string): Date => {
          return new Date(dateTimeString);
        };

        if (!currentValue) {
          return (
            <Field
              label={label}
              required={required}
              error={error?.message}
              blockType="timer"
              id={`timer-${fieldName}`}
            >
              <div className="text-center text-muted-foreground p-4">
                Timer not initialized
              </div>
            </Field>
          );
        }

        return (
          <Field
            label={label}
            required={required}
            error={error?.message}
            hint={config?.hint || 'Track the duration of this activity'}
            blockType="timer"
            id={`timer-${fieldName}`}
          >
            <div className="space-y-4">
              {/* Timer type selection */}
              <div>
                <label className="text-sm font-medium">Timer Type</label>
                <Select value={currentValue.type} onValueChange={(value) => handleTypeChange(value as 'duration' | 'stopwatch' | 'start_end')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stopwatch">Stopwatch (Track as you go)</SelectItem>
                    <SelectItem value="duration">Duration (Enter manually)</SelectItem>
                    <SelectItem value="start_end">Start & End Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stopwatch mode */}
              {currentValue.type === 'stopwatch' && (
                <div className="space-y-3">
                  <div className="text-center space-y-3">
                    <div className="relative">
                      {/* Main timer display */}
                      <div className="text-4xl font-mono font-bold text-primary">
                        {formatTime(elapsedSeconds)}
                      </div>

                      {/* Status indicator */}
                      <div className={`text-sm flex items-center justify-center gap-1 mt-1 ${isRunning ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <Timer className="w-3 h-3" />
                        {isRunning ? 'Running' : currentValue.duration ? 'Stopped' : 'Ready'}
                      </div>
                    </div>

                    {/* Timer controls */}
                    <div className="flex items-center justify-center gap-2">
                      {!isRunning ? (
                        <Button
                          type="button"
                          onClick={handleStart}
                          className="flex items-center gap-2"
                          size="lg"
                        >
                          <Play className="w-4 h-4" />
                          {currentValue.startTime ? 'Resume' : 'Start'}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleStop}
                          variant="secondary"
                          className="flex items-center gap-2"
                          size="lg"
                        >
                          <Square className="w-4 h-4" />
                          Stop
                        </Button>
                      )}

                      <Button
                        type="button"
                        onClick={handleReset}
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={isRunning}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Activity summary */}
                  {(currentValue.startTime || currentValue.endTime) && (
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="text-sm font-medium">Activity Summary</div>

                      {currentValue.startTime && (
                        <div className="text-xs text-muted-foreground">
                          Started: {currentValue.startTime.toLocaleTimeString()}
                        </div>
                      )}

                      {currentValue.endTime && (
                        <div className="text-xs text-muted-foreground">
                          Ended: {currentValue.endTime.toLocaleTimeString()}
                        </div>
                      )}

                      {currentValue.duration !== undefined && currentValue.duration > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Duration: {currentValue.duration} minutes
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Duration mode */}
              {currentValue.type === 'duration' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={currentValue.duration || 0}
                      onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>

                  {/* Presets for common activity durations */}
                  {config?.presetDurations && config.presetDurations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Quick Durations</div>
                      <div className="flex flex-wrap gap-2">
                        {config.presetDurations.map((preset: number) => (
                          <Button
                            key={preset}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDurationChange(preset)}
                            className="text-xs"
                          >
                            {preset} min
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentValue.duration !== undefined && currentValue.duration > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Duration: {currentValue.duration} minutes
                    </Badge>
                  )}
                </div>
              )}

              {/* Start & End Time mode */}
              {currentValue.type === 'start_end' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Start Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={formatDateTimeForInput(currentValue.startTime)}
                      onChange={(e) => {
                        const startTime = parseDateTimeFromInput(e.target.value);
                        const durationMinutes =
                          currentValue.endTime && startTime
                            ? Math.round((currentValue.endTime.getTime() - startTime.getTime()) / 60000)
                            : undefined;

                        field.onChange({
                          ...currentValue,
                          startTime,
                          duration: durationMinutes,
                        });
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      End Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={formatDateTimeForInput(currentValue.endTime)}
                      onChange={(e) => {
                        const endTime = parseDateTimeFromInput(e.target.value);
                        const durationMinutes =
                          currentValue.startTime && endTime
                            ? Math.round((endTime.getTime() - currentValue.startTime.getTime()) / 60000)
                            : undefined;

                        field.onChange({
                          ...currentValue,
                          endTime,
                          duration: durationMinutes,
                        });
                      }}
                      className="mt-1"
                    />
                  </div>

                  {currentValue.startTime && currentValue.endTime && currentValue.duration !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      Duration: {currentValue.duration} minutes
                    </Badge>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Input
                  type="text"
                  placeholder="Any notes about this activity duration..."
                  value={currentValue.notes || ''}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </Field>
        );
      }}
    />
  );
};

export default TimerBlock;
