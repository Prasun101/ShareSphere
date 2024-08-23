import { Component, OnInit } from '@angular/core';
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
  selector: 'app-freeproducts',
  templateUrl: './freeproducts.component.html',
  styleUrl: './freeproducts.component.css'
})
export class FreeproductsComponent implements OnInit {
  products: Product[] = [];
  responsiveOptions: any[] | undefined;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}
  ngOnInit() {
    
    this.loadProducts();
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

  saveProduct(product: Product): void {
    console.log(product.id);
    if (product.saved) {
      this.authService.unsaveProduct(product.id).subscribe(() => {
        product.saved = false;
        this.authService.updateLocalSavedProducts(product.id, false);
        this.snackBar.open('Product unsaved successfully!', 'Close', {
          duration: 3000
        });
      });
    } else if (!product.saved) {
      this.authService.saveProduct(product.id).subscribe(() => {
        product.saved = true;
        this.authService.updateLocalSavedProducts(product.id, true);
        this.snackBar.open('Product saved successfully!', 'Close', {
          duration: 3000
        });
      });
    } else {
      this.snackBar.open('Product is already saved!', 'Close', {
        duration: 3000
      });
    }
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



  loadProducts() {
    this.authService.getFreeProducts().subscribe({
      next: (products) => {
        this.products = products;
        console.log(this.products);
      },
      error: (err) => {
        console.error('Failed to fetch products', err);
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
