/**
 * Header Actions Component
 * 
 * Renders action buttons with proper positioning and styling
 * Supports multiple action variants and positions
 */

import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { HeaderActionsProps, ActionVariant, ActionPosition, MAX_ACTION_LABEL_LENGTH } from '../types';

// ============================================================================
// Component Styles
// ============================================================================

const ACTIONS_CONTAINER_STYLES = 'flex items-center gap-2';
const LEADING_ACTIONS_STYLES = 'flex items-center gap-2 mr-auto';
const TRAILING_ACTIONS_STYLES = 'flex items-center gap-2 ml-auto';

// ============================================================================
// Helper Functions
// ============================================================================

function getButtonVariant(actionVariant: ActionVariant) {
  switch (actionVariant) {
    case ActionVariant.PRIMARY:
      return 'default';
    case ActionVariant.SECONDARY:
      return 'secondary';
    case ActionVariant.GHOST:
      return 'ghost';
    case ActionVariant.DESTRUCTIVE:
      return 'destructive';
    default:
      return 'ghost';
  }
}

function getButtonClasses(actionVariant: ActionVariant) {
  switch (actionVariant) {
    case ActionVariant.PRIMARY:
      return 'bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200';
    case ActionVariant.SECONDARY:
      return 'bg-orange-100/80 hover:bg-orange-200/80 text-orange-800 border-orange-200 shadow-sm hover:shadow-md transition-all duration-200';
    case ActionVariant.GHOST:
      return 'hover:bg-orange-100/60 text-orange-700 hover:text-orange-800 transition-all duration-200';
    default:
      return '';
  }
}

function truncateLabel(label: string, maxLength: number = MAX_ACTION_LABEL_LENGTH): string {
  if (label.length <= maxLength) {
    return label;
  }
  return label.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// Main Component
// ============================================================================

export function HeaderActions({
  actions,
  className
}: HeaderActionsProps) {
  
  // Filter and group actions by position
  const visibleActions = actions.filter(action => action.visible !== false);
  const leadingActions = visibleActions.filter(action => action.position === ActionPosition.LEADING);
  const trailingActions = visibleActions.filter(action => action.position === ActionPosition.TRAILING);
  
  if (visibleActions.length === 0) {
    return null;
  }
  
  return (
    <div className={cn(ACTIONS_CONTAINER_STYLES, className)}>
      {/* Leading Actions */}
      {leadingActions.length > 0 && (
        <div className={LEADING_ACTIONS_STYLES}>
          {leadingActions.map((action) => {
            const Icon = action.icon;
            const displayLabel = truncateLabel(action.label);
            
            return (
              <Button
                key={action.id}
                variant={getButtonVariant(action.variant)}
                size="sm"
                onClick={action.handler}
                disabled={action.disabled}
                title={action.label}
                aria-label={action.label}
                className={getButtonClasses(action.variant)}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {displayLabel}
              </Button>
            );
          })}
        </div>
      )}
      
      {/* Trailing Actions */}
      {trailingActions.length > 0 && (
        <div className={TRAILING_ACTIONS_STYLES}>
          {trailingActions.map((action) => {
            const Icon = action.icon;
            const displayLabel = truncateLabel(action.label);
            
            return (
              <Button
                key={action.id}
                variant={getButtonVariant(action.variant)}
                size="sm"
                onClick={action.handler}
                disabled={action.disabled}
                title={action.label}
                aria-label={action.label}
                className={getButtonClasses(action.variant)}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {displayLabel}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

HeaderActions.displayName = 'HeaderActions';