import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Address,
  AddressType,
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressFilters,
  PaginatedAddressResponse,
  AddressValidationResult,
  AddressBookSummary,
  Country,
  State,
  AddressSuggestion
} from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly apiUrl = `${environment.apiUrl}/addresses`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private addressesSubject = new BehaviorSubject<AddressResponse[]>([]);

  // Mock data for development (remove when backend is ready)
  private mockAddresses: AddressResponse[] = [];
  private mockCountries: Country[] = [];

  constructor(private http: HttpClient) {
    this.initializeMockData();
  }

  // Public observables
  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get addresses$(): Observable<AddressResponse[]> {
    return this.addressesSubject.asObservable();
  }

  // CRUD Operations
  getAddresses(
    filters?: AddressFilters,
    page: number = 1,
    pageSize: number = 10
  ): Observable<PaginatedAddressResponse> {
    this.setLoading(true);

    // For now, return mock data. Replace with HTTP call when backend is ready
    return this.getMockAddresses(filters, page, pageSize).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );

    // Future HTTP implementation:
    /*
    const params = this.buildHttpParams(filters, page, pageSize);
    return this.http.get<PaginatedAddressResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this.addressesSubject.next(response.addresses);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  getAddressById(id: number): Observable<AddressResponse> {
    this.setLoading(true);

    // Mock implementation
    const address = this.mockAddresses.find(a => a.id === id);
    if (address) {
      this.setLoading(false);
      return of(address);
    }

    this.setLoading(false);
    return throwError(() => new Error('Address not found'));

    // Future HTTP implementation:
    /*
    return this.http.get<AddressResponse>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
    */
  }

  createAddress(addressRequest: CreateAddressRequest): Observable<AddressResponse> {
    this.setLoading(true);

    // Validate address before creation
    const validationResult = this.validateAddress(addressRequest);
    if (!validationResult.isValid) {
      this.setLoading(false);
      return throwError(() => new Error(validationResult.errors[0].message));
    }

    // Mock implementation
    const newAddress = this.createMockAddress(addressRequest);
    this.mockAddresses.unshift(newAddress);
    this.addressesSubject.next([...this.mockAddresses]);
    this.setLoading(false);
    return of(newAddress);

    // Future HTTP implementation:
    /*
    return this.http.post<AddressResponse>(this.apiUrl, addressRequest).pipe(
      tap((address) => {
        const currentAddresses = this.addressesSubject.value;
        this.addressesSubject.next([address, ...currentAddresses]);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  updateAddress(id: number, updateRequest: UpdateAddressRequest): Observable<AddressResponse> {
    this.setLoading(true);

    // Mock implementation
    const addressIndex = this.mockAddresses.findIndex(a => a.id === id);
    if (addressIndex === -1) {
      this.setLoading(false);
      return throwError(() => new Error('Address not found'));
    }

    const updatedAddress = {
      ...this.mockAddresses[addressIndex],
      ...updateRequest,
      updatedAt: new Date().toISOString()
    };

    this.mockAddresses[addressIndex] = updatedAddress;
    this.addressesSubject.next([...this.mockAddresses]);
    this.setLoading(false);
    return of(updatedAddress);

    // Future HTTP implementation:
    /*
    return this.http.put<AddressResponse>(`${this.apiUrl}/${id}`, updateRequest).pipe(
      tap((address) => {
        this.updateAddressInList(address);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  deleteAddress(id: number): Observable<void> {
    this.setLoading(true);

    // Mock implementation
    const addressIndex = this.mockAddresses.findIndex(a => a.id === id);
    if (addressIndex === -1) {
      this.setLoading(false);
      return throwError(() => new Error('Address not found'));
    }

    this.mockAddresses.splice(addressIndex, 1);
    this.addressesSubject.next([...this.mockAddresses]);
    this.setLoading(false);
    return of(void 0);

    // Future HTTP implementation:
    /*
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentAddresses = this.addressesSubject.value;
        const filteredAddresses = currentAddresses.filter(a => a.id !== id);
        this.addressesSubject.next(filteredAddresses);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  setDefaultAddress(id: number, type: AddressType): Observable<AddressResponse> {
    this.setLoading(true);

    // Mock implementation
    const addressIndex = this.mockAddresses.findIndex(a => a.id === id);
    if (addressIndex === -1) {
      this.setLoading(false);
      return throwError(() => new Error('Address not found'));
    }

    // Remove default flag from other addresses of the same type
    this.mockAddresses.forEach(address => {
      if (address.type === type || address.type === AddressType.Both) {
        address.isDefault = false;
      }
    });

    // Set the selected address as default
    this.mockAddresses[addressIndex].isDefault = true;
    this.mockAddresses[addressIndex].updatedAt = new Date().toISOString();

    this.addressesSubject.next([...this.mockAddresses]);
    this.setLoading(false);
    return of(this.mockAddresses[addressIndex]);

    // Future HTTP implementation:
    /*
    return this.http.patch<AddressResponse>(`${this.apiUrl}/${id}/set-default`, { type }).pipe(
      tap((address) => {
        this.updateAddressInList(address);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  getDefaultAddresses(): Observable<{ shipping?: AddressResponse; billing?: AddressResponse }> {
    const shippingDefault = this.mockAddresses.find(a => 
      a.isDefault && (a.type === AddressType.Shipping || a.type === AddressType.Both)
    );
    const billingDefault = this.mockAddresses.find(a => 
      a.isDefault && (a.type === AddressType.Billing || a.type === AddressType.Both)
    );

    return of({
      shipping: shippingDefault,
      billing: billingDefault
    });

    // Future HTTP implementation:
    /*
    return this.http.get<{ shipping?: AddressResponse; billing?: AddressResponse }>(`${this.apiUrl}/defaults`).pipe(
      catchError(this.handleError.bind(this))
    );
    */
  }

  getAddressBookSummary(): Observable<AddressBookSummary> {
    const summary: AddressBookSummary = {
      totalAddresses: this.mockAddresses.length,
      defaultShippingAddress: this.mockAddresses.find(a => 
        a.isDefault && (a.type === AddressType.Shipping || a.type === AddressType.Both)
      ),
      defaultBillingAddress: this.mockAddresses.find(a => 
        a.isDefault && (a.type === AddressType.Billing || a.type === AddressType.Both)
      ),
      recentAddresses: this.mockAddresses
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
    };

    return of(summary);

    // Future HTTP implementation:
    /*
    return this.http.get<AddressBookSummary>(`${this.apiUrl}/summary`).pipe(
      catchError(this.handleError.bind(this))
    );
    */
  }

  // Address validation
  validateAddress(address: CreateAddressRequest | UpdateAddressRequest): AddressValidationResult {
    const errors: any[] = [];

    if (!address.firstName?.trim()) {
      errors.push({ field: 'firstName', message: 'First name is required', code: 'REQUIRED' });
    }

    if (!address.lastName?.trim()) {
      errors.push({ field: 'lastName', message: 'Last name is required', code: 'REQUIRED' });
    }

    if (!address.addressLine1?.trim()) {
      errors.push({ field: 'addressLine1', message: 'Address line 1 is required', code: 'REQUIRED' });
    }

    if (!address.city?.trim()) {
      errors.push({ field: 'city', message: 'City is required', code: 'REQUIRED' });
    }

    if (!address.state?.trim()) {
      errors.push({ field: 'state', message: 'State is required', code: 'REQUIRED' });
    }

    if (!address.postalCode?.trim()) {
      errors.push({ field: 'postalCode', message: 'Postal code is required', code: 'REQUIRED' });
    }

    if (!address.country?.trim()) {
      errors.push({ field: 'country', message: 'Country is required', code: 'REQUIRED' });
    }

    // Postal code format validation (basic)
    if (address.postalCode && address.country === 'US') {
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      if (!usZipRegex.test(address.postalCode)) {
        errors.push({ field: 'postalCode', message: 'Invalid US postal code format', code: 'INVALID_FORMAT' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Address suggestions (for autocomplete)
  getAddressSuggestions(query: string): Observable<AddressSuggestion[]> {
    // Mock implementation - in real app, this would call a geocoding service
    const suggestions: AddressSuggestion[] = [
      {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        confidence: 0.95
      },
      {
        addressLine1: '456 Broadway',
        city: 'New York',
        state: 'NY',
        postalCode: '10013',
        country: 'US',
        confidence: 0.87
      }
    ].filter(s => 
      s.addressLine1.toLowerCase().includes(query.toLowerCase()) ||
      s.city.toLowerCase().includes(query.toLowerCase())
    );

    return of(suggestions);

    // Future implementation with geocoding service:
    /*
    return this.http.get<AddressSuggestion[]>(`${this.apiUrl}/suggestions`, {
      params: { query }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
    */
  }

  // Country and state data
  getCountries(): Observable<Country[]> {
    return of(this.mockCountries);

    // Future HTTP implementation:
    /*
    return this.http.get<Country[]>(`${environment.apiUrl}/countries`).pipe(
      catchError(this.handleError.bind(this))
    );
    */
  }

  getStates(countryCode: string): Observable<State[]> {
    const country = this.mockCountries.find(c => c.code === countryCode);
    return of(country?.states || []);

    // Future HTTP implementation:
    /*
    return this.http.get<State[]>(`${environment.apiUrl}/countries/${countryCode}/states`).pipe(
      catchError(this.handleError.bind(this))
    );
    */
  }

  // Utility methods
  formatAddress(address: AddressResponse): string {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country
    ].filter(Boolean);

    return parts.join('\n');
  }

  formatAddressOneLine(address: AddressResponse): string {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Private helper methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}`;
    }

    console.error('AddressService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private buildHttpParams(
    filters?: AddressFilters,
    page: number = 1,
    pageSize: number = 10
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.isDefault !== undefined) params = params.set('isDefault', filters.isDefault.toString());
      if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
    }

    return params;
  }

  private getMockAddresses(
    filters?: AddressFilters,
    page: number = 1,
    pageSize: number = 10
  ): Observable<PaginatedAddressResponse> {
    let filteredAddresses = [...this.mockAddresses];

    // Apply filters
    if (filters) {
      if (filters.type) {
        filteredAddresses = filteredAddresses.filter(address => 
          address.type === filters.type || address.type === AddressType.Both
        );
      }
      if (filters.isDefault !== undefined) {
        filteredAddresses = filteredAddresses.filter(address => address.isDefault === filters.isDefault);
      }
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredAddresses = filteredAddresses.filter(address => 
          address.label.toLowerCase().includes(searchTerm) ||
          address.addressLine1.toLowerCase().includes(searchTerm) ||
          address.city.toLowerCase().includes(searchTerm)
        );
      }
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedAddresses = filteredAddresses.slice(startIndex, endIndex);

    const response: PaginatedAddressResponse = {
      addresses: paginatedAddresses,
      totalCount: filteredAddresses.length,
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(filteredAddresses.length / pageSize),
      hasNextPage: endIndex < filteredAddresses.length,
      hasPreviousPage: page > 1
    };

    return of(response);
  }

  private createMockAddress(request: CreateAddressRequest): AddressResponse {
    const addressId = this.mockAddresses.length + 1;
    
    const address: AddressResponse = {
      id: addressId,
      userId: 1, // Mock user ID
      type: request.type,
      label: request.label,
      firstName: request.firstName,
      lastName: request.lastName,
      company: request.company,
      addressLine1: request.addressLine1,
      addressLine2: request.addressLine2,
      city: request.city,
      state: request.state,
      postalCode: request.postalCode,
      country: request.country,
      phoneNumber: request.phoneNumber,
      isDefault: request.isDefault || false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return address;
  }

  private initializeMockData(): void {
    // Initialize with some mock addresses for development
    this.mockAddresses = [
      {
        id: 1,
        userId: 1,
        type: AddressType.Both,
        label: 'Home',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        phoneNumber: '+1-555-0123',
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: 1,
        type: AddressType.Shipping,
        label: 'Work',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Tech Corp',
        addressLine1: '456 Business Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10013',
        country: 'US',
        phoneNumber: '+1-555-0456',
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Initialize mock countries
    this.mockCountries = [
      {
        code: 'US',
        name: 'United States',
        states: [
          { code: 'NY', name: 'New York' },
          { code: 'CA', name: 'California' },
          { code: 'TX', name: 'Texas' },
          { code: 'FL', name: 'Florida' }
        ]
      },
      {
        code: 'CA',
        name: 'Canada',
        states: [
          { code: 'ON', name: 'Ontario' },
          { code: 'BC', name: 'British Columbia' },
          { code: 'QC', name: 'Quebec' }
        ]
      }
    ];
  }

  private updateAddressInList(updatedAddress: AddressResponse): void {
    const currentAddresses = this.addressesSubject.value;
    const index = currentAddresses.findIndex(address => address.id === updatedAddress.id);
    if (index !== -1) {
      currentAddresses[index] = updatedAddress;
      this.addressesSubject.next([...currentAddresses]);
    }
  }
} 