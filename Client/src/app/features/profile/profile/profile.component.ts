import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    ReactiveFormsModule
  ]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  profileForm: FormGroup;
  currentUser: User | null = null;
  loading = false;
  selectedTabIndex = 0;
  
  // Address management
  addresses: AddressResponse[] = [];
  addressLoading$: Observable<boolean>;
  
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
      this.markFormGroupTouched(this.profileForm);
      return;
    }
    
    this.loading = true;
    // In a real app, you would call a service to update the profile
    // For this demo, we'll just show a success message
    setTimeout(() => {
      this.showSuccess('Profile updated successfully!');
      this.loading = false;
    }, 1000);
  }
  
  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
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
  
  onEditAddress(address: AddressResponse): void {
    // In a real app, this would open an edit dialog or navigate to edit page
    console.log('Edit address:', address);
    this.showSuccess('Edit address functionality would be implemented here');
  }
  
  // Get default responsive images for addresses
  getAddressImage(address: AddressResponse, index: number): string {
    const defaultImages = [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1516455207990-7a41ce80f7ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    ];
    
    // Use modulo to cycle through images if there are more addresses than images
    return defaultImages[index % defaultImages.length];
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
  
  // Security methods
  onChangePassword(): void {
    // TODO: Implement password change functionality
    this.snackBar.open('Password change functionality coming soon!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onEnable2FA(): void {
    // TODO: Implement 2FA setup functionality
    this.snackBar.open('Two-Factor Authentication setup coming soon!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onViewLoginActivity(): void {
    // TODO: Implement login activity view functionality
    this.snackBar.open('Login activity view coming soon!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onManagePrivacy(): void {
    // TODO: Implement privacy settings management
    this.snackBar.open('Privacy settings management coming soon!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onExportData(): void {
    // TODO: Implement data export functionality
    this.snackBar.open('Data export functionality coming soon!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onDeleteAccount(): void {
    // TODO: Implement account deletion with confirmation dialog
    this.snackBar.open('Account deletion requires confirmation. Feature coming soon!', 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  onDeactivateAccount(): void {
    // TODO: Implement account deactivation functionality
    this.snackBar.open('Account deactivation functionality coming soon!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
} 