import { describe, it, expect } from 'vitest';
import {
  filterActivities,
  sortActivities,
  groupActivitiesByCategory,
  getActivityStats,
  formatHealthData,
  formatGrowthData,
  getRelativeTime,
  isToday,
  validateActivityData,
  exportActivitiesToCSV,
  exportActivitiesToJSON,
} from '../activityUtils';
import { 
  createMockActivity, 
  createMockHealthActivity, 
  createMockGrowthActivity,
  createMockDietActivity,
} from '../../test/activity-test-utils';
import { ActivityCategory, ActivityFilters } from '../types';

describe('Activity Utilities (Working Tests)', () => {
  describe('filterActivities', () => {
    const activities = [
      createMockHealthActivity({ 
        id: 1, 
        pet_id: 1, 
        title: 'Vet Visit',
        activity_date: '2024-01-15',
        category: ActivityCategory.Health,
        subcategory: 'Veterinary Visit',
        cost: 150
      }),
      createMockGrowthActivity({ 
        id: 2, 
        pet_id: 2, 
        title: 'Weight Check',
        activity_date: '2024-01-10',
        category: ActivityCategory.Growth,
        subcategory: 'Weight Tracking',
        cost: undefined
      }),
      createMockDietActivity({ 
        id: 3, 
        pet_id: 1, 
        title: 'Morning Feed',
        activity_date: '2024-01-20',
        category: ActivityCategory.Diet,
        subcategory: 'Regular Feeding'
      }),
    ];

    it('filters by pet_id', () => {
      const filters: ActivityFilters = { pet_id: 1 };
      const result = filterActivities(activities, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(a => a.pet_id === 1)).toBe(true);
    });

    it('filters by category', () => {
      const filters: ActivityFilters = { category: [ActivityCategory.Health] };
      const result = filterActivities(activities, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(ActivityCategory.Health);
    });

    it('filters by search query in title', () => {
      const filters: ActivityFilters = { search_query: 'vet' };
      const result = filterActivities(activities, filters);
      
      // Should find "Vet Visit" activity
      expect(result.some(a => a.title.toLowerCase().includes('vet'))).toBe(true);
    });
  });

  describe('sortActivities', () => {
    const activities = [
      createMockActivity({ title: 'B Activity', activity_date: '2024-01-10', cost: 100 }),
      createMockActivity({ title: 'A Activity', activity_date: '2024-01-15', cost: 50 }),
      createMockActivity({ title: 'C Activity', activity_date: '2024-01-05', cost: 200 }),
    ];

    it('sorts by title ascending', () => {
      const result = sortActivities(activities, 'title', 'asc');
      expect(result[0].title).toBe('A Activity');
      expect(result[2].title).toBe('C Activity');
    });

    it('sorts by date descending', () => {
      const result = sortActivities(activities, 'date', 'desc');
      expect(result[0].activity_date).toBe('2024-01-15');
      expect(result[2].activity_date).toBe('2024-01-05');
    });

    it('sorts by cost ascending', () => {
      const result = sortActivities(activities, 'cost', 'asc');
      expect(result[0].cost).toBe(50);
      expect(result[2].cost).toBe(200);
    });
  });

  describe('groupActivitiesByCategory', () => {
    const activities = [
      createMockHealthActivity(),
      createMockHealthActivity(),
      createMockGrowthActivity(),
    ];

    it('groups activities by category', () => {
      const result = groupActivitiesByCategory(activities);
      
      expect(result[ActivityCategory.Health]).toHaveLength(2);
      expect(result[ActivityCategory.Growth]).toHaveLength(1);
      expect(result[ActivityCategory.Diet]).toHaveLength(0);
    });
  });

  describe('getActivityStats', () => {
    const activities = [
      createMockHealthActivity({ 
        cost: 100, 
        mood_rating: 4,
        activity_date: new Date().toISOString().split('T')[0] // today
      }),
      createMockGrowthActivity({ 
        cost: 50, 
        mood_rating: 3,
        activity_date: new Date().toISOString().split('T')[0] // today
      }),
      createMockDietActivity({ 
        mood_rating: 5,
        activity_date: new Date().toISOString().split('T')[0], // today
        cost: undefined // No cost for diet activity
      }),
    ];

    it('calculates total activities', () => {
      const stats = getActivityStats(activities);
      expect(stats.totalActivities).toBe(3);
    });

    it('calculates category counts', () => {
      const stats = getActivityStats(activities);
      
      expect(stats.categoryCounts[ActivityCategory.Health]).toBe(1);
      expect(stats.categoryCounts[ActivityCategory.Growth]).toBe(1);
      expect(stats.categoryCounts[ActivityCategory.Diet]).toBe(1);
    });

    it('calculates total cost', () => {
      const stats = getActivityStats(activities);
      expect(stats.totalCost).toBe(150); // 100 + 50 (diet activity has no cost)
    });

    it('calculates average mood rating', () => {
      const stats = getActivityStats(activities);
      expect(stats.averageMoodRating).toBe(4); // (4+3+5)/3 = 4
    });
  });

  describe('Format Functions', () => {
    it('formatHealthData works', () => {
      const data = {
        veterinarian_name: 'Dr. Smith',
        clinic_name: 'Pet Clinic',
        symptoms: ['Coughing'],
        diagnosis: 'Respiratory infection',
        is_critical: false,
      };

      const result = formatHealthData(data);
      
      expect(result).toContain('Dr. Smith');
      expect(result).toContain('Pet Clinic');
      expect(result).toContain('Coughing');
      expect(result).toContain('Respiratory infection');
    });

    it('formatGrowthData works', () => {
      const data = {
        weight: { value: 25.5, unit: 'kg' as const },
        height: { value: 65, unit: 'cm' as const },
        milestone_type: 'Adult Weight Reached',
      };

      const result = formatGrowthData(data);
      
      expect(result).toContain('25.5kg');
      expect(result).toContain('65cm');
      expect(result).toContain('Adult Weight Reached');
    });
  });

  describe('Date Functions', () => {
    it('isToday works', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      expect(isToday(today)).toBe(true);
      expect(isToday(yesterday)).toBe(false);
    });

    it('getRelativeTime works', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const result = getRelativeTime(fiveMinutesAgo);
      expect(result).toBe('5m ago');
    });
  });

  describe('Validation', () => {
    it('validateActivityData validates required fields', () => {
      const invalidActivity = {
        title: '',
        category: undefined,
        subcategory: '',
        activity_date: '',
      };

      const result = validateActivityData(invalidActivity);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Valid category is required');
      expect(result.errors).toContain('Subcategory is required');
      expect(result.errors).toContain('Activity date is required');
    });

    it('validateActivityData passes for valid data', () => {
      const validActivity = {
        title: 'Test Activity',
        category: ActivityCategory.Health,
        subcategory: 'Checkup',
        activity_date: '2024-01-15',
        cost: 50,
        mood_rating: 4 as 1 | 2 | 3 | 4 | 5,
      };

      const result = validateActivityData(validActivity);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Export Functions', () => {
    const activities = [
      createMockActivity({
        id: 1,
        pet_id: 1,
        title: 'Test Activity',
        description: 'Test description',
        category: ActivityCategory.Health,
        subcategory: 'Checkup',
        activity_date: '2024-01-15',
        cost: 100,
        currency: 'USD',
        location: 'Pet Clinic',
        mood_rating: 3,
      }),
    ];

    it('exportActivitiesToCSV works', () => {
      const csv = exportActivitiesToCSV(activities);
      
      expect(csv).toContain('ID,Pet ID,Category');
      expect(csv).toContain('Test Activity');
      expect(csv).toContain('health'); // CSV uses lowercase enum value
      expect(csv).toContain('100');
    });

    it('exportActivitiesToJSON works', () => {
      const json = exportActivitiesToJSON(activities);
      const parsed = JSON.parse(json);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe('Test Activity');
    });
  });
});