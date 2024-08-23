import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';



interface Activity {
  user_id: string;
  username:string;
  profile_picture:string;
  activity_type: string;
  activity_details: {
    product_id?: string;
    title?: string;
    category?: string;
  };
  other_user_details?: {
    username?: string;
    profile_picture?: string;
  };
  timestamp: string;
}
@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.css'
})
export class ActivityComponent  implements OnInit{
  activities: Activity[] = [];
  isSeller: boolean = false;
  isLoggedIn: boolean = false;
  loggedInUser: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadActivities();
    this.authService.isLoggedIn.subscribe((status: boolean) => {
      this.isLoggedIn = status;
      if (this.isLoggedIn) {
        this.authService.getLoggedInUser().subscribe((user: any) => {
          this.loggedInUser = user;
          this.isSeller = !!user.seller_id;
          console.log(this.isSeller);
          console.log(this.loggedInUser);
        });
      } else {
        this.isSeller = false;
      }
    });
  }

  loadActivities(): void {
    this.authService.getActivity().subscribe(
      (data: Activity[]) => {
        this.activities = data;
        console.log('Activities:', this.activities);
      },
      (error) => {
        console.error('Failed to load activities', error);
      }
    );
  }
}
