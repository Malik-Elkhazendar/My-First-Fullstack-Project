import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map, shareReplay } from 'rxjs';

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveBreakpoints {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
}

/**
 * Responsive utilities service for handling different screen sizes
 * and providing reactive breakpoint information
 */
@Injectable({
  providedIn: 'root'
})
export class ResponsiveUtils {
  
  /**
   * Observable that emits current breakpoint state
   */
  public readonly breakpoints$: Observable<ResponsiveBreakpoints>;
  
  /**
   * Observable for mobile detection (xs and sm screens)
   */
  public readonly isMobile$: Observable<boolean>;
  
  /**
   * Observable for tablet detection (md screens)
   */
  public readonly isTablet$: Observable<boolean>;
  
  /**
   * Observable for desktop detection (lg and xl screens)
   */
  public readonly isDesktop$: Observable<boolean>;

  constructor(private breakpointObserver: BreakpointObserver) {
    // Create breakpoints observable
    this.breakpoints$ = this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).pipe(
      map(result => ({
        xs: this.breakpointObserver.isMatched(Breakpoints.XSmall),
        sm: this.breakpointObserver.isMatched(Breakpoints.Small),
        md: this.breakpointObserver.isMatched(Breakpoints.Medium),
        lg: this.breakpointObserver.isMatched(Breakpoints.Large),
        xl: this.breakpointObserver.isMatched(Breakpoints.XLarge)
      })),
      shareReplay(1)
    );

    // Create device type observables
    this.isMobile$ = this.breakpoints$.pipe(
      map(breakpoints => breakpoints.xs || breakpoints.sm)
    );

    this.isTablet$ = this.breakpoints$.pipe(
      map(breakpoints => breakpoints.md)
    );

    this.isDesktop$ = this.breakpoints$.pipe(
      map(breakpoints => breakpoints.lg || breakpoints.xl)
    );
  }

  /**
   * Check if current screen is mobile size
   */
  isMobile(): boolean {
    return this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
  }

  /**
   * Check if current screen is tablet size
   */
  isTablet(): boolean {
    return this.breakpointObserver.isMatched(Breakpoints.Medium);
  }

  /**
   * Check if current screen is desktop size
   */
  isDesktop(): boolean {
    return this.breakpointObserver.isMatched([Breakpoints.Large, Breakpoints.XLarge]);
  }

  /**
   * Get appropriate grid columns based on screen size
   * 
   * @param mobileColumns - Number of columns for mobile
   * @param tabletColumns - Number of columns for tablet
   * @param desktopColumns - Number of columns for desktop
   * @returns Number of columns for current screen size
   */
  getGridColumns(mobileColumns: number = 1, tabletColumns: number = 2, desktopColumns: number = 3): number {
    if (this.isMobile()) return mobileColumns;
    if (this.isTablet()) return tabletColumns;
    return desktopColumns;
  }

  /**
   * Get appropriate page size based on screen size
   * 
   * @param mobilePage - Page size for mobile
   * @param tabletPage - Page size for tablet  
   * @param desktopPage - Page size for desktop
   * @returns Page size for current screen size
   */
  getPageSize(mobilePage: number = 6, tabletPage: number = 12, desktopPage: number = 24): number {
    if (this.isMobile()) return mobilePage;
    if (this.isTablet()) return tabletPage;
    return desktopPage;
  }

  /**
   * Get responsive dialog width
   * 
   * @param mobileWidth - Width for mobile screens
   * @param desktopWidth - Width for desktop screens
   * @returns Appropriate width string
   */
  getDialogWidth(mobileWidth: string = '95vw', desktopWidth: string = '400px'): string {
    return this.isMobile() ? mobileWidth : desktopWidth;
  }

  /**
   * Get responsive card padding
   * 
   * @param mobilePadding - Padding for mobile screens
   * @param desktopPadding - Padding for desktop screens
   * @returns Appropriate padding string
   */
  getCardPadding(mobilePadding: string = '16px', desktopPadding: string = '24px'): string {
    return this.isMobile() ? mobilePadding : desktopPadding;
  }

  /**
   * Check if screen width is below a specific pixel value
   * 
   * @param maxWidth - Maximum width in pixels
   * @returns True if screen is below the specified width
   */
  isBelow(maxWidth: number): boolean {
    return this.breakpointObserver.isMatched(`(max-width: ${maxWidth}px)`);
  }

  /**
   * Check if screen width is above a specific pixel value
   * 
   * @param minWidth - Minimum width in pixels
   * @returns True if screen is above the specified width
   */
  isAbove(minWidth: number): boolean {
    return this.breakpointObserver.isMatched(`(min-width: ${minWidth}px)`);
  }

  /**
   * Get responsive font size
   * 
   * @param mobileFontSize - Font size for mobile
   * @param desktopFontSize - Font size for desktop
   * @returns Appropriate font size
   */
  getFontSize(mobileFontSize: string = '14px', desktopFontSize: string = '16px'): string {
    return this.isMobile() ? mobileFontSize : desktopFontSize;
  }

  /**
   * Get responsive spacing
   * 
   * @param mobileSpacing - Spacing for mobile
   * @param desktopSpacing - Spacing for desktop
   * @returns Appropriate spacing value
   */
  getSpacing(mobileSpacing: string = '8px', desktopSpacing: string = '16px'): string {
    return this.isMobile() ? mobileSpacing : desktopSpacing;
  }
} 