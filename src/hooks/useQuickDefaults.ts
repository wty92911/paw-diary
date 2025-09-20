import { useState, useEffect, useCallback } from 'react';
import { ActivityCategory } from '../lib/types/activities';

// Quick default value interfaces
export interface QuickDefaults {
  // General
  subcategory: string;

  // Time-based
  defaultTime: 'now' | 'custom';
  customTimeOffset?: number; // minutes from now

  // Measurement defaults
  weightUnit: string;
  heightUnit: string;
  temperatureUnit: string;

  // Portion defaults
  portionUnit: string;
  defaultBrand?: string;
  defaultProduct?: string;

  // Cost defaults
  currency: string;
  expenseCategory: string;

  // Location defaults
  defaultLocation?: string;
  useGPS: boolean;

  // Notes defaults
  notesTemplate?: string;

  // Rating defaults
  defaultRating?: number;

  // People defaults
  defaultPeople: string[];

  // Tags defaults
  commonTags: string[];
}

// Category-specific quick defaults
export type CategoryQuickDefaults = Partial<QuickDefaults>;

// Pet-specific defaults storage
interface PetQuickDefaults {
  petId: number;
  global: CategoryQuickDefaults;
  categories: Partial<Record<ActivityCategory, CategoryQuickDefaults>>;
  lastUpdated: Date;
}

// Quick defaults service
class QuickDefaultsService {
  private readonly STORAGE_KEY = 'paw-diary-quick-defaults';
  private readonly AUTO_LEARN_THRESHOLD = 3; // Number of uses to establish default

  // Default values for new pets
  private readonly DEFAULT_VALUES: CategoryQuickDefaults = {
    defaultTime: 'now',
    weightUnit: 'kg',
    heightUnit: 'cm',
    temperatureUnit: 'C',
    portionUnit: 'cup',
    currency: 'USD',
    useGPS: true,
    commonTags: [],
    defaultPeople: [],
  };

  // Load pet defaults from localStorage
  private loadPetDefaults(): Record<number, PetQuickDefaults> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const defaults = JSON.parse(stored);

        // Convert date strings back to Date objects
        Object.values(defaults).forEach((petDefault: any) => {
          petDefault.lastUpdated = new Date(petDefault.lastUpdated);
        });

        return defaults;
      }
    } catch (error) {
      console.warn('Failed to load quick defaults:', error);
    }
    return {};
  }

  // Save pet defaults to localStorage
  private savePetDefaults(defaults: Record<number, PetQuickDefaults>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaults));
    } catch (error) {
      console.warn('Failed to save quick defaults:', error);
    }
  }

  // Get defaults for a pet
  getPetDefaults(petId: number): PetQuickDefaults {
    const allDefaults = this.loadPetDefaults();
    const existing = allDefaults[petId];

    if (existing) {
      return existing;
    }

    // Create new defaults for pet
    const newDefaults: PetQuickDefaults = {
      petId,
      global: { ...this.DEFAULT_VALUES },
      categories: {},
      lastUpdated: new Date(),
    };

    allDefaults[petId] = newDefaults;
    this.savePetDefaults(allDefaults);

    return newDefaults;
  }

  // Get defaults for a specific category
  getCategoryDefaults(petId: number, category: ActivityCategory): CategoryQuickDefaults {
    const petDefaults = this.getPetDefaults(petId);
    const categoryDefaults = petDefaults.categories[category] || {};

    // Merge with global defaults
    return {
      ...petDefaults.global,
      ...categoryDefaults,
    };
  }

  // Update global defaults for a pet
  updateGlobalDefaults(petId: number, updates: Partial<CategoryQuickDefaults>): void {
    const allDefaults = this.loadPetDefaults();
    const petDefaults = this.getPetDefaults(petId);

    petDefaults.global = {
      ...petDefaults.global,
      ...updates,
    };
    petDefaults.lastUpdated = new Date();

    allDefaults[petId] = petDefaults;
    this.savePetDefaults(allDefaults);
  }

  // Update category-specific defaults
  updateCategoryDefaults(
    petId: number,
    category: ActivityCategory,
    updates: Partial<CategoryQuickDefaults>,
  ): void {
    const allDefaults = this.loadPetDefaults();
    const petDefaults = this.getPetDefaults(petId);

    petDefaults.categories[category] = {
      ...petDefaults.categories[category],
      ...updates,
    };
    petDefaults.lastUpdated = new Date();

    allDefaults[petId] = petDefaults;
    this.savePetDefaults(allDefaults);
  }

  // Learn from user input (auto-update defaults based on usage)
  learnFromInput(
    petId: number,
    category: ActivityCategory,
    fieldName: keyof CategoryQuickDefaults,
    value: any,
  ): void {
    if (!value || value === '') return;

    const usageKey = `${petId}-${category}-${fieldName}-${value}`;
    const usageCountKey = `usage-count-${usageKey}`;

    // Get current usage count
    let usageCount = 0;
    try {
      const stored = localStorage.getItem(usageCountKey);
      usageCount = stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      // Ignore parse errors
    }

    usageCount++;
    localStorage.setItem(usageCountKey, usageCount.toString());

    // Update default if threshold reached
    if (usageCount >= this.AUTO_LEARN_THRESHOLD) {
      this.updateCategoryDefaults(petId, category, {
        [fieldName]: value,
      });
    }
  }

  // Get smart suggestions based on usage patterns
  getSmartSuggestions(
    petId: number,
    category: ActivityCategory,
    fieldName: keyof CategoryQuickDefaults,
    limit: number = 5,
  ): any[] {
    const suggestions = new Map<any, number>();

    // Search for all usage patterns for this field
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(`usage-count-${petId}-${category}-${fieldName}-`)) {
        continue;
      }

      const value = key.split('-').slice(4).join('-'); // Extract value part
      const count = parseInt(localStorage.getItem(key) || '0', 10);

      if (count > 0) {
        suggestions.set(value, count);
      }
    }

    // Sort by usage count and return top suggestions
    return Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value]) => value);
  }

  // Clear defaults for a pet
  clearForPet(petId: number): void {
    const allDefaults = this.loadPetDefaults();
    delete allDefaults[petId];
    this.savePetDefaults(allDefaults);

    // Clear usage counters
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`-${petId}-`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Clear all defaults
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);

    // Clear all usage counters
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('usage-count-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Get statistics
  getStats(): {
    totalPets: number;
    avgDefaultsPerPet: number;
    mostActiveCategory: string | null;
    oldestDefaults: Date | null;
  } {
    const allDefaults = this.loadPetDefaults();
    const pets = Object.values(allDefaults);

    let totalDefaults = 0;
    const categoryUsage: Record<string, number> = {};
    let oldestDate: Date | null = null;

    pets.forEach(pet => {
      // Count global defaults
      totalDefaults += Object.keys(pet.global).length;

      // Count category defaults
      Object.entries(pet.categories).forEach(([category, defaults]) => {
        totalDefaults += Object.keys(defaults || {}).length;
        categoryUsage[category] = (categoryUsage[category] || 0) + 1;
      });

      // Track oldest defaults
      if (!oldestDate || pet.lastUpdated < oldestDate) {
        oldestDate = pet.lastUpdated;
      }
    });

    const mostActiveCategory =
      Object.entries(categoryUsage).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalPets: pets.length,
      avgDefaultsPerPet: pets.length > 0 ? Math.round(totalDefaults / pets.length) : 0,
      mostActiveCategory,
      oldestDefaults: oldestDate,
    };
  }

  // Export data for backup/sync
  exportData(): Record<number, PetQuickDefaults> {
    return this.loadPetDefaults();
  }

  // Import data from backup/sync
  importData(data: Record<number, PetQuickDefaults>): void {
    // Convert date strings to Date objects
    Object.values(data).forEach(petDefaults => {
      petDefaults.lastUpdated = new Date(petDefaults.lastUpdated);
    });

    this.savePetDefaults(data);
  }
}

// Global service instance
const quickDefaultsService = new QuickDefaultsService();

// Main hook for quick defaults
export function useQuickDefaults(petId: number, category?: ActivityCategory) {
  const [globalDefaults, setGlobalDefaults] = useState<CategoryQuickDefaults>({});
  const [categoryDefaults, setCategoryDefaults] = useState<CategoryQuickDefaults>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load defaults
  const refreshDefaults = useCallback(() => {
    setIsLoading(true);
    try {
      const petDefaults = quickDefaultsService.getPetDefaults(petId);
      setGlobalDefaults(petDefaults.global);

      if (category) {
        const catDefaults = quickDefaultsService.getCategoryDefaults(petId, category);
        setCategoryDefaults(catDefaults);
      }
    } catch (error) {
      console.error('Failed to load quick defaults:', error);
    } finally {
      setIsLoading(false);
    }
  }, [petId, category]);

  // Load defaults on mount and changes
  useEffect(() => {
    refreshDefaults();
  }, [refreshDefaults]);

  // Update global defaults
  const updateGlobal = useCallback(
    (updates: Partial<CategoryQuickDefaults>) => {
      quickDefaultsService.updateGlobalDefaults(petId, updates);
      refreshDefaults();
    },
    [petId, refreshDefaults],
  );

  // Update category defaults
  const updateCategory = useCallback(
    (updates: Partial<CategoryQuickDefaults>) => {
      if (!category) return;

      quickDefaultsService.updateCategoryDefaults(petId, category, updates);
      refreshDefaults();
    },
    [petId, category, refreshDefaults],
  );

  // Learn from user input
  const learnFromInput = useCallback(
    (fieldName: keyof CategoryQuickDefaults, value: any) => {
      if (!category) return;

      quickDefaultsService.learnFromInput(petId, category, fieldName, value);
    },
    [petId, category],
  );

  // Get smart suggestions
  const getSuggestions = useCallback(
    (fieldName: keyof CategoryQuickDefaults, limit?: number) => {
      if (!category) return [];

      return quickDefaultsService.getSmartSuggestions(petId, category, fieldName, limit);
    },
    [petId, category],
  );

  // Clear defaults
  const clearDefaults = useCallback(() => {
    quickDefaultsService.clearForPet(petId);
    refreshDefaults();
  }, [petId, refreshDefaults]);

  // Get combined defaults (category overrides global)
  const combinedDefaults = category ? categoryDefaults : globalDefaults;

  return {
    // State
    globalDefaults,
    categoryDefaults: category ? categoryDefaults : {},
    defaults: combinedDefaults,
    isLoading,

    // Actions
    updateGlobal,
    updateCategory,
    learnFromInput,
    refreshDefaults,
    clearDefaults,

    // Utilities
    getSuggestions,
  };
}

// Hook for global defaults only
export function useGlobalQuickDefaults(petId: number) {
  const [defaults, setDefaults] = useState<CategoryQuickDefaults>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshDefaults = useCallback(() => {
    setIsLoading(true);
    try {
      const petDefaults = quickDefaultsService.getPetDefaults(petId);
      setDefaults(petDefaults.global);
    } catch (error) {
      console.error('Failed to load global defaults:', error);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    refreshDefaults();
  }, [refreshDefaults]);

  const updateDefaults = useCallback(
    (updates: Partial<CategoryQuickDefaults>) => {
      quickDefaultsService.updateGlobalDefaults(petId, updates);
      refreshDefaults();
    },
    [petId, refreshDefaults],
  );

  return {
    defaults,
    isLoading,
    updateDefaults,
    refreshDefaults,
  };
}

// Hook for category-specific defaults
export function useCategoryQuickDefaults(petId: number, category: ActivityCategory) {
  const [defaults, setDefaults] = useState<CategoryQuickDefaults>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshDefaults = useCallback(() => {
    setIsLoading(true);
    try {
      const categoryDefaults = quickDefaultsService.getCategoryDefaults(petId, category);
      setDefaults(categoryDefaults);
    } catch (error) {
      console.error('Failed to load category defaults:', error);
    } finally {
      setIsLoading(false);
    }
  }, [petId, category]);

  useEffect(() => {
    refreshDefaults();
  }, [refreshDefaults]);

  const updateDefaults = useCallback(
    (updates: Partial<CategoryQuickDefaults>) => {
      quickDefaultsService.updateCategoryDefaults(petId, category, updates);
      refreshDefaults();
    },
    [petId, category, refreshDefaults],
  );

  const learnFromInput = useCallback(
    (fieldName: keyof CategoryQuickDefaults, value: any) => {
      quickDefaultsService.learnFromInput(petId, category, fieldName, value);
    },
    [petId, category],
  );

  const getSuggestions = useCallback(
    (fieldName: keyof CategoryQuickDefaults, limit?: number) => {
      return quickDefaultsService.getSmartSuggestions(petId, category, fieldName, limit);
    },
    [petId, category],
  );

  return {
    defaults,
    isLoading,
    updateDefaults,
    refreshDefaults,
    learnFromInput,
    getSuggestions,
  };
}

// Hook for smart suggestions
export function useSmartSuggestions(
  petId: number,
  category: ActivityCategory,
  fieldName: keyof CategoryQuickDefaults,
) {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const refreshSuggestions = useCallback(() => {
    const smartSuggestions = quickDefaultsService.getSmartSuggestions(
      petId,
      category,
      fieldName,
      10,
    );
    setSuggestions(smartSuggestions);
  }, [petId, category, fieldName]);

  useEffect(() => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  return {
    suggestions,
    refreshSuggestions,
  };
}

// Hook for defaults statistics
export function useQuickDefaultsStats() {
  const [stats, setStats] = useState(quickDefaultsService.getStats());

  const refreshStats = useCallback(() => {
    setStats(quickDefaultsService.getStats());
  }, []);

  useEffect(() => {
    refreshStats();

    // Refresh stats periodically
    const interval = setInterval(refreshStats, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return { stats, refreshStats };
}

// Utility functions
export function getPetQuickDefaults(petId: number): PetQuickDefaults {
  return quickDefaultsService.getPetDefaults(petId);
}

export function getCategoryQuickDefaults(
  petId: number,
  category: ActivityCategory,
): CategoryQuickDefaults {
  return quickDefaultsService.getCategoryDefaults(petId, category);
}

export function updateGlobalQuickDefaults(
  petId: number,
  updates: Partial<CategoryQuickDefaults>,
): void {
  quickDefaultsService.updateGlobalDefaults(petId, updates);
}

export function updateCategoryQuickDefaults(
  petId: number,
  category: ActivityCategory,
  updates: Partial<CategoryQuickDefaults>,
): void {
  quickDefaultsService.updateCategoryDefaults(petId, category, updates);
}

export function learnFromUserInput(
  petId: number,
  category: ActivityCategory,
  fieldName: keyof CategoryQuickDefaults,
  value: any,
): void {
  quickDefaultsService.learnFromInput(petId, category, fieldName, value);
}

export function getSmartFieldSuggestions(
  petId: number,
  category: ActivityCategory,
  fieldName: keyof CategoryQuickDefaults,
  limit?: number,
): any[] {
  return quickDefaultsService.getSmartSuggestions(petId, category, fieldName, limit);
}

export function clearQuickDefaultsForPet(petId: number): void {
  quickDefaultsService.clearForPet(petId);
}

export function clearAllQuickDefaults(): void {
  quickDefaultsService.clearAll();
}

export function exportQuickDefaultsData(): Record<number, PetQuickDefaults> {
  return quickDefaultsService.exportData();
}

export function importQuickDefaultsData(data: Record<number, PetQuickDefaults>): void {
  quickDefaultsService.importData(data);
}

// Export service for direct access
export { quickDefaultsService };
