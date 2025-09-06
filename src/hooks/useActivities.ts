import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ActivityCategory } from '../lib/types/activities';

// Activity interface for the hook
export interface Activity {
  id: string;
  petId: number;
  category: ActivityCategory;
  subcategory: string;
  title: string;
  timestamp: Date;
  blocks: Record<string, any>; // Block data
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Activity creation/update interface
export interface ActivityInput {
  petId: number;
  category: ActivityCategory;
  subcategory: string;
  title: string;
  timestamp: Date;
  blocks: Record<string, any>;
  notes?: string;
  tags?: string[];
}

// Filters for activity queries
export interface ActivityFilters {
  petId?: number;
  category?: ActivityCategory;
  subcategory?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

// Sort options
export interface ActivitySort {
  field: 'timestamp' | 'createdAt' | 'updatedAt' | 'title';
  direction: 'asc' | 'desc';
}

// Activity API service functions (mock implementations)
class ActivityService {
  // Simulate API delay
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock data storage
  private activities: Activity[] = [];
  private nextId = 1;

  // Get activities with filters and pagination
  async getActivities(
    filters: ActivityFilters = {},
    sort: ActivitySort = { field: 'timestamp', direction: 'desc' },
  ): Promise<{ activities: Activity[]; total: number; hasMore: boolean }> {
    await this.delay(300);

    let filtered = [...this.activities];

    // Apply filters
    if (filters.petId !== undefined) {
      filtered = filtered.filter(a => a.petId === filters.petId);
    }
    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }
    if (filters.subcategory) {
      filtered = filtered.filter(a => a.subcategory === filters.subcategory);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(a => a.timestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(a => a.timestamp <= filters.dateTo!);
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(a => filters.tags!.some(tag => a.tags?.includes(tag)));
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(searchLower) ||
          a.notes?.toLowerCase().includes(searchLower) ||
          a.subcategory.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue instanceof Date && bValue instanceof Date) {
        return sort.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    // Apply pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const paginatedResults = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < filtered.length;

    return {
      activities: paginatedResults,
      total: filtered.length,
      hasMore,
    };
  }

  // Get single activity by ID
  async getActivity(id: string): Promise<Activity | null> {
    await this.delay(200);
    return this.activities.find(a => a.id === id) || null;
  }

  // Create new activity
  async createActivity(input: ActivityInput): Promise<Activity> {
    await this.delay(400);

    const now = new Date();
    const activity: Activity = {
      id: `activity-${this.nextId++}`,
      ...input,
      timestamp: new Date(input.timestamp),
      createdAt: now,
      updatedAt: now,
    };

    this.activities.push(activity);
    return activity;
  }

  // Update existing activity
  async updateActivity(id: string, input: Partial<ActivityInput>): Promise<Activity> {
    await this.delay(400);

    const index = this.activities.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Activity not found');
    }

    const updatedActivity: Activity = {
      ...this.activities[index],
      ...input,
      timestamp: input.timestamp ? new Date(input.timestamp) : this.activities[index].timestamp,
      updatedAt: new Date(),
    };

    this.activities[index] = updatedActivity;
    return updatedActivity;
  }

  // Delete activity
  async deleteActivity(id: string): Promise<void> {
    await this.delay(300);

    const index = this.activities.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Activity not found');
    }

    this.activities.splice(index, 1);
  }

  // Bulk operations
  async deleteActivities(ids: string[]): Promise<void> {
    await this.delay(500);
    this.activities = this.activities.filter(a => !ids.includes(a.id));
  }

  // Get activity statistics
  async getActivityStats(petId: number): Promise<{
    totalActivities: number;
    categoryCounts: Record<string, number>;
    recentActivity: Date | null;
    streakDays: number;
  }> {
    await this.delay(200);

    const petActivities = this.activities.filter(a => a.petId === petId);
    const categoryCounts: Record<string, number> = {};

    petActivities.forEach(activity => {
      categoryCounts[activity.category] = (categoryCounts[activity.category] || 0) + 1;
    });

    // Calculate streak (consecutive days with activities)
    const sortedDates = petActivities
      .map(a => a.timestamp.toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streakDays = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);

      if (sortedDates[i] === expectedDate.toDateString()) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      totalActivities: petActivities.length,
      categoryCounts,
      recentActivity:
        petActivities.length > 0
          ? new Date(Math.max(...petActivities.map(a => a.timestamp.getTime())))
          : null,
      streakDays,
    };
  }

  // Add some sample data for development
  addSampleData(petId: number): void {
    const now = new Date();
    const sampleActivities: ActivityInput[] = [
      {
        petId,
        category: ActivityCategory.Health,
        subcategory: 'vet-checkup',
        title: 'Annual Checkup',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        blocks: {
          'title-1': { text: 'Annual Checkup' },
          'notes-1': { text: 'Everything looks good! Weight is healthy.' },
          'measurement-1': { value: 12.5, unit: 'kg', type: 'weight' },
        },
        notes: 'Dr. Smith was very thorough.',
        tags: ['vet', 'checkup', 'healthy'],
      },
      {
        petId,
        category: ActivityCategory.Diet,
        subcategory: 'breakfast',
        title: 'Morning Meal',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        blocks: {
          'title-1': { text: 'Morning Meal' },
          'portion-1': {
            amount: 1.5,
            unit: 'cup',
            brand: "Hill's Science Diet",
            product: 'Adult Dry Food',
          },
        },
        tags: ['meal', 'breakfast'],
      },
      {
        petId,
        category: ActivityCategory.Lifestyle,
        subcategory: 'walk',
        title: 'Morning Walk',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        blocks: {
          'title-1': { text: 'Morning Walk' },
          'timer-1': { duration: 1800, isRunning: false, currentTime: 1800 }, // 30 minutes
          'location-1': { name: 'Central Park', type: 'park' },
        },
        tags: ['exercise', 'walk'],
      },
    ];

    sampleActivities.forEach(activity => {
      this.createActivity(activity);
    });
  }
}

// Global service instance
const activityService = new ActivityService();

// Query keys factory
export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filters: ActivityFilters, sort: ActivitySort) =>
    [...activityKeys.lists(), filters, sort] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
  stats: (petId: number) => [...activityKeys.all, 'stats', petId] as const,
};

// Main useActivities hook
export function useActivities(
  filters: ActivityFilters = {},
  sort: ActivitySort = { field: 'timestamp', direction: 'desc' },
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: activityKeys.list(filters, sort),
    queryFn: () => activityService.getActivities(filters, sort),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single activity
export function useActivity(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: activityKeys.detail(id),
    queryFn: () => activityService.getActivity(id),
    enabled: options.enabled !== false && !!id,
  });
}

// Activity statistics
export function useActivityStats(petId: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: activityKeys.stats(petId),
    queryFn: () => activityService.getActivityStats(petId),
    enabled: options.enabled !== false && petId > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create activity mutation
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ActivityInput) => activityService.createActivity(input),
    onSuccess: newActivity => {
      // Invalidate and refetch activity lists
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });

      // Invalidate stats for the pet
      queryClient.invalidateQueries({ queryKey: activityKeys.stats(newActivity.petId) });

      // Add to cache
      queryClient.setQueryData(activityKeys.detail(newActivity.id), newActivity);
    },
  });
}

// Update activity mutation
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ActivityInput> }) =>
      activityService.updateActivity(id, data),
    onSuccess: updatedActivity => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });

      // Update detail cache
      queryClient.setQueryData(activityKeys.detail(updatedActivity.id), updatedActivity);

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: activityKeys.stats(updatedActivity.petId) });
    },
  });
}

// Delete activity mutation
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activityService.deleteActivity(id),
    onSuccess: (_, id) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: activityKeys.detail(id) });

      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

// Bulk delete activities mutation
export function useDeleteActivities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => activityService.deleteActivities(ids),
    onSuccess: (_, ids) => {
      // Remove from detail caches
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: activityKeys.detail(id) });
      });

      // Invalidate all activity queries
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

// Infinite query for activity lists with pagination
export function useInfiniteActivities(
  filters: ActivityFilters = {},
  sort: ActivitySort = { field: 'timestamp', direction: 'desc' },
) {
  return useQuery({
    queryKey: [...activityKeys.list(filters, sort), 'infinite'],
    queryFn: async () => {
      const limit = filters.limit || 20;
      let offset = 0;
      let allActivities: Activity[] = [];
      let hasMore = true;

      while (hasMore) {
        const result = await activityService.getActivities({ ...filters, limit, offset }, sort);
        allActivities = [...allActivities, ...result.activities];
        hasMore = result.hasMore;
        offset += limit;

        // Safety limit to prevent infinite loading
        if (allActivities.length > 1000) break;
      }

      return { activities: allActivities, total: allActivities.length };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Utility hooks for common filter patterns
export function useRecentActivities(petId: number, days: number = 7) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  return useActivities({ petId, dateFrom }, { field: 'timestamp', direction: 'desc' });
}

export function useActivitiesByCategory(petId: number, category: ActivityCategory) {
  return useActivities({ petId, category }, { field: 'timestamp', direction: 'desc' });
}

export function useSearchActivities(petId: number, searchQuery: string, enabled: boolean = true) {
  return useActivities(
    { petId, search: searchQuery },
    { field: 'timestamp', direction: 'desc' },
    { enabled: enabled && searchQuery.length > 0 },
  );
}

// Development utility to add sample data
export function useAddSampleData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (petId: number) => {
      activityService.addSampleData(petId);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

// Export the service for direct access if needed
export { activityService };
