import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminDashboardComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Verify the user is admin
    if (!this.authService.isAdmin) {
      console.warn('Non-admin user accessing admin dashboard');
    }
  }
} 