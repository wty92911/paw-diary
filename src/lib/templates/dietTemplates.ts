import { 
  ActivityTemplate, 
  ActivityCategory, 
  ActivityBlockType,
  DEFAULT_PORTION_CONFIG,
  DEFAULT_ATTACHMENT_CONFIG
} from '../types/activities';

// Diet category templates
export const dietTemplates: ActivityTemplate[] = [
  // Diet Category - Feeding Template
  {
    id: 'diet.feeding',
    category: ActivityCategory.Diet,
    subcategory: 'Feeding',
    label: 'Feeding',
    icon: '🍽️',
    isQuickLogEnabled: true,
    description: 'Record feeding sessions with food type, portion, and timing',
    blocks: [
      {
        id: 'title',
        type: 'title' as ActivityBlockType,
        label: 'Meal Description',
        required: true,
        config: {
          placeholder: 'Breakfast, lunch, dinner, snack...',
          maxLength: 100,
          autocomplete: ['Breakfast', 'Lunch', 'Dinner', 'Morning Snack', 'Evening Snack', 'Treat']
        }
      },
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Feeding Time',
        required: true,
        config: {
          showDate: true,
          showTime: true,
          defaultToNow: true,
          allowFuture: false,
          showPresets: true,
          presets: [
            { id: 'now', label: 'Now', offset: 0 },
            { id: '1h_ago', label: '1 hour ago', offset: -60 },
            { id: '2h_ago', label: '2 hours ago', offset: -120 }
          ]
        }
      },
      {
        id: 'portion',
        type: 'portion' as ActivityBlockType,
        label: 'Portion Size',
        required: true,
        config: {
          ...DEFAULT_PORTION_CONFIG,
          portionTypes: ['meal', 'snack', 'treat', 'supplement'],
          units: ['g', 'cups', 'ml', 'pieces'],
          defaultUnit: 'g'
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Food Notes',
        required: false,
        config: {
          placeholder: 'Food brand, flavor, appetite level...',
          maxLength: 500
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Photos',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 3,
          showOCR: false
        }
      }
    ]
  },

  // Diet Category - Water Template
  {
    id: 'diet.water',
    category: ActivityCategory.Diet,
    subcategory: 'Water',
    label: 'Water Intake',
    icon: '💧',
    isQuickLogEnabled: true,
    description: 'Track daily water consumption',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Time',
        required: true,
        config: {
          showDate: true,
          showTime: true,
          defaultToNow: true,
          allowFuture: false
        }
      },
      {
        id: 'portion',
        type: 'portion' as ActivityBlockType,
        label: 'Water Amount',
        required: true,
        config: {
          portionTypes: ['bowl', 'bottle', 'fountain'],
          units: ['ml', 'cups', 'oz'],
          defaultUnit: 'ml',
          showBrand: false
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Notes',
        required: false,
        config: {
          placeholder: 'Water source, eagerness to drink...',
          maxLength: 200
        }
      }
    ]
  },

  // Diet Category - Treat Template
  {
    id: 'diet.treat',
    category: ActivityCategory.Diet,
    subcategory: 'Treat',
    label: 'Treats & Rewards',
    icon: '🦴',
    isQuickLogEnabled: true,
    description: 'Log treats, rewards, and special snacks',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Time',
        required: true,
        config: {
          showDate: true,
          showTime: true,
          defaultToNow: true,
          allowFuture: false
        }
      },
      {
        id: 'title',
        type: 'title' as ActivityBlockType,
        label: 'Treat Type',
        required: true,
        config: {
          placeholder: 'Biscuit, bone, training treat...',
          maxLength: 100,
          autocomplete: ['Training treat', 'Dental chew', 'Biscuit', 'Bone', 'Fruit', 'Vegetable']
        }
      },
      {
        id: 'portion',
        type: 'portion' as ActivityBlockType,
        label: 'Amount',
        required: false,
        config: {
          portionTypes: ['piece', 'small', 'medium', 'large'],
          units: ['pieces', 'g', 'oz'],
          defaultUnit: 'pieces',
          showBrand: true
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Occasion',
        required: false,
        config: {
          placeholder: 'Training session, good behavior, special occasion...',
          maxLength: 200
        }
      }
    ]
  }
];

export default dietTemplates;