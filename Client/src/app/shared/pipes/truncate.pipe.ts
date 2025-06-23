import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncation options interface
 */
export interface TruncateOptions {
  /** Maximum length of the text (default: 100) */
  length?: number;
  /** Suffix to append when truncated (default: '...') */
  suffix?: string;
  /** Whether to break at word boundaries (default: true) */
  wordBoundary?: boolean;
  /** Whether to preserve HTML tags (default: false) */
  preserveHtml?: boolean;
  /** Custom break characters (default: [' ', '-', '_']) */
  breakChars?: string[];
}

/**
 * Text truncation pipe with advanced options
 * 
 * Truncates text to a specified length with options for word boundaries,
 * custom suffixes, and HTML preservation.
 * 
 * @example
 * ```html
 * <!-- Basic usage -->
 * {{ 'This is a very long text that needs to be truncated' | truncate:20 }}
 * <!-- Output: "This is a very lo..." -->
 * 
 * <!-- With word boundary -->
 * {{ 'This is a very long text that needs to be truncated' | truncate:20:true }}
 * <!-- Output: "This is a very..." -->
 * 
 * <!-- With custom suffix -->
 * {{ 'This is a very long text' | truncate:15:'…' }}
 * <!-- Output: "This is a very…" -->
 * 
 * <!-- With options object -->
 * {{ longText | truncate:{ length: 50, suffix: ' [Read more]', wordBoundary: true } }}
 * ```
 * 
 * @since 1.0.0
 * @author Fashion Forward Team
 */
@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {

  /**
   * Transform text by truncating it to specified length
   * 
   * @param value - The text to truncate
   * @param lengthOrOptions - Maximum length or options object
   * @param wordBoundary - Whether to break at word boundaries (deprecated, use options)
   * @param suffix - Custom suffix (deprecated, use options)
   * @returns Truncated text or original if shorter than limit
   * 
   * @example
   * ```typescript
   * // In component
   * const truncated = this.truncatePipe.transform('Long text here', 10);
   * console.log(truncated); // "Long text..."
   * ```
   */
  transform(
    value: string | null | undefined,
    lengthOrOptions: number | TruncateOptions = 100,
    wordBoundary: boolean = true,
    suffix: string = '...'
  ): string {
    // Handle null/undefined values
    if (!value || typeof value !== 'string') {
      return '';
    }

    // Determine options based on parameter type
    const options: Required<TruncateOptions> = typeof lengthOrOptions === 'number'
      ? {
          length: lengthOrOptions,
          suffix,
          wordBoundary,
          preserveHtml: false,
          breakChars: [' ', '-', '_', '\t', '\n']
        }
      : {
          length: 100,
          suffix: '...',
          wordBoundary: true,
          preserveHtml: false,
          breakChars: [' ', '-', '_', '\t', '\n'],
          ...lengthOrOptions
        };

    // If text is shorter than limit, return as-is
    if (value.length <= options.length) {
      return value;
    }

    try {
      if (options.preserveHtml) {
        return this.truncateHtml(value, options);
      } else {
        return this.truncatePlainText(value, options);
      }
    } catch (error) {
      console.warn('TruncatePipe: Error during truncation', { value, options, error });
      // Fallback to simple truncation
      return value.substring(0, options.length) + options.suffix;
    }
  }

  /**
   * Truncate plain text
   * 
   * @private
   * @param text - Text to truncate
   * @param options - Truncation options
   * @returns Truncated text
   */
  private truncatePlainText(text: string, options: Required<TruncateOptions>): string {
    if (!options.wordBoundary) {
      return text.substring(0, options.length) + options.suffix;
    }

    // Find the last break character within the limit
    let truncateIndex = options.length;
    
    for (let i = options.length - 1; i >= 0; i--) {
      if (options.breakChars.includes(text[i])) {
        truncateIndex = i;
        break;
      }
    }

    // If no break character found, use the original limit
    if (truncateIndex === options.length && options.length > 0) {
      // Look for any whitespace or punctuation
      for (let i = options.length - 1; i >= Math.max(0, options.length - 20); i--) {
        if (/\s|[.,;:!?]/.test(text[i])) {
          truncateIndex = i;
          break;
        }
      }
    }

    const truncated = text.substring(0, truncateIndex).trim();
    return truncated + options.suffix;
  }

  /**
   * Truncate HTML text while preserving tags
   * 
   * @private
   * @param html - HTML string to truncate
   * @param options - Truncation options
   * @returns Truncated HTML
   */
  private truncateHtml(html: string, options: Required<TruncateOptions>): string {
    // Simple HTML truncation - strips tags for length calculation
    const textContent = html.replace(/<[^>]*>/g, '');
    
    if (textContent.length <= options.length) {
      return html;
    }

    // This is a simplified version - for production, consider using a proper HTML parser
    const truncatedText = this.truncatePlainText(textContent, options);
    
    // Try to preserve basic HTML structure (very basic implementation)
    const openTags: string[] = [];
    let result = '';
    let textLength = 0;
    let i = 0;

    while (i < html.length && textLength < options.length) {
      if (html[i] === '<') {
        // Find the end of the tag
        const tagEnd = html.indexOf('>', i);
        if (tagEnd !== -1) {
          const tag = html.substring(i, tagEnd + 1);
          result += tag;
          
          // Track opening/closing tags (simplified)
          const tagName = tag.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/)?.[1];
          if (tagName && !tag.startsWith('</') && !tag.endsWith('/>')) {
            openTags.push(tagName);
          } else if (tagName && tag.startsWith('</')) {
            const lastIndex = openTags.lastIndexOf(tagName);
            if (lastIndex !== -1) {
              openTags.splice(lastIndex, 1);
            }
          }
          
          i = tagEnd + 1;
        } else {
          result += html[i];
          textLength++;
          i++;
        }
      } else {
        result += html[i];
        textLength++;
        i++;
      }
    }

    // Close any remaining open tags
    while (openTags.length > 0) {
      const tagName = openTags.pop();
      result += `</${tagName}>`;
    }

    return result + options.suffix;
  }

  /**
   * Get word count of text
   * 
   * @param text - Text to count words in
   * @returns Number of words
   * 
   * @example
   * ```typescript
   * const wordCount = TruncatePipe.getWordCount('Hello world test');
   * console.log(wordCount); // 3
   * ```
   */
  static getWordCount(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Truncate by word count instead of character count
   * 
   * @param text - Text to truncate
   * @param wordLimit - Maximum number of words
   * @param suffix - Suffix to append
   * @returns Truncated text
   * 
   * @example
   * ```typescript
   * const truncated = TruncatePipe.truncateByWords('Hello world test example', 2);
   * console.log(truncated); // "Hello world..."
   * ```
   */
  static truncateByWords(text: string, wordLimit: number, suffix: string = '...'): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const words = text.trim().split(/\s+/);
    
    if (words.length <= wordLimit) {
      return text;
    }

    return words.slice(0, wordLimit).join(' ') + suffix;
  }

  /**
   * Get reading time estimate for text
   * 
   * @param text - Text to analyze
   * @param wordsPerMinute - Average reading speed (default: 200)
   * @returns Reading time in minutes
   * 
   * @example
   * ```typescript
   * const readingTime = TruncatePipe.getReadingTime('Long article text here...');
   * console.log(`${readingTime} min read`);
   * ```
   */
  static getReadingTime(text: string, wordsPerMinute: number = 200): number {
    const wordCount = this.getWordCount(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }
} 