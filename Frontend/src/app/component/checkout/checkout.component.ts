import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxStripeModule, StripeService } from 'ngx-stripe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxStripeModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];
  total: number = 0;
  deliveryCharge: number = 7;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private stripeService: StripeService
  ) {}

  ngOnInit(): void {
    this.fetchCartItems();
  }

  fetchCartItems(): void {
    this.authService.getCartItems().subscribe(
      (data) => {
        this.cartItems = data.items;
        this.calculateTotal();
      },
      (error) => {
        console.error('Error fetching cart items:', error);
      }
    );
  }

  calculateTotal(): void {
    this.total = this.cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0) + this.deliveryCharge;
  }
  updateCart(): void {
    this.fetchCartItems();
  }

  removeItem(productId: string): void {
    this.authService.removeFromCart(productId).subscribe(
      (response) => {
        console.log('Item removed:', response);
        this.snackBar.open('Item removed Successfully', 'Close', {
          duration: 1000
        });
        this.cartItems = this.cartItems.filter(item => item.product._id !== productId);
        this.calculateTotal();
      },
      (error) => {
        console.error('Error removing item from cart:', error);
      }
    );
  }

  getSizeOptions(category: string): string[] {
    if (category.toLowerCase() === 'clothing') {
      return ['S', 'M', 'L'];
    }
    return [];
  }

  increaseQuantity(item: any): void {
    item.quantity += 1;
    this.calculateTotal();
  }

  decreaseQuantity(item: any): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
      this.calculateTotal();
    }
  }

  createCheckoutSession(): void {
    this.authService.createCheckoutSession(this.cartItems).subscribe(
      (session) => {
        this.stripeService.redirectToCheckout({ sessionId: session.id }).subscribe(result => {
          if (result.error) {
            console.error('Error redirecting to checkout:', result.error.message);
          }
        });
      },
      (error) => {
        console.error('Error creating checkout session:', error);
      }
    );
  }
}
