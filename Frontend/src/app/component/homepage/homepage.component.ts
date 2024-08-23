import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MegaMenuItem, MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { MegaMenuModule } from 'primeng/megamenu';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ChangeDetectorRef } from '@angular/core';
import { RatingModule } from 'primeng/rating';
import { DataViewModule } from 'primeng/dataview';

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
interface Item {
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
interface UserReview {
  text: string;
  author: string;
}


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  standalone: true,
  imports: [
    FileUploadModule,
    FormsModule,
    ChipModule,
    CarouselModule,
    ButtonModule,
    TagModule,
    ReactiveFormsModule,
    MegaMenuModule,
    CommonModule,
    RouterModule,
    ToastModule,
    InputTextModule,
    AvatarModule,
    DialogModule,
    DropdownModule,
    RatingModule,
    DataViewModule,
  
  ],
  schemas: [NO_ERRORS_SCHEMA], 
  styleUrls: ['./homepage.component.css'],
  providers: [ AuthService,MessageService]
})
export class HomepageComponent implements OnInit {
  userReviews: UserReview[] = [];
  products: Product[] = [];
  visible: boolean = false;
  layout: 'list' | 'grid' = 'list'; // or 'grid'
  sellProducts: Item[] = [];  // This will store the sell products

  title: any;
  description: any;
  

  showDialog() {
    if (this.isLoggedIn=true){
      this.visible = true;
    }
    else{
      this.snackBar.open('Sign up to share a product.', 'Close', {
        duration: 3000
      });
    }
  }
  responsiveOptions: any[] | undefined;
  items: MegaMenuItem[] | undefined;
  posts: any;
  selectedCategory: any;
  isLoading: boolean = false;
  isSeller: boolean = false;
  isLoggedIn: boolean = false;
  categories: any[] = [];
  productForm: FormGroup;
  loggedInUser: any = null;
  selectedImage: string | null = null;
  image: File | null = null;
  selectedFiles: File[] = [];

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      price: [''],
      image: ['']
    });
  }

  ngOnInit() {
    this.loadSellProducts();
    this.loadProducts();
    this.authService.getLoggedInUser().subscribe((user: any) => {
      this.loggedInUser = user;
      this.isSeller = !!user.seller_id;
      console.log("this user is seller ?"+this.isSeller);
      });
    
    this.userReviews = [
      { text: "This product has changed my life! Highly recommend.", author: "John Doe" },
      { text: "Amazing quality and great customer service.", author: "Jane Smith" },
      { text: "I’ve never been more satisfied with a purchase!", author: "Alice Johnson" },
      { text: "Fast delivery and the product exceeded expectations.", author: "Michael Brown" },
      { text: "Affordable and works like a charm. 5 stars!", author: "Emily Davis" },
      { text: "Fantastic! Will be buying again.", author: "Chris Wilson" },
      { text: "Absolutely love it. My friends are impressed too!", author: "Patricia White" }
    ];
    this.categories = [
      { label: 'Electronics', value: 'electronics' },
      { label: 'Clothing', value: 'clothing' },
      { label: 'Books', value: 'books' },
      { label: 'Household Items', value: 'household' }
    ];
    

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
  loadSellProducts() {
    this.authService.getSellProducts().subscribe({
        next: (response) => {
          this.sellProducts = response.slice(0, 12);
        },
        error: (error) => {
          console.error('Failed to load sell products:', error);
          
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
  
  

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
      this.image = file; // Save the file for upload
    }
  }
  
  

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  addNewProduct() {
    console.log('Publish button clicked');
    console.log('Form validity:', this.productForm.valid);  
    console.log('Image file:', this.image);  
    if (this.productForm.valid && this.image ) {
      console.log('Form is valid, proceeding with product creation'); 
      this.isLoading = true;
      const price = this.productForm.value.price || 0;
      const formData = new FormData();
      formData.append('title', this.productForm.value.title);
      formData.append('description', this.productForm.value.description);
      formData.append('category', this.productForm.value.category);
      formData.append('price', price.toString());
      formData.append('image', this.image);
  
      this.authService.createProduct(formData).subscribe({
        next: (response) => {
          this.snackBar.open('Product created successfully!', 'Close', {
            duration: 3000
          });
          this.productForm.reset();
          this.selectedImage = null;
          this.image = null;
          this.isLoading = false;
          this.visible = false; 
          this.cd.detectChanges();  
          this.loadProducts();
        },
        error: () => {
          this.snackBar.open('Failed to create product: ', 'Close', {
            duration: 3000
          });
          this.visible = false; 
          this.isLoading = false;
          this.cd.detectChanges();  // Ensure Angular updates the UI
        }
      });
    }
  }
  
  
  
  
   
}
