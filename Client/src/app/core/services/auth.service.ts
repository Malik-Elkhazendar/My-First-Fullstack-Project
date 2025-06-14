import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, UserRole, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly EXPIRATION_KEY = 'auth_expiration';
  private readonly API_URL = '/api/auth'; // Replace with your actual API URL in production
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenExpirationTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  // Check if user is authenticated
  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value?.token;
  }

  // Check if user is admin
  get isAdmin(): boolean {
    return this.currentUserSubject.value?.role === UserRole.Admin;
  }

  // Get current user
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // For development/demo purposes only - replace with real API in production
  private simulateHttp<T>(data: T, delay: number = 800): Observable<T> {
    return of(data).pipe(
      tap(() => console.log('Auth API call simulated')),
      catchError(error => throwError(() => new Error(error)))
    );
  }

  // Load stored authentication data on service initialization
  private loadStoredAuth(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);
      const expirationStr = localStorage.getItem(this.EXPIRATION_KEY);
      
      if (!token || !userStr || !expirationStr) {
        return;
      }
      
      const user = JSON.parse(userStr) as User;
      const expirationDate = new Date(expirationStr);
      
      // Check if token is expired
      if (expirationDate <= new Date()) {
        this.logout();
        return;
      }
      
      // Set user and auto-logout timer
      user.token = token;
      this.currentUserSubject.next(user);
      this.autoLogout(expirationDate.getTime() - new Date().getTime());
    } catch (error) {
      console.error('Failed to load authentication data', error);
      this.logout();
    }
  }

  // Store authentication data
  private storeAuthData(response: AuthResponse): void {
    const expirationDate = new Date(new Date().getTime() + response.expiresIn * 1000);
    
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(this.EXPIRATION_KEY, expirationDate.toISOString());
    
    this.autoLogout(response.expiresIn * 1000);
  }

  // Set auto logout timer
  private autoLogout(expirationDuration: number): void {
    this.clearLogoutTimer();
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  // Clear logout timer
  private clearLogoutTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  // Login method
  login(credentials: LoginRequest): Observable<User> {
    // For demo purposes only - Replace with actual API call in production
    // return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
    return this.simulateHttp<AuthResponse>({
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: credentials.email,
        role: credentials.email.includes('admin') ? UserRole.Admin : UserRole.Customer,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      token: 'mock_jwt_token_' + Math.random().toString(36).substring(2),
      expiresIn: 3600 // 1 hour
    }, 1000).pipe(
      tap(response => {
        const user = {...response.user, token: response.token};
        this.currentUserSubject.next(user);
        this.storeAuthData(response);
      }),
      map(response => response.user)
    );
  }

  // Register method
  register(userData: RegisterRequest): Observable<User> {
    // For demo purposes only - Replace with actual API call in production
    // return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
    return this.simulateHttp<AuthResponse>({
      user: {
        id: Math.floor(Math.random() * 1000) + 1,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: UserRole.Customer,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      token: 'mock_jwt_token_' + Math.random().toString(36).substring(2),
      expiresIn: 3600 // 1 hour
    }, 1500).pipe(
      tap(response => {
        const user = {...response.user, token: response.token};
        this.currentUserSubject.next(user);
        this.storeAuthData(response);
      }),
      map(response => response.user)
    );
  }

  // Logout method
  logout(): void {
    this.clearLogoutTimer();
    this.currentUserSubject.next(null);
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRATION_KEY);
    
    this.router.navigate(['/auth/login']);
  }
} 