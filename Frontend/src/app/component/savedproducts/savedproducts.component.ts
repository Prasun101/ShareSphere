import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

interface Product {
  image_url: string;
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  user_id: string;
  image_path: string;
  created_at: Date;
  user: {
    id:string;
    username: string;
    profile_picture: string | null;
  };
  saved?: boolean;
  inventoryStatus:  'In Stock' | 'Out of Stock'; 
}
@Component({
  selector: 'app-saved-products',
  templateUrl: './savedproducts.component.html',
  styleUrls: ['./savedproducts.component.css']
})
export class SavedProductsComponent implements OnInit {
  products: Product[] = [];
  responsiveOptions: any[] | undefined;


  constructor(private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getSavedProducts();
    this.responsiveOptions = [
      {
        breakpoint: '1199px',
        numVisible: 1,
        numScroll: 1
      },
      {
        breakpoint: '991px',
        numVisible: 2,
        numScroll: 1
      },
      {
        breakpoint: '767px',
        numVisible: 1,
        numScroll: 1
      }
    ];
  }

  getSavedProducts(): void {
    this.authService.getSavedProducts().subscribe(
      (data) => {
        this.products = data.map((product: any) => ({
          ...product,
          saved: true // All these products are saved
        }));
        const baseUrl = 'http://127.0.0.1:5000/uploads'; // Replace with your Flask server URL
        this.products.forEach(product => {
          product.image_url = `${baseUrl}/products/${product.image_path}`;
        });
        console.log(this.products);
      },
      (error) => {
        console.error('Error fetching saved products', error);
      }
    );
  }

  unsaveProduct(product: Product): void {
    this.authService.unsaveProduct(product.id).subscribe(
      () => {
        this.products = this.products.filter(p => p.id !== product.id);
        this.snackBar.open('Product removed from saved.', 'Close', { duration: 3000 })
      },
      (error) => {
        console.error('Error unsaving product', error);
      }
    );
  }
  sendProductMessage(productOrItem: any) {
    if (!productOrItem) {
        this.snackBar.open('No product or item provided.', 'Close', { duration: 3000 });
        return;
    }

    // Determine if the input is product or item and extract relevant data
    const recipientId = productOrItem?.user?.id;
    const productId = productOrItem?.id;
    const productTitle = productOrItem?.title;
    const productDescription = productOrItem?.description;
    const productImagePath = productOrItem?.image_path;

    // Log values for debugging
    console.log('Recipient ID:', recipientId);
    console.log('Product ID:', productId);
    console.log('Product Title:', productTitle);
    console.log('Product Description:', productDescription);
    console.log('Product Image Path:', productImagePath);

    if (!recipientId || !productId) {
        this.snackBar.open('Invalid product or recipient information.', 'Close', { duration: 3000 });
        return;
    }

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
        this.snackBar.open('Failed to send message: ' + err.message, 'Close', { duration: 3000 });
      }
    });
  }


  getSeverity(inventoryStatus: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (inventoryStatus) {
        case 'in stock':
            return 'success';
        case 'low stock':
            return 'warning';
        case 'out of stock':
            return 'danger';
        default:
            return undefined;
    }
}

}
