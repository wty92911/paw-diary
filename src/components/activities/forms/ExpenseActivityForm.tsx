import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { type ExpenseActivityData } from '../../../lib/types';
import { Upload, X, Receipt, DollarSign, Repeat, CreditCard } from 'lucide-react';

// Expense activity schema
export const expenseActivitySchema = z.object({
  receipt_photo: z.string().optional(),
  expense_category: z.string().max(100).optional(),
  vendor: z.string().max(200).optional(),
  tax_deductible: z.boolean().optional(),
  recurring_schedule: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      interval: z.number().min(1).max(99).optional(),
      end_date: z.string().optional(),
    })
    .optional(),
  budget_category: z.string().max(100).optional(),
  payment_method: z.string().max(100).optional(),
});

export type ExpenseActivityFormData = z.infer<typeof expenseActivitySchema>;

interface ExpenseActivityFormProps {
  initialData?: ExpenseActivityData;
  onSave?: (data: ExpenseActivityFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// Expense category options
const EXPENSE_CATEGORIES = [
  'Food & Treats',
  'Medical & Healthcare',
  'Grooming & Hygiene',
  'Toys & Entertainment',
  'Training & Education',
  'Boarding & Pet Care',
  'Insurance',
  'Accessories & Equipment',
  'Transportation',
  'Emergency Fund',
  'Other',
];

// Budget category options
const BUDGET_CATEGORIES = [
  'Monthly Essentials',
  'Healthcare Reserve',
  'Emergency Fund',
  'Treats & Entertainment',
  'Annual Expenses',
  'One-time Purchases',
];

// Payment method options
const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Mobile Payment',
  'Pet Insurance',
  'Other',
];

// Frequency options with display labels
const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Every week' },
  { value: 'monthly', label: 'Monthly', description: 'Every month' },
  { value: 'yearly', label: 'Yearly', description: 'Every year' },
] as const;

export const ExpenseActivityForm: React.FC<ExpenseActivityFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isSubmitting = false,
}) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(
    initialData?.receipt_photo || null,
  );
  const [showRecurring, setShowRecurring] = useState<boolean>(!!initialData?.recurring_schedule);
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);

  const form = useForm<ExpenseActivityFormData>({
    resolver: zodResolver(expenseActivitySchema),
    defaultValues: {
      receipt_photo: initialData?.receipt_photo,
      expense_category: initialData?.expense_category,
      vendor: initialData?.vendor,
      tax_deductible: initialData?.tax_deductible || false,
      recurring_schedule: initialData?.recurring_schedule,
      budget_category: initialData?.budget_category,
      payment_method: initialData?.payment_method,
    },
  });

  const { register, handleSubmit, watch, setValue } = form;

  // Handle receipt photo upload
  const handleReceiptUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image (JPEG, PNG) or PDF file.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setReceiptFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setReceiptPreview(result);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF files, show a placeholder
      setReceiptPreview('pdf-placeholder');
    }

    // Simulate OCR processing (placeholder for future implementation)
    simulateOcrProcessing(file);
  }, []);

  // Simulate OCR processing for receipt data extraction
  const simulateOcrProcessing = useCallback(
    async (_file: File) => {
      setIsOcrProcessing(true);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock OCR results (in real implementation, this would call an OCR service)
      const mockOcrResults = {
        vendor: 'Pet Store Plus',
        amount: '24.99',
        category: 'Food & Treats',
      };

      // Auto-fill form fields with OCR results
      if (!watch('vendor')) {
        setValue('vendor', mockOcrResults.vendor);
      }
      if (!watch('expense_category')) {
        setValue('expense_category', mockOcrResults.category);
      }

      setIsOcrProcessing(false);
    },
    [watch, setValue],
  );

  // Remove receipt photo
  const removeReceiptPhoto = useCallback(() => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setValue('receipt_photo', undefined);
  }, [setValue]);

  // Handle recurring schedule toggle
  const handleRecurringToggle = useCallback(
    (checked: boolean) => {
      setShowRecurring(checked);
      if (!checked) {
        setValue('recurring_schedule', undefined);
      }
    },
    [setValue],
  );

  const onSubmit = (data: ExpenseActivityFormData) => {
    // Include receipt file information if uploaded
    if (receiptFile) {
      // In real implementation, this would upload the file and get a path
      data.receipt_photo = `receipt_${Date.now()}_${receiptFile.name}`;
    }
    onSave?.(data);
  };

  return (
    <div className="space-y-6">
      {/* Receipt Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt-upload">Upload Receipt</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {receiptPreview ? (
                <div className="space-y-3">
                  {receiptPreview === 'pdf-placeholder' ? (
                    <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">PDF Receipt Uploaded</p>
                        <p className="text-xs text-gray-500">{receiptFile?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="max-h-40 mx-auto rounded-lg object-contain"
                      />
                      {isOcrProcessing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">Processing receipt...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeReceiptPhoto}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop your receipt here or click to upload
                  </p>
                  <p className="text-xs text-gray-500 mb-4">Supports JPEG, PNG, PDF (max 10MB)</p>
                  <input
                    id="receipt-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
            {isOcrProcessing && (
              <p className="text-sm text-blue-600">
                📋 Extracting information from receipt... This may auto-fill some fields.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expense Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor/Store</Label>
              <Input
                id="vendor"
                {...register('vendor')}
                placeholder="Pet Store, Vet Clinic, etc."
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_category">Expense Category</Label>
              <Select onValueChange={value => setValue('expense_category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select onValueChange={value => setValue('payment_method', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method} value={method}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {method}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_category">Budget Category</Label>
              <Select onValueChange={value => setValue('budget_category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget category" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tax Deductible */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax-deductible"
              {...register('tax_deductible')}
              onCheckedChange={checked => setValue('tax_deductible', checked === true)}
            />
            <Label htmlFor="tax-deductible" className="text-sm">
              This expense is tax-deductible (service animal, medical, etc.)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Recurring Expense Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Expense
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-recurring"
              checked={showRecurring}
              onCheckedChange={checked => handleRecurringToggle(checked === true)}
            />
            <Label htmlFor="show-recurring">Set up as recurring expense</Label>
          </div>

          {showRecurring && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    onValueChange={value =>
                      setValue(
                        'recurring_schedule.frequency',
                        value as 'daily' | 'weekly' | 'monthly' | 'yearly',
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>
                          <div className="flex flex-col">
                            <span>{freq.label}</span>
                            <span className="text-xs text-gray-500">{freq.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Interval</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    max="99"
                    {...register('recurring_schedule.interval', { valueAsNumber: true })}
                    placeholder="e.g. Every 2 weeks = 2"
                  />
                  <p className="text-xs text-gray-500">
                    Optional: Leave empty for every occurrence (e.g., every week)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input id="end_date" type="date" {...register('recurring_schedule.end_date')} />
                <p className="text-xs text-gray-500">Leave empty for ongoing recurring expense</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6">
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || isOcrProcessing}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : 'Save Expense Activity'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
