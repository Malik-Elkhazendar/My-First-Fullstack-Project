/**
 * Date utility functions for common date operations
 * 
 * Provides consistent date formatting, validation, and manipulation
 * throughout the application.
 */
export class DateUtils {
  
  /**
   * Format date to display string
   * @param date - Date to format
   * @param format - Format string (default: 'MM/dd/yyyy')
   * @returns Formatted date string
   */
  static formatDate(date: Date | string, format: string = 'MM/dd/yyyy'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!DateUtils.isValidDate(dateObj)) {
      return 'Invalid Date';
    }
    
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (format) {
      case 'MM/dd/yyyy':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        break;
      case 'MMM dd, yyyy':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        break;
      case 'MMMM dd, yyyy':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      default:
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
    }
    
    return dateObj.toLocaleDateString('en-US', options);
  }
  
  /**
   * Format date and time to display string
   * @param date - Date to format
   * @param includeSeconds - Whether to include seconds
   * @returns Formatted date-time string
   */
  static formatDateTime(date: Date | string, includeSeconds: boolean = false): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!DateUtils.isValidDate(dateObj)) {
      return 'Invalid Date';
    }
    
    const dateStr = DateUtils.formatDate(dateObj);
    const timeStr = includeSeconds 
      ? dateObj.toLocaleTimeString('en-US')
      : dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    return `${dateStr} ${timeStr}`;
  }
  
  /**
   * Get relative time string (e.g., "2 hours ago")
   * @param date - Date to compare
   * @returns Relative time string
   */
  static getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return DateUtils.formatDate(dateObj);
  }
  
  /**
   * Check if date is valid
   * @param date - Date to validate
   * @returns True if date is valid
   */
  static isValidDate(date: any): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }
  
  /**
   * Check if date is today
   * @param date - Date to check
   * @returns True if date is today
   */
  static isToday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  }
  
  /**
   * Check if date is in the past
   * @param date - Date to check
   * @returns True if date is in the past
   */
  static isPast(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getTime() < new Date().getTime();
  }
  
  /**
   * Add days to date
   * @param date - Base date
   * @param days - Number of days to add
   * @returns New date with days added
   */
  static addDays(date: Date | string, days: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setDate(dateObj.getDate() + days);
    return dateObj;
  }
  
  /**
   * Get start of day
   * @param date - Date to get start of day for
   * @returns Date at start of day (00:00:00)
   */
  static startOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  }
  
  /**
   * Get end of day
   * @param date - Date to get end of day for
   * @returns Date at end of day (23:59:59)
   */
  static endOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setHours(23, 59, 59, 999);
    return dateObj;
  }
} 