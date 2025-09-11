import { useCallback, useMemo } from 'react';
import {
  getBrandSuggestions,
  getRecentBrandSuggestions,
  getFrequentBrandSuggestions,
  getSmartBrandSuggestions,
  searchBrands,
  recordBrandUsage,
  getAllBrandsForPet,
  getProductsForBrand,
  type BrandSuggestion,
} from '../lib/utils/brandMemory';

/**
 * Hook for integrating brand memory functionality into components
 * Provides brand suggestions, search, and usage recording for pet activities
 */
export function useBrandMemory(petId: number, category: string) {
  // Get all brand suggestions for this pet and category
  const suggestions = useMemo(() => getBrandSuggestions(petId, category), [petId, category]);

  // Get recent brand suggestions (used within last 30 days)
  const recentSuggestions = useMemo(
    () => getRecentBrandSuggestions(petId, category),
    [petId, category],
  );

  // Get frequently used brands (used 3+ times)
  const frequentSuggestions = useMemo(
    () => getFrequentBrandSuggestions(petId, category),
    [petId, category],
  );

  // Get smart suggestions combining memory and popular brands
  const smartSuggestions = useMemo(
    () => getSmartBrandSuggestions(petId, category),
    [petId, category],
  );

  // Record brand usage
  const recordUsage = useCallback(
    (brand: string, product?: string) => {
      recordBrandUsage(petId, category, brand, product);
    },
    [petId, category],
  );

  // Search brands by query
  const searchBrandMemory = useCallback(
    (query: string) => {
      if (!query.trim()) return [];
      return searchBrands(petId, category, query);
    },
    [petId, category],
  );

  // Get all brands for this pet (across all categories)
  const allBrands = useMemo(() => getAllBrandsForPet(petId), [petId]);

  // Get products for a specific brand
  const getProducts = useCallback(
    (brand: string) => getProductsForBrand(petId, brand, category),
    [petId, category],
  );

  // Format brand suggestions for display in UI components
  const formatSuggestionsForUI = useCallback((brandSuggestions: BrandSuggestion[]) => {
    return brandSuggestions.map(suggestion => ({
      id: `${suggestion.brand}-${suggestion.product || ''}`,
      label: suggestion.product ? `${suggestion.brand} - ${suggestion.product}` : suggestion.brand,
      brand: suggestion.brand,
      product: suggestion.product,
      isRecent: suggestion.isRecent,
      isFrequent: suggestion.isFrequent,
      lastUsed: suggestion.lastUsed,
      usageCount: suggestion.usageCount,
      score: suggestion.score,
    }));
  }, []);

  return {
    // Raw suggestion data
    suggestions,
    recentSuggestions,
    frequentSuggestions,
    smartSuggestions,
    allBrands,

    // Formatted for UI
    formattedSuggestions: formatSuggestionsForUI(suggestions),
    formattedRecentSuggestions: formatSuggestionsForUI(recentSuggestions),
    formattedFrequentSuggestions: formatSuggestionsForUI(frequentSuggestions),
    formattedSmartSuggestions: formatSuggestionsForUI(smartSuggestions),

    // Actions
    recordUsage,
    searchBrandMemory,
    getProducts,

    // Utility
    formatSuggestionsForUI,
  };
}

/**
 * Simpler hook for just getting brand suggestions formatted for dropdowns/autocomplete
 */
export function useBrandSuggestions(petId: number, category: string) {
  const { formattedSmartSuggestions, recordUsage, searchBrandMemory } = useBrandMemory(
    petId,
    category,
  );

  return {
    suggestions: formattedSmartSuggestions,
    recordUsage,
    search: searchBrandMemory,
  };
}
