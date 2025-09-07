import { Activity } from '../../hooks/useActivities';
import { ActivityTimelineItem } from '../types/activities';

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
function hasHealthFlag(activity: Activity): boolean {
  return (
    activity.category === 'Health' ||
    activity.activity_data.blocks.health?.urgent === true ||
    activity.activity_data.blocks.health?.flag === true ||
    false
  );
}

/**
 * Determines if activity is pinned
 */
function isPinned(activity: Activity): boolean {
  return activity.activity_data.blocks.pinned === true || false;
}

/**
 * Converts Activity objects to ActivityTimelineItem format for timeline display
 */
export function convertActivitiesToTimelineItems(activities: Activity[]): ActivityTimelineItem[] {
  return activities.map((activity): ActivityTimelineItem => {
    const blocks = activity.activity_data.blocks;
    
    return {
      id: activity.id,
      petId: activity.pet_id,
      category: activity.category as any,
      subcategory: activity.subcategory,
      title: activity.title,
      description: activity.description || '',
      activityDate: new Date(activity.activity_date),
      keyFacts: extractKeyFacts(blocks),
      attachmentCount: countAttachments(blocks),
      thumbnails: extractThumbnails(blocks),
      hasHealthFlag: hasHealthFlag(activity),
      isPinned: isPinned(activity),
    };
  });
}

