import { z } from 'zod';
import { 
  ActivityCategory,
  ActivityBlockType,
} from '../types/activities';

// Base validation schemas for common patterns

// Text validation with common patterns
const textSchema = (minLength = 0, maxLength = 1000) =>
  z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be less than ${maxLength} characters`)
    .trim();

const requiredTextSchema = (minLength = 1, maxLength = 1000) =>
  textSchema(minLength, maxLength)
    .min(minLength, minLength === 1 ? 'This field is required' : `Must be at least ${minLength} characters`);

// Number validation with range
const numberSchema = (min?: number, max?: number) => {
  let schema = z.number();
  if (min !== undefined) schema = schema.min(min, `Must be at least ${min}`);
  if (max !== undefined) schema = schema.max(max, `Must be less than or equal to ${max}`);
  return schema;
};

const positiveNumberSchema = numberSchema(0);
const requiredNumberSchema = z.number().min(0.01, 'Must be greater than 0');

// Date validation
const dateSchema = z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Please enter a valid date',
});

const futureDateSchema = z.date().refine(
  (date) => date > new Date(),
  'Date must be in the future'
);

const pastDateSchema = z.date().refine(
  (date) => date <= new Date(),
  'Date cannot be in the future'
);

// Email and URL validation
const emailSchema = z.string().email('Please enter a valid email address').optional();
const urlSchema = z.string().url('Please enter a valid URL').optional();

// Block-specific validation schemas

// Title Block
export const titleBlockSchema = z.object({
  value: requiredTextSchema(1, 200),
});

// Notes Block  
export const notesBlockSchema = z.object({
  value: textSchema(0, 1000).optional(),
});

// Time Block
export const timeBlockSchema = z.object({
  date: dateSchema,
  time: z.string().optional(),
  timezone: z.string().optional(),
  notes: textSchema(0, 200).optional(),
}).refine((data) => {
  // Validate time format if provided
  if (data.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
    return false;
  }
  return true;
}, {
  message: 'Time must be in HH:MM format',
  path: ['time']
});

// Subcategory Block
export const subcategoryBlockSchema = z.object({
  value: requiredTextSchema(1, 100),
});

// Measurement Block
export const measurementBlockSchema = z.object({
  value: requiredNumberSchema,
  unit: requiredTextSchema(1, 20),
  measurementType: requiredTextSchema(1, 50),
  notes: textSchema(0, 200).optional(),
}).refine((data) => {
  // Type-specific validation
  if (data.measurementType === 'weight' && data.value > 200) {
    return false;
  }
  if (data.measurementType === 'temperature' && (data.value < -50 || data.value > 100)) {
    return false;
  }
  return true;
}, {
  message: 'Measurement value is outside acceptable range for this type',
  path: ['value']
});

// Rating Block
export const ratingBlockSchema = z.object({
  value: z.number().min(1, 'Rating must be at least 1').max(10, 'Rating cannot exceed 10'),
  scale: z.number().min(1).max(10),
  ratingType: requiredTextSchema(1, 50),
  notes: textSchema(0, 200).optional(),
}).refine((data) => {
  return data.value <= data.scale;
}, {
  message: 'Rating value cannot exceed the scale maximum',
  path: ['value']
});

// Portion Block
export const portionBlockSchema = z.object({
  amount: requiredNumberSchema,
  unit: requiredTextSchema(1, 20),
  portionType: requiredTextSchema(1, 50),
  brand: textSchema(0, 100).optional(),
  notes: textSchema(0, 200).optional(),
});

// Timer Block
export const timerBlockSchema = z.object({
  type: z.enum(['duration', 'stopwatch', 'start_end']),
  duration: z.number().min(0).optional(),
  startTime: dateSchema.optional(),
  endTime: dateSchema.optional(),
  notes: textSchema(0, 200).optional(),
}).refine((data) => {
  // Duration type must have duration
  if (data.type === 'duration' && !data.duration) {
    return false;
  }
  // Start/end type must have both times
  if (data.type === 'start_end' && (!data.startTime || !data.endTime)) {
    return false;
  }
  // End time must be after start time
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    return false;
  }
  return true;
}, {
  message: 'Timer configuration is invalid for the selected type',
});

// Location Block
export const locationBlockSchema = z.object({
  name: requiredTextSchema(1, 200),
  address: textSchema(0, 300).optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  notes: textSchema(0, 200).optional(),
});

// Weather Block
export const weatherBlockSchema = z.object({
  temperature: z.number().min(-50).max(60).optional(),
  temperatureUnit: z.enum(['C', 'F']),
  conditions: textSchema(0, 100).optional(),
  description: textSchema(0, 200).optional(),
});

// Checklist Block
export const checklistItemSchema = z.object({
  id: requiredTextSchema(1, 50),
  text: requiredTextSchema(1, 200),
  checked: z.boolean(),
  notes: textSchema(0, 200).optional(),
});

export const checklistBlockSchema = z.object({
  items: z.array(checklistItemSchema).min(1, 'At least one item is required'),
  checklistType: requiredTextSchema(1, 50),
  notes: textSchema(0, 200).optional(),
}).refine((data) => {
  // Validate unique item IDs
  const ids = data.items.map(item => item.id);
  return new Set(ids).size === ids.length;
}, {
  message: 'Checklist items must have unique IDs',
  path: ['items']
});

// Attachment Block
export const attachmentBlockSchema = z.object({
  id: requiredTextSchema(1, 50),
  filename: requiredTextSchema(1, 255),
  originalName: requiredTextSchema(1, 255),
  mimeType: requiredTextSchema(1, 100),
  size: z.number().min(1).max(10 * 1024 * 1024), // Max 10MB
  path: requiredTextSchema(1, 500),
  thumbnailPath: textSchema(0, 500).optional(),
  uploadedAt: dateSchema,
  description: textSchema(0, 300).optional(),
  ocrText: textSchema(0, 5000).optional(),
}).refine((data) => {
  // Validate file size
  const maxSize = 10 * 1024 * 1024; // 10MB
  return data.size <= maxSize;
}, {
  message: 'File size cannot exceed 10MB',
  path: ['size']
}).refine((data) => {
  // Validate MIME type
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp',
    'application/pdf', 'text/plain'
  ];
  return allowedTypes.includes(data.mimeType);
}, {
  message: 'File type is not supported',
  path: ['mimeType']
});

export const attachmentArraySchema = z.array(attachmentBlockSchema)
  .max(10, 'Cannot have more than 10 attachments');

// Cost Block
export const costBlockSchema = z.object({
  amount: requiredNumberSchema,
  currency: z.string().length(3, 'Currency code must be 3 characters').toUpperCase(),
  category: textSchema(0, 50).optional(),
  description: textSchema(0, 200).optional(),
  receiptPhoto: textSchema(0, 500).optional(),
  notes: textSchema(0, 200).optional(),
}).refine((data) => {
  // Validate currency codes
  const validCurrencies = ['USD', 'CNY', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  return validCurrencies.includes(data.currency);
}, {
  message: 'Currency code is not supported',
  path: ['currency']
});

// People Block
export const personSchema = z.object({
  id: requiredTextSchema(1, 50),
  name: requiredTextSchema(1, 100),
  type: requiredTextSchema(1, 50),
  contact: z.object({
    phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
    email: emailSchema,
    address: textSchema(0, 300).optional(),
  }).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: textSchema(0, 300).optional(),
});

export const peopleBlockSchema = z.object({
  people: z.array(personSchema).min(1, 'At least one person is required'),
  notes: textSchema(0, 200).optional(),
}).refine((data) => {
  // Validate unique person IDs
  const ids = data.people.map(person => person.id);
  return new Set(ids).size === ids.length;
}, {
  message: 'People must have unique IDs',
  path: ['people']
});

// Reminder Block
export const reminderBlockSchema = z.object({
  type: requiredTextSchema(1, 50),
  title: requiredTextSchema(1, 100),
  description: textSchema(0, 300).optional(),
  reminderDate: futureDateSchema,
  reminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format').optional(),
  repeat: z.object({
    pattern: z.object({
      type: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
      interval: z.number().min(1).max(365),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      endDate: dateSchema.optional(),
      maxOccurrences: z.number().min(1).max(100).optional(),
    }),
    startDate: dateSchema,
    endDate: dateSchema.optional(),
    maxOccurrences: z.number().min(1).max(100).optional(),
    notes: textSchema(0, 200).optional(),
  }).optional(),
  isEnabled: z.boolean(),
});

// Recurrence Block
export const recurrencePatternSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  interval: z.number().min(1).max(365),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  endDate: dateSchema.optional(),
  maxOccurrences: z.number().min(1).max(100).optional(),
});

export const recurrenceBlockSchema = z.object({
  pattern: recurrencePatternSchema,
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  maxOccurrences: z.number().min(1).max(100).optional(),
  notes: textSchema(0, 200).optional(),
}).refine((data) => {
  // End date must be after start date
  if (data.endDate && data.endDate <= data.startDate) {
    return false;
  }
  // Must have either end date or max occurrences
  if (!data.endDate && !data.maxOccurrences) {
    return false;
  }
  return true;
}, {
  message: 'Recurrence must have an end date or maximum number of occurrences',
});

// Master block validation registry
export const blockValidationRegistry: Record<ActivityBlockType, z.ZodSchema> = {
  'title': titleBlockSchema,
  'notes': notesBlockSchema,
  'time': timeBlockSchema,
  'subcategory': subcategoryBlockSchema,
  'measurement': measurementBlockSchema,
  'rating': ratingBlockSchema,
  'portion': portionBlockSchema,
  'timer': timerBlockSchema,
  'location': locationBlockSchema,
  'weather': weatherBlockSchema,
  'checklist': checklistBlockSchema,
  'attachment': attachmentArraySchema,
  'cost': costBlockSchema,
  'reminder': reminderBlockSchema,
  'people': peopleBlockSchema,
  'recurrence': recurrenceBlockSchema,
};

// Complete activity form validation schema - matches ActivityFormData interface
export const activityFormValidationSchema = z.object({
  petId: z.number().min(1, 'Pet is required'),
  category: z.nativeEnum(ActivityCategory, {
    required_error: 'Category is required',
  }),
  subcategory: requiredTextSchema(1, 100),
  blocks: z.record(z.string(), z.any()).default({}),
});

// Simplified validation - block-level validation happens within blocks

// Utility functions for block validation

export const validateBlockData = (blockType: ActivityBlockType, data: any) => {
  const schema = blockValidationRegistry[blockType];
  if (!schema) {
    throw new Error(`No validation schema found for block type: ${blockType}`);
  }
  return schema.safeParse(data);
};

export const getBlockValidationErrors = (blockType: ActivityBlockType, data: any): string[] => {
  const result = validateBlockData(blockType, data);
  if (result.success) return [];
  
  return result.error.errors.map((err: z.ZodIssue) => err.message);
};

export const isBlockDataValid = (blockType: ActivityBlockType, data: any): boolean => {
  const result = validateBlockData(blockType, data);
  return result.success;
};

// Helper schemas for common validations
export const commonValidationSchemas = {
  text: textSchema,
  requiredText: requiredTextSchema,
  number: numberSchema,
  positiveNumber: positiveNumberSchema,
  requiredNumber: requiredNumberSchema,
  date: dateSchema,
  futureDate: futureDateSchema,
  pastDate: pastDateSchema,
  email: emailSchema,
  url: urlSchema,
};

// Export type inference helpers
export type TitleBlockData = z.infer<typeof titleBlockSchema>;
export type NotesBlockData = z.infer<typeof notesBlockSchema>;
export type TimeBlockData = z.infer<typeof timeBlockSchema>;
export type MeasurementBlockData = z.infer<typeof measurementBlockSchema>;
export type RatingBlockData = z.infer<typeof ratingBlockSchema>;
export type PortionBlockData = z.infer<typeof portionBlockSchema>;
export type TimerBlockData = z.infer<typeof timerBlockSchema>;
export type LocationBlockData = z.infer<typeof locationBlockSchema>;
export type WeatherBlockData = z.infer<typeof weatherBlockSchema>;
export type ChecklistBlockData = z.infer<typeof checklistBlockSchema>;
export type AttachmentBlockData = z.infer<typeof attachmentBlockSchema>;
export type CostBlockData = z.infer<typeof costBlockSchema>;
export type ReminderBlockData = z.infer<typeof reminderBlockSchema>;
export type PeopleBlockData = z.infer<typeof peopleBlockSchema>;
export type RecurrenceBlockData = z.infer<typeof recurrenceBlockSchema>;

export type ActivityFormValidationData = z.infer<typeof activityFormValidationSchema>;