import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../../../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  user = {
    username: '',
    first_name: '',
    last_name: '',
    address: '',
    email: '',
    phone: '',
    birthday: '',
    profile_picture: ''
  };
 
  profilePictureUrl: string = 'http://bootdey.com/img/Content/avatar/avatar1.png';
  profilePicture: any;

  constructor(private authService: AuthService,private snackBar: MatSnackBar,) {}

  ngOnInit(): void {
    this.authService.getLoggedInUser().subscribe(
      (data: any) => {
        this.user = {
          username: data.username || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          address: data.address || '',
          email: data.email || '',
          phone: data.phone || '',
          birthday: data.birthday || '',
          profile_picture: data.profile_picture || ''
        };
        this.profilePictureUrl = this.user.profile_picture;
        console.log(this.profilePictureUrl);
          
      },
      (error: any) => {
        console.error('Error fetching user data', error);
      }
    );
  }


  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.profilePicture = event.target.files[0];
      const reader = new FileReader();
      reader.onload = e => this.profilePictureUrl = reader.result as string;
      reader.readAsDataURL(this.profilePicture);
    }
  }

  onSubmit(): void {
    const formData = new FormData();
    formData.append('username', this.user.username);
    formData.append('first_name', this.user.first_name);
    formData.append('last_name', this.user.last_name);
    formData.append('address', this.user.address);
    formData.append('email', this.user.email);
    formData.append('phone', this.user.phone);
    formData.append('birthday', this.user.birthday);
    
    if (this.profilePicture) {
      formData.append('profile_picture', this.profilePicture);
    }

    this.authService.updateProfile(formData).subscribe(
      (response: any) => {
        this.snackBar.open('Profile Details Updated Successfully', 'Close', {
          duration: 1000
        });
      },
      (error: any) => {
        this.snackBar.open(' Failed Updating Profile Details', 'Close', {
          duration: 1000
        });
      }
    );
  }
}