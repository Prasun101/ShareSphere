import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  @ViewChild('registerform') registerform!: NgForm;

  username: string = '';
  email: string = '';
  password: string = '';
  uniqueID: string = '';
  isSeller: boolean = false;

  message = '';
  success = false;
  type: string = 'password';
  isText: boolean = false;
  eyeIcon: string = 'fa-eye-slash';
  termsChecked = false;
  isLoading: boolean = false;

  constructor(private authService: AuthService, public snackBar: MatSnackBar) {}

  registerUsers(users: { username: string; email: string; password: string }) {
    this.isLoading = true; // Show spinner

    const userPayload = {
      ...users,
      isSeller: this.isSeller,
      uniqueID: this.isSeller ? this.uniqueID : undefined,
    };

    this.authService.register(userPayload).subscribe({
      next: () => {
        setTimeout(() => {
          console.log('Registration Successful');
          console.log(users);
          this.snackBar.open('You are successfully registered.', 'close', {
            duration: 3000
          });
          this.registerform.resetForm();
          this.isLoading = false; // Hide spinner
        }, 2000); // Simulate delay for success message
      },
      error: (error: { status: number }) => {
        setTimeout(() => {
          this.snackBar.open('Email already exists! Please use a different email.', 'close', {
            duration: 3000
          });
          this.isLoading = false; // Hide spinner
        }, 2000);
      }
    });
  }

  hideShowPassword() {
    this.isText = !this.isText;
    this.isText ? this.eyeIcon = 'fa-eye' : this.eyeIcon = 'fa-eye-slash';
    this.isText ? this.type = 'text' : this.type = 'password';
  }

  toggleSeller() {
    this.isSeller = !this.isSeller;
  }

  ngOnInit(): void {}
}
