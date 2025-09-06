import React from 'react';
import { Controller } from 'react-hook-form';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Field } from './Field';
import { BlockProps } from '../../../lib/types/activities';
import { notesBlockSchema } from '../../../lib/validation/activityBlocks';

// Configuration interface for NotesBlock
interface NotesBlockConfig {
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  showCounter?: boolean;
  allowFormatting?: boolean;
  rows?: number;
  showFormattingHelp?: boolean;
  autoResize?: boolean;
}

// NotesBlock component for handling multiline text input with formatting
const NotesBlock: React.FC<BlockProps<NotesBlockConfig>> = ({
  control,
  name,
  label = 'Notes',
  required = false,
  config = {},
}) => {
  const {
    placeholder = 'Add notes...',
    maxLength = 1000,
    minLength = 0,
    showCounter = true,
    allowFormatting = false,
    rows = 4,
    showFormattingHelp = false,
    autoResize = true,
  } = config;

  // Text formatting functions (basic markdown-style)
  const applyFormatting = (
    currentValue: string,
    selectionStart: number,
    selectionEnd: number,
    format: 'bold' | 'italic' | 'bullet'
  ): { newValue: string; newCursorPos: number } => {
    const beforeSelection = currentValue.slice(0, selectionStart);
    const selectedText = currentValue.slice(selectionStart, selectionEnd);
    const afterSelection = currentValue.slice(selectionEnd);

    let formattedText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = selectedText ? 4 : 2;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        cursorOffset = selectedText ? 2 : 1;
        break;
      case 'bullet':
        const lines = selectedText.split('\n');
        formattedText = lines.map(line => line.trim() ? `• ${line}` : line).join('\n');
        cursorOffset = formattedText.length - selectedText.length;
        break;
    }

    const newValue = beforeSelection + formattedText + afterSelection;
    const newCursorPos = selectionStart + (selectedText ? formattedText.length : cursorOffset);

    return { newValue, newCursorPos };
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: required ? `${label} is required` : false,
        minLength: minLength > 0 ? {
          value: minLength,
          message: `${label} must be at least ${minLength} characters`,
        } : undefined,
        maxLength: maxLength ? {
          value: maxLength,
          message: `${label} must be less than ${maxLength} characters`,
        } : undefined,
        validate: (value) => {
          // Use Zod validation
          const result = notesBlockSchema.safeParse({ value: value || '' });
          if (!result.success && (required || value)) {
            return result.error.errors[0]?.message || 'Invalid notes';
          }
          return true;
        },
      }}
      render={({ field, fieldState }) => {
        const currentLength = typeof field.value === 'string' ? field.value.length : 0;
        const textareaRef = React.useRef<HTMLTextAreaElement>(null);

        // Auto-resize functionality
        React.useEffect(() => {
          if (autoResize && textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
          }
        }, [field.value, autoResize]);

        // Handle formatting button clicks
        const handleFormat = (format: 'bold' | 'italic' | 'bullet') => {
          if (!textareaRef.current) return;

          const textarea = textareaRef.current;
          const selectionStart = textarea.selectionStart;
          const selectionEnd = textarea.selectionEnd;
          const currentValue = field.value || '';

          const { newValue, newCursorPos } = applyFormatting(
            currentValue,
            selectionStart,
            selectionEnd,
            format
          );

          field.onChange(newValue);

          // Restore cursor position after React re-render
          setTimeout(() => {
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 0);
        };

        const counterColor = currentLength > maxLength * 0.9 
          ? currentLength >= maxLength 
            ? 'text-destructive' 
            : 'text-yellow-600'
          : 'text-muted-foreground';

        return (
          <Field
            label={label}
            required={required}
            error={fieldState.error?.message}
            hint={undefined}
            blockType="notes"
          >
            <div className="space-y-2">
              {/* Formatting toolbar */}
              {allowFormatting && (
                <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/30">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleFormat('bold')}
                    title="Bold (**text**)"
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs italic"
                    onClick={() => handleFormat('italic')}
                    title="Italic (_text_)"
                  >
                    I
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleFormat('bullet')}
                    title="Bullet points (• item)"
                  >
                    •
                  </Button>
                </div>
              )}

              {/* Main textarea */}
              <Textarea
                {...field}
                ref={(e) => {
                  field.ref(e);
                  (textareaRef as any).current = e;
                }}
                placeholder={placeholder}
                maxLength={maxLength}
                rows={autoResize ? undefined : rows}
                className={autoResize ? 'resize-none overflow-hidden' : undefined}
                style={autoResize ? { minHeight: `${rows * 1.5}em` } : undefined}
              />

              {/* Formatting help */}
              {showFormattingHelp && allowFormatting && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Formatting shortcuts:</div>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="text-xs">**bold**</Badge>
                    <Badge variant="secondary" className="text-xs">_italic_</Badge>
                    <Badge variant="secondary" className="text-xs">• bullet</Badge>
                  </div>
                </div>
              )}

              {/* Character count display */}
              {showCounter && (
                <div className="flex justify-between items-center text-xs">
                  <div className={`${counterColor}`}>
                    {currentLength}/{maxLength} characters
                  </div>
                  {currentLength > maxLength * 0.8 && (
                    <div className={counterColor}>
                      {currentLength >= maxLength 
                        ? '⚠️ Maximum limit reached'
                        : currentLength > maxLength * 0.9
                        ? '⚠️ Approaching limit'
                        : 'High usage'
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </Field>
        );
      }}
    />
  );
};

export default NotesBlock;