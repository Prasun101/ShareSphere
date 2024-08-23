import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-promote',
  templateUrl: './promote.component.html',
  styleUrl: './promote.component.css'
})
export class PromoteComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void { }

  subscribeToPlan(planType: string): void {
    this.authService.createAdsCheckoutSession(planType).subscribe({
      next: (response) => {
        window.location.href = `https://checkout.stripe.com/pay/${response.id}`;
      },
      error: (error) => {
        console.error('Failed to create checkout session', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create checkout session.' });
      }
    });
  }

}
