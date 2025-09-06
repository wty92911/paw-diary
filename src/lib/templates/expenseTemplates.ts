import { 
  ActivityTemplate, 
  ActivityCategory, 
  ActivityBlockType,
  QuickLogTemplate,
  DEFAULT_ATTACHMENT_CONFIG
} from '../types/activities';

// Expense category templates
export const expenseTemplates: ActivityTemplate[] = [
  // Expense Category - Purchase Template
  {
    id: 'expense.purchase',
    category: ActivityCategory.Expense,
    subcategory: 'Purchase',
    label: 'Purchase',
    icon: '💰',
    isQuickLogEnabled: true,
    description: 'Track purchases of food, toys, supplies, and services',
    blocks: [
      {
        id: 'title',
        type: 'title' as ActivityBlockType,
        label: 'Item/Service',
        required: true,
        config: {
          placeholder: 'Food, toy, vet visit, grooming...',
          maxLength: 100
        }
      },
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Purchase Date',
        required: true,
        config: {
          showDate: true,
          showTime: false,
          defaultToNow: true,
          allowFuture: false
        }
      },
      {
        id: 'cost',
        type: 'cost' as ActivityBlockType,
        label: 'Cost',
        required: true,
        config: {
          currencies: ['USD', 'CNY', 'EUR', 'GBP'],
          defaultCurrency: 'USD',
          showCategory: true,
          categories: [
            'food', 'treats', 'toys', 'grooming', 'medical',
            'supplies', 'accessories', 'services', 'other'
          ],
          allowReceipt: true
        }
      },
      {
        id: 'location',
        type: 'location' as ActivityBlockType,
        label: 'Store/Clinic',
        required: false,
        config: {
          allowCustomLocation: true,
          showMap: false,
          commonLocations: [
            'Pet store',
            'Veterinary clinic',
            'Online (Amazon)',
            'Online (Petco)',
            'Grocery store',
            'Specialty shop'
          ]
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Purchase Notes',
        required: false,
        config: {
          placeholder: 'Brand, size, reason for purchase, quality...',
          maxLength: 300
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Receipt/Photos',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 3,
          showOCR: true,
          allowedTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'application/pdf'
          ]
        }
      }
    ]
  },

  // Expense Category - Veterinary Template
  {
    id: 'expense.veterinary',
    category: ActivityCategory.Expense,
    subcategory: 'Veterinary',
    label: 'Veterinary Expense',
    icon: '🏥',
    isQuickLogEnabled: false,
    description: 'Track veterinary visits and medical expenses',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Visit Date',
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
        label: 'Service Type',
        required: true,
        config: {
          placeholder: 'Annual checkup, vaccination, surgery...',
          maxLength: 150,
          autocomplete: [
            'Annual checkup',
            'Vaccination',
            'Emergency visit',
            'Surgery',
            'Dental cleaning',
            'Blood work',
            'X-rays',
            'Prescription medication',
            'Specialist consultation'
          ]
        }
      },
      {
        id: 'people',
        type: 'people' as ActivityBlockType,
        label: 'Veterinarian/Clinic',
        required: true,
        config: {
          peopleTypes: ['veterinarian', 'vet_clinic', 'specialist', 'emergency_clinic'],
          allowCustomType: true,
          showContact: true,
          showRating: true
        }
      },
      {
        id: 'cost',
        type: 'cost' as ActivityBlockType,
        label: 'Total Cost',
        required: true,
        config: {
          currencies: ['USD', 'CNY', 'EUR', 'GBP'],
          defaultCurrency: 'USD',
          showCategory: true,
          categories: [
            'checkup', 'vaccination', 'emergency', 'surgery', 
            'medication', 'diagnostics', 'dental', 'specialist'
          ],
          allowReceipt: true
        }
      },
      {
        id: 'checklist',
        type: 'checklist' as ActivityBlockType,
        label: 'Services Provided',
        required: false,
        config: {
          checklistType: 'veterinary',
          predefinedItems: [
            'Physical examination',
            'Weight check',
            'Temperature',
            'Vaccination administered',
            'Blood work ordered',
            'Prescription given',
            'Follow-up scheduled',
            'Emergency treatment'
          ],
          allowCustomItems: true,
          maxItems: 12
        }
      },
      {
        id: 'reminder',
        type: 'reminder' as ActivityBlockType,
        label: 'Follow-up Reminders',
        required: false,
        config: {
          reminderTypes: [
            'next_checkup', 'vaccination_due', 'medication_refill', 
            'recheck_appointment', 'test_results', 'surgery_followup'
          ],
          allowCustom: true,
          showTime: true,
          showRepeat: true
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Visit Summary',
        required: false,
        config: {
          placeholder: 'Diagnosis, treatment plan, vet recommendations...',
          maxLength: 800
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Medical Records & Receipts',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 8,
          showOCR: true,
          allowedTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'application/pdf', 'text/plain'
          ]
        }
      }
    ]
  },

  // Expense Category - Grooming Template
  {
    id: 'expense.grooming',
    category: ActivityCategory.Expense,
    subcategory: 'Grooming',
    label: 'Grooming Service',
    icon: '✂️',
    isQuickLogEnabled: true,
    description: 'Track grooming appointments and costs',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Appointment Date',
        required: true,
        config: {
          showDate: true,
          showTime: true,
          defaultToNow: true,
          allowFuture: false
        }
      },
      {
        id: 'people',
        type: 'people' as ActivityBlockType,
        label: 'Groomer/Salon',
        required: true,
        config: {
          peopleTypes: ['groomer', 'grooming_salon', 'mobile_groomer'],
          allowCustomType: true,
          showContact: true,
          showRating: true
        }
      },
      {
        id: 'checklist',
        type: 'checklist' as ActivityBlockType,
        label: 'Services Received',
        required: true,
        config: {
          checklistType: 'grooming',
          predefinedItems: [
            'Bath and shampoo',
            'Haircut/trim',
            'Nail trimming',
            'Ear cleaning',
            'Teeth brushing',
            'Anal gland expression',
            'Flea treatment',
            'De-shedding'
          ],
          allowCustomItems: true,
          maxItems: 10
        }
      },
      {
        id: 'cost',
        type: 'cost' as ActivityBlockType,
        label: 'Grooming Cost',
        required: true,
        config: {
          currencies: ['USD', 'CNY', 'EUR', 'GBP'],
          defaultCurrency: 'USD',
          showCategory: true,
          categories: ['full_groom', 'bath_only', 'nail_trim', 'specialty_service'],
          allowReceipt: true
        }
      },
      {
        id: 'rating',
        type: 'rating' as ActivityBlockType,
        label: 'Service Quality',
        required: false,
        config: {
          scale: 5,
          ratingType: 'quality',
          labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
          showEmojis: false
        }
      },
      {
        id: 'reminder',
        type: 'reminder' as ActivityBlockType,
        label: 'Next Grooming',
        required: false,
        config: {
          reminderTypes: ['next_grooming', 'nail_trim_due'],
          allowCustom: true,
          showTime: false,
          showRepeat: true
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Grooming Notes',
        required: false,
        config: {
          placeholder: 'Special requests, pet behavior, result quality...',
          maxLength: 400
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Before/After Photos',
        required: false,
        config: {
          ...DEFAULT_ATTACHMENT_CONFIG,
          maxFiles: 4,
          showOCR: false
        }
      }
    ]
  },

  // Expense Category - Insurance Template
  {
    id: 'expense.insurance',
    category: ActivityCategory.Expense,
    subcategory: 'Insurance',
    label: 'Pet Insurance',
    icon: '🛡️',
    isQuickLogEnabled: true,
    description: 'Track insurance payments and claims',
    blocks: [
      {
        id: 'time',
        type: 'time' as ActivityBlockType,
        label: 'Payment/Claim Date',
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
        label: 'Transaction Type',
        required: true,
        config: {
          placeholder: 'Monthly premium, claim reimbursement...',
          maxLength: 100,
          autocomplete: [
            'Monthly premium payment',
            'Annual premium payment',
            'Claim reimbursement',
            'Deductible payment',
            'Policy change fee'
          ]
        }
      },
      {
        id: 'cost',
        type: 'cost' as ActivityBlockType,
        label: 'Amount',
        required: true,
        config: {
          currencies: ['USD', 'CNY', 'EUR', 'GBP'],
          defaultCurrency: 'USD',
          showCategory: true,
          categories: ['premium', 'reimbursement', 'deductible', 'fee'],
          allowReceipt: true
        }
      },
      {
        id: 'notes',
        type: 'notes' as ActivityBlockType,
        label: 'Insurance Details',
        required: false,
        config: {
          placeholder: 'Policy number, claim number, coverage details...',
          maxLength: 400
        }
      },
      {
        id: 'attachment',
        type: 'attachment' as ActivityBlockType,
        label: 'Insurance Documents',
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
  }
];

// Expense quick log templates
export const expenseQuickLogTemplates: QuickLogTemplate[] = [
  {
    templateId: 'expense.purchase',
    category: ActivityCategory.Expense,
    subcategory: 'Purchase',
    label: 'Quick Purchase',
    icon: '💰',
    blocks: [
      {
        id: 'title',
        type: 'title' as ActivityBlockType,
        label: 'Item',
        required: true,
        config: {
          placeholder: 'What did you buy?',
          maxLength: 50
        }
      },
      {
        id: 'cost',
        type: 'cost' as ActivityBlockType,
        label: 'Cost',
        required: true,
        config: {
          currencies: ['USD', 'CNY', 'EUR', 'GBP'],
          defaultCurrency: 'USD',
          showCategory: false,
          allowReceipt: false
        }
      }
    ]
  },
  {
    templateId: 'expense.grooming',
    category: ActivityCategory.Expense,
    subcategory: 'Grooming',
    label: 'Quick Grooming',
    icon: '✂️',
    blocks: [
      {
        id: 'cost',
        type: 'cost' as ActivityBlockType,
        label: 'Cost',
        required: true,
        config: {
          currencies: ['USD', 'CNY', 'EUR', 'GBP'],
          defaultCurrency: 'USD',
          showCategory: false,
          allowReceipt: false
        }
      },
      {
        id: 'rating',
        type: 'rating' as ActivityBlockType,
        label: 'Quality',
        required: false,
        config: {
          scale: 5,
          ratingType: 'quality'
        }
      }
    ]
  }
];

export default expenseTemplates;