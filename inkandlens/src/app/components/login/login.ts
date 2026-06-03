import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  showAdminPrompt = false;
  adminPassword = '';
  errorMessage = '';

  constructor(private router: Router) {}

  selectReader() {
    this.router.navigate(['/user']);
  }

  showAdminForm() {
    this.showAdminPrompt = true;
    this.errorMessage = '';
    this.adminPassword = '';
  }

  cancelAdmin() {
    this.showAdminPrompt = false;
    this.errorMessage = '';
    this.adminPassword = '';
  }

  verifyAdmin() {
    if (this.adminPassword === 'ATMADMIN2026') {
      localStorage.setItem('role', 'admin');
      this.router.navigate(['/admin']);
    } else {
      this.errorMessage = 'Incorrect admin password. Please try again.';
      this.adminPassword = '';
    }
  }
}
