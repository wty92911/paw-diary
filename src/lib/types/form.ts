/**
 * Strict type definitions for React Hook Form integration
 * Eliminates any usage in form-related components
 */

import {
  type Control,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
  type FieldValues
} from 'react-hook-form';

/**
 * Strict form control interface for React Hook Form
 * Replaces loose any types with proper generics
 *
 * @template TFieldValues - The shape of the form data
 */
export interface StrictFormControl<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
}

/**
 * Extract field path type from form values
 * Utility type for type-safe field name strings
 */
export type FieldPath<TFieldValues extends FieldValues> = string & keyof TFieldValues;
