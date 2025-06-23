/**
 * String utility functions for common string operations
 * 
 * Provides consistent string formatting, validation, and manipulation
 * throughout the application.
 */
export class StringUtils {
  
  /**
   * Capitalize first letter of string
   * @param str - String to capitalize
   * @returns String with first letter capitalized
   */
  static capitalize(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  /**
   * Convert string to title case
   * @param str - String to convert
   * @returns String in title case
   */
  static toTitleCase(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().split(' ')
      .map(word => StringUtils.capitalize(word))
      .join(' ');
  }
  
  /**
   * Convert string to kebab case (hyphen-separated)
   * @param str - String to convert
   * @returns String in kebab case
   */
  static toKebabCase(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
  
  /**
   * Convert string to camel case
   * @param str - String to convert
   * @returns String in camel case
   */
  static toCamelCase(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }
  
  /**
   * Truncate string to specified length
   * @param str - String to truncate
   * @param length - Maximum length
   * @param suffix - Suffix to append (default: '...')
   * @returns Truncated string
   */
  static truncate(str: string, length: number, suffix: string = '...'): string {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }
  
  /**
   * Remove HTML tags from string
   * @param str - String with HTML tags
   * @returns String without HTML tags
   */
  static stripHtml(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '');
  }
  
  /**
   * Escape HTML special characters
   * @param str - String to escape
   * @returns Escaped string
   */
  static escapeHtml(str: string): string {
    if (!str || typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  /**
   * Check if string is empty or whitespace only
   * @param str - String to check
   * @returns True if string is empty or whitespace only
   */
  static isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }
  
  /**
   * Generate random string
   * @param length - Length of string to generate
   * @param chars - Characters to use (default: alphanumeric)
   * @returns Random string
   */
  static random(length: number = 8, chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Format file size string
   * @param bytes - Size in bytes
   * @param decimals - Number of decimal places
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  /**
   * Extract initials from name
   * @param name - Full name
   * @param maxInitials - Maximum number of initials
   * @returns Initials string
   */
  static getInitials(name: string, maxInitials: number = 2): string {
    if (!name || typeof name !== 'string') return '';
    
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .slice(0, maxInitials)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }
  
  /**
   * Mask sensitive information (e.g., email, phone)
   * @param str - String to mask
   * @param visibleStart - Number of visible characters at start
   * @param visibleEnd - Number of visible characters at end
   * @param maskChar - Character to use for masking
   * @returns Masked string
   */
  static mask(str: string, visibleStart: number = 2, visibleEnd: number = 2, maskChar: string = '*'): string {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= visibleStart + visibleEnd) return str;
    
    const start = str.substring(0, visibleStart);
    const end = str.substring(str.length - visibleEnd);
    const maskLength = str.length - visibleStart - visibleEnd;
    
    return start + maskChar.repeat(maskLength) + end;
  }
} 