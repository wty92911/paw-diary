import React from 'react';
import { Control, FieldError } from 'react-hook-form';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Play, Pause, Square, RotateCcw, Timer } from 'lucide-react';
import { ActivityFormData, ActivityBlockDef } from '../../../lib/types/activities';
import { Field } from './Field';
import { useFormContext } from './FormContext';

// Timer value interface
interface TimerValue {
  duration: number; // Total duration in seconds
  startTime?: Date; // When timer was started
  endTime?: Date; // When timer was stopped
  isRunning: boolean;
  currentTime: number; // Current elapsed time in seconds
  laps?: TimerLap[]; // For activities that need lap tracking
}

// Timer lap interface
interface TimerLap {
  lapNumber: number;
  startTime: Date;
  endTime: Date;
  duration: number; // Duration in seconds
}

// Timer block specific props
interface TimerBlockProps {
  block: ActivityBlockDef & { type: 'timer' };
  control?: Control<ActivityFormData>;
  error?: FieldError;
}

// TimerBlock component for duration tracking activities
const TimerBlock: React.FC<TimerBlockProps> = ({
  block,
  error,
}) => {
  const { watch, setValue } = useFormContext();
  const fieldName = `blocks.${block.id}` as const;
  const currentValue: TimerValue | undefined = watch(fieldName);

  // Timer interval ref
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize default value
  React.useEffect(() => {
    if (!currentValue) {
      setValue(fieldName, {
        duration: 0,
        isRunning: false,
        currentTime: 0,
        laps: [],
      });
    }
  }, [currentValue, fieldName, setValue]);

  // Timer tick effect
  React.useEffect(() => {
    if (currentValue?.isRunning) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const startTime = currentValue.startTime || now;
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        const updatedValue: TimerValue = {
          ...currentValue,
          currentTime: elapsed,
        };
        setValue(fieldName, updatedValue);
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
  }, [currentValue?.isRunning, currentValue?.startTime, fieldName, setValue]);

  // Start timer
  const handleStart = React.useCallback(() => {
    if (!currentValue) return;

    const now = new Date();
    const updatedValue: TimerValue = {
      ...currentValue,
      isRunning: true,
      startTime: currentValue.startTime || now,
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Pause timer
  const handlePause = React.useCallback(() => {
    if (!currentValue) return;

    const updatedValue: TimerValue = {
      ...currentValue,
      isRunning: false,
      duration: currentValue.currentTime,
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Stop timer
  const handleStop = React.useCallback(() => {
    if (!currentValue) return;

    const now = new Date();
    const updatedValue: TimerValue = {
      ...currentValue,
      isRunning: false,
      endTime: now,
      duration: currentValue.currentTime,
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Reset timer
  const handleReset = React.useCallback(() => {
    if (!currentValue) return;

    const updatedValue: TimerValue = {
      duration: 0,
      isRunning: false,
      currentTime: 0,
      laps: [],
    };
    setValue(fieldName, updatedValue);
  }, [fieldName, setValue]);

  // Add lap (for activities that need lap tracking)
  const handleAddLap = React.useCallback(() => {
    if (!currentValue || !currentValue.isRunning) return;

    const now = new Date();
    const previousLap = currentValue.laps?.[currentValue.laps.length - 1];
    const lapStartTime = previousLap ? previousLap.endTime : currentValue.startTime || now;
    
    const newLap: TimerLap = {
      lapNumber: (currentValue.laps?.length || 0) + 1,
      startTime: lapStartTime,
      endTime: now,
      duration: Math.floor((now.getTime() - lapStartTime.getTime()) / 1000),
    };

    const updatedValue: TimerValue = {
      ...currentValue,
      laps: [...(currentValue.laps || []), newLap],
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer status
  const getTimerStatus = (): { label: string; color: string } => {
    if (!currentValue) return { label: 'Ready', color: 'text-muted-foreground' };
    
    if (currentValue.isRunning) {
      return { label: 'Running', color: 'text-green-600' };
    } else if (currentValue.duration > 0) {
      return { label: 'Stopped', color: 'text-blue-600' };
    }
    return { label: 'Ready', color: 'text-muted-foreground' };
  };

  if (!currentValue) return null;

  const displayTime = currentValue.isRunning ? currentValue.currentTime : currentValue.duration;
  const status = getTimerStatus();
  const canAddLaps = block.config?.enableLaps && currentValue.isRunning;

  return (
    <Field
      label={block.label}
      required={block.required}
      error={error?.message}
      hint={block.config?.hint || 'Track the duration of this activity'}
      blockType="timer"
      id={`timer-${block.id}`}
    >
      <div className="space-y-4">
        {/* Timer display */}
        <div className="text-center space-y-3">
          <div className="relative">
            {/* Main timer display */}
            <div className="text-4xl font-mono font-bold text-primary">
              {formatTime(displayTime)}
            </div>
            
            {/* Status indicator */}
            <div className={`text-sm ${status.color} flex items-center justify-center gap-1 mt-1`}>
              <Timer className="w-3 h-3" />
              {status.label}
            </div>
          </div>

          {/* Timer controls */}
          <div className="flex items-center justify-center gap-2">
            {!currentValue.isRunning ? (
              <Button
                type="button"
                onClick={handleStart}
                className="flex items-center gap-2"
                size="lg"
              >
                <Play className="w-4 h-4" />
                {currentValue.duration > 0 ? 'Resume' : 'Start'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handlePause}
                variant="secondary"
                className="flex items-center gap-2"
                size="lg"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}

            {currentValue.duration > 0 && (
              <Button
                type="button"
                onClick={handleStop}
                variant="outline"
                className="flex items-center gap-2"
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
              disabled={currentValue.isRunning}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          {/* Lap button */}
          {canAddLaps && (
            <Button
              type="button"
              onClick={handleAddLap}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Timer className="w-3 h-3" />
              Add Lap
            </Button>
          )}
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
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Duration: {formatTime(currentValue.duration)}
              </Badge>
              {currentValue.laps && currentValue.laps.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {currentValue.laps.length} Lap{currentValue.laps.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Laps list */}
        {currentValue.laps && currentValue.laps.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Laps</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {currentValue.laps.map((lap) => (
                <div key={lap.lapNumber} className="flex items-center justify-between text-xs bg-muted/20 rounded p-2">
                  <span className="font-medium">Lap {lap.lapNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{formatTime(lap.duration)}</span>
                    <span className="text-muted-foreground">
                      {lap.endTime.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Presets for common activity durations */}
        {block.config?.presetDurations && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Quick Durations</div>
            <div className="flex flex-wrap gap-2">
              {block.config.presetDurations.map((preset: number) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updatedValue: TimerValue = {
                      ...currentValue,
                      duration: preset,
                      currentTime: preset,
                    };
                    setValue(fieldName, updatedValue);
                  }}
                  className="text-xs"
                  disabled={currentValue.isRunning}
                >
                  {formatTime(preset)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
};

export default TimerBlock;