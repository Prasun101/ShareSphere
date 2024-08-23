import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { Subscription } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';  

interface User {
  _id: string;
  username: string;
  email: string;
  profile_picture?: string;
  status?:boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,CardModule,RouterModule, TagModule,ButtonModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  message = '';
  messages: any[] = [];
  users: User[] = [];
  selectedUser: User | null = null;
  recipientId: string | null = null;
  loggedInUser: any = null;
  lastSeen: string | null = null;
  messageSubscription: Subscription | undefined;
  userSubscription: Subscription | undefined;
  routeSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('ChatComponent ngOnInit initialized');  // Debugging statement

    this.authService.getLoggedInUser().subscribe(
      (user: any) => {
        this.loggedInUser = user;
        console.log('Logged in user fetched', user);  // Debugging statement
      },
      (error: any) => {
        console.error('Error fetching logged in user', error);
      }
    );

    this.userSubscription = this.authService.getAllUsers().subscribe(
      (response: any) => {
        this.users = response.users;
        console.log('Users fetched', response.users);  // Debugging statement
      },
      (error: any) => {
        console.error('Error fetching users', error);
      }
    );

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.recipientId = params.get('recipientId');
      console.log('Route param recipientId:', this.recipientId);  // Debugging statement
      if (this.recipientId) {
        this.authService.joinRoom(this.recipientId);
        this.fetchMessages();
      }
    });

    this.messageSubscription = this.authService.onMessageReceived().subscribe((message: any) => {
      console.log('Received message:', message);  // Debugging statement
      if (message.sender_id === this.recipientId || message.recipient_id === this.recipientId) {
        this.messages.push(message);
      }
    });
  }

  fetchMessages(): void {
    if (this.recipientId) {
      this.authService.fetchMessages(this.recipientId).subscribe(
        (response: any) => {
          this.messages = response;
          this.lastSeen = new Date().toISOString(); 
          console.log('Messages fetched', response);  // Debugging statement
          console.log(this.messages);
          
        },
        (error: any) => {
          console.error('Error fetching messages', error);
        }
      );
    }
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.recipientId = user._id;
    this.messages = []; // Clear previous messages
    this.router.navigate(['/home/messages', this.recipientId]).then(() => {
      this.fetchMessages();
    });
  }

  sendNewMessage(): void {
    if (this.message.trim() && this.recipientId) {
      this.authService.sendMessage(this.recipientId, this.message);
      this.message = '';
      this.fetchMessages();
    }
  }

  filteredUsers(): User[] {
    if (!this.searchQuery) {
      return this.users;
    }
    return this.users.filter(user => 
      user.username.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
