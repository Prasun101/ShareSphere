import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

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
    id: string;
    username: string;
    profile_picture: string | null;
  };
  saved?: boolean;
  inventoryStatus: 'In Stock' | 'Out of Stock';
}
@Component({
  selector: 'app-sellerproducts',

  templateUrl: './sellerproducts.component.html',
  styleUrl: './sellerproducts.component.css'
})
export class SellerproductsComponent {
  products: Product[] = [];
  responsiveOptions: any[] | undefined;
  editDialogVisible: boolean = false;
  editProductForm: FormGroup;
  productId: string = '';
  loggedInUser: any = null;
  productIdToDelete: string | null = null;
  selectedImage: string | null = null;
  categories: any[] = [];
  productForm!: FormGroup;
  deleteDialogVisible: boolean = false;
  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    
    private messageService: MessageService
  ) {
    this.editProductForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      image: [''],
    });

    this.categories = [
      { label: 'Electronics', value: 'electronics' },
      { label: 'Clothing', value: 'clothing' },
      { label: 'Books', value: 'books' },
      { label: 'Household Items', value: 'household' },
    ];
  }
 
  showDeleteDialog(productId: string): void {
    this.productIdToDelete = productId;
    this.deleteDialogVisible = true;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.myProducts();
    this.authService.getLoggedInUser().subscribe((user: any) => {
      this.loggedInUser = user;
    });
    this.loadProducts();

    this.responsiveOptions = [
      {
        breakpoint: '1199px',
        numVisible: 1,
        numScroll: 1,
      },
      {
        breakpoint: '991px',
        numVisible: 2,
        numScroll: 1,
      },
      {
        breakpoint: '767px',
        numVisible: 1,
        numScroll: 1,
      },
    ];
  }

  initializeForm() {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      image: [''], // Handle image as a string or URL initially
    });
  }

  myProducts(): void {
    this.authService.getMyProducts().subscribe(
      (response) => {
        this.products = response;
        console.log(this.products);
      },
      (error) => {
        console.error('Error fetching my products:', error);
      }
    );
  }

  editProduct(product: any) {
    this.editDialogVisible = true;
    this.populateProductForm(product);
    this.productId = product.id;
  }

  populateProductForm(product: any) {
    this.productForm.patchValue({
      title: product.title,
      category: product.category,
      description: product.description,
      image: `http://127.0.0.1:5000/uploads/products/${product.image_path}`,
    });

    if (product.image_path) {
      this.selectedImage = `http://127.0.0.1:5000/uploads/products/${product.image_path}`;
    } else {
      this.selectedImage = null;
    }
  }

  saveEdit() {
    if (this.productForm.valid) {
      this.saveEditedProduct(this.productId);
      this.editDialogVisible = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Product Edited',
        detail: 'Product was successfully edited.',
      });
    }
  }

  cancelEdit() {
    this.editDialogVisible = false;
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Cancelled',
      detail: 'Product edit is canceled.',
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
      this.editProductForm.patchValue({
        image: file,
      });
    }
  }

  saveEditedProduct(productId: string) {
    const formData = new FormData();
    formData.append('title', this.productForm.get('title')?.value);
    formData.append('category', this.productForm.get('category')?.value);
    formData.append('description', this.productForm.get('description')?.value);

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    this.authService.updateProduct(productId, formData).subscribe({
      next: () => {
        this.myProducts(); // Refresh product list after editing
      },
      error: (error) => {
        this.snackBar.open('Failed to update product: ' + error.message, 'Close', {
          duration: 3000,
        });
      },
    });
  }

  deleteProduct(): void {
    if (this.productIdToDelete) {
      this.authService.deleteProduct(this.productIdToDelete).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Product deleted',
            detail: 'Product was successfully deleted.',
          });
          this.loadProducts(); // Refresh the product list
          this.deleteDialogVisible = false; // Close the dialog
        },
        error: (err) => {
          this.snackBar.open('Failed to delete product: ' + err.message, 'Close', {
            duration: 3000,
          });
        }
      });
    }
  }
  loadProducts(): void {
    this.authService.getMyProducts().subscribe(
      (products) => {
        this.products = products;
      },
      (error) => {
        console.error('Failed to load products', error);
      }
    );
  }

  // Function to close the dialog without deleting
  cancelDelete(): void {
    this.deleteDialogVisible = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Delete Cancelled.',
      detail: 'Product deletion cancelled.',
    });
  }




  saveProduct(product: Product): void {
    if (product.saved) {
      this.authService.unsaveProduct(product.id).subscribe(() => {
        product.saved = false;
        this.authService.updateLocalSavedProducts(product.id, false);
        this.snackBar.open('Product unsaved successfully!', 'Close', {
          duration: 3000,
        });
      });
    } else if (!product.saved) {
      this.authService.saveProduct(product.id).subscribe(() => {
        product.saved = true;
        this.authService.updateLocalSavedProducts(product.id, true);
        this.snackBar.open('Product saved successfully!', 'Close', {
          duration: 3000,
        });
      });
    } else {
      this.snackBar.open('Product is already saved!', 'Close', {
        duration: 3000,
      });
    }
  }
  getSeverity(inventoryStatus: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    switch (inventoryStatus) {
      case 'In Stock':
        return 'success';
      case 'Out of Stock':
        return 'danger';
      default:
        return undefined;
    }
  }

}
