import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Clock,
  MapPin,
  DollarSign,
  Star,
  AlertTriangle,
  Trash2
} from 'lucide-react';
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
  className,
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [swipeX, setSwipeX] = React.useState(0);
  const [showDeleteAction, setShowDeleteAction] = React.useState(false);
  const [deleteConfirmMode, setDeleteConfirmMode] = React.useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const longPressTimer = useRef<number | undefined>(undefined);

  // Extract activity facts for summary display
  const activityFacts = React.useMemo(() => formatActivityFacts(activity), [activity]);

  // Handle swipe to delete gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isDragging.current = false;
      isHorizontalSwipe.current = null;
      setIsSwiping(false);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      currentX.current = e.touches[0].clientX;
      currentY.current = e.touches[0].clientY;
      const deltaX = currentX.current - startX.current;
      const deltaY = currentY.current - startY.current;
      
      // Determine swipe direction on first movement
      if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
      
      // Only handle horizontal swipes for delete functionality
      if (isHorizontalSwipe.current && Math.abs(deltaX) > 10) {
        isDragging.current = true;
        setIsSwiping(true);
        
        if (deltaX < 0) {
          // Left swipe for delete
          const swipeDistance = Math.min(Math.abs(deltaX), 100);
          setSwipeX(-swipeDistance);
          setShowDeleteAction(swipeDistance > 40);
        } else if (deleteConfirmMode || swipeX < 0) {
          // Right swipe to restore or continue restoring
          const swipeDistance = Math.max(deltaX + swipeX, -100);
          setSwipeX(Math.min(swipeDistance, 0));
          setShowDeleteAction(swipeDistance < -40);
          
          // Exit delete confirm mode if swiped back enough
          if (deleteConfirmMode && swipeDistance > -20) {
            setDeleteConfirmMode(false);
          }
        }
      }
    }
  }, [deleteConfirmMode, swipeX]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging.current && isHorizontalSwipe.current) {
      if (showDeleteAction && Math.abs(swipeX) > 40 && !deleteConfirmMode) {
        // Enter delete confirmation mode
        setDeleteConfirmMode(true);
        setSwipeX(-100);
      } else if (swipeX > -20) {
        // Reset to original position if not swiped far enough
        setSwipeX(0);
        setShowDeleteAction(false);
        setDeleteConfirmMode(false);
      }
      // If still in delete mode but swiped back partially, keep current position
    }
    
    setIsSwiping(false);
    isDragging.current = false;
    isHorizontalSwipe.current = null;
  }, [showDeleteAction, swipeX, deleteConfirmMode]);

  // Handle mouse events for long press detection
  const handleMouseDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setIsPressed(true);
    }, 500); // 500ms long press
  }, []);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsPressed(false);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete?.(activity.id);
  }, [onDelete, activity.id]);

  // Handle delete cancel (tap anywhere else)
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmMode(false);
    setSwipeX(0);
    setShowDeleteAction(false);
  }, []);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Handle card click to edit or restore position
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger if it's the delete action
    if ((e.target as Element).closest('.delete-action')) {
      return;
    }
    
    // If in delete confirm mode or swiped, restore to original position
    if (deleteConfirmMode || swipeX < 0) {
      handleDeleteCancel();
      return;
    }
    
    // Don't trigger edit if currently swiping
    if (isSwiping || isDragging.current) {
      return;
    }
    
    onEdit?.(activity.id);
  }, [isSwiping, onEdit, activity.id, deleteConfirmMode, swipeX, handleDeleteCancel]);

  return (
    <div 
      ref={cardRef}
      className={`${className} relative`}
    >
      {/* Delete action background - fixed position behind card */}
      <motion.div 
        className="absolute inset-0 bg-red-500 flex items-center justify-end rounded-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showDeleteAction || deleteConfirmMode ? 1 : 0,
          scale: showDeleteAction || deleteConfirmMode ? 1 : 0.8
        }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { duration: 0.3, type: "spring", stiffness: 400, damping: 25 }
        }}
      >
        <motion.div 
          className="flex items-center gap-2 cursor-pointer delete-action px-6 h-full"
          onClick={handleDeleteConfirm}
          initial={{ x: 20, opacity: 0 }}
          animate={{ 
            x: showDeleteAction || deleteConfirmMode ? 0 : 20,
            opacity: showDeleteAction || deleteConfirmMode ? 1 : 0 
          }}
          transition={{ 
            delay: showDeleteAction || deleteConfirmMode ? 0.1 : 0,
            duration: 0.2 
          }}
        >
          <Trash2 className="w-5 h-5 text-white" />
          <span className="text-white text-sm font-medium">Delete</span>
        </motion.div>
      </motion.div>
      
      {/* Card container that slides over the delete background */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          x: swipeX
        }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          layout: { type: "spring", bounce: 0.15 },
          opacity: { duration: 0.2 },
          y: { duration: 0.3 },
          x: isSwiping 
            ? { type: "tween", duration: 0 } // No transition during swiping for immediate response
            : { 
                type: "spring",
                stiffness: deleteConfirmMode ? 200 : 350,
                damping: deleteConfirmMode ? 25 : 30,
                mass: 0.9
              }
        }}
        whileHover={{ 
          y: -2,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        className="relative z-10"
      >
        <Card 
          className={`
            ${getCategoryCardClasses(activity.category, {
              isPinned: activity.isPinned,
              hasHealthFlag: activity.hasHealthFlag,
              isPressed
            })}
            transition-all duration-200 cursor-pointer
          `}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
    </div>
  );
};

export default ActivityCard;