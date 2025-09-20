{/* No React import needed for this component */}
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ActivityMode } from '../../lib/types/activities';
import { updateActivityMode } from '../../utils/activityEditorParams';
import { cn } from '../../lib/utils';

export interface EditorModeSwitchProps {
  /** Current active mode */
  currentMode: ActivityMode;
  /** Callback when mode changes */
  onModeChange?: (mode: ActivityMode) => void;
  /** Whether to sync with URL parameters (default: true) */
  syncWithUrl?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * EditorModeSwitch - Mode switching component for activity editor
 * 
 * Provides a segmented control interface for switching between Quick, Guided,
 * and Advanced editing modes. Can optionally sync with URL parameters for
 * proper navigation state management.
 * 
 * Features:
 * - Three-way segmented control (Quick | Guided | Advanced)
 * - URL synchronization for navigation state preservation
 * - Visual indicators for current mode
 * - Accessibility support with proper ARIA labels
 * - Responsive design for mobile and desktop
 * 
 * Usage:
 * ```tsx
 * <EditorModeSwitch 
 *   currentMode={mode}
 *   onModeChange={handleModeChange}
 *   syncWithUrl={true}
 * />
 * ```
 */
export function EditorModeSwitch({
  currentMode,
  onModeChange,
  syncWithUrl = true,
  className,
  disabled = false,
}: EditorModeSwitchProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleModeChange = (newMode: ActivityMode) => {
    // Call external callback if provided
    onModeChange?.(newMode);

    // Update URL parameters if sync is enabled
    if (syncWithUrl) {
      const updatedParams = updateActivityMode(searchParams, newMode);
      setSearchParams(updatedParams, { replace: true });
    }
  };

  const modeOptions: Array<{
    mode: ActivityMode;
    label: string;
    description: string;
    shortLabel: string;
  }> = [
    {
      mode: 'quick',
      label: 'Quick Log',
      shortLabel: 'Quick',
      description: 'Essential information only (1-2 fields)',
    },
    {
      mode: 'guided',
      label: 'Guided Flow',
      shortLabel: 'Guided',
      description: 'Step-by-step with all template fields',
    },
    {
      mode: 'advanced',
      label: 'Advanced Editor',
      shortLabel: 'Advanced',
      description: 'Full editor with tabs and advanced features',
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Mode Toggle Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="text-sm font-medium text-gray-700">
          Editing Mode:
        </div>
        
        {/* Segmented Control */}
        <div className="flex bg-gray-100 rounded-lg p-1 space-x-1">
          {modeOptions.map(({ mode, shortLabel, description }) => (
            <Button
              key={mode}
              variant={currentMode === mode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange(mode)}
              disabled={disabled}
              className={cn(
                'relative px-3 py-1.5 text-xs font-medium transition-all',
                'focus:z-10 focus:outline-none focus:ring-2 focus:ring-orange-500',
                currentMode === mode
                  ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
              title={description}
              aria-label={`Switch to ${shortLabel} mode: ${description}`}
            >
              {shortLabel}
            </Button>
          ))}
        </div>

        {/* Current Mode Badge (Mobile-friendly) */}
        <Badge
          variant="secondary"
          className="sm:hidden text-xs bg-orange-100 text-orange-800"
        >
          {modeOptions.find(option => option.mode === currentMode)?.label}
        </Badge>
      </div>

      {/* Mode Description */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-2 border border-gray-200">
        <span className="font-medium">
          {modeOptions.find(option => option.mode === currentMode)?.label}:
        </span>{' '}
        {modeOptions.find(option => option.mode === currentMode)?.description}
      </div>
    </div>
  );
}

/**
 * Compact version of EditorModeSwitch for use in headers or constrained spaces
 */
export function EditorModeSwitchCompact({
  currentMode,
  onModeChange,
  syncWithUrl = true,
  className,
  disabled = false,
}: EditorModeSwitchProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleModeChange = (newMode: ActivityMode) => {
    onModeChange?.(newMode);

    if (syncWithUrl) {
      const updatedParams = updateActivityMode(searchParams, newMode);
      setSearchParams(updatedParams, { replace: true });
    }
  };

  const modeLabels = {
    quick: 'Q',
    guided: 'G', 
    advanced: 'A',
  };

  const modeDescriptions = {
    quick: 'Quick Log',
    guided: 'Guided Flow',
    advanced: 'Advanced Editor',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {(Object.keys(modeLabels) as ActivityMode[]).map((mode) => (
        <Button
          key={mode}
          variant={currentMode === mode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange(mode)}
          disabled={disabled}
          className={cn(
            'w-8 h-8 p-0 text-xs font-mono',
            currentMode === mode
              ? 'bg-orange-100 text-orange-800 border border-orange-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}
          title={modeDescriptions[mode]}
          aria-label={`Switch to ${modeDescriptions[mode]} mode`}
        >
          {modeLabels[mode]}
        </Button>
      ))}
    </div>
  );
}

export default EditorModeSwitch;