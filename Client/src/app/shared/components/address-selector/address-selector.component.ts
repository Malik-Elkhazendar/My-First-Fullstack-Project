import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { takeUntil, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AddressService } from '../../../core/services/address.service';
import {
  AddressResponse,
  AddressType,
  CreateAddressRequest,
  Country,
  State,
  AddressSelection
} from '../../../core/models/address.model';

export interface AddressSelectorConfig {
  type: AddressType;
  title: string;
  allowNewAddress: boolean;
  showSaveOption: boolean;
  required: boolean;
}

@Component({
  selector: 'app-address-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './address-selector.component.html',
  styleUrls: ['./address-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressSelectorComponent implements OnInit, OnDestroy {
  @Input() config!: AddressSelectorConfig;
  @Input() selectedAddressId?: number;
  @Input() useShippingAsBilling = false;
  @Input() disabled = false;

  @Output() addressSelected = new EventEmitter<AddressSelection>();
  @Output() validationChanged = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();

  addresses: AddressResponse[] = [];
  countries: Country[] = [];
  states: State[] = [];
  loading$: Observable<boolean>;

  selectionForm!: FormGroup;
  newAddressForm!: FormGroup;
  
  selectionMode: 'existing' | 'new' = 'existing';
  showNewAddressForm = false;

  constructor(
    private addressService: AddressService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.loading$ = this.addressService.loading$;
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadAddresses();
    this.loadCountries();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.selectionForm = this.fb.group({
      selectedAddressId: [''],
      useExisting: [true]
    });

    this.newAddressForm = this.fb.group({
      label: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      company: [''],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['US', Validators.required],
      phoneNumber: [''],
      saveAddress: [false]
    });
  }

  private setupFormSubscriptions(): void {
    // Watch for selection changes
    this.selectionForm.valueChanges.pipe(
      startWith(this.selectionForm.value),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.onSelectionChange();
    });

    // Watch for new address form changes
    this.newAddressForm.valueChanges.pipe(
      startWith(this.newAddressForm.value),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.onNewAddressChange();
    });

    // Watch for country changes to load states
    this.newAddressForm.get('country')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((countryCode) => {
      if (countryCode) {
        this.loadStates(countryCode);
      }
    });
  }

  private loadAddresses(): void {
    this.addressService.getAddresses({ type: this.config.type }).subscribe({
      next: (response) => {
        this.addresses = response.addresses;
        this.setDefaultSelection();
      },
      error: (error) => {
        this.showError('Failed to load addresses: ' + error.message);
      }
    });
  }

  private loadCountries(): void {
    this.addressService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        // Load states for default country
        this.loadStates('US');
      },
      error: (error) => {
        this.showError('Failed to load countries: ' + error.message);
      }
    });
  }

  private loadStates(countryCode: string): void {
    this.addressService.getStates(countryCode).subscribe({
      next: (states) => {
        this.states = states;
        // Reset state selection when country changes
        this.newAddressForm.patchValue({ state: '' });
      },
      error: (error) => {
        console.error('Failed to load states:', error);
      }
    });
  }

  private setDefaultSelection(): void {
    if (this.selectedAddressId) {
      this.selectionForm.patchValue({
        selectedAddressId: this.selectedAddressId,
        useExisting: true
      });
    } else if (this.addresses.length > 0) {
      // Select default address if available
      const defaultAddress = this.addresses.find(a => a.isDefault);
      if (defaultAddress) {
        this.selectionForm.patchValue({
          selectedAddressId: defaultAddress.id,
          useExisting: true
        });
      }
    } else if (this.config.allowNewAddress) {
      // No addresses available, switch to new address mode
      this.selectionMode = 'new';
      this.showNewAddressForm = true;
      this.selectionForm.patchValue({ useExisting: false });
    }
  }

  onSelectionModeChange(mode: 'existing' | 'new'): void {
    this.selectionMode = mode;
    this.showNewAddressForm = mode === 'new';
    this.selectionForm.patchValue({ useExisting: mode === 'existing' });
    this.onSelectionChange();
  }

  onAddressSelect(addressId: number): void {
    this.selectionForm.patchValue({ selectedAddressId: addressId });
  }

  private onSelectionChange(): void {
    const formValue = this.selectionForm.value;
    let selection: AddressSelection = {};
    let isValid = false;

    if (formValue.useExisting && formValue.selectedAddressId) {
      // Using existing address
      if (this.config.type === AddressType.Shipping) {
        selection.shippingAddressId = formValue.selectedAddressId;
      } else if (this.config.type === AddressType.Billing) {
        selection.billingAddressId = formValue.selectedAddressId;
      }
      isValid = true;
    } else if (!formValue.useExisting && this.newAddressForm.valid) {
      // Using new address
      const newAddress = this.buildNewAddressRequest();
      if (this.config.type === AddressType.Shipping) {
        selection.newShippingAddress = newAddress;
      } else if (this.config.type === AddressType.Billing) {
        selection.newBillingAddress = newAddress;
      }
      isValid = true;
    }

    this.addressSelected.emit(selection);
    this.validationChanged.emit(isValid);
  }

  private onNewAddressChange(): void {
    if (this.selectionMode === 'new') {
      this.onSelectionChange();
    }
  }

  private buildNewAddressRequest(): CreateAddressRequest {
    const formValue = this.newAddressForm.value;
    return {
      type: this.config.type,
      label: formValue.label,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      company: formValue.company,
      addressLine1: formValue.addressLine1,
      addressLine2: formValue.addressLine2,
      city: formValue.city,
      state: formValue.state,
      postalCode: formValue.postalCode,
      country: formValue.country,
      phoneNumber: formValue.phoneNumber,
      isDefault: false
    };
  }

  formatAddress(address: AddressResponse): string {
    return this.addressService.formatAddressOneLine(address);
  }

  getAddressLabel(address: AddressResponse): string {
    return `${address.label} - ${address.firstName} ${address.lastName}`;
  }

  onCreateNewAddress(): void {
    if (this.newAddressForm.valid) {
      const addressRequest = this.buildNewAddressRequest();
      
      this.addressService.createAddress(addressRequest).subscribe({
        next: (newAddress) => {
          this.addresses.unshift(newAddress);
          this.selectionMode = 'existing';
          this.showNewAddressForm = false;
          this.selectionForm.patchValue({
            selectedAddressId: newAddress.id,
            useExisting: true
          });
          this.showSuccess('Address saved successfully');
        },
        error: (error) => {
          this.showError('Failed to save address: ' + error.message);
        }
      });
    }
  }

  onEditAddress(address: AddressResponse): void {
    // Populate form with existing address data
    this.newAddressForm.patchValue({
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phoneNumber: address.phoneNumber,
      saveAddress: true
    });
    
    this.selectionMode = 'new';
    this.showNewAddressForm = true;
  }

  onDeleteAddress(address: AddressResponse): void {
    if (confirm(`Are you sure you want to delete the address "${address.label}"?`)) {
      this.addressService.deleteAddress(address.id!).subscribe({
        next: () => {
          this.addresses = this.addresses.filter(a => a.id !== address.id);
          this.showSuccess('Address deleted successfully');
          
          // If deleted address was selected, clear selection
          if (this.selectionForm.value.selectedAddressId === address.id) {
            this.selectionForm.patchValue({ selectedAddressId: '' });
          }
        },
        error: (error) => {
          this.showError('Failed to delete address: ' + error.message);
        }
      });
    }
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

  // Validation helpers
  isFormValid(): boolean {
    if (this.selectionMode === 'existing') {
      return !!this.selectionForm.value.selectedAddressId;
    } else {
      return this.newAddressForm.valid;
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.newAddressForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return `${fieldName} is required`;
      }
      // Add more validation error messages as needed
    }
    return null;
  }
} 