import { Activity } from '../../hooks/useActivities';
import { ActivityTimelineItem } from '../types/activities';

/**
 * Converts Activity objects to ActivityTimelineItem format for timeline display
 */
export function convertActivitiesToTimelineItems(activities: Activity[]): ActivityTimelineItem[] {
  return activities.map((activity): ActivityTimelineItem => {
    // Extract key facts from blocks
    const keyFacts: string[] = [];
    
    // Extract measurement facts
    if (activity.activity_data.blocks.measurements) {
      Object.entries(activity.activity_data.blocks.measurements).forEach(([key, measurement]: [string, any]) => {
        if (measurement?.value && measurement?.unit) {
          keyFacts.push(`${key}: ${measurement.value} ${measurement.unit}`);
        }
      });
    }

    // Extract portion facts
    if (activity.activity_data.blocks.portion) {
      const portion = activity.activity_data.blocks.portion;
      if (portion?.amount && portion?.unit) {
        keyFacts.push(`Amount: ${portion.amount} ${portion.unit}`);
      }
      if (portion?.brand) {
        keyFacts.push(`Brand: ${portion.brand}`);
      }
    }

    // Extract cost facts
    if (activity.activity_data.blocks.cost) {
      const cost = activity.activity_data.blocks.cost;
      if (cost?.amount && cost?.currency) {
        keyFacts.push(`Cost: ${cost.currency}${cost.amount}`);
      }
    }

    // Extract rating facts
    if (activity.activity_data.blocks.rating) {
      const rating = activity.activity_data.blocks.rating;
      if (rating?.value && rating?.scale) {
        keyFacts.push(`Rating: ${rating.value}/${rating.scale}`);
      }
    }

    // Extract location facts
    if (activity.activity_data.blocks.location) {
      const location = activity.activity_data.blocks.location;
      if (location?.name) {
        keyFacts.push(`Location: ${location.name}`);
      }
    }

    // Extract attachments info
    const attachments = activity.activity_data.blocks.attachments || [];
    const attachmentCount = Array.isArray(attachments) ? attachments.length : 0;
    const thumbnails = Array.isArray(attachments) 
      ? attachments.slice(0, 3).map((att: any) => att.thumbnail || att.url || '').filter(Boolean)
      : [];

    // Check for health flags
    const hasHealthFlag = activity.category === 'Health' || 
      activity.activity_data.blocks.health?.flag === true;

    // Check if pinned (not implemented in current data structure)
    const isPinned = false;

    return {
      id: activity.id,
      petId: activity.pet_id,
      category: activity.category as any,
      subcategory: activity.subcategory,
      title: activity.title,
      description: activity.description || '',
      activityDate: new Date(activity.activity_date),
      keyFacts,
      attachmentCount,
      thumbnails,
      hasHealthFlag,
      isPinned,
    };
  });
}

/**
 * Extracts key facts from activity blocks for timeline display
 */
export function extractKeyFacts(blocks: Record<string, any>): string[] {
  const facts: string[] = [];

  // Helper function to add fact if value exists
  const addFact = (label: string, value: any, unit?: string) => {
    if (value !== undefined && value !== null && value !== '') {
      const factText = unit ? `${label}: ${value} ${unit}` : `${label}: ${value}`;
      facts.push(factText);
    }
  };

  // Extract facts from different block types
  Object.entries(blocks).forEach(([blockType, blockData]) => {
    if (!blockData || typeof blockData !== 'object') return;

    switch (blockType) {
      case 'measurement':
      case 'measurements':
        if (Array.isArray(blockData)) {
          blockData.forEach((measurement: any) => {
            addFact(measurement.measurementType || 'Measurement', measurement.value, measurement.unit);
          });
        } else if (blockData.value) {
          addFact('Measurement', blockData.value, blockData.unit);
        }
        break;

      case 'portion':
        addFact('Amount', blockData.amount, blockData.unit);
        if (blockData.brand) addFact('Brand', blockData.brand);
        break;

      case 'cost':
        addFact('Cost', blockData.amount ? `${blockData.currency || '$'}${blockData.amount}` : undefined);
        break;

      case 'rating':
        addFact('Rating', blockData.value ? `${blockData.value}/${blockData.scale || 5}` : undefined);
        break;

      case 'location':
        addFact('Location', blockData.name || blockData.address);
        break;

      case 'timer':
        if (blockData.duration) {
          const hours = Math.floor(blockData.duration / 60);
          const minutes = blockData.duration % 60;
          const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
          addFact('Duration', timeStr);
        }
        break;

      case 'weather':
        if (blockData.condition) addFact('Weather', blockData.condition);
        if (blockData.temperature) addFact('Temperature', blockData.temperature, '°C');
        break;
    }
  });

  return facts;
}

/**
 * Counts attachments from activity blocks
 */
export function countAttachments(blocks: Record<string, any>): number {
  const attachments = blocks.attachments || blocks.attachment;
  if (!attachments) return 0;
  if (Array.isArray(attachments)) return attachments.length;
  return 1;
}

/**
 * Extracts thumbnail URLs from activity blocks
 */
export function extractThumbnails(blocks: Record<string, any>, limit = 3): string[] {
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
export function hasHealthFlag(activity: Activity): boolean {
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
export function isPinned(activity: Activity): boolean {
  return activity.activity_data.blocks.pinned === true || false;
}