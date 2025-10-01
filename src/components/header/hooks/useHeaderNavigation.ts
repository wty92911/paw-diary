/**
 * Header Navigation Hook
 * 
 * Provides navigation utilities for header components including:
 * - Back button functionality
 * - Route navigation
 * - Breadcrumb management
 */

import { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BreadcrumbItem, BackAction, BackActionType, UseHeaderNavigationReturn } from '../types';

// ============================================================================
// Constants
// ============================================================================

const MAX_BREADCRUMBS = 5;

// ============================================================================
// Helper Functions
// ============================================================================

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: '/',
      active: pathname === '/'
    }
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label: formatSegmentLabel(segment),
      href: currentPath,
      active: isLast
    });
  });

  // Limit breadcrumbs to prevent UI overflow
  return breadcrumbs.slice(-MAX_BREADCRUMBS);
}

function formatSegmentLabel(segment: string): string {
  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function canNavigateBack(): boolean {
  return window.history.length > 1;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useHeaderNavigation(): UseHeaderNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================================
  // Navigation Functions
  // ============================================================================

  const goBack = useCallback(() => {
    if (canNavigateBack()) {
      navigate(-1);
    } else {
      // Fallback to home if no history
      navigate('/');
    }
  }, [navigate]);

  const navigateTo = useCallback((url: string) => {
    navigate(url);
  }, [navigate]);

  // ============================================================================
  // Breadcrumb Generation
  // ============================================================================

  const breadcrumbs = useMemo(() => {
    return generateBreadcrumbsFromPath(location.pathname);
  }, [location.pathname]);

  // ============================================================================
  // Return Object
  // ============================================================================

  return {
    goBack,
    canGoBack: canNavigateBack(),
    navigateTo,
    currentPath: location.pathname,
    breadcrumbs
  };
}

// ============================================================================
// Back Action Handler Hook
// ============================================================================

export function useBackActionHandler() {
  const navigation = useHeaderNavigation();

  const handleBackAction = useCallback((backAction?: BackAction) => {
    if (!backAction) {
      navigation.goBack();
      return;
    }

    if (backAction.disabled) {
      return;
    }

    switch (backAction.type) {
      case BackActionType.ROUTER_BACK:
        navigation.goBack();
        break;
      
      case BackActionType.CUSTOM_HANDLER:
        if (backAction.handler) {
          backAction.handler();
        } else {
          console.warn('Custom back action specified but no handler provided');
          navigation.goBack();
        }
        break;
      
      case BackActionType.NAVIGATE_TO_URL:
        if (backAction.url) {
          navigation.navigateTo(backAction.url);
        } else {
          console.warn('Navigate to URL action specified but no URL provided');
          navigation.goBack();
        }
        break;
      
      default:
        navigation.goBack();
        break;
    }
  }, [navigation]);

  return { handleBackAction };
}