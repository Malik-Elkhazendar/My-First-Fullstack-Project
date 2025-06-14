import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { AddressService } from '../../../core/services/address.service';
import { User } from '../../../core/models/user.model';
import { AddressResponse, AddressType } from '../../../core/models/address.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  profileForm: FormGroup;
  currentUser: User | null = null;
  loading = false;
  
  // Address management
  addresses: AddressResponse[] = [];
  addressLoading$: Observable<boolean>;
  selectedTabIndex = 0;
  
  // Make AddressType available in template
  AddressType = AddressType;

  constructor(
    private authService: AuthService,
    private addressService: AddressService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });
    
    this.addressLoading$ = this.addressService.loading$;
  }
  
  ngOnInit(): void {
    // Load user data from auth service
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
      }
    });
    
    // Load user addresses
    this.loadAddresses();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }
    
    this.loading = true;
    // In a real app, you would call a service to update the profile
    // For this demo, we'll just show a success message
    setTimeout(() => {
      this.snackBar.open('Profile updated successfully!', 'Close', {
        duration: 3000
      });
      this.loading = false;
    }, 1000);
  }
  
  // Address management methods
  private loadAddresses(): void {
    this.addressService.getAddresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.addresses = response.addresses;
        },
        error: (error) => {
          this.showError('Failed to load addresses: ' + error.message);
        }
      });
  }
  
  onAddressSelected(selection: any): void {
    // Handle address selection if needed
    console.log('Address selected:', selection);
  }
  
  onAddressValidationChanged(isValid: boolean): void {
    // Handle validation changes if needed
    console.log('Address validation changed:', isValid);
  }
  
  onDeleteAddress(address: AddressResponse): void {
    if (confirm(`Are you sure you want to delete the address "${address.label}"?`)) {
      this.addressService.deleteAddress(address.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess('Address deleted successfully');
            this.loadAddresses(); // Refresh the list
          },
          error: (error) => {
            this.showError('Failed to delete address: ' + error.message);
          }
        });
    }
  }
  
  onSetDefaultAddress(address: AddressResponse): void {
    this.addressService.setDefaultAddress(address.id!, address.type)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Default address updated successfully');
          this.loadAddresses(); // Refresh the list
        },
        error: (error) => {
          this.showError('Failed to update default address: ' + error.message);
        }
      });
  }
  
  getShippingAddresses(): AddressResponse[] {
    return this.addresses.filter(addr => 
      addr.type === AddressType.Shipping || addr.type === AddressType.Both
    );
  }
  
  getBillingAddresses(): AddressResponse[] {
    return this.addresses.filter(addr => 
      addr.type === AddressType.Billing || addr.type === AddressType.Both
    );
  }
  
  formatAddress(address: AddressResponse): string {
    return this.addressService.formatAddressOneLine(address);
  }
  
  // Helper to get user initials for avatar
  getUserInitials(): string {
    if (!this.currentUser) return '';
    
    const firstInitial = this.currentUser.firstName.charAt(0);
    const lastInitial = this.currentUser.lastName.charAt(0);
    
    return `${firstInitial}${lastInitial}`;
  }
  
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
  
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
} 