// Brand memory utilities for remembering product selections per pet

export interface BrandMemoryEntry {
  brand: string;
  product?: string;
  category: string;
  lastUsed: Date;
  usageCount: number;
  petId: number;
}

export interface BrandSuggestion {
  brand: string;
  product?: string;
  category: string;
  isRecent: boolean;
  isFrequent: boolean;
  lastUsed: Date;
  usageCount: number;
  score: number; // Calculated relevance score
}

// Brand memory cache
class BrandMemoryCache {
  private cache: Map<string, BrandMemoryEntry[]> = new Map();
  private readonly STORAGE_KEY = 'paw-diary-brand-memory';
  private readonly MAX_ENTRIES_PER_CATEGORY = 50;
  private readonly RECENT_DAYS_THRESHOLD = 30;
  private readonly FREQUENT_USAGE_THRESHOLD = 3;

  constructor() {
    this.loadFromStorage();
  }

  // Get cache key for pet + category
  private getCacheKey(petId: number, category: string): string {
    return `${petId}-${category}`;
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, entries]) => {
          this.cache.set(key, (entries as any[]).map((entry: any) => ({
            ...entry,
            lastUsed: new Date(entry.lastUsed),
          })));
        });
      }
    } catch (error) {
      console.warn('Failed to load brand memory from localStorage:', error);
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save brand memory to localStorage:', error);
    }
  }

  // Calculate relevance score for a brand entry
  private calculateScore(entry: BrandMemoryEntry): number {
    const now = new Date();
    const daysSinceUsed = (now.getTime() - entry.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    
    // Recency score (0-50 points, decays over time)
    const recencyScore = Math.max(0, 50 - (daysSinceUsed * 2));
    
    // Frequency score (0-50 points, logarithmic scale)
    const frequencyScore = Math.min(50, Math.log(entry.usageCount + 1) * 15);
    
    return recencyScore + frequencyScore;
  }

  // Record brand usage
  recordUsage(
    petId: number,
    category: string,
    brand: string,
    product?: string
  ): void {
    const cacheKey = this.getCacheKey(petId, category);
    const entries = this.cache.get(cacheKey) || [];

    // Find existing entry
    const existingIndex = entries.findIndex(
      entry => entry.brand === brand && entry.product === product
    );

    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = {
        ...entries[existingIndex],
        lastUsed: new Date(),
        usageCount: entries[existingIndex].usageCount + 1,
      };
    } else {
      // Add new entry
      const newEntry: BrandMemoryEntry = {
        brand,
        product,
        category,
        petId,
        lastUsed: new Date(),
        usageCount: 1,
      };
      entries.push(newEntry);
    }

    // Sort by score and keep only top entries
    const entriesWithScores = entries.map(entry => ({
      entry,
      score: this.calculateScore(entry),
    }));

    entriesWithScores.sort((a, b) => b.score - a.score);

    const trimmedEntries = entriesWithScores
      .slice(0, this.MAX_ENTRIES_PER_CATEGORY)
      .map(item => item.entry);

    this.cache.set(cacheKey, trimmedEntries);
    this.saveToStorage();
  }

  // Get brand suggestions for a pet + category
  getSuggestions(petId: number, category: string): BrandSuggestion[] {
    const cacheKey = this.getCacheKey(petId, category);
    const entries = this.cache.get(cacheKey) || [];

    const now = new Date();
    const recentThreshold = new Date(now.getTime() - (this.RECENT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000));

    return entries
      .map(entry => {
        const isRecent = entry.lastUsed >= recentThreshold;
        const isFrequent = entry.usageCount >= this.FREQUENT_USAGE_THRESHOLD;
        const score = this.calculateScore(entry);

        return {
          brand: entry.brand,
          product: entry.product,
          category: entry.category,
          isRecent,
          isFrequent,
          lastUsed: entry.lastUsed,
          usageCount: entry.usageCount,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  // Get recent brands only (used within last 30 days)
  getRecentSuggestions(petId: number, category: string): BrandSuggestion[] {
    return this.getSuggestions(petId, category).filter(suggestion => suggestion.isRecent);
  }

  // Get frequently used brands only (used 3+ times)
  getFrequentSuggestions(petId: number, category: string): BrandSuggestion[] {
    return this.getSuggestions(petId, category).filter(suggestion => suggestion.isFrequent);
  }

  // Search brands by query
  searchBrands(petId: number, category: string, query: string): BrandSuggestion[] {
    const suggestions = this.getSuggestions(petId, category);
    const lowercaseQuery = query.toLowerCase();

    return suggestions.filter(suggestion =>
      suggestion.brand.toLowerCase().includes(lowercaseQuery) ||
      suggestion.product?.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get all unique brands across categories for a pet
  getAllBrands(petId: number): string[] {
    const allBrands = new Set<string>();
    
    this.cache.forEach((entries, key) => {
      if (key.startsWith(`${petId}-`)) {
        entries.forEach(entry => allBrands.add(entry.brand));
      }
    });

    return Array.from(allBrands).sort();
  }

  // Get all products for a specific brand and pet
  getProductsForBrand(petId: number, brand: string, category?: string): string[] {
    const products = new Set<string>();
    
    this.cache.forEach((entries, key) => {
      if (key.startsWith(`${petId}-`)) {
        // If category specified, only check that category
        if (category && !key.endsWith(`-${category}`)) {
          return;
        }

        entries.forEach(entry => {
          if (entry.brand === brand && entry.product) {
            products.add(entry.product);
          }
        });
      }
    });

    return Array.from(products).sort();
  }

  // Clear brand memory for specific pet
  clearForPet(petId: number): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(`${petId}-`)) {
        this.cache.delete(key);
      }
    });
    this.saveToStorage();
  }

  // Clear brand memory for specific category
  clearForCategory(petId: number, category: string): void {
    const cacheKey = this.getCacheKey(petId, category);
    this.cache.delete(cacheKey);
    this.saveToStorage();
  }

  // Clear all brand memory
  clearAll(): void {
    this.cache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Export brand memory data (for backup/sync)
  exportData(): Record<string, BrandMemoryEntry[]> {
    return Object.fromEntries(this.cache);
  }

  // Import brand memory data (for backup/sync)
  importData(data: Record<string, BrandMemoryEntry[]>): void {
    this.cache.clear();
    Object.entries(data).forEach(([key, entries]) => {
      this.cache.set(key, entries.map(entry => ({
        ...entry,
        lastUsed: new Date(entry.lastUsed),
      })));
    });
    this.saveToStorage();
  }

  // Get statistics for debugging
  getStats(): {
    totalEntries: number;
    entriesByPet: Record<number, number>;
    entriesByCategory: Record<string, number>;
    mostUsedBrands: Array<{ brand: string; totalUsage: number }>;
  } {
    const allEntries = Array.from(this.cache.values()).flat();
    const entriesByPet: Record<number, number> = {};
    const entriesByCategory: Record<string, number> = {};
    const brandUsage: Record<string, number> = {};

    allEntries.forEach(entry => {
      // Count by pet
      entriesByPet[entry.petId] = (entriesByPet[entry.petId] || 0) + 1;

      // Count by category
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;

      // Count brand usage
      brandUsage[entry.brand] = (brandUsage[entry.brand] || 0) + entry.usageCount;
    });

    const mostUsedBrands = Object.entries(brandUsage)
      .map(([brand, totalUsage]) => ({ brand, totalUsage }))
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 10);

    return {
      totalEntries: allEntries.length,
      entriesByPet,
      entriesByCategory,
      mostUsedBrands,
    };
  }
}

// Global brand memory instance
const brandMemoryCache = new BrandMemoryCache();

// Public API functions
export function recordBrandUsage(
  petId: number,
  category: string,
  brand: string,
  product?: string
): void {
  brandMemoryCache.recordUsage(petId, category, brand, product);
}

export function getBrandSuggestions(
  petId: number,
  category: string
): BrandSuggestion[] {
  return brandMemoryCache.getSuggestions(petId, category);
}

export function getRecentBrandSuggestions(
  petId: number,
  category: string
): BrandSuggestion[] {
  return brandMemoryCache.getRecentSuggestions(petId, category);
}

export function getFrequentBrandSuggestions(
  petId: number,
  category: string
): BrandSuggestion[] {
  return brandMemoryCache.getFrequentSuggestions(petId, category);
}

export function searchBrands(
  petId: number,
  category: string,
  query: string
): BrandSuggestion[] {
  return brandMemoryCache.searchBrands(petId, category, query);
}

export function getAllBrandsForPet(petId: number): string[] {
  return brandMemoryCache.getAllBrands(petId);
}

export function getProductsForBrand(
  petId: number,
  brand: string,
  category?: string
): string[] {
  return brandMemoryCache.getProductsForBrand(petId, brand, category);
}

export function clearBrandMemoryForPet(petId: number): void {
  brandMemoryCache.clearForPet(petId);
}

export function clearBrandMemoryForCategory(
  petId: number,
  category: string
): void {
  brandMemoryCache.clearForCategory(petId, category);
}

export function clearAllBrandMemory(): void {
  brandMemoryCache.clearAll();
}

export function exportBrandMemoryData(): Record<string, BrandMemoryEntry[]> {
  return brandMemoryCache.exportData();
}

export function importBrandMemoryData(data: Record<string, BrandMemoryEntry[]>): void {
  brandMemoryCache.importData(data);
}

export function getBrandMemoryStats() {
  return brandMemoryCache.getStats();
}

// Utility functions for common brand/product combinations
export function formatBrandProduct(brand: string, product?: string): string {
  return product ? `${brand} - ${product}` : brand;
}

export function parseBrandProduct(combined: string): { brand: string; product?: string } {
  const parts = combined.split(' - ');
  if (parts.length === 2) {
    return { brand: parts[0].trim(), product: parts[1].trim() };
  }
  return { brand: combined.trim() };
}

// Predefined popular brands by category for suggestions
export const POPULAR_BRANDS_BY_CATEGORY: Record<string, string[]> = {
  food: [
    'Hill\'s Science Diet',
    'Royal Canin',
    'Blue Buffalo',
    'Purina Pro Plan',
    'Wellness',
    'Orijen',
    'Acana',
    'Merrick',
    'Taste of the Wild',
    'Natural Balance',
  ],
  treats: [
    'Zuke\'s',
    'Blue Buffalo',
    'Wellness',
    'Friskies',
    'Temptations',
    'Greenies',
    'Milk-Bone',
    'Pup-Peroni',
    'Blue Buffalo Treats',
    'Old Mother Hubbard',
  ],
  medication: [
    'Bravecto',
    'NexGuard',
    'Heartgard',
    'Revolution',
    'Frontline',
    'Advantage',
    'Seresto',
    'K9 Advantix',
  ],
  grooming: [
    'FURminator',
    'Earthbath',
    'Burt\'s Bees',
    'Wahl',
    'Oster',
    'Chris Christensen',
    'Isle of Dogs',
    'TropiClean',
  ],
  toys: [
    'Kong',
    'Nylabone',
    'Chuckit!',
    'Rope & Bone',
    'ZippyPaws',
    'Outward Hound',
    'Petmate',
    'JW Pet',
  ],
};

export function getPopularBrandsForCategory(category: string): string[] {
  return POPULAR_BRANDS_BY_CATEGORY[category] || [];
}

// Smart brand suggestions that combine memory and popular brands
export function getSmartBrandSuggestions(
  petId: number,
  category: string,
  maxSuggestions: number = 10
): BrandSuggestion[] {
  const memorySuggestions = getBrandSuggestions(petId, category);
  const popularBrands = getPopularBrandsForCategory(category);
  
  // Create suggestions from popular brands not already in memory
  const memoryBrands = new Set(memorySuggestions.map(s => s.brand));
  const popularSuggestions: BrandSuggestion[] = popularBrands
    .filter(brand => !memoryBrands.has(brand))
    .map(brand => ({
      brand,
      category,
      isRecent: false,
      isFrequent: false,
      lastUsed: new Date(0), // Never used
      usageCount: 0,
      score: 10, // Lower score than memory-based suggestions
    }));

  // Combine and limit results
  const allSuggestions = [...memorySuggestions, ...popularSuggestions];
  return allSuggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
}

// Export cache instance for direct access
export { brandMemoryCache };