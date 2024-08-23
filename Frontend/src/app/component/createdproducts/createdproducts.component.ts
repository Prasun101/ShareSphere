import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  selector: 'app-createdproducts',
  templateUrl: './createdproducts.component.html',
  styleUrls: ['./createdproducts.component.css'],
  providers: [ConfirmationService, MessageService],
})
export class CreatedproductsComponent implements OnInit {
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
    private router: Router,
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
      

      this.loadProducts();
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
    if (this.productForm == null) {
      throw new Error('productForm is null');
    }

    const title = this.productForm.get('title');
    if (title == null) {
      throw new Error('title form control is null');
    }

    const category = this.productForm.get('category');
    if (category == null) {
      throw new Error('category form control is null');
    }

    const description = this.productForm.get('description');
    if (description == null) {
      throw new Error('description form control is null');
    }

    const formData = new FormData();
    formData.append('title', title.value);
    formData.append('category', category.value);
    formData.append('description', description.value);

    if (this.selectedImage != null) {
      formData.append('image', this.selectedImage);
    }

    this.authService.updateProduct(productId, formData).subscribe({
      next: () => {
        this.myProducts(); // Refresh product list after editing
      },
      error: (error) => {
        if (error == null) {
          throw new Error('error is null');
        }
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

  sendProductMessage(productOrItem: any) {
    if (!productOrItem) {
      this.snackBar.open('No product or item provided.', 'Close', { duration: 3000 });
      return;
    }

    const recipientId = productOrItem?.user?.id;
    const productId = productOrItem?.id;
    const productTitle = productOrItem?.title;
    const productDescription = productOrItem?.description;
    const productImagePath = productOrItem?.image_path;

    if (!recipientId || !productId) {
      this.snackBar.open('Invalid product or recipient information.', 'Close', { duration: 3000 });
      return;
    }

    this.authService.sendProductMessage(productId, recipientId, productTitle, productDescription, productImagePath).subscribe({
      next: () => {
        this.snackBar.open('Message sent successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/home/messages', recipientId]);
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open('Failed to send message: ' + err.message, 'Close', { duration: 3000 });
      },
    });
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
