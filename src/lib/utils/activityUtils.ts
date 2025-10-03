import {
  type ActivityTimelineItem,
  type ActivityRecord,
  type ActivityBlockData,
  type ActivityCategory
} from '../types/activities';

/**
 * Extract display title from activity data
 */
export function getActivityTitle(activity: ActivityRecord): string {
  // Try to get title from activity_data first, fallback to subcategory
  const titleBlock = activity.activity_data?.title;
  const title = (titleBlock && typeof titleBlock === 'object' && 'value' in titleBlock)
    ? titleBlock.value
    : titleBlock;
  return (typeof title === 'string' ? title : null) || activity.subcategory || 'Untitled Activity';
}

/**
 * Extract display description from activity data
 */
export function getActivityDescription(activity: ActivityRecord): string {
  // Try to get description from activity_data
  const notesBlock = activity.activity_data?.notes;
  const description = (notesBlock && typeof notesBlock === 'object' && 'value' in notesBlock)
    ? notesBlock.value
    : notesBlock;
  return (typeof description === 'string' ? description : null) || '';
}

/**
 * Extract activity date from activity data
 */
export function getActivityDate(activity: ActivityRecord): Date {
  // Try to get date from activity_data first, fallback to created_at
  const timeBlock = activity.activity_data?.time;

  // Handle the database format: { date: "ISO string", time: "", timezone: "" }
  if (timeBlock && typeof timeBlock === 'object' && 'date' in timeBlock && typeof timeBlock.date === 'string') {
    return new Date(timeBlock.date);
  }

  // Fallback to other formats
  const activityDate = (timeBlock && typeof timeBlock === 'object' && 'value' in timeBlock)
    ? timeBlock.value
    : timeBlock || activity.created_at;
  return new Date(activityDate as string | number | Date);
}

/**
 * Helper function to add fact if value exists
 */
function addFact(facts: string[], label: string, value: string | number | boolean | null | undefined, unit?: string) {
  if (value !== undefined && value !== null && value !== '') {
    const factText = unit ? `${label}: ${value} ${unit}` : `${label}: ${value}`;
    facts.push(factText);
  }
}

/**
 * Extracts key facts from activity blocks for timeline display
 */
function extractKeyFacts(blocks: Record<string, ActivityBlockData>): string[] {
  const facts: string[] = [];

  // Extract facts from different block types
  Object.entries(blocks).forEach(([blockType, blockData]) => {
    if (!blockData || typeof blockData !== 'object') return;

    switch (blockType) {
      case 'measurement':
      case 'measurements':
        if (Array.isArray(blockData)) {
          blockData.forEach((measurement) => {
            if (measurement && typeof measurement === 'object' && 'value' in measurement && 'unit' in measurement) {
              const typedMeasurement = measurement as { value: number; unit: string; measurementType?: string };
              addFact(facts, typedMeasurement.measurementType || 'Measurement', typedMeasurement.value, typedMeasurement.unit);
            }
          });
        } else if (typeof blockData === 'object' && blockData !== null) {
          Object.entries(blockData).forEach(([key, measurement]) => {
            if (
              measurement &&
              typeof measurement === 'object' &&
              'value' in measurement &&
              'unit' in measurement
            ) {
              addFact(facts, key, (measurement as { value: number }).value, (measurement as { unit: string }).unit);
            }
          });
        }
        break;

      case 'portion':
        if ('amount' in blockData && 'unit' in blockData) {
          addFact(facts, 'Amount', (blockData as { amount: number }).amount, (blockData as { unit: string }).unit);
          if ('brand' in blockData) addFact(facts, 'Brand', (blockData as { brand: string }).brand);
        }
        break;

      case 'cost':
        if ('amount' in blockData && blockData.amount) {
          const currency = ('currency' in blockData ? blockData.currency : null) || '$';
          addFact(facts, 'Cost', `${currency}${blockData.amount}`);
        }
        break;

      case 'rating':
        if ('value' in blockData && blockData.value) {
          const scale = ('scale' in blockData ? blockData.scale : null) || 5;
          addFact(facts, 'Rating', `${blockData.value}/${scale}`);
        }
        break;

      case 'location':
        if ('name' in blockData || 'address' in blockData) {
          const name = 'name' in blockData && typeof blockData.name === 'string' ? blockData.name : null;
          const address = 'address' in blockData && typeof blockData.address === 'string' ? blockData.address : null;
          addFact(facts, 'Location', name || address || '');
        }
        break;

      case 'timer':
        if ('duration' in blockData && typeof blockData.duration === 'number') {
          const hours = Math.floor(blockData.duration / 60);
          const minutes = blockData.duration % 60;
          const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
          addFact(facts, 'Duration', timeStr);
        }
        break;

      case 'weather':
        if ('condition' in blockData && blockData.condition && typeof blockData.condition === 'string') {
          addFact(facts, 'Weather', blockData.condition);
        }
        if ('temperature' in blockData && typeof blockData.temperature === 'number') {
          addFact(facts, 'Temperature', blockData.temperature, '°C');
        }
        break;
    }
  });

  return facts;
}

/**
 * Counts attachments from activity blocks
 */
function countAttachments(blocks: Record<string, ActivityBlockData>): number {
  const attachments = blocks.attachments || blocks.attachment;
  if (!attachments) return 0;
  if (Array.isArray(attachments)) return attachments.length;
  return 1;
}

/**
 * Extracts thumbnail URLs from activity blocks
 */
function extractThumbnails(blocks: Record<string, ActivityBlockData>, limit = 3): string[] {
  const attachments = blocks.attachments || blocks.attachment || [];
  if (!Array.isArray(attachments)) return [];

  return attachments
    .slice(0, limit)
    .map((att) => {
      if (att && typeof att === 'object' && ('thumbnail' in att || 'url' in att)) {
        const typedAtt = att as { thumbnail?: string; url?: string };
        return typedAtt.thumbnail || typedAtt.url || '';
      }
      return '';
    })
    .filter(Boolean);
}

/**
 * Determines if activity has health-related flags
 */
function hasHealthFlag(activity: ActivityRecord): boolean {
  if (activity.category === 'Health') return true;

  const healthData = activity.activity_data?.health;
  if (healthData && typeof healthData === 'object') {
    return ('urgent' in healthData && healthData.urgent === true) ||
           ('flag' in healthData && healthData.flag === true);
  }

  return false;
}

/**
 * Determines if activity is pinned
 */
function isPinned(activity: ActivityRecord): boolean {
  const pinnedData = activity.activity_data?.pinned;
  return typeof pinnedData === 'boolean' && pinnedData === true;
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
      category: activity.category as ActivityCategory,
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

