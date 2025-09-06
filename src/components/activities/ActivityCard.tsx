import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Copy, 
  Share,
  Clock,
  MapPin,
  DollarSign,
  Star,
  AlertTriangle,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ActivityTimelineItem } from '../../lib/types/activities';
import { formatRelativeTime, formatDate } from '../../lib/utils/dateUtils';
import { 
  getCategoryColor, 
  getCategoryIcon, 
  getCategoryCardClasses 
} from '../../lib/ui/categoryTheme';

// Using centralized category theme utilities instead of hardcoded colors

interface ActivityCardProps {
  activity: ActivityTimelineItem;
  onEdit?: (activityId: number) => void;
  onDelete?: (activityId: number) => void;
  onDuplicate?: (activityId: number) => void;
  onShare?: (activityId: number) => void;
  onViewDetails?: (activityId: number) => void;
  className?: string;
}

// Extract formatted facts from ActivityTimelineItem keyFacts for display
const formatActivityFacts = (activity: ActivityTimelineItem): Array<{
  icon: React.ReactNode;
  text: string;
  key: string;
}> => {
  const facts: Array<{ icon: React.ReactNode; text: string; key: string }> = [];

  // Time fact (always shown)
  facts.push({
    key: 'time',
    icon: <Clock className="w-3 h-3" />,
    text: formatRelativeTime(activity.activityDate),
  });

  // Add formatted key facts from the activity
  activity.keyFacts.forEach((fact, index) => {
    // Try to detect fact type and add appropriate icon
    let icon = <Star className="w-3 h-3" />; // Default icon
    
    if (fact.toLowerCase().includes('cost') || fact.includes('$') || fact.includes('€') || fact.includes('£')) {
      icon = <DollarSign className="w-3 h-3" />;
    } else if (fact.toLowerCase().includes('location') || fact.toLowerCase().includes('at ')) {
      icon = <MapPin className="w-3 h-3" />;
    }
    
    facts.push({
      key: `fact_${index}`,
      icon,
      text: fact,
    });
  });

  // Limit to 3 most important facts for card display
  return facts.slice(0, 3);
};

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onViewDetails,
  className,
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const longPressTimer = React.useRef<number | undefined>(undefined);

  // Extract activity facts for summary display
  const activityFacts = React.useMemo(() => formatActivityFacts(activity), [activity]);

  // Handle long press for mobile context menu
  const handleMouseDown = React.useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setIsPressed(true);
      // Could show context menu or selection state
    }, 500); // 500ms long press
  }, []);

  const handleMouseUp = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsPressed(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Handle card click for view details
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on action buttons
    if ((e.target as Element).closest('button, [role="menuitem"]')) {
      return;
    }
    onViewDetails?.(activity.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        layout: { type: "spring", bounce: 0.15 },
        opacity: { duration: 0.2 },
        y: { duration: 0.3 }
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Card 
        className={`
          ${getCategoryCardClasses(activity.category, {
            isPinned: activity.isPinned,
            hasHealthFlag: activity.hasHealthFlag,
            isPressed
          })}
          transition-all duration-200
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCardClick}
      >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header with category icon and badges */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" title={activity.category}>
                {getCategoryIcon(activity.category)}
              </span>
              <Badge 
                variant="secondary" 
                className={`text-white ${getCategoryColor(activity.category, 'primary')}`}
              >
                {activity.category}
              </Badge>
              {activity.subcategory && (
                <Badge variant="outline" className="text-xs">
                  {activity.subcategory}
                </Badge>
              )}
              {/* Pet name could be resolved from petId if needed */}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-base mb-1 line-clamp-1">
              {activity.title}
            </h3>

            {/* Description */}
            {activity.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {activity.description}
              </p>
            )}

            {/* Activity facts */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {activityFacts.map((fact) => (
                <div key={fact.key} className="flex items-center gap-1">
                  {fact.icon}
                  <span>{fact.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status indicators and thumbnails */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {/* Status indicators */}
            <div className="flex items-center gap-1">
              {activity.hasHealthFlag && (
                <div className="flex items-center justify-center p-1 bg-red-100 rounded-full">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                </div>
              )}
              {activity.isPinned && (
                <div className="text-amber-500" title="Pinned">
                  📌
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {activity.thumbnails.length > 0 && (
              <div className="flex -space-x-2">
                {activity.thumbnails.slice(0, 3).map((thumbnail, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded border-2 border-background overflow-hidden bg-muted"
                    style={{ zIndex: 10 - index }}
                  >
                    <img
                      src={thumbnail}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
                {activity.thumbnails.length > 3 && (
                  <div className="w-12 h-12 rounded border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                    +{activity.thumbnails.length - 3}
                  </div>
                )}
              </div>
            )}
            
            {/* Attachment count indicator */}
            {activity.attachmentCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {activity.attachmentCount === 1 
                  ? '1 attachment' 
                  : `${activity.attachmentCount} attachments`}
              </span>
            )}
          </div>

          {/* Actions menu */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onViewDetails?.(activity.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(activity.id)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(activity.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare?.(activity.id)}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(activity.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Date footer */}
        <div className="mt-3 pt-2 border-t border-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(activity.activityDate)}</span>
            {/* Updated timestamp would come from additional metadata if available */}
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default ActivityCard;