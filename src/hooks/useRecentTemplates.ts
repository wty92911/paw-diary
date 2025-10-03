import { useState, useEffect, useCallback } from 'react';
import { type ActivityCategory, type ActivityTemplate } from '../lib/types/activities';

// Recent template usage entry
export interface RecentTemplateEntry {
  templateId: string;
  category: ActivityCategory;
  subcategory: string;
  petId: number;
  lastUsed: Date;
  usageCount: number;
  title: string;
}

// Recent template cache service
class RecentTemplateService {
  private readonly STORAGE_KEY = 'paw-diary-recent-templates';
  private readonly MAX_TEMPLATES_PER_PET = 10;
  private readonly RECENT_DAYS_THRESHOLD = 30;

  // Load recent templates from localStorage
  private loadTemplates(): Record<string, RecentTemplateEntry[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const templates = JSON.parse(stored);

        // Convert date strings back to Date objects
        Object.values(templates as Record<string, RecentTemplateEntry[]>).forEach(entries => {
          entries.forEach(entry => {
            entry.lastUsed = new Date(entry.lastUsed);
          });
        });

        return templates;
      }
    } catch (error) {
      console.warn('Failed to load recent templates:', error);
    }
    return {};
  }

  // Save templates to localStorage
  private saveTemplates(templates: Record<string, RecentTemplateEntry[]>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.warn('Failed to save recent templates:', error);
    }
  }

  // Get cache key for pet
  private getCacheKey(petId: number): string {
    return `pet-${petId}`;
  }

  // Record template usage
  recordUsage(petId: number, template: ActivityTemplate): void {
    const templates = this.loadTemplates();
    const cacheKey = this.getCacheKey(petId);
    const entries = templates[cacheKey] || [];

    // Find existing entry
    const existingIndex = entries.findIndex(entry => entry.templateId === template.id);

    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = {
        ...entries[existingIndex],
        lastUsed: new Date(),
        usageCount: entries[existingIndex].usageCount + 1,
      };
    } else {
      // Add new entry
      const newEntry: RecentTemplateEntry = {
        templateId: template.id,
        category: template.category,
        subcategory: template.subcategory,
        petId,
        lastUsed: new Date(),
        usageCount: 1,
        title: template.label,
      };
      entries.push(newEntry);
    }

    // Sort by usage score (recency + frequency) and limit entries
    const now = new Date();
    const entriesWithScore = entries.map(entry => {
      const daysSinceUsed = (now.getTime() - entry.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 50 - daysSinceUsed);
      const frequencyScore = Math.min(50, Math.log(entry.usageCount + 1) * 15);
      const score = recencyScore + frequencyScore;

      return { entry, score };
    });

    entriesWithScore.sort((a, b) => b.score - a.score);

    const trimmedEntries = entriesWithScore
      .slice(0, this.MAX_TEMPLATES_PER_PET)
      .map(item => item.entry);

    templates[cacheKey] = trimmedEntries;
    this.saveTemplates(templates);
  }

  // Get recent templates for a pet
  getRecentTemplates(petId: number): RecentTemplateEntry[] {
    const templates = this.loadTemplates();
    const cacheKey = this.getCacheKey(petId);
    const entries = templates[cacheKey] || [];

    // Sort by last used date (most recent first)
    return entries.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  // Get recent templates filtered by category
  getRecentTemplatesByCategory(petId: number, category: ActivityCategory): RecentTemplateEntry[] {
    const allTemplates = this.getRecentTemplates(petId);
    return allTemplates.filter(template => template.category === category);
  }

  // Get most used templates for a pet
  getMostUsedTemplates(petId: number, limit: number = 5): RecentTemplateEntry[] {
    const templates = this.getRecentTemplates(petId);
    return templates.sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
  }

  // Get templates used within recent threshold
  getRecentlyUsedTemplates(petId: number): RecentTemplateEntry[] {
    const templates = this.getRecentTemplates(petId);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - this.RECENT_DAYS_THRESHOLD);

    return templates.filter(template => template.lastUsed >= threshold);
  }

  // Clear recent templates for a pet
  clearForPet(petId: number): void {
    const templates = this.loadTemplates();
    const cacheKey = this.getCacheKey(petId);
    delete templates[cacheKey];
    this.saveTemplates(templates);
  }

  // Clear all recent templates
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Get statistics
  getStats(): {
    totalTemplates: number;
    templatesByPet: Record<number, number>;
    mostUsedTemplate: RecentTemplateEntry | null;
  } {
    const allTemplates = this.loadTemplates();
    const templatesByPet: Record<number, number> = {};
    let totalTemplates = 0;
    let mostUsedTemplate: RecentTemplateEntry | null = null;
    let maxUsage = 0;

    Object.values(allTemplates).forEach(entries => {
      entries.forEach(entry => {
        totalTemplates++;
        templatesByPet[entry.petId] = (templatesByPet[entry.petId] || 0) + 1;

        if (entry.usageCount > maxUsage) {
          maxUsage = entry.usageCount;
          mostUsedTemplate = entry;
        }
      });
    });

    return {
      totalTemplates,
      templatesByPet,
      mostUsedTemplate,
    };
  }

  // Export data for backup/sync
  exportData(): Record<string, RecentTemplateEntry[]> {
    return this.loadTemplates();
  }

  // Import data from backup/sync
  importData(data: Record<string, RecentTemplateEntry[]>): void {
    // Convert date strings to Date objects
    Object.values(data).forEach(entries => {
      entries.forEach(entry => {
        entry.lastUsed = new Date(entry.lastUsed);
      });
    });

    this.saveTemplates(data);
  }
}

// Global service instance
const recentTemplateService = new RecentTemplateService();

// Main hook for recent templates
export function useRecentTemplates(petId: number) {
  const [templates, setTemplates] = useState<RecentTemplateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load templates
  const refreshTemplates = useCallback(() => {
    setIsLoading(true);
    try {
      const recentTemplates = recentTemplateService.getRecentTemplates(petId);
      setTemplates(recentTemplates);
    } catch (error) {
      console.error('Failed to load recent templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  // Load templates on mount and pet change
  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  // Record template usage
  const recordUsage = useCallback(
    (template: ActivityTemplate) => {
      recentTemplateService.recordUsage(petId, template);
      refreshTemplates();
    },
    [petId, refreshTemplates],
  );

  // Get templates by category
  const getByCategory = useCallback(
    (category: ActivityCategory) => {
      return recentTemplateService.getRecentTemplatesByCategory(petId, category);
    },
    [petId],
  );

  // Get most used templates
  const getMostUsed = useCallback(
    (limit: number = 5) => {
      return recentTemplateService.getMostUsedTemplates(petId, limit);
    },
    [petId],
  );

  // Get recently used templates (within threshold)
  const getRecentlyUsed = useCallback(() => {
    return recentTemplateService.getRecentlyUsedTemplates(petId);
  }, [petId]);

  // Clear templates for current pet
  const clearTemplates = useCallback(() => {
    recentTemplateService.clearForPet(petId);
    refreshTemplates();
  }, [petId, refreshTemplates]);

  return {
    // State
    templates,
    isLoading,

    // Actions
    recordUsage,
    refreshTemplates,
    clearTemplates,

    // Utilities
    getByCategory,
    getMostUsed,
    getRecentlyUsed,
  };
}

// Hook for recent templates by category
export function useRecentTemplatesByCategory(petId: number, category: ActivityCategory) {
  const [templates, setTemplates] = useState<RecentTemplateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTemplates = useCallback(() => {
    setIsLoading(true);
    try {
      const categoryTemplates = recentTemplateService.getRecentTemplatesByCategory(petId, category);
      setTemplates(categoryTemplates);
    } catch (error) {
      console.error('Failed to load recent templates by category:', error);
    } finally {
      setIsLoading(false);
    }
  }, [petId, category]);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  const recordUsage = useCallback(
    (template: ActivityTemplate) => {
      recentTemplateService.recordUsage(petId, template);
      refreshTemplates();
    },
    [petId, refreshTemplates],
  );

  return {
    templates,
    isLoading,
    recordUsage,
    refreshTemplates,
  };
}

// Hook for template statistics
export function useRecentTemplateStats() {
  const [stats, setStats] = useState(recentTemplateService.getStats());

  const refreshStats = useCallback(() => {
    setStats(recentTemplateService.getStats());
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
export function getRecentTemplatesByPet(petId: number): RecentTemplateEntry[] {
  return recentTemplateService.getRecentTemplates(petId);
}

export function recordTemplateUsage(petId: number, template: ActivityTemplate): void {
  recentTemplateService.recordUsage(petId, template);
}

export function clearRecentTemplatesForPet(petId: number): void {
  recentTemplateService.clearForPet(petId);
}

export function clearAllRecentTemplates(): void {
  recentTemplateService.clearAll();
}

export function exportRecentTemplateData(): Record<string, RecentTemplateEntry[]> {
  return recentTemplateService.exportData();
}

export function importRecentTemplateData(data: Record<string, RecentTemplateEntry[]>): void {
  recentTemplateService.importData(data);
}

// Export service for direct access
export { recentTemplateService };
