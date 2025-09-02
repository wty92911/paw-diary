import {
  Activity,
  ActivityCategory,
  ActivityFilters,
  HealthActivityData,
  GrowthActivityData,
  DietActivityData,
  LifestyleActivityData,
  ExpenseActivityData,
} from './types';
import { formatDate } from './utils';

// Search and filtering utilities
export function filterActivities(activities: Activity[], filters: ActivityFilters): Activity[] {
  return activities.filter(activity => {
    // Pet filter
    if (filters.pet_id !== undefined && activity.pet_id !== filters.pet_id) {
      return false;
    }

    // Category filter
    if (
      filters.category &&
      filters.category.length > 0 &&
      !filters.category.includes(activity.category)
    ) {
      return false;
    }

    // Subcategory filter
    if (
      filters.subcategory &&
      filters.subcategory.length > 0 &&
      !filters.subcategory.includes(activity.subcategory)
    ) {
      return false;
    }

    // Date range filter
    if (filters.date_range) {
      const activityDate = new Date(activity.activity_date);
      if (filters.date_range.start && activityDate < new Date(filters.date_range.start)) {
        return false;
      }
      if (filters.date_range.end && activityDate > new Date(filters.date_range.end)) {
        return false;
      }
    }

    // Cost range filter
    if (filters.cost_range && activity.cost !== undefined && activity.cost !== null) {
      if (filters.cost_range.min !== undefined && activity.cost < filters.cost_range.min) {
        return false;
      }
      if (filters.cost_range.max !== undefined && activity.cost > filters.cost_range.max) {
        return false;
      }
    }

    // Text search in title and description
    if (filters.search_query) {
      const searchLower = filters.search_query.toLowerCase();
      const titleMatch = activity.title.toLowerCase().includes(searchLower);
      const descriptionMatch = activity.description?.toLowerCase().includes(searchLower) || false;

      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }

    return true;
  });
}

// Debounced search function
export function createDebouncedSearch<T extends any[]>(
  searchFn: (...args: T) => void,
  delay: number = 300,
): (...args: T) => void {
  let timeoutId: number | undefined;

  return (...args: T) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      searchFn(...args);
    }, delay);
  };
}

// Sort activities by various criteria
export function sortActivities(
  activities: Activity[],
  sortBy: 'date' | 'title' | 'category' | 'cost' | 'mood',
  direction: 'asc' | 'desc' = 'desc',
): Activity[] {
  const sorted = [...activities].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'cost':
        const aCost = a.cost || 0;
        const bCost = b.cost || 0;
        comparison = aCost - bCost;
        break;
      case 'mood':
        const aMood = a.mood_rating || 0;
        const bMood = b.mood_rating || 0;
        comparison = aMood - bMood;
        break;
      default:
        comparison = 0;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// Group activities by various criteria
export function groupActivitiesByDate(activities: Activity[]): Record<string, Activity[]> {
  const grouped: Record<string, Activity[]> = {};

  activities.forEach(activity => {
    const dateKey = formatDate(activity.activity_date);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(activity);
  });

  return grouped;
}

export function groupActivitiesByCategory(
  activities: Activity[],
): Record<ActivityCategory, Activity[]> {
  const grouped = {} as Record<ActivityCategory, Activity[]>;

  // Initialize all categories
  Object.values(ActivityCategory).forEach(category => {
    grouped[category] = [];
  });

  activities.forEach(activity => {
    grouped[activity.category].push(activity);
  });

  return grouped;
}

// Date and time utilities specific to activities
export function formatActivityDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatActivityTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  return formatDate(d);
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

  return d >= startOfWeek && d <= endOfWeek;
}

// Category-specific data formatting
export function formatHealthData(data: HealthActivityData): string {
  const parts: string[] = [];

  if (data.veterinarian_name) {
    parts.push(`Vet: ${data.veterinarian_name}`);
  }
  if (data.clinic_name) {
    parts.push(`Clinic: ${data.clinic_name}`);
  }
  if (data.symptoms && data.symptoms.length > 0) {
    parts.push(`Symptoms: ${data.symptoms.join(', ')}`);
  }
  if (data.diagnosis) {
    parts.push(`Diagnosis: ${data.diagnosis}`);
  }
  if (data.medications && data.medications.length > 0) {
    const medications = data.medications.map(med => med.name || 'Medication').join(', ');
    parts.push(`Medications: ${medications}`);
  }
  if (data.is_critical) {
    parts.push('⚠️ Critical');
  }

  return parts.join(' • ');
}

export function formatGrowthData(data: GrowthActivityData): string {
  const parts: string[] = [];

  if (data.weight) {
    parts.push(`Weight: ${data.weight.value}${data.weight.unit}`);
  }
  if (data.height) {
    parts.push(`Height: ${data.height.value}${data.height.unit}`);
  }
  if (data.milestone_type) {
    parts.push(`Milestone: ${data.milestone_type}`);
  }
  if (data.development_stage) {
    parts.push(`Stage: ${data.development_stage}`);
  }

  return parts.join(' • ');
}

export function formatDietData(data: DietActivityData): string {
  const parts: string[] = [];

  if (data.food_brand) {
    parts.push(`Brand: ${data.food_brand}`);
  }
  if (data.food_product) {
    parts.push(`Food: ${data.food_product}`);
  }
  if (data.portion_size) {
    parts.push(`Portion: ${data.portion_size.amount} ${data.portion_size.unit}`);
  }
  if (data.feeding_schedule) {
    parts.push(`Schedule: ${data.feeding_schedule}`);
  }
  if (data.food_rating) {
    parts.push(`Rating: ${data.food_rating}/5`);
  }
  if (data.allergic_reaction) {
    parts.push('⚠️ Allergic Reaction');
  }

  return parts.join(' • ');
}

export function formatLifestyleData(data: LifestyleActivityData): string {
  const parts: string[] = [];

  if (data.activity_type) {
    parts.push(`Activity: ${data.activity_type}`);
  }
  if (data.duration_minutes) {
    parts.push(`Duration: ${data.duration_minutes} min`);
  }
  if (data.energy_level) {
    parts.push(`Energy: ${data.energy_level}/5`);
  }
  if (data.weather_conditions) {
    parts.push(`Weather: ${data.weather_conditions}`);
  }
  if (data.social_interactions && data.social_interactions.length > 0) {
    const interactions = data.social_interactions.map(si => si.type || 'Social').join(', ');
    parts.push(`Social: ${interactions}`);
  }

  return parts.join(' • ');
}

export function formatExpenseData(data: ExpenseActivityData): string {
  const parts: string[] = [];

  if (data.expense_category) {
    parts.push(`Category: ${data.expense_category}`);
  }
  if (data.vendor) {
    parts.push(`Vendor: ${data.vendor}`);
  }
  if (data.budget_category) {
    parts.push(`Budget: ${data.budget_category}`);
  }
  if (data.tax_deductible) {
    parts.push('💰 Tax Deductible');
  }
  if (data.receipt_photo) {
    parts.push('📷 Receipt Attached');
  }

  return parts.join(' • ');
}

export function formatActivityData(activity: Activity): string {
  if (!activity.activity_data) return '';

  switch (activity.category) {
    case ActivityCategory.Health:
      return formatHealthData(activity.activity_data as HealthActivityData);
    case ActivityCategory.Growth:
      return formatGrowthData(activity.activity_data as GrowthActivityData);
    case ActivityCategory.Diet:
      return formatDietData(activity.activity_data as DietActivityData);
    case ActivityCategory.Lifestyle:
      return formatLifestyleData(activity.activity_data as LifestyleActivityData);
    case ActivityCategory.Expense:
      return formatExpenseData(activity.activity_data as ExpenseActivityData);
    default:
      return '';
  }
}

// Statistics utilities
export function getActivityStats(activities: Activity[]): {
  totalActivities: number;
  categoryCounts: Record<ActivityCategory, number>;
  totalCost: number;
  averageMoodRating: number;
  mostActiveDay: string | null;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
} {
  const categoryCounts = {} as Record<ActivityCategory, number>;
  let totalCost = 0;
  let moodRatings: number[] = [];
  const dayCount: Record<string, number> = {};

  // Initialize category counts
  Object.values(ActivityCategory).forEach(category => {
    categoryCounts[category] = 0;
  });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let activitiesThisWeek = 0;
  let activitiesThisMonth = 0;

  activities.forEach(activity => {
    // Category counts
    categoryCounts[activity.category]++;

    // Total cost
    if (activity.cost) {
      totalCost += activity.cost;
    }

    // Mood ratings
    if (activity.mood_rating) {
      moodRatings.push(activity.mood_rating);
    }

    // Day tracking
    const activityDate = new Date(activity.activity_date);
    const dayKey = activityDate.toDateString();
    dayCount[dayKey] = (dayCount[dayKey] || 0) + 1;

    // Week/month tracking
    if (activityDate >= oneWeekAgo) {
      activitiesThisWeek++;
    }
    if (activityDate >= oneMonthAgo) {
      activitiesThisMonth++;
    }
  });

  // Calculate most active day
  let mostActiveDay: string | null = null;
  let maxCount = 0;
  Object.entries(dayCount).forEach(([day, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveDay = day;
    }
  });

  // Calculate average mood rating
  const averageMoodRating =
    moodRatings.length > 0
      ? moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length
      : 0;

  return {
    totalActivities: activities.length,
    categoryCounts,
    totalCost,
    averageMoodRating,
    mostActiveDay,
    activitiesThisWeek,
    activitiesThisMonth,
  };
}

// Export utilities
export function exportActivitiesToCSV(activities: Activity[]): string {
  const headers = [
    'ID',
    'Pet ID',
    'Category',
    'Subcategory',
    'Title',
    'Description',
    'Date',
    'Cost',
    'Currency',
    'Location',
    'Mood Rating',
    'Activity Data',
  ];

  const rows = activities.map(activity => [
    activity.id.toString(),
    activity.pet_id.toString(),
    activity.category,
    activity.subcategory,
    `"${activity.title.replace(/"/g, '""')}"`,
    `"${(activity.description || '').replace(/"/g, '""')}"`,
    activity.activity_date,
    activity.cost?.toString() || '',
    activity.currency || '',
    `"${(activity.location || '').replace(/"/g, '""')}"`,
    activity.mood_rating?.toString() || '',
    `"${formatActivityData(activity).replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csvContent;
}

export function exportActivitiesToJSON(activities: Activity[]): string {
  return JSON.stringify(activities, null, 2);
}

// Import utilities
export function parseCSVActivities(csvContent: string): Partial<Activity>[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const activities: Partial<Activity>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',');
    const activity: Partial<Activity> = {};

    headers.forEach((header, index) => {
      const value = values[index]?.replace(/^"|"$/g, '').replace(/""/g, '"');

      switch (header.toLowerCase()) {
        case 'id':
          if (value) activity.id = parseInt(value);
          break;
        case 'pet id':
        case 'pet_id':
          if (value) activity.pet_id = parseInt(value);
          break;
        case 'category':
          if (value && Object.values(ActivityCategory).includes(value as ActivityCategory)) {
            activity.category = value as ActivityCategory;
          }
          break;
        case 'subcategory':
          if (value) activity.subcategory = value;
          break;
        case 'title':
          if (value) activity.title = value;
          break;
        case 'description':
          if (value) activity.description = value;
          break;
        case 'date':
          if (value) activity.activity_date = value;
          break;
        case 'cost':
          if (value) activity.cost = parseFloat(value);
          break;
        case 'currency':
          if (value) activity.currency = value;
          break;
        case 'location':
          if (value) activity.location = value;
          break;
        case 'mood rating':
        case 'mood_rating':
          if (value) activity.mood_rating = parseInt(value) as 1 | 2 | 3 | 4 | 5;
          break;
      }
    });

    activities.push(activity);
  }

  return activities;
}

// Validation utilities
export function validateActivityData(activity: Partial<Activity>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!activity.title || activity.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!activity.category || !Object.values(ActivityCategory).includes(activity.category)) {
    errors.push('Valid category is required');
  }

  if (!activity.subcategory || activity.subcategory.trim().length === 0) {
    errors.push('Subcategory is required');
  }

  if (!activity.activity_date) {
    errors.push('Activity date is required');
  } else {
    const date = new Date(activity.activity_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid activity date format');
    }
  }

  if (activity.cost !== undefined && activity.cost < 0) {
    errors.push('Cost cannot be negative');
  }

  if (
    activity.mood_rating !== undefined &&
    (activity.mood_rating < 1 || activity.mood_rating > 5)
  ) {
    errors.push('Mood rating must be between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
