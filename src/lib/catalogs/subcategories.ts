import { ActivityCategory } from '../types/activities';

// Subcategory option interface
export interface SubcategoryOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  isPopular?: boolean;
  sortOrder?: number;
}

// Subcategory cache entry
interface SubcategoryCacheEntry {
  petId: number;
  category: ActivityCategory;
  recentSelections: string[];
  lastUsed: Date;
}

// Comprehensive subcategory definitions per category
export const SUBCATEGORY_OPTIONS: Record<ActivityCategory, SubcategoryOption[]> = {
  [ActivityCategory.Health]: [
    // Veterinary Care
    { id: 'vet-checkup', label: 'Veterinary Checkup', icon: '🏥', isPopular: true, sortOrder: 1 },
    { id: 'vaccination', label: 'Vaccination', icon: '💉', isPopular: true, sortOrder: 2 },
    { id: 'emergency-visit', label: 'Emergency Visit', icon: '🚨', sortOrder: 3 },
    { id: 'dental-care', label: 'Dental Care', icon: '🦷', sortOrder: 4 },
    { id: 'surgery', label: 'Surgery', icon: '⚕️', sortOrder: 5 },
    { id: 'specialist-visit', label: 'Specialist Visit', icon: '👨‍⚕️', sortOrder: 6 },
    
    // Medication & Treatment
    { id: 'medication', label: 'Medication', icon: '💊', isPopular: true, sortOrder: 7 },
    { id: 'supplement', label: 'Supplement', icon: '🌿', sortOrder: 8 },
    { id: 'treatment', label: 'Treatment', icon: '🩹', sortOrder: 9 },
    { id: 'physical-therapy', label: 'Physical Therapy', icon: '🏃‍♂️', sortOrder: 10 },
    
    // Preventive Care
    { id: 'flea-tick-treatment', label: 'Flea & Tick Treatment', icon: '🐛', isPopular: true, sortOrder: 11 },
    { id: 'heartworm-prevention', label: 'Heartworm Prevention', icon: '❤️', isPopular: true, sortOrder: 12 },
    { id: 'deworming', label: 'Deworming', icon: '🪱', sortOrder: 13 },
    
    // Health Monitoring
    { id: 'weight-check', label: 'Weight Check', icon: '⚖️', isPopular: true, sortOrder: 14 },
    { id: 'temperature-check', label: 'Temperature Check', icon: '🌡️', sortOrder: 15 },
    { id: 'blood-work', label: 'Blood Work', icon: '🩸', sortOrder: 16 },
    { id: 'x-ray', label: 'X-Ray', icon: '🩻', sortOrder: 17 },
    { id: 'ultrasound', label: 'Ultrasound', icon: '📡', sortOrder: 18 },
    
    // Symptoms & Issues
    { id: 'illness', label: 'Illness', icon: '🤒', sortOrder: 19 },
    { id: 'injury', label: 'Injury', icon: '🩹', sortOrder: 20 },
    { id: 'behavioral-issue', label: 'Behavioral Issue', icon: '🧠', sortOrder: 21 },
    { id: 'skin-issue', label: 'Skin Issue', icon: '🫧', sortOrder: 22 },
    { id: 'digestive-issue', label: 'Digestive Issue', icon: '🤢', sortOrder: 23 },
  ],

  [ActivityCategory.Growth]: [
    // Physical Development
    { id: 'weight-measurement', label: 'Weight Measurement', icon: '⚖️', isPopular: true, sortOrder: 1 },
    { id: 'height-measurement', label: 'Height Measurement', icon: '📏', sortOrder: 2 },
    { id: 'length-measurement', label: 'Length Measurement', icon: '📐', sortOrder: 3 },
    { id: 'body-condition', label: 'Body Condition Score', icon: '📊', sortOrder: 4 },
    
    // Developmental Milestones
    { id: 'teething', label: 'Teething', icon: '🦷', sortOrder: 5 },
    { id: 'eye-opening', label: 'Eyes Opening', icon: '👁️', sortOrder: 6 },
    { id: 'walking', label: 'First Steps', icon: '👣', sortOrder: 7 },
    { id: 'weaning', label: 'Weaning', icon: '🍼', sortOrder: 8 },
    
    // Behavioral Development
    { id: 'socialization', label: 'Socialization', icon: '👥', isPopular: true, sortOrder: 9 },
    { id: 'house-training', label: 'House Training', icon: '🏠', isPopular: true, sortOrder: 10 },
    { id: 'leash-training', label: 'Leash Training', icon: '🦮', sortOrder: 11 },
    { id: 'basic-commands', label: 'Basic Commands', icon: '🎯', sortOrder: 12 },
    
    // Age Stages
    { id: 'puppy-kitten-stage', label: 'Puppy/Kitten Stage', icon: '🐶', sortOrder: 13 },
    { id: 'adolescent-stage', label: 'Adolescent Stage', icon: '🐕', sortOrder: 14 },
    { id: 'adult-stage', label: 'Adult Stage', icon: '🐕‍🦺', sortOrder: 15 },
    { id: 'senior-stage', label: 'Senior Stage', icon: '👴', sortOrder: 16 },
  ],

  [ActivityCategory.Diet]: [
    // Meal Types
    { id: 'breakfast', label: 'Breakfast', icon: '🌅', isPopular: true, sortOrder: 1 },
    { id: 'lunch', label: 'Lunch', icon: '☀️', sortOrder: 2 },
    { id: 'dinner', label: 'Dinner', icon: '🌙', isPopular: true, sortOrder: 3 },
    { id: 'snack', label: 'Snack', icon: '🍪', isPopular: true, sortOrder: 4 },
    { id: 'treat', label: 'Treat', icon: '🦴', isPopular: true, sortOrder: 5 },
    
    // Food Types
    { id: 'dry-food', label: 'Dry Food', icon: '🥣', isPopular: true, sortOrder: 6 },
    { id: 'wet-food', label: 'Wet Food', icon: '🥫', isPopular: true, sortOrder: 7 },
    { id: 'raw-food', label: 'Raw Food', icon: '🥩', sortOrder: 8 },
    { id: 'homemade-food', label: 'Homemade Food', icon: '👨‍🍳', sortOrder: 9 },
    { id: 'prescription-diet', label: 'Prescription Diet', icon: '💊', sortOrder: 10 },
    
    // Special Diets
    { id: 'weight-management', label: 'Weight Management', icon: '⚖️', sortOrder: 11 },
    { id: 'senior-diet', label: 'Senior Diet', icon: '👴', sortOrder: 12 },
    { id: 'puppy-kitten-food', label: 'Puppy/Kitten Food', icon: '🐶', sortOrder: 13 },
    { id: 'sensitive-stomach', label: 'Sensitive Stomach', icon: '🤢', sortOrder: 14 },
    { id: 'allergy-diet', label: 'Allergy Diet', icon: '🚫', sortOrder: 15 },
    
    // Supplements & Extras
    { id: 'vitamin-supplement', label: 'Vitamin Supplement', icon: '🌿', sortOrder: 16 },
    { id: 'joint-supplement', label: 'Joint Supplement', icon: '🦴', sortOrder: 17 },
    { id: 'probiotic', label: 'Probiotic', icon: '🦠', sortOrder: 18 },
    { id: 'fish-oil', label: 'Fish Oil', icon: '🐟', sortOrder: 19 },
    
    // Water & Hydration
    { id: 'water', label: 'Water', icon: '💧', isPopular: true, sortOrder: 20 },
    { id: 'broth', label: 'Broth', icon: '🍲', sortOrder: 21 },
    { id: 'milk', label: 'Pet Milk', icon: '🥛', sortOrder: 22 },
  ],

  [ActivityCategory.Lifestyle]: [
    // Exercise & Play
    { id: 'walk', label: 'Walk', icon: '🚶', isPopular: true, sortOrder: 1 },
    { id: 'run', label: 'Run/Jog', icon: '🏃', sortOrder: 2 },
    { id: 'hike', label: 'Hiking', icon: '🥾', sortOrder: 3 },
    { id: 'swimming', label: 'Swimming', icon: '🏊', sortOrder: 4 },
    { id: 'fetch', label: 'Fetch', icon: '🎾', isPopular: true, sortOrder: 5 },
    { id: 'tug-of-war', label: 'Tug of War', icon: '🪢', sortOrder: 6 },
    { id: 'agility-training', label: 'Agility Training', icon: '🤸', sortOrder: 7 },
    
    // Rest & Sleep
    { id: 'nap', label: 'Nap', icon: '😴', isPopular: true, sortOrder: 8 },
    { id: 'bedtime', label: 'Bedtime', icon: '🛏️', isPopular: true, sortOrder: 9 },
    { id: 'rest', label: 'Rest Time', icon: '💤', sortOrder: 10 },
    
    // Grooming & Hygiene
    { id: 'bath', label: 'Bath', icon: '🛁', isPopular: true, sortOrder: 11 },
    { id: 'brushing', label: 'Brushing', icon: '🪮', isPopular: true, sortOrder: 12 },
    { id: 'nail-trim', label: 'Nail Trimming', icon: '✂️', isPopular: true, sortOrder: 13 },
    { id: 'ear-cleaning', label: 'Ear Cleaning', icon: '👂', sortOrder: 14 },
    { id: 'teeth-brushing', label: 'Teeth Brushing', icon: '🪥', sortOrder: 15 },
    { id: 'professional-grooming', label: 'Professional Grooming', icon: '💅', sortOrder: 16 },
    
    // Social Activities
    { id: 'playdates', label: 'Playdates', icon: '🤝', sortOrder: 17 },
    { id: 'dog-park', label: 'Dog Park', icon: '🏞️', sortOrder: 18 },
    { id: 'training-class', label: 'Training Class', icon: '🎓', sortOrder: 19 },
    { id: 'pet-store-visit', label: 'Pet Store Visit', icon: '🏪', sortOrder: 20 },
    { id: 'vet-social', label: 'Vet Socialization', icon: '🏥', sortOrder: 21 },
    
    // Travel & Outings
    { id: 'car-ride', label: 'Car Ride', icon: '🚗', sortOrder: 22 },
    { id: 'travel', label: 'Travel', icon: '✈️', sortOrder: 23 },
    { id: 'camping', label: 'Camping', icon: '⛺', sortOrder: 24 },
    { id: 'beach-visit', label: 'Beach Visit', icon: '🏖️', sortOrder: 25 },
    
    // Indoor Activities
    { id: 'toy-play', label: 'Toy Play', icon: '🧸', isPopular: true, sortOrder: 26 },
    { id: 'puzzle-games', label: 'Puzzle Games', icon: '🧩', sortOrder: 27 },
    { id: 'hide-and-seek', label: 'Hide and Seek', icon: '👀', sortOrder: 28 },
    { id: 'cuddle-time', label: 'Cuddle Time', icon: '🤗', sortOrder: 29 },
  ],

  [ActivityCategory.Expense]: [
    // Veterinary Expenses
    { id: 'vet-bill', label: 'Veterinary Bill', icon: '🏥', isPopular: true, sortOrder: 1 },
    { id: 'emergency-vet', label: 'Emergency Vet Bill', icon: '🚨', sortOrder: 2 },
    { id: 'specialist-fee', label: 'Specialist Fee', icon: '👨‍⚕️', sortOrder: 3 },
    { id: 'surgery-cost', label: 'Surgery Cost', icon: '⚕️', sortOrder: 4 },
    { id: 'dental-procedure', label: 'Dental Procedure', icon: '🦷', sortOrder: 5 },
    
    // Medication & Supplements
    { id: 'prescription-cost', label: 'Prescription Cost', icon: '💊', sortOrder: 6 },
    { id: 'flea-tick-medication', label: 'Flea & Tick Medication', icon: '🐛', sortOrder: 7 },
    { id: 'heartworm-medication', label: 'Heartworm Medication', icon: '❤️', sortOrder: 8 },
    { id: 'supplement-cost', label: 'Supplement Cost', icon: '🌿', sortOrder: 9 },
    
    // Food & Nutrition
    { id: 'pet-food', label: 'Pet Food', icon: '🥣', isPopular: true, sortOrder: 10 },
    { id: 'treats', label: 'Treats', icon: '🦴', isPopular: true, sortOrder: 11 },
    { id: 'special-diet-food', label: 'Special Diet Food', icon: '💊', sortOrder: 12 },
    { id: 'food-bowls', label: 'Food & Water Bowls', icon: '🥄', sortOrder: 13 },
    
    // Grooming & Care
    { id: 'grooming-service', label: 'Grooming Service', icon: '✂️', isPopular: true, sortOrder: 14 },
    { id: 'grooming-supplies', label: 'Grooming Supplies', icon: '🧴', sortOrder: 15 },
    { id: 'nail-trim-service', label: 'Nail Trimming Service', icon: '💅', sortOrder: 16 },
    
    // Supplies & Equipment
    { id: 'toys', label: 'Toys', icon: '🧸', isPopular: true, sortOrder: 17 },
    { id: 'bedding', label: 'Bedding', icon: '🛏️', sortOrder: 18 },
    { id: 'carrier-crate', label: 'Carrier/Crate', icon: '📦', sortOrder: 19 },
    { id: 'leash-collar', label: 'Leash & Collar', icon: '🦮', sortOrder: 20 },
    { id: 'litter-supplies', label: 'Litter & Supplies', icon: '🗑️', sortOrder: 21 },
    
    // Services
    { id: 'pet-sitting', label: 'Pet Sitting', icon: '👨‍👩‍👧‍👦', sortOrder: 22 },
    { id: 'dog-walking', label: 'Dog Walking', icon: '🚶', sortOrder: 23 },
    { id: 'boarding', label: 'Boarding', icon: '🏨', sortOrder: 24 },
    { id: 'training-classes', label: 'Training Classes', icon: '🎓', sortOrder: 25 },
    { id: 'daycare', label: 'Pet Daycare', icon: '🏫', sortOrder: 26 },
    
    // Insurance & Registration
    { id: 'pet-insurance', label: 'Pet Insurance', icon: '🛡️', sortOrder: 27 },
    { id: 'license-registration', label: 'License & Registration', icon: '📋', sortOrder: 28 },
    { id: 'microchip', label: 'Microchip', icon: '💾', sortOrder: 29 },
    
    // Miscellaneous
    { id: 'pet-taxi', label: 'Pet Taxi/Transport', icon: '🚗', sortOrder: 30 },
    { id: 'photography', label: 'Pet Photography', icon: '📸', sortOrder: 31 },
    { id: 'memorial-costs', label: 'Memorial Costs', icon: '💐', sortOrder: 32 },
  ],
};

// In-memory cache for subcategory selections per pet
class SubcategoryCache {
  private cache: Map<string, SubcategoryCacheEntry> = new Map();
  private readonly MAX_RECENT_SELECTIONS = 10;
  private readonly CACHE_STORAGE_KEY = 'paw-diary-subcategory-cache';

  constructor() {
    this.loadFromStorage();
  }

  // Get cache key for pet + category combination
  private getCacheKey(petId: number, category: ActivityCategory): string {
    return `${petId}-${category}`;
  }

  // Load cache from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.CACHE_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, entry]: [string, any]) => {
          this.cache.set(key, {
            ...entry,
            lastUsed: new Date(entry.lastUsed),
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load subcategory cache from localStorage:', error);
    }
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem(this.CACHE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save subcategory cache to localStorage:', error);
    }
  }

  // Record a subcategory selection for a pet
  recordSelection(petId: number, category: ActivityCategory, subcategoryId: string): void {
    const cacheKey = this.getCacheKey(petId, category);
    const existing = this.cache.get(cacheKey);

    const recentSelections = existing?.recentSelections || [];
    
    // Remove if already exists and add to front
    const updatedSelections = [
      subcategoryId,
      ...recentSelections.filter(id => id !== subcategoryId)
    ].slice(0, this.MAX_RECENT_SELECTIONS);

    this.cache.set(cacheKey, {
      petId,
      category,
      recentSelections: updatedSelections,
      lastUsed: new Date(),
    });

    this.saveToStorage();
  }

  // Get recent subcategory selections for a pet + category
  getRecentSelections(petId: number, category: ActivityCategory): string[] {
    const cacheKey = this.getCacheKey(petId, category);
    const entry = this.cache.get(cacheKey);
    return entry?.recentSelections || [];
  }

  // Clear cache for a specific pet
  clearForPet(petId: number): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(`${petId}-`)) {
        this.cache.delete(key);
      }
    });
    this.saveToStorage();
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
    localStorage.removeItem(this.CACHE_STORAGE_KEY);
  }

  // Get cache stats for debugging
  getCacheStats(): { totalEntries: number; petIds: number[]; categories: string[] } {
    const entries = Array.from(this.cache.values());
    const petIds = [...new Set(entries.map(e => e.petId))];
    const categories = [...new Set(entries.map(e => e.category))];
    
    return {
      totalEntries: entries.length,
      petIds,
      categories,
    };
  }
}

// Global cache instance
const subcategoryCache = new SubcategoryCache();

// Public API functions
export function getSubcategoryOptions(category: ActivityCategory): SubcategoryOption[] {
  return SUBCATEGORY_OPTIONS[category] || [];
}

export function getPopularSubcategories(category: ActivityCategory): SubcategoryOption[] {
  return getSubcategoryOptions(category).filter(option => option.isPopular);
}

export function getSubcategoriesForPet(
  petId: number, 
  category: ActivityCategory
): { recent: SubcategoryOption[]; popular: SubcategoryOption[]; all: SubcategoryOption[] } {
  const allOptions = getSubcategoryOptions(category);
  const recentIds = subcategoryCache.getRecentSelections(petId, category);
  
  // Get recent options (in order of recency)
  const recent = recentIds
    .map(id => allOptions.find(opt => opt.id === id))
    .filter((opt): opt is SubcategoryOption => opt !== undefined);

  // Get popular options (excluding those already in recent)
  const popular = allOptions
    .filter(opt => opt.isPopular && !recentIds.includes(opt.id))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Get all options sorted by sort order
  const all = allOptions.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return { recent, popular, all };
}

export function recordSubcategorySelection(
  petId: number, 
  category: ActivityCategory, 
  subcategoryId: string
): void {
  subcategoryCache.recordSelection(petId, category, subcategoryId);
}

export function findSubcategoryById(
  category: ActivityCategory, 
  subcategoryId: string
): SubcategoryOption | undefined {
  return getSubcategoryOptions(category).find(opt => opt.id === subcategoryId);
}

export function searchSubcategories(
  category: ActivityCategory, 
  query: string
): SubcategoryOption[] {
  const options = getSubcategoryOptions(category);
  const lowercaseQuery = query.toLowerCase();
  
  return options.filter(option => 
    option.label.toLowerCase().includes(lowercaseQuery) ||
    option.description?.toLowerCase().includes(lowercaseQuery)
  );
}

// Cache management functions
export function clearSubcategoryCacheForPet(petId: number): void {
  subcategoryCache.clearForPet(petId);
}

export function clearAllSubcategoryCache(): void {
  subcategoryCache.clearAll();
}

export function getSubcategoryCacheStats() {
  return subcategoryCache.getCacheStats();
}

// Export the cache instance for direct access if needed
export { subcategoryCache };