import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  isSeller = false;
  type: string = "password";
  eyeIcon: string = "fa-eye-slash";

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router // Inject Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      uniqueID: ['']
    });
  }

  ngOnInit(): void {}

  loginProcess(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const loginData = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
        isSeller: this.isSeller,
        uniqueID: this.isSeller ? this.loginForm.value.uniqueID : null
      };
  
      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
          this.isLoading = false;
          // Store the login status and user details
          this.authService.setLoggedInUser(response.user); // Adjust according to your service
          // Navigate to home or another route where the side nav bar is used
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.snackBar.open('Invalid username, password, or seller ID.', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }
  

  toggleSellerLogin(): void {
    this.isSeller = !this.isSeller;
    if (this.isSeller) {
      this.loginForm.get('uniqueID')?.setValidators([Validators.required]);
    } else {
      this.loginForm.get('uniqueID')?.clearValidators();
    }
    this.loginForm.get('uniqueID')?.updateValueAndValidity();
  }

  hideShowPassword(): void {
    this.type = this.type === 'password' ? 'text' : 'password';
    this.eyeIcon = this.eyeIcon === 'fa-eye-slash' ? 'fa-eye' : 'fa-eye-slash';
  }
}
