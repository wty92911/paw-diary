import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EditableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: string[];
  onAddOption: (value: string) => void;
  onRemoveOption: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
  value,
  onValueChange,
  options,
  onAddOption,
  onRemoveOption,
  placeholder = 'Select or type...',
  label,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || '');
  const [showDeleteMode, setShowDeleteMode] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sync input value with prop value
  React.useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowDeleteMode(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
    setShowDeleteMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);

    // Auto-add to options if it's a new value and not empty (on blur or enter)
  };

  const handleInputBlur = () => {
    if (inputValue.trim() && !options.includes(inputValue.trim())) {
      onAddOption(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() && !options.includes(inputValue.trim())) {
        onAddOption(inputValue.trim());
      }
      setOpen(false);
    }
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveOption(option);
    if (value === option) {
      onValueChange('');
      setInputValue('');
    }
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn('flex flex-col gap-1.5 relative', className)} ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium leading-none">{label}</label>
      )}

      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-8"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
          onClick={() => setOpen(!open)}
          tabIndex={-1}
        >
          <ChevronDown className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            open && "transform rotate-180"
          )} />
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredOptions.length > 0 ? (
              <div className="p-1">
                <div className="flex items-center justify-between px-2 py-1.5 border-b">
                  <span className="text-xs font-medium text-muted-foreground">
                    Saved Options ({filteredOptions.length})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => setShowDeleteMode(!showDeleteMode)}
                  >
                    {showDeleteMode ? 'Done' : 'Edit'}
                  </Button>
                </div>

                <div className="py-1">
                  {filteredOptions.map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer hover:bg-muted rounded-sm",
                        value === option && "bg-muted font-medium"
                      )}
                      onClick={() => !showDeleteMode && handleSelect(option)}
                    >
                      <span>{option}</span>

                      {showDeleteMode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleRemove(option, e)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {inputValue.trim() ? 'Type and press Enter to add' : 'No options yet'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
