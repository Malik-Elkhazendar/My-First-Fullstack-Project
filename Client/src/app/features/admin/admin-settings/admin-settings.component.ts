import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeTab: 'system' | 'payment' | 'security' = 'system';
  systemForm!: FormGroup;
  
  readonly currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' }
  ];
  
  readonly timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Initial load
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.systemForm = this.fb.group({
      siteName: ['Fashion Forward', Validators.required],
      contactEmail: ['contact@fashionforward.com', [Validators.required, Validators.email]],
      supportPhone: ['+1-555-0123'],
      currency: ['USD', Validators.required],
      timezone: ['UTC', Validators.required],
      maintenanceMode: [false]
    });
  }

  setActiveTab(tab: 'system' | 'payment' | 'security'): void {
    this.activeTab = tab;
  }

  onSaveSystemSettings(): void {
    if (this.systemForm.valid) {
      const settings = this.systemForm.value;
      console.log('Save system settings:', settings);
      // TODO: Implement save system settings functionality
    }
  }
} 