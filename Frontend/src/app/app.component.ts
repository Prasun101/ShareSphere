import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MatSnackBar } from '@angular/material/snack-bar';

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}
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
  inventoryStatus?:  'In Stock' | 'Out of Stock'; 
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Angular_Final_Year_Project';
  products: Product[] = [];
  isSeller: boolean = false;
  isLoggedIn: boolean = false;
  loggedInUser: any = null;
  displayConfirmDialog: boolean = false;
  isSideNavCollapsed = false;
  screenWidth = 0;
  searchResults: any[] = [];
  searchQuery: string = '';
  showResults: boolean = false;

  

  constructor(private authService: AuthService,
              private router: Router,
              private route: ActivatedRoute,
              private snackBar: MatSnackBar,
               private messageService: MessageService
  ) {}
  confirmLogout(event: Event) {
    this.displayConfirmDialog = true; // Show the dialog
  }
  onAccept() {
    this.displayConfirmDialog = false;
    this.logout();
    this.messageService.add({
      severity: 'success',
      summary: 'Logout successful',
      detail: 'You have been logged out successfully.',
    });
    // Implement the logout logic here
  }
  onReject() {
    this.displayConfirmDialog = false; // Hide the dialog
    this.messageService.add({
      severity: 'info',
      summary: 'Logout Cancelled',
      detail: 'You have cancelled the logout.',
    });
}
  
  
  
  
  getBodyClass(): string {
    let styleClass = '';
    if (this.isSideNavCollapsed && this.screenWidth > 768) {
      styleClass = 'body-trimmed';
    } else if (this.isSideNavCollapsed && this.screenWidth <= 768 && this.screenWidth > 0) {
      styleClass = 'body-md-screen';
    }
    return styleClass;
  }

  ngOnInit() {
    this.authService.isLoggedIn.subscribe((status: boolean) => {
      this.isLoggedIn = status;
      console.log(this.isLoggedIn);
      if (this.isLoggedIn) {
        this.authService.getLoggedInUser().subscribe((user: any) => {
          this.loggedInUser = user;
          this.isSeller = !!user.seller_id;
          console.log(this.isSeller);
          console.log(this.isLoggedIn);
        });
      } else {
        this.isSeller = false;
      }
    });
    

    const storedIsSeller = localStorage.getItem('isSeller');
    this.isSeller = storedIsSeller === 'true';
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false; // Hide the results div
  }
  searchProducts(): void {
    if (this.searchQuery.trim() !== '') {
      this.authService.searchProducts(this.searchQuery).subscribe(
        (products) => {
          this.searchResults = products;
          console.log(this.searchResults);
          this.showResults = true; // Show the results div
        },
        (error) => {
          console.error('Error during search:', error);
        }
      );
    }
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/firstpage']);
  }

  onToggleSideNav(data: SideNavToggle): void {
    this.screenWidth = data.screenWidth;
    this.isSideNavCollapsed = data.collapsed;
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
      error: () => {
        this.snackBar.open('Failed to send message',  'Close', { duration: 3000 });
      }
    });
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

}
