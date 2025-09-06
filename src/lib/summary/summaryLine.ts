import { ActivityTimelineItem, ActivityCategory, MeasurementData, RatingData, PortionData, CostData, TimerData } from '../types/activities';

/**
 * Summary line generation utilities for extracting key facts from activities
 * for timeline display in ActivityCard components
 */

/**
 * Generate key facts array from an activity's data for timeline display
 * Returns formatted strings that represent the most important aspects of the activity
 */
export function generateKeyFacts(
  activity: Partial<ActivityTimelineItem> & {
    activity_data?: Record<string, any>;
    measurements?: Record<string, MeasurementData>;
    cost?: CostData;
    rating?: RatingData;
    portion?: PortionData;
    timer?: TimerData;
    location?: string;
    weather?: { temperature?: number; conditions?: string };
  }
): string[] {
  const facts: string[] = [];

  // Extract facts based on category type
  switch (activity.category) {
    case ActivityCategory.Health:
      facts.push(...extractHealthFacts(activity));
      break;
    case ActivityCategory.Growth:
      facts.push(...extractGrowthFacts(activity));
      break;
    case ActivityCategory.Diet:
      facts.push(...extractDietFacts(activity));
      break;
    case ActivityCategory.Lifestyle:
      facts.push(...extractLifestyleFacts(activity));
      break;
    case ActivityCategory.Expense:
      facts.push(...extractExpenseFacts(activity));
      break;
  }

  // Add common facts that apply to all categories
  facts.push(...extractCommonFacts(activity));

  // Return top 3 most important facts
  return facts.slice(0, 3);
}

/**
 * Extract health-specific facts
 */
function extractHealthFacts(activity: any): string[] {
  const facts: string[] = [];

  // Temperature measurement
  if (activity.measurements?.temperature) {
    const temp = activity.measurements.temperature;
    facts.push(`${temp.value}°${temp.unit}`);
  }

  // Weight measurement for health tracking
  if (activity.measurements?.weight) {
    const weight = activity.measurements.weight;
    facts.push(`Weight: ${weight.value} ${weight.unit}`);
  }

  // Medication or treatment info
  if (activity.activity_data?.medication) {
    facts.push(`${activity.activity_data.medication}`);
  }

  // Vet visit or appointment
  if (activity.subcategory?.toLowerCase().includes('vet')) {
    facts.push('Vet visit');
  }

  // Symptoms checklist
  if (activity.activity_data?.symptoms && Array.isArray(activity.activity_data.symptoms)) {
    const checkedSymptoms = activity.activity_data.symptoms.filter((s: any) => s.checked);
    if (checkedSymptoms.length > 0) {
      facts.push(`${checkedSymptoms.length} symptoms noted`);
    }
  }

  return facts;
}

/**
 * Extract growth-specific facts
 */
function extractGrowthFacts(activity: any): string[] {
  const facts: string[] = [];

  // Weight measurement
  if (activity.measurements?.weight) {
    const weight = activity.measurements.weight;
    facts.push(`${weight.value} ${weight.unit}`);
  }

  // Height measurement
  if (activity.measurements?.height) {
    const height = activity.measurements.height;
    facts.push(`Height: ${height.value} ${height.unit}`);
  }

  // Length measurement (for some pets)
  if (activity.measurements?.length) {
    const length = activity.measurements.length;
    facts.push(`Length: ${length.value} ${length.unit}`);
  }

  // Age milestone
  if (activity.activity_data?.milestone) {
    facts.push(activity.activity_data.milestone);
  }

  return facts;
}

/**
 * Extract diet-specific facts
 */
function extractDietFacts(activity: any): string[] {
  const facts: string[] = [];

  // Portion information
  if (activity.portion) {
    const portion = activity.portion;
    facts.push(`${portion.amount} ${portion.unit}`);
    
    if (portion.brand) {
      facts.push(portion.brand);
    }
  }

  // Food type or brand from activity data
  if (activity.activity_data?.food_type) {
    facts.push(activity.activity_data.food_type);
  }

  // Meal type (breakfast, lunch, dinner, treat)
  if (activity.subcategory) {
    facts.push(activity.subcategory);
  }

  // Rating for food preference
  if (activity.rating && activity.rating.ratingType === 'appetite') {
    facts.push(`${activity.rating.value}/5 appetite`);
  }

  // Special diet notes
  if (activity.activity_data?.diet_notes) {
    facts.push(activity.activity_data.diet_notes);
  }

  return facts;
}

/**
 * Extract lifestyle-specific facts
 */
function extractLifestyleFacts(activity: any): string[] {
  const facts: string[] = [];

  // Duration for activities like walks, play, sleep
  if (activity.timer) {
    const timer = activity.timer;
    if (timer.duration) {
      facts.push(`${Math.round(timer.duration)} minutes`);
    } else if (timer.startTime && timer.endTime) {
      const duration = (new Date(timer.endTime).getTime() - new Date(timer.startTime).getTime()) / (1000 * 60);
      facts.push(`${Math.round(duration)} minutes`);
    }
  }

  // Activity intensity or energy level
  if (activity.rating && activity.rating.ratingType === 'energy') {
    facts.push(`${activity.rating.value}/5 energy`);
  }

  // Training progress
  if (activity.activity_data?.training_success) {
    facts.push('Training success');
  }

  // Social interaction
  if (activity.activity_data?.other_pets && activity.activity_data.other_pets.length > 0) {
    facts.push(`With ${activity.activity_data.other_pets.length} other pets`);
  }

  return facts;
}

/**
 * Extract expense-specific facts
 */
function extractExpenseFacts(activity: any): string[] {
  const facts: string[] = [];

  // Cost amount
  if (activity.cost) {
    const cost = activity.cost;
    facts.push(`${cost.currency}${cost.amount.toFixed(2)}`);
    
    if (cost.category) {
      facts.push(cost.category);
    }
  }

  // Item or service purchased
  if (activity.activity_data?.item_name) {
    facts.push(activity.activity_data.item_name);
  }

  // Expense type
  if (activity.subcategory) {
    facts.push(activity.subcategory);
  }

  return facts;
}

/**
 * Extract common facts that apply to all activity types
 */
function extractCommonFacts(activity: any): string[] {
  const facts: string[] = [];

  // Location
  if (activity.location) {
    facts.push(`at ${activity.location}`);
  }

  // Weather conditions
  if (activity.weather?.conditions) {
    facts.push(activity.weather.conditions);
  }

  // General mood rating
  if (activity.rating && activity.rating.ratingType === 'mood') {
    facts.push(`${activity.rating.value}/5 mood`);
  }

  // Notes preview (first few words)
  if (activity.description && activity.description.length > 0) {
    const preview = activity.description.split(' ').slice(0, 4).join(' ');
    if (preview.length < activity.description.length) {
      facts.push(`${preview}...`);
    }
  }

  return facts;
}

/**
 * Generate a single summary line for quick preview
 */
export function generateSummaryLine(activity: Partial<ActivityTimelineItem>): string {
  const keyFacts = generateKeyFacts(activity);
  
  if (keyFacts.length === 0) {
    return activity.subcategory || activity.category || 'Activity';
  }

  // Combine the most important facts into a readable summary
  const primaryFact = keyFacts[0];
  const secondaryFacts = keyFacts.slice(1);

  if (secondaryFacts.length === 0) {
    return primaryFact;
  }

  return `${primaryFact} • ${secondaryFacts.join(' • ')}`;
}

/**
 * Extract attachments summary for timeline display
 */
export function generateAttachmentSummary(attachmentCount: number): string {
  if (attachmentCount === 0) return '';
  if (attachmentCount === 1) return '1 photo';
  return `${attachmentCount} photos`;
}

/**
 * Generate context-aware summary based on recency
 */
export function generateContextualSummary(activity: Partial<ActivityTimelineItem>): {
  primary: string;
  secondary: string[];
  context?: string;
} {
  const keyFacts = generateKeyFacts(activity);
  const now = new Date();
  const activityDate = activity.activityDate ? new Date(activity.activityDate) : now;
  const hoursAgo = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);

  let context: string | undefined;

  // Add temporal context for recent activities
  if (hoursAgo < 1) {
    context = 'Just now';
  } else if (hoursAgo < 24) {
    context = `${Math.round(hoursAgo)}h ago`;
  }

  return {
    primary: keyFacts[0] || activity.title || 'Activity',
    secondary: keyFacts.slice(1),
    context,
  };
}

/**
 * Format measurement value with appropriate precision
 */
export function formatMeasurement(measurement: MeasurementData): string {
  const precision = measurement.value % 1 === 0 ? 0 : 1;
  return `${measurement.value.toFixed(precision)} ${measurement.unit}`;
}

/**
 * Format duration from timer data
 */
export function formatDuration(timer: TimerData): string {
  if (timer.duration) {
    const hours = Math.floor(timer.duration / 60);
    const minutes = timer.duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  if (timer.startTime && timer.endTime) {
    const start = new Date(timer.startTime);
    const end = new Date(timer.endTime);
    const durationMs = end.getTime() - start.getTime();
    const totalMinutes = Math.round(durationMs / (1000 * 60));
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  return '';
}

/**
 * Format cost with currency symbol
 */
export function formatCost(cost: CostData): string {
  return `${cost.currency}${cost.amount.toFixed(2)}`;
}

/**
 * Generate health priority indicator
 */
export function getHealthPriority(activity: any): 'critical' | 'important' | 'normal' {
  // Critical: Emergency visits, high fever, severe symptoms
  if (
    activity.subcategory?.toLowerCase().includes('emergency') ||
    (activity.measurements?.temperature?.value && activity.measurements.temperature.value > 39.5) ||
    (activity.activity_data?.severity === 'high')
  ) {
    return 'critical';
  }

  // Important: Vet visits, medications, concerning symptoms
  if (
    activity.subcategory?.toLowerCase().includes('vet') ||
    activity.activity_data?.medication ||
    (activity.activity_data?.symptoms && activity.activity_data.symptoms.length > 2)
  ) {
    return 'important';
  }

  return 'normal';
}