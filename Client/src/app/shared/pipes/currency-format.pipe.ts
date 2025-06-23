import { Pipe, PipeTransform } from '@angular/core';

/**
 * Currency formatting options interface
 */
export interface CurrencyFormatOptions {
  /** Currency code (default: 'USD') */
  currency?: string;
  /** Locale code (default: 'en-US') */
  locale?: string;
  /** Display currency symbol or code (default: 'symbol') */
  display?: 'symbol' | 'code' | 'name';
  /** Minimum fraction digits (default: 2) */
  minimumFractionDigits?: number;
  /** Maximum fraction digits (default: 2) */
  maximumFractionDigits?: number;
}

/**
 * Currency formatting pipe with advanced options
 * 
 * Formats numbers as currency with support for different locales,
 * currencies, and formatting options.
 * 
 * @example
 * ```html
 * <!-- Basic usage -->
 * {{ 1234.56 | currencyFormat }}
 * <!-- Output: $1,234.56 -->
 * 
 * <!-- With currency code -->
 * {{ 1234.56 | currencyFormat:'EUR' }}
 * <!-- Output: €1,234.56 -->
 * 
 * <!-- With options -->
 * {{ 1234.56 | currencyFormat:'EUR':'de-DE' }}
 * <!-- Output: 1.234,56 € -->
 * 
 * <!-- With full options object -->
 * {{ 1234.56 | currencyFormat:{ currency: 'JPY', locale: 'ja-JP', minimumFractionDigits: 0 } }}
 * <!-- Output: ¥1,235 -->
 * ```
 * 
 * @since 1.0.0
 * @author Fashion Forward Team
 */
@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  
  /**
   * Transform a number into a formatted currency string
   * 
   * @param value - The numeric value to format
   * @param currencyOrOptions - Currency code string or options object
   * @param locale - Locale code (only used if first param is string)
   * @param display - Display format (only used if first param is string)
   * @returns Formatted currency string or original value if invalid
   * 
   * @example
   * ```typescript
   * // In component
   * const formatted = this.currencyPipe.transform(1234.56, 'EUR', 'de-DE');
   * console.log(formatted); // "1.234,56 €"
   * ```
   */
  transform(
    value: number | string | null | undefined,
    currencyOrOptions: string | CurrencyFormatOptions = 'USD',
    locale: string = 'en-US',
    display: 'symbol' | 'code' | 'name' = 'symbol'
  ): string {
    // Handle null/undefined values
    if (value == null || value === '') {
      return '';
    }

    // Convert string to number if needed
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Validate numeric value
    if (isNaN(numericValue)) {
      console.warn(`CurrencyFormatPipe: Invalid numeric value: ${value}`);
      return String(value);
    }

    try {
      // Determine options based on parameter type
      const options: CurrencyFormatOptions = typeof currencyOrOptions === 'string' 
        ? { 
            currency: currencyOrOptions, 
            locale, 
            display 
          }
        : {
            currency: 'USD',
            locale: 'en-US',
            display: 'symbol',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            ...currencyOrOptions
          };

      // Format using Intl.NumberFormat
      const formatter = new Intl.NumberFormat(options.locale, {
        style: 'currency',
        currency: options.currency,
        currencyDisplay: options.display,
        minimumFractionDigits: options.minimumFractionDigits,
        maximumFractionDigits: options.maximumFractionDigits
      });

      return formatter.format(numericValue);
      
    } catch (error) {
      console.error('CurrencyFormatPipe: Formatting error', {
        value,
        options: currencyOrOptions,
        error
      });
      
      // Fallback to basic USD formatting
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numericValue);
    }
  }

  /**
   * Get supported currency codes
   * 
   * @returns Array of common currency codes
   * 
   * @example
   * ```typescript
   * const currencies = CurrencyFormatPipe.getSupportedCurrencies();
   * console.log(currencies); // ['USD', 'EUR', 'GBP', ...]
   * ```
   */
  static getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
      'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB',
      'INR', 'BRL', 'ZAR', 'KRW', 'PLN', 'CZK', 'HUF', 'ILS'
    ];
  }

  /**
   * Check if a currency code is supported
   * 
   * @param currency - Currency code to check
   * @returns True if currency is supported
   * 
   * @example
   * ```typescript
   * const isSupported = CurrencyFormatPipe.isCurrencySupported('EUR');
   * console.log(isSupported); // true
   * ```
   */
  static isCurrencySupported(currency: string): boolean {
    return this.getSupportedCurrencies().includes(currency.toUpperCase());
  }

  /**
   * Parse a formatted currency string back to number
   * 
   * @param formattedValue - Formatted currency string
   * @param locale - Locale used for formatting
   * @returns Numeric value or null if parsing fails
   * 
   * @example
   * ```typescript
   * const value = CurrencyFormatPipe.parseCurrency('$1,234.56', 'en-US');
   * console.log(value); // 1234.56
   * ```
   */
  static parseCurrency(formattedValue: string, locale: string = 'en-US'): number | null {
    if (!formattedValue || typeof formattedValue !== 'string') {
      return null;
    }

    try {
      // Remove currency symbols and non-numeric characters except decimal separators
      const cleanValue = formattedValue
        .replace(/[^\d\-+.,]/g, '') // Remove all non-numeric except decimal separators
        .replace(/,(?=\d{3})/g, ''); // Remove thousand separators

      const numericValue = parseFloat(cleanValue);
      return isNaN(numericValue) ? null : numericValue;
    } catch (error) {
      console.warn('CurrencyFormatPipe: Parse error', { formattedValue, error });
      return null;
    }
  }
} 