import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface LoadingState {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({});
  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  /**
   * Set loading state for a specific key
   */
  setLoading(key: string, loading: boolean): void {
    const currentState = this.loadingSubject.value;
    this.loadingSubject.next({
      ...currentState,
      [key]: loading
    });
  }

  /**
   * Get loading state for a specific key
   */
  isLoading(key: string): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        observer.next(!!state[key]);
      });
    });
  }

  /**
   * Get loading state for a specific key as boolean
   */
  isLoadingSync(key: string): boolean {
    return !!this.loadingSubject.value[key];
  }

  /**
   * Check if any loading operation is active
   */
  isAnyLoading(): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        const hasAnyLoading = Object.values(state).some(loading => loading);
        observer.next(hasAnyLoading);
      });
    });
  }

  /**
   * Wrap an observable with loading state management
   */
  withLoading<T>(key: string, source: Observable<T>): Observable<T> {
    this.setLoading(key, true);
    return source.pipe(
      finalize(() => this.setLoading(key, false))
    );
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingSubject.next({});
  }

  /**
   * Clear loading state for a specific key
   */
  clear(key: string): void {
    const currentState = this.loadingSubject.value;
    const newState = { ...currentState };
    delete newState[key];
    this.loadingSubject.next(newState);
  }

  /**
   * Get all current loading states
   */
  getAllLoadingStates(): LoadingState {
    return this.loadingSubject.value;
  }
} 