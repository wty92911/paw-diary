/**
 * Date and time utility functions for consistent formatting across the app
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "yesterday", "3 days ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return diffSeconds <= 5 ? 'just now' : `${diffSeconds}s ago`;
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays === 1) {
    return 'yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  }

  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }

  return `${diffYears}y ago`;
}

/**
 * Format a date as a readable string (e.g., "Mar 15, 2024", "Today", "Yesterday")
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffMs = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays === -1) {
    return 'Tomorrow';
  }

  // For dates within the current year, show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // For dates in other years, show month, day, and year
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Format a date and time together (e.g., "Mar 15, 2024 at 2:30 PM")
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Format time as readable string (e.g., "2:30 PM", "14:30")
 */
export function formatTime(date: Date, use24Hour = false): string {
  if (use24Hour) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get start of day for a given date
 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Get end of day for a given date
 */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get a range of dates for grouping activities
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Group activities by date for timeline display
 */
export function groupByDate<T extends { activity_date: string }>(
  items: T[]
): Array<{ date: string; items: T[] }> {
  const groups = new Map<string, T[]>();
  
  items.forEach((item) => {
    const date = formatDate(new Date(item.activity_date));
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(item);
  });
  
  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    items: items.sort((a, b) => 
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    ),
  }));
}

/**
 * Parse ISO date string to Date object with error handling
 */
export function parseISODate(isoString: string): Date {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${isoString}`);
  }
  return date;
}

/**
 * Format date for API requests (ISO format)
 */
export function formatForAPI(date: Date): string {
  return date.toISOString();
}