import { ActivityTimelineItem, ActivityRecord } from '../types/activities';

/**
 * Extract display title from activity data
 */
export function getActivityTitle(activity: ActivityRecord): string {
  // Try to get title from activity_data first, fallback to subcategory
  const titleBlock = activity.activity_data?.title;
  const title = titleBlock?.value || titleBlock;
  return title || activity.subcategory || 'Untitled Activity';
}

/**
 * Extract display description from activity data
 */
export function getActivityDescription(activity: ActivityRecord): string {
  // Try to get description from activity_data
  const notesBlock = activity.activity_data?.notes;
  const description = notesBlock?.value || notesBlock;
  return description || '';
}

/**
 * Extract activity date from activity data
 */
export function getActivityDate(activity: ActivityRecord): Date {
  // Try to get date from activity_data first, fallback to created_at
  const timeBlock = activity.activity_data?.time;

  // Handle the database format: { date: "ISO string", time: "", timezone: "" }
  if (timeBlock && typeof timeBlock === 'object' && 'date' in timeBlock) {
    return new Date(timeBlock.date);
  }

  // Fallback to other formats
  const activityDate = timeBlock?.value || timeBlock || activity.created_at;
  return new Date(activityDate);
}

/**
 * Helper function to add fact if value exists
 */
function addFact(facts: string[], label: string, value: any, unit?: string) {
  if (value !== undefined && value !== null && value !== '') {
    const factText = unit ? `${label}: ${value} ${unit}` : `${label}: ${value}`;
    facts.push(factText);
  }
}

/**
 * Extracts key facts from activity blocks for timeline display
 */
function extractKeyFacts(blocks: Record<string, any>): string[] {
  const facts: string[] = [];

  // Extract facts from different block types
  Object.entries(blocks).forEach(([blockType, blockData]) => {
    if (!blockData || typeof blockData !== 'object') return;

    switch (blockType) {
      case 'measurement':
      case 'measurements':
        if (Array.isArray(blockData)) {
          blockData.forEach((measurement: any) => {
            addFact(facts, measurement.measurementType || 'Measurement', measurement.value, measurement.unit);
          });
        } else if (typeof blockData === 'object') {
          Object.entries(blockData).forEach(([key, measurement]: [string, any]) => {
            if (measurement?.value && measurement?.unit) {
              addFact(facts, key, measurement.value, measurement.unit);
            }
          });
        }
        break;

      case 'portion':
        addFact(facts, 'Amount', blockData.amount, blockData.unit);
        if (blockData.brand) addFact(facts, 'Brand', blockData.brand);
        break;

      case 'cost':
        addFact(facts, 'Cost', blockData.amount ? `${blockData.currency || '$'}${blockData.amount}` : undefined);
        break;

      case 'rating':
        addFact(facts, 'Rating', blockData.value ? `${blockData.value}/${blockData.scale || 5}` : undefined);
        break;

      case 'location':
        addFact(facts, 'Location', blockData.name || blockData.address);
        break;

      case 'timer':
        if (blockData.duration) {
          const hours = Math.floor(blockData.duration / 60);
          const minutes = blockData.duration % 60;
          const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
          addFact(facts, 'Duration', timeStr);
        }
        break;

      case 'weather':
        if (blockData.condition) addFact(facts, 'Weather', blockData.condition);
        if (blockData.temperature) addFact(facts, 'Temperature', blockData.temperature, '°C');
        break;
    }
  });

  return facts;
}

/**
 * Counts attachments from activity blocks
 */
function countAttachments(blocks: Record<string, any>): number {
  const attachments = blocks.attachments || blocks.attachment;
  if (!attachments) return 0;
  if (Array.isArray(attachments)) return attachments.length;
  return 1;
}

/**
 * Extracts thumbnail URLs from activity blocks
 */
function extractThumbnails(blocks: Record<string, any>, limit = 3): string[] {
  const attachments = blocks.attachments || blocks.attachment || [];
  if (!Array.isArray(attachments)) return [];

  return attachments
    .slice(0, limit)
    .map((att: any) => att.thumbnail || att.url || '')
    .filter(Boolean);
}

/**
 * Determines if activity has health-related flags
 */
function hasHealthFlag(activity: ActivityRecord): boolean {
  return (
    activity.category === 'Health' ||
    activity.activity_data?.health?.urgent === true ||
    activity.activity_data?.health?.flag === true ||
    false
  );
}

/**
 * Determines if activity is pinned
 */
function isPinned(activity: ActivityRecord): boolean {
  return activity.activity_data?.pinned === true || false;
}

/**
 * Converts Activity objects to ActivityTimelineItem format for timeline display
 */
export function convertActivitiesToTimelineItems(activities: ActivityRecord[]): ActivityTimelineItem[] {
  return activities.map((activity): ActivityTimelineItem => {
    // activity_data is the blocks Record itself, not nested under .blocks
    const blocks = activity.activity_data || {};

    return {
      id: activity.id,
      petId: activity.pet_id,
      category: activity.category as any,
      subcategory: activity.subcategory,
      title: getActivityTitle(activity),
      description: getActivityDescription(activity),
      activityDate: getActivityDate(activity),
      keyFacts: extractKeyFacts(blocks),
      attachmentCount: countAttachments(blocks),
      thumbnails: extractThumbnails(blocks),
      hasHealthFlag: hasHealthFlag(activity),
      isPinned: isPinned(activity),
    };
  });
}

