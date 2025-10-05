/* eslint-disable react-refresh/only-export-components */
// BlockRenderer exports both component and utility constant
import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Control, type FieldErrors, type UseFormWatch, type UseFormSetValue } from 'react-hook-form';
import { type ActivityBlockData } from '../../lib/types/activities';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Alert, AlertDescription } from '../ui/alert';
import {
  type ActivityBlockDef,
  type ActivityBlockType,
  type ActivityFormData,
  type BlockRendererProps,
  type BlockProps
} from '../../lib/types/activities';
// Block helpers available but not used in this file
// import { getBlockDisplayName, getBlockIcon } from './utils/blockHelpers';

// Lazy load individual block components for better performance
const TitleBlock = React.lazy(() => import('./blocks/TitleBlock'));
const TimeBlock = React.lazy(() => import('./blocks/TimeBlock'));
const NotesBlock = React.lazy(() => import('./blocks/NotesBlock'));
const MeasurementBlock = React.lazy(() => import('./blocks/MeasurementBlock'));

// Implemented block components
const RatingBlock = React.lazy(() => import('./blocks/RatingBlock'));
const PortionBlock = React.lazy(() => import('./blocks/PortionBlock'));
const TimerBlock = React.lazy(() => import('./blocks/TimerBlock'));
// const LocationBlock = React.lazy(() => import('./blocks/LocationBlock'));
// const WeatherBlock = React.lazy(() => import('./blocks/WeatherBlock'));
// const ChecklistBlock = React.lazy(() => import('./blocks/ChecklistBlock'));
const AttachmentBlock = React.lazy(() => import('./blocks/AttachmentBlock'));
const CostBlock = React.lazy(() => import('./blocks/CostBlock'));
// const ReminderBlock = React.lazy(() => import('./blocks/ReminderBlock'));
// const PeopleBlock = React.lazy(() => import('./blocks/PeopleBlock'));
// const RecurrenceBlock = React.lazy(() => import('./blocks/RecurrenceBlock'));

// Block component registry mapping block types to their components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BLOCK_COMPONENT_REGISTRY: Partial<Record<ActivityBlockType, React.LazyExoticComponent<React.ComponentType<BlockProps<any>>>>> = {
  'title': TitleBlock,
  'time': TimeBlock,
  'notes': NotesBlock,
  'measurement': MeasurementBlock,
  'rating': RatingBlock,
  'portion': PortionBlock,
  'timer': TimerBlock,
  // 暂时注释掉未修复的组件，将逐个修复后再添加回来
  // 'location': LocationBlock,
  // 'weather': WeatherBlock,
  // 'checklist': ChecklistBlock,
  'attachment': AttachmentBlock,
  'cost': CostBlock,
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
  constructor(props: { children: React.ReactNode; blockType: ActivityBlockType; blockLabel?: string; onRetry?: () => void }) {
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
}) => {
  // Removed error border styling - errors shown at form level only
  const wrapperClassName = 'space-y-2';

  return (
    <motion.div
      className={wrapperClassName} 
      data-block-id={block.id} 
      data-block-type={block.type}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        layout: { type: "spring", bounce: 0.15 },
        opacity: { duration: 0.2 },
        y: { duration: 0.3 }
      }}
    >
      <AnimatePresence>
        {block.label && (
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {block.label}
              {showRequired && block.required && (
                <motion.span 
                  className="text-destructive ml-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.3 }}
                >
                  *
                </motion.span>
              )}
            </label>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {block.type}
              </Badge>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </motion.div>
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
  const fieldError = errors?.blocks?.[block.id];
  const hasError = !!fieldError;

  // Check if field has been touched and get current value
  const currentValue = watch ? watch(`blocks.${block.id}` as `blocks.${string}`) : undefined;
  const isEmpty = currentValue === undefined || currentValue === null || currentValue === '';
  const showRequiredHint = block.required && isEmpty && hasError;

  const handleRetry = () => {
    // Clear any errors and re-render the component
    if (setValue) {
      // Reset to empty string for text fields, or appropriate default based on block type
      const defaultValue = block.type === 'time' ? new Date() : '' as ActivityBlockData;
      setValue(`blocks.${block.id}` as `blocks.${string}`, defaultValue);
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
            name={`blocks.${block.id}`}
            label={block.label}
            required={block.required}
            config={block.config}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        </Suspense>
      </BlockErrorBoundary>
      {/* Required field hint */}
      {showRequiredHint && (
        <motion.div 
          className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md mt-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <span className="text-amber-600 text-xs">⚠️</span>
          <p className="text-xs text-amber-700">
            This field is required - please fill it out to continue
          </p>
        </motion.div>
      )}
      
      {/* General field errors */}
      {hasError && fieldError && !showRequiredHint && (
        <motion.div
          className="mt-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <p className="text-sm text-destructive" role="alert">
            {fieldError.message || 'This field has an error'}
          </p>
        </motion.div>
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

// Export the main component
export default BlockRenderer;

// Re-export types for convenience
export type { BlockRendererProps, BlockProps };