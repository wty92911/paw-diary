import { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import {
  Activity,
  ActivityCategory,
  ACTIVITY_CATEGORIES,
  type ActivityAttachment,
} from '../../lib/types';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Paperclip,
  Heart,
  TrendingUp,
  UtensilsCrossed,
  Dumbbell,
  Receipt,
  Image,
  FileText,
  Play,
} from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activityId: number) => void;
  onAttachmentClick?: (attachment: ActivityAttachment) => void;
  isExpanded?: boolean;
  onExpandToggle?: (activityId: number) => void;
}

// Category icons mapping
const CATEGORY_ICONS = {
  [ActivityCategory.Health]: Heart,
  [ActivityCategory.Growth]: TrendingUp,
  [ActivityCategory.Diet]: UtensilsCrossed,
  [ActivityCategory.Lifestyle]: Dumbbell,
  [ActivityCategory.Expense]: Receipt,
} as const;

// Attachment type icons
const ATTACHMENT_ICONS = {
  photo: Image,
  document: FileText,
  video: Play,
} as const;

// Format date for display
const formatActivityDate = (dateString: string): { date: string; time: string } => {
  const date = new Date(dateString);
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  return {
    date: date.toLocaleDateString('en-US', dateOptions),
    time: date.toLocaleTimeString('en-US', timeOptions),
  };
};

// Format currency display
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    CNY: '¥',
    EUR: '€',
    GBP: '£',
  };
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};

// Get category color classes
const getCategoryColorClasses = (category: ActivityCategory) => {
  const config = ACTIVITY_CATEGORIES[category];
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  };

  return colorMap[config.color] || colorMap.blue;
};

// Extract key information from activity data based on category
const extractActivitySummary = (activity: Activity): string[] => {
  const summary: string[] = [];

  if (!activity.activity_data) return summary;

  const data = activity.activity_data as Record<string, any>;

  switch (activity.category) {
    case ActivityCategory.Health:
      if (data.veterinarian_name) summary.push(`Vet: ${data.veterinarian_name}`);
      if (data.symptoms && Array.isArray(data.symptoms)) {
        summary.push(
          `Symptoms: ${data.symptoms.slice(0, 2).join(', ')}${data.symptoms.length > 2 ? '...' : ''}`,
        );
      }
      if (data.is_critical) summary.push('🚨 Critical');
      break;

    case ActivityCategory.Growth:
      if (data.weight?.value)
        summary.push(`Weight: ${data.weight.value}${data.weight.unit || 'kg'}`);
      if (data.height?.value)
        summary.push(`Height: ${data.height.value}${data.height.unit || 'cm'}`);
      if (data.milestone_type) summary.push(`Milestone: ${data.milestone_type}`);
      break;

    case ActivityCategory.Diet:
      if (data.food_brand) summary.push(`Brand: ${data.food_brand}`);
      if (data.portion_size)
        summary.push(`Portion: ${data.portion_size.amount} ${data.portion_size.unit}`);
      if (data.food_rating) summary.push(`Rating: ${'⭐'.repeat(data.food_rating)}`);
      if (data.allergic_reaction) summary.push('⚠️ Allergic Reaction');
      break;

    case ActivityCategory.Lifestyle:
      if (data.duration_minutes) summary.push(`Duration: ${data.duration_minutes}min`);
      if (data.energy_level) summary.push(`Energy: ${'⚡'.repeat(data.energy_level)}`);
      if (data.activity_type) summary.push(`Type: ${data.activity_type}`);
      break;

    case ActivityCategory.Expense:
      if (data.vendor) summary.push(`Vendor: ${data.vendor}`);
      if (data.expense_category) summary.push(`Category: ${data.expense_category}`);
      if (data.tax_deductible) summary.push('💼 Tax Deductible');
      break;
  }

  return summary;
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onEdit,
  onDelete,
  onAttachmentClick,
  isExpanded = false,
  onExpandToggle,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { date, time } = formatActivityDate(activity.activity_date);
  const categoryConfig = ACTIVITY_CATEGORIES[activity.category];
  const colorClasses = getCategoryColorClasses(activity.category);
  const CategoryIcon = CATEGORY_ICONS[activity.category];
  const activitySummary = extractActivitySummary(activity);

  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete?.(activity.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  }, [showDeleteConfirm, onDelete, activity.id]);

  const handleExpandToggle = useCallback(() => {
    onExpandToggle?.(activity.id);
  }, [onExpandToggle, activity.id]);

  const handleAttachmentClick = useCallback(
    (attachment: ActivityAttachment) => {
      onAttachmentClick?.(attachment);
    },
    [onAttachmentClick],
  );

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${colorClasses.border} ${colorClasses.bg}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          {/* Left side - Category icon and basic info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${colorClasses.bg} border ${colorClasses.border}`}>
              <CategoryIcon className={`h-5 w-5 ${colorClasses.text}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className={`${colorClasses.bg} ${colorClasses.text} border-0`}
                >
                  {categoryConfig.label}
                </Badge>
                {activity.subcategory && (
                  <span className="text-sm text-gray-500">• {activity.subcategory}</span>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 truncate">{activity.title}</h3>

              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{date}</span>
                  <span className="text-gray-400">•</span>
                  <span>{time}</span>
                </div>

                {activity.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{activity.location}</span>
                  </div>
                )}

                {activity.cost && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrency(activity.cost, activity.currency)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 ml-2">
            {activity.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm">{activity.attachments.length}</span>
              </div>
            )}

            {activity.mood_rating && (
              <div className="flex items-center">
                <span className="text-sm">{'😊'.repeat(activity.mood_rating)}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(activity)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className={`h-8 w-8 p-0 ${
                    showDeleteConfirm
                      ? 'text-red-600 hover:text-red-700 bg-red-50'
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {onExpandToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpandToggle}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 mb-2">
              Delete this activity? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                className="h-7 px-3 text-xs"
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-7 px-3 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Activity summary */}
        {activitySummary.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {activitySummary.map((item, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5 bg-white border-gray-300 text-gray-600"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description (always visible if present) */}
        {activity.description && (
          <div className="mb-3">
            <p className="text-sm text-gray-700 line-clamp-2">{activity.description}</p>
          </div>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Full description */}
            {activity.description && (
              <div>
                <p className="text-sm text-gray-700">{activity.description}</p>
              </div>
            )}

            {/* Attachments */}
            {activity.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {activity.attachments.map(attachment => {
                    const AttachmentIcon = ATTACHMENT_ICONS[attachment.file_type] || FileText;
                    return (
                      <button
                        key={attachment.id}
                        onClick={() => handleAttachmentClick(attachment)}
                        className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        {attachment.file_type === 'photo' && attachment.thumbnail_path ? (
                          <img
                            src={attachment.thumbnail_path}
                            alt="Thumbnail"
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <AttachmentIcon className="h-8 w-8 text-gray-500 mb-1" />
                        )}
                        <span className="text-xs text-gray-600 text-center truncate w-full">
                          {attachment.file_path.split('/').pop() || 'Attachment'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity-specific data */}
            {activity.activity_data && Object.keys(activity.activity_data).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(activity.activity_data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attachment thumbnails preview (always visible) */}
        {!isExpanded && activity.attachments.length > 0 && (
          <div className="flex gap-1 overflow-x-auto">
            {activity.attachments.slice(0, 4).map(attachment => (
              <button
                key={attachment.id}
                onClick={() => handleAttachmentClick(attachment)}
                className="flex-shrink-0 w-12 h-12 bg-gray-100 border border-gray-200 rounded overflow-hidden hover:border-gray-300 transition-colors"
              >
                {attachment.file_type === 'photo' && attachment.thumbnail_path ? (
                  <img
                    src={attachment.thumbnail_path}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </button>
            ))}
            {activity.attachments.length > 4 && (
              <div className="flex-shrink-0 w-12 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">+{activity.attachments.length - 4}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
