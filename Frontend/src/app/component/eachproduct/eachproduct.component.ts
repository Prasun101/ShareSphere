import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
interface Product {
  image_url: string;
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  user_id: string;
  image_path: string;
  created_at: Date;
  user: {
    username: string;
    profile_picture: string | null;
  };
  saved?:boolean;
}

@Component({
  selector: 'app-eachproduct',
  standalone: true,
  imports: [FormsModule,CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './eachproduct.component.html',
  styleUrl: './eachproduct.component.css'
})
export class EachproductComponent {
reviewText: any;
submitReview() {
throw new Error('Method not implemented.');
}
contactSeller() {
throw new Error('Method not implemented.');
}
addToWishlist() {
throw new Error('Method not implemented.');
}
addToCart(price: number): void {
  this.authService.addToCart(this.productId, 1).subscribe(
    (response) => {
      console.log('Item added to cart:', response);
      this.snackBar.open('Item added to cart:', 'Close', {
        duration: 3000
      });
    },
    (error) => {
      console.error('Error adding item to cart:', error);
      this.snackBar.open('Error adding item to cart:', 'Close', {
        duration: 3000
      });
    }
  );
}
  product: any;
  productId: any;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private location:Location,
    private snackBar: MatSnackBar,
    private router:Router  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('product_id');
    this.fetchProductDetails();
  }
  goBack(): void {
    this.location.back();
  }

  fetchProductDetails(): void {
    this.authService.getProduct(this.productId).subscribe(
      (data) => {
        this.product = data;
        console.log(this.product);
      },
      (error) => {
        console.error('Error fetching product details:', error);
      }
    );
  }
  saveProduct(product: Product): void {
    if (product.saved) {
      this.authService.unsaveProduct(product._id).subscribe(() => {
        product.saved = false;
        this.authService.updateLocalSavedProducts(product._id, false);
        this.snackBar.open('Product unsaved successfully!', 'Close', {
          duration: 3000
        });
      });
    } else if (!product.saved) {
      this.authService.saveProduct(product._id).subscribe(() => {
        product.saved = true;
        this.authService.updateLocalSavedProducts(product._id, true);
        this.snackBar.open('Product saved successfully!', 'Close', {
          duration: 3000
        })
      });
      
    }else{
      this.snackBar.open('Product is already saved!', 'Close', {
        duration: 3000
      })
    }
  }
  sendProductMessage(product: any) {
    const recipientId = product.user_id;
    const productId = product._id;
    const productTitle = product.title;
    const productDescription = product.description;
    const productImagePath = product.image_path;

    console.log('Sending message:', {
      productId,
      recipientId,
      productTitle,
      productDescription,
      productImagePath
    });

    this.authService.sendProductMessage(productId, recipientId, productTitle, productDescription, productImagePath).subscribe({
      next: () => {
        this.snackBar.open('Message sent successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/home/messages', recipientId]); // Navigate to the messages route
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open('Failed to send message: ', 'Close', { duration: 3000 });
      }
    });
  }
}