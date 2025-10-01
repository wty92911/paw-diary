/**
 * iOS-Style Universal Header Component
 * 
 * Main orchestrator component that renders different header variants
 * with iOS-style design, scroll behavior, and accessibility features.
 */

import { useMemo, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { 
  UniversalHeaderProps, 
  HeaderVariant,
  ColorScheme,
  ElevationLevel,
  DEFAULT_IOS_BEHAVIOR 
} from './types';
import { useHeaderConfiguration } from './HeaderProvider';
import { useScrollState } from './hooks/useScrollState';
import { useIOSLayout } from './hooks/useIOSLayout';
import { IOSHeaderContainer } from './components/IOSHeaderContainer';
import { AppHeader } from './variants/AppHeader';
import { PetContextHeader } from './variants/PetContextHeader';
import { FormHeader } from './variants/FormHeader';
import { ActivitiesHeader } from './variants/ActivitiesHeader';

// ============================================================================
// Main Component
// ============================================================================

export function UniversalHeader({
  configuration,
  children,
  onConfigurationChange: _onConfigurationChange
}: UniversalHeaderProps) {
  const { updateConfiguration: _updateConfiguration } = useHeaderConfiguration();
  const headerRef = useRef<HTMLElement>(null);

  // ============================================================================
  // iOS Layout and Scroll Behavior
  // ============================================================================

  const { headerHeight, isCompact } = useIOSLayout();
  
  // Determine scroll behavior based on configuration
  const enableScrollBehavior = configuration.scrollBehavior !== 'none';
  const hideOnScroll = configuration.scrollBehavior === 'hide';
  
  const { scrollState } = useScrollState({
    hideOnScrollDown: hideOnScroll,
    threshold: 80
  });

  // ============================================================================
  // Theme and Behavior Configuration
  // ============================================================================

  const theme = useMemo(() => ({
    colorScheme: configuration.theme?.colorScheme || ColorScheme.AUTO,
    elevation: configuration.theme?.elevation || ElevationLevel.LOW,
    iosBehavior: {
      ...DEFAULT_IOS_BEHAVIOR,
      ...configuration.theme?.iosBehavior,
      autoHide: hideOnScroll,
      enableBlur: configuration.scrollBehavior === 'blur' || configuration.scrollBehavior === 'auto'
    }
  }), [configuration.theme, configuration.scrollBehavior, hideOnScroll]);

  // ============================================================================
  // Content Padding Effect
  // ============================================================================

  useEffect(() => {
    if (!configuration.contentPadding) return;

    // Apply content padding to body to prevent overlap
    const bodyElement = document.body;
    const paddingTop = `${headerHeight}px`;
    
    bodyElement.style.paddingTop = paddingTop;
    
    return () => {
      bodyElement.style.paddingTop = '';
    };
  }, [configuration.contentPadding, headerHeight]);

  // ============================================================================
  // Variant Rendering
  // ============================================================================

  const renderHeaderVariant = () => {
    const commonProps = {
      sticky: configuration.sticky,
      className: isCompact ? 'text-sm' : ''
    };

    switch (configuration.variant) {
      case HeaderVariant.APP:
        return (
          <AppHeader
            title={configuration.title || ''}
            actions={configuration.actions}
            {...commonProps}
          />
        );

      case HeaderVariant.PET_CONTEXT:
        if (!configuration.petContext) {
          throw new Error('Pet context configuration is required for PET_CONTEXT variant');
        }
        return (
          <PetContextHeader
            pet={configuration.petContext.pet}
            breadcrumbs={configuration.petContext.breadcrumbs}
            showBackButton={configuration.showBackButton}
            backAction={configuration.backAction}
            showPetPhoto={configuration.petContext.showPetPhoto}
            photoSize={configuration.petContext.photoSize}
            showSpecies={configuration.petContext.showSpecies}
            {...commonProps}
          />
        );

      case HeaderVariant.FORM:
        return (
          <FormHeader
            title={configuration.title || ''}
            subtitle={configuration.subtitle}
            showBackButton={configuration.showBackButton}
            backAction={configuration.backAction}
            {...commonProps}
          />
        );

      case HeaderVariant.ACTIVITIES:
        return (
          <ActivitiesHeader
            pet={configuration.petContext?.pet}
            title={configuration.title}
            showBackButton={configuration.showBackButton}
            backAction={configuration.backAction}
            actions={configuration.actions}
            {...commonProps}
          />
        );

      default:
        throw new Error(`Unsupported header variant: ${configuration.variant}`);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!configuration.sticky) {
    // Static header without iOS container
    return (
      <header 
        ref={headerRef}
        className={cn(
          "w-full",
          configuration.className
        )} 
        role="banner"
      >
        <div className="container mx-auto px-4">
          {renderHeaderVariant()}
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>
      </header>
    );
  }

  // iOS-style fixed header with scroll behavior
  return (
    <IOSHeaderContainer
      ref={headerRef}
      scrollState={enableScrollBehavior ? scrollState : { scrollY: 0, isScrolled: false, direction: 'none', isNearTop: true }}
      behavior={theme.iosBehavior}
      colorScheme={theme.colorScheme}
      elevation={theme.elevation}
      className={configuration.className}
    >
      {renderHeaderVariant()}
      {children && (
        <div className="absolute top-full left-0 right-0 px-4 py-2 bg-inherit border-t border-current/10">
          {children}
        </div>
      )}
    </IOSHeaderContainer>
  );
}

// ============================================================================
// Display Name for DevTools
// ============================================================================

UniversalHeader.displayName = 'UniversalHeader';