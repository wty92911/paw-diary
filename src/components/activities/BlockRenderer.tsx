import React, { Suspense } from 'react';
import { Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ActivityBlockDef, 
  ActivityBlockType, 
  ActivityFormData,
  BlockRendererProps,
  BlockProps 
} from '../../lib/types/activities';

// Lazy load individual block components for better performance
const TitleBlock = React.lazy(() => import('./blocks/TitleBlock'));
const TimeBlock = React.lazy(() => import('./blocks/TimeBlock'));
const NotesBlock = React.lazy(() => import('./blocks/NotesBlock'));
const MeasurementBlock = React.lazy(() => import('./blocks/MeasurementBlock'));
const SubcategoryBlock = React.lazy(() => import('./blocks/SubcategoryBlock'));

// TODO: Implement these block components
// const RatingBlock = React.lazy(() => import('./blocks/RatingBlock'));
// const PortionBlock = React.lazy(() => import('./blocks/PortionBlock'));
// const TimerBlock = React.lazy(() => import('./blocks/TimerBlock'));
// const LocationBlock = React.lazy(() => import('./blocks/LocationBlock'));
// const WeatherBlock = React.lazy(() => import('./blocks/WeatherBlock'));
// const ChecklistBlock = React.lazy(() => import('./blocks/ChecklistBlock'));
// const AttachmentBlock = React.lazy(() => import('./blocks/AttachmentBlock'));
// const CostBlock = React.lazy(() => import('./blocks/CostBlock'));
// const ReminderBlock = React.lazy(() => import('./blocks/ReminderBlock'));
// const PeopleBlock = React.lazy(() => import('./blocks/PeopleBlock'));
// const RecurrenceBlock = React.lazy(() => import('./blocks/RecurrenceBlock'));

// Block component registry mapping block types to their components
const BLOCK_COMPONENT_REGISTRY: Partial<Record<ActivityBlockType, React.LazyExoticComponent<React.ComponentType<BlockProps<any>>>>> = {
  'title': TitleBlock,
  'time': TimeBlock,
  'notes': NotesBlock,
  'measurement': MeasurementBlock,
  'subcategory': SubcategoryBlock,
  // TODO: Add other block components as they are implemented
  // 'rating': RatingBlock,
  // 'portion': PortionBlock,
  // 'timer': TimerBlock,
  // 'location': LocationBlock,
  // 'weather': WeatherBlock,
  // 'checklist': ChecklistBlock,
  // 'attachment': AttachmentBlock,
  // 'cost': CostBlock,
  // 'reminder': ReminderBlock,
  // 'people': PeopleBlock,
  // 'recurrence': RecurrenceBlock,
};

// Loading fallback component
const BlockLoadingFallback: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center justify-center p-4 border rounded-md bg-muted/10">
    <LoadingSpinner className="w-4 h-4 mr-2" />
    <span className="text-sm text-muted-foreground">Loading {label || 'block'}...</span>
  </div>
);

// Error fallback component for individual blocks
class BlockErrorBoundary extends React.Component<
  { 
    children: React.ReactNode;
    blockType: ActivityBlockType;
    blockLabel?: string;
    onRetry?: () => void;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.blockType} block:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">Error</Badge>
              {this.props.blockLabel || this.props.blockType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription className="text-sm">
                Unable to load this block. You can continue with other parts of the form.
                {this.props.onRetry && (
                  <button 
                    onClick={this.props.onRetry}
                    className="ml-2 text-primary underline hover:no-underline"
                  >
                    Try again
                  </button>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Individual block wrapper with consistent styling and error handling
interface BlockWrapperProps {
  block: ActivityBlockDef;
  children: React.ReactNode;
  showRequired?: boolean;
  hasError?: boolean;
}

const BlockWrapper: React.FC<BlockWrapperProps> = ({ 
  block, 
  children, 
  showRequired = true,
  hasError = false 
}) => {
  const wrapperClassName = `space-y-2 ${hasError ? 'ring-2 ring-destructive ring-offset-2' : ''}`;
  
  return (
    <div className={wrapperClassName} data-block-id={block.id} data-block-type={block.type}>
      {block.label && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {block.label}
            {showRequired && block.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </label>
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {block.type}
          </Badge>
        </div>
      )}
      {children}
    </div>
  );
};

// Main BlockRenderer component
export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  control,
  errors,
  watch,
  setValue,
}) => {
  const BlockComponent = BLOCK_COMPONENT_REGISTRY[block.type];
  
  if (!BlockComponent) {
    console.warn(`No component registered for block type: ${block.type}`);
    return (
      <BlockWrapper block={block} hasError={true}>
        <Alert>
          <AlertDescription>
            Unknown block type: {block.type}
          </AlertDescription>
        </Alert>
      </BlockWrapper>
    );
  }

  // Extract field error for this specific block
  const fieldError = errors?.[block.id];
  const hasError = !!fieldError;

  const handleRetry = () => {
    // Clear any errors and re-render the component
    if (setValue) {
      setValue(block.id, undefined);
    }
    window.location.reload(); // Simple retry mechanism
  };

  return (
    <BlockWrapper block={block} hasError={hasError}>
      <BlockErrorBoundary 
        blockType={block.type} 
        blockLabel={block.label}
        onRetry={handleRetry}
      >
        <Suspense 
          fallback={<BlockLoadingFallback label={block.label || block.type} />}
        >
          <BlockComponent
            control={control}
            name={block.id}
            label={block.label}
            required={block.required}
            config={block.config}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        </Suspense>
      </BlockErrorBoundary>
      {hasError && fieldError && (
        <p className="text-sm text-destructive mt-1" role="alert">
          {fieldError.message || 'This field has an error'}
        </p>
      )}
    </BlockWrapper>
  );
};

// Multi-block renderer for rendering arrays of blocks
interface MultiBlockRendererProps {
  blocks: ActivityBlockDef[];
  control: Control<ActivityFormData>;
  errors: FieldErrors<ActivityFormData>;
  watch: UseFormWatch<ActivityFormData>;
  setValue: UseFormSetValue<ActivityFormData>;
  className?: string;
}

export const MultiBlockRenderer: React.FC<MultiBlockRendererProps> = ({
  blocks,
  control,
  errors,
  watch,
  setValue,
  className = 'space-y-4',
}) => {
  return (
    <div className={className}>
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />
      ))}
    </div>
  );
};

// Hook for managing block rendering state
export const useBlockRenderer = () => {
  const [loadedBlocks, setLoadedBlocks] = React.useState<Set<string>>(new Set());
  const [failedBlocks, setFailedBlocks] = React.useState<Set<string>>(new Set());

  const markBlockLoaded = React.useCallback((blockId: string) => {
    setLoadedBlocks(prev => new Set(prev).add(blockId));
  }, []);

  const markBlockFailed = React.useCallback((blockId: string) => {
    setFailedBlocks(prev => new Set(prev).add(blockId));
  }, []);

  const isBlockLoaded = React.useCallback((blockId: string) => {
    return loadedBlocks.has(blockId);
  }, [loadedBlocks]);

  const isBlockFailed = React.useCallback((blockId: string) => {
    return failedBlocks.has(blockId);
  }, [failedBlocks]);

  const resetBlock = React.useCallback((blockId: string) => {
    setLoadedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.delete(blockId);
      return newSet;
    });
    setFailedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.delete(blockId);
      return newSet;
    });
  }, []);

  return {
    loadedBlocks,
    failedBlocks,
    markBlockLoaded,
    markBlockFailed,
    isBlockLoaded,
    isBlockFailed,
    resetBlock,
  };
};

// Utility functions for block operations
export const getBlockDisplayName = (block: ActivityBlockDef): string => {
  return block.label || block.type.charAt(0).toUpperCase() + block.type.slice(1);
};

export const getBlockIcon = (blockType: ActivityBlockType): string => {
  const iconMap: Record<ActivityBlockType, string> = {
    'title': '📝',
    'notes': '📄',
    'time': '⏰',
    'subcategory': '📂',
    'measurement': '📏',
    'rating': '⭐',
    'portion': '🍽️',
    'timer': '⏱️',
    'location': '📍',
    'weather': '🌤️',
    'checklist': '☑️',
    'attachment': '📎',
    'cost': '💰',
    'reminder': '🔔',
    'people': '👥',
    'recurrence': '🔁',
  };
  return iconMap[blockType] || '🔧';
};

export const validateBlockData = (block: ActivityBlockDef, data: any): boolean => {
  if (block.required && (data === undefined || data === null || data === '')) {
    return false;
  }
  
  // Add block-specific validation here
  switch (block.type) {
    case 'measurement':
      return !block.required || (typeof data?.value === 'number' && data?.unit);
    case 'cost':
      return !block.required || (typeof data?.amount === 'number' && data?.currency);
    case 'rating':
      return !block.required || (typeof data?.value === 'number' && data?.value >= 1);
    default:
      return !block.required || !!data;
  }
};

// Export the main component and utilities
export default BlockRenderer;

// Re-export types for convenience
export type { BlockRendererProps, BlockProps };

// Block registry utilities
export const getAvailableBlockTypes = (): ActivityBlockType[] => {
  return Object.keys(BLOCK_COMPONENT_REGISTRY) as ActivityBlockType[];
};

export const isBlockTypeSupported = (blockType: string): blockType is ActivityBlockType => {
  return blockType in BLOCK_COMPONENT_REGISTRY;
};