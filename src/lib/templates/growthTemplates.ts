import { 
  type ActivityTemplate, 
  ActivityCategory, 
  type ActivityBlockType,
  DEFAULT_MEASUREMENT_CONFIG,
  DEFAULT_ATTACHMENT_CONFIG
} from '../types/activities';

// Growth category templates
export const growthTemplates: ActivityTemplate[] = [
  // Growth Category - Weight Template
  {
    id: 'growth.weight',
    category: ActivityCategory.Growth,
    subcategory: 'Weight',
    label: 'Weight Check',
    icon: '⚖️',
    isAvailable: true, // ✅ Tested and implemented
    description: 'Record weight measurements for growth tracking',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Measurement Time',
        required: true,
        config: {
          showDate: true,
          showTime: true,
          defaultToNow: true,
          allowFuture: false
        }
      },
      {
        id: 'weight',
        type: 'measurement' as ActivityBlockType,
        label: 'Weight',
        required: true,
        config: {
          ...DEFAULT_MEASUREMENT_CONFIG,
          measurementType: 'weight',
          units: ['kg', 'g', 'lbs'],
          defaultUnit: 'kg',
          min: 0.001,
          max: 200,
          precision: 3
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Growth Notes',
        required: false,
        config: {
          placeholder: 'Body condition, comparison to last measurement...',
          maxLength: 300
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Progress Photos',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 2,
          showOCR: false
        }
      }
    ]
  },

  // Growth Category - Height/Length Template
  {
    id: 'growth.height',
    category: ActivityCategory.Growth,
    subcategory: 'Height',
    label: 'Height/Length Check',
    icon: '📏',
    isAvailable: false, // ⚠️ Not yet tested
    description: 'Measure height, length, or body dimensions',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Measurement Time',
        required: true,
        config: {
          showDate: true,
          showTime: true,
          defaultToNow: true,
          allowFuture: false
        }
      },
      {
        id: 'height',
        type: 'measurement' as ActivityBlockType,
        label: 'Height/Length',
        required: true,
        config: {
          measurementType: 'height',
          units: ['cm', 'in', 'm'],
          defaultUnit: 'cm',
          min: 1,
          max: 200,
          precision: 0.1
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Measurement Notes',
        required: false,
        config: {
          placeholder: 'Standing height, body length, specific measurement notes...',
          maxLength: 300
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Measurement Photos',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 2,
          showOCR: false
        }
      }
    ]
  },

  // Growth Category - Development Milestone Template
  {
    id: 'growth.milestone',
    category: ActivityCategory.Growth,
    subcategory: 'Milestone',
    label: 'Development Milestone',
    icon: '🎯',
    isAvailable: false, // ⚠️ Not yet tested
    description: 'Track developmental milestones and growth stages',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Date Achieved',
        required: true,
        config: {
          showDate: true,
          showTime: false,
          defaultToNow: true,
          allowFuture: false
        }
      },
      {
        id: 'title',
        type: 'title' as ActivityBlockType,
        label: 'Milestone',
        required: true,
        config: {
          placeholder: 'First walk, house trained, learned sit...',
          maxLength: 150,
          autocomplete: [
            'First walk outdoors',
            'House trained',
            'Learned to sit',
            'Learned to stay',
            'First grooming',
            'Lost puppy teeth',
            'First heat cycle',
            'Spay/neuter surgery'
          ]
        }
      },
      {
        id: 'checklist',
        type: 'checklist' as ActivityBlockType,
        label: 'Development Markers',
        required: false,
        config: {
          checklistType: 'milestone',
          predefinedItems: [
            'Shows consistent behavior',
            'Responds reliably to command',
            'Demonstrates skill independently',
            'No accidents or setbacks'
          ],
          allowCustomItems: true,
          maxItems: 10
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Milestone Details',
        required: false,
        config: {
          placeholder: 'How it happened, training methods used, challenges overcome...',
          maxLength: 500
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Milestone Photos/Videos',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 5,
          showOCR: false
        }
      }
    ]
  }
];

export default growthTemplates;