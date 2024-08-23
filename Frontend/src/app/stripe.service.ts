import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    this.stripePromise = loadStripe('pk_test_51PlEjbP5jAgM3OlZ14vpuEbu79B5dL7AqpECLcP1Djn5vgBFcJCPkoPgEQfxojtEr0CyWs8LvEK56d3mJsH9AEdx00HVJr7ONO');
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await this.stripePromise;
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error('Stripe Checkout error:', error);
      }
    } else {
      console.error('Stripe.js failed to load.');
    }
  }
}
