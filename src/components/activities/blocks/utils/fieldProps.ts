/**
 * Utility function to get field props from React Hook Form
 * Provides accessibility attributes and error handling
 */
export function getFieldProps(
  field: { name: string; value: unknown },
  fieldState: { error?: { message?: string } }
) {
  return {
    error: fieldState.error?.message,
    'aria-invalid': fieldState.error ? 'true' : 'false',
    'aria-describedby': fieldState.error ? `${field.name}-error` : undefined,
  };
}
