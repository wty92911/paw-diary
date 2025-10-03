import { 
  type ActivityTemplate, 
  ActivityCategory, 
  type ActivityBlockType,
  DEFAULT_ATTACHMENT_CONFIG
} from '../types/activities';

// Health category templates
export const healthTemplates: ActivityTemplate[] = [
  // Health Category - Checkup Template
  {
    id: 'health.checkup',
    category: ActivityCategory.Health,
    subcategory: 'Checkup',
    label: 'Health Checkup',
    icon: '🏥',
    isQuickLogEnabled: false,
    description: 'Comprehensive health examination record',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Checkup Date',
        required: true,
        config: {
          showDate: true,
          showTime: true,
          defaultToNow: true,
          allowFuture: true
        }
      },
      {
        id: 'people',
        type: 'people' as ActivityBlockType,
        label: 'Veterinarian',
        required: false,
        config: {
          peopleTypes: ['veterinarian', 'vet_tech', 'specialist'],
          allowCustomType: true,
          showContact: true,
          showRating: true
        }
      },
      {
        id: 'checklist',
        type: 'checklist' as ActivityBlockType,
        label: 'Health Checklist',
        required: false,
        config: {
          checklistType: 'health',
          predefinedItems: [
            'Weight measurement',
            'Temperature check',
            'Heart rate',
            'Vaccination status',
            'Dental examination',
            'Eye examination',
            'Ear examination',
            'Skin/coat condition'
          ],
          allowCustomItems: true,
          maxItems: 15
        }
      },
      {
        id: 'cost',
        type: 'cost' as ActivityBlockType,
        label: 'Visit Cost',
        required: false,
        config: {
          currencies: ['USD', 'CNY', 'EUR', 'GBP'],
          defaultCurrency: 'USD',
          showCategory: true,
          categories: ['checkup', 'vaccination', 'treatment', 'medication', 'emergency'],
          allowReceipt: true
        }
      },
      {
        id: 'reminder',
        type: 'reminder' as ActivityBlockType,
        label: 'Follow-up Reminder',
        required: false,
        config: {
          reminderTypes: ['next_checkup', 'medication', 'recheck', 'vaccination'],
          allowCustom: true,
          showTime: true,
          showRepeat: true
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Checkup Notes',
        required: false,
        config: {
          placeholder: 'Vet observations, recommendations, health concerns...',
          maxLength: 1000
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Medical Records',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 5,
          showOCR: true,
          allowedTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'application/pdf', 'text/plain'
          ]
        }
      }
    ]
  },

  // Health Category - Medication Template
  {
    id: 'health.medication',
    category: ActivityCategory.Health,
    subcategory: 'Medication',
    label: 'Medication Administration',
    icon: '💊',
    isQuickLogEnabled: true,
    description: 'Track medication doses and schedules',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Administration Time',
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
        label: 'Medication Name',
        required: true,
        config: {
          placeholder: 'Medicine name and dosage...',
          maxLength: 150
        }
      },
      {
        id: 'portion',
        type: 'portion' as ActivityBlockType,
        label: 'Dosage',
        required: true,
        config: {
          portionTypes: ['tablet', 'liquid', 'injection', 'topical'],
          units: ['mg', 'ml', 'tablets', 'drops'],
          defaultUnit: 'mg',
          showBrand: true
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Administration Notes',
        required: false,
        config: {
          placeholder: 'With food, reaction observed, difficulty giving...',
          maxLength: 300
        }
      },
      {
        id: 'reminder',
        type: 'reminder' as ActivityBlockType,
        label: 'Next Dose Reminder',
        required: false,
        config: {
          reminderTypes: ['next_dose', 'refill_needed', 'side_effects_check'],
          allowCustom: false,
          showTime: true,
          showRepeat: true
        }
      }
    ]
  },

  // Health Category - Symptom Template
  {
    id: 'health.symptom',
    category: ActivityCategory.Health,
    subcategory: 'Symptom',
    label: 'Symptom Tracking',
    icon: '🌡️',
    isQuickLogEnabled: true,
    description: 'Log symptoms and health concerns',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Symptom Observed',
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
        label: 'Primary Symptom',
        required: true,
        config: {
          placeholder: 'Vomiting, lethargy, limping...',
          maxLength: 100,
          autocomplete: [
            'Vomiting',
            'Diarrhea',
            'Lethargy',
            'Limping',
            'Coughing',
            'Sneezing',
            'Loss of appetite',
            'Excessive drinking',
            'Difficulty breathing',
            'Skin irritation'
          ]
        }
      },
      {
        id: 'rating',
        type: 'rating' as ActivityBlockType,
        label: 'Severity',
        required: true,
        config: {
          scale: 5,
          ratingType: 'severity',
          labels: ['Mild', 'Moderate', 'Concerning', 'Severe', 'Critical'],
          showEmojis: false
        }
      },
      {
        id: 'checklist',
        type: 'checklist' as ActivityBlockType,
        label: 'Additional Symptoms',
        required: false,
        config: {
          checklistType: 'symptoms',
          predefinedItems: [
            'Change in appetite',
            'Change in water consumption',
            'Behavioral changes',
            'Temperature change',
            'Difficulty moving',
            'Breathing issues',
            'Digestive issues',
            'Skin/coat changes'
          ],
          allowCustomItems: true,
          maxItems: 12
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Detailed Description',
        required: false,
        config: {
          placeholder: 'Duration, triggers, what helps/worsens, progression...',
          maxLength: 500
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Photos/Videos',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 3,
          showOCR: false
        }
      }
    ]
  }
];


export default healthTemplates;