import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';

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
    username: string;
    profile_picture: string | null;
  };
  saved?:boolean;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-your-products',
  templateUrl: './your-products.component.html',
  styleUrls: ['./your-products.component.css']
})
export class YourProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [
    { id: 1, name: 'electronics' },
    { id: 2, name: 'books' },
    { id: 3, name: 'clothing' },
    { id: 4, name: 'household items' }
    // Add more categories as needed
  ];
  selectedCategory: string = '';
  responsiveOptions: any[] | undefined;
  selectedPriceRange: string = '';

  constructor(private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
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
    this.getSellProducts();
    
  }
  getButtonStyle(type: string): any {
    const isActive = this.selectedCategory === type || this.selectedPriceRange === type;
    return {
      'background-color': isActive ? '#007bff' : '#ffffff',
      'color': isActive ? '#ffffff' : '#007bff',
      'border': isActive ? 'none' : '1px solid #007bff',
      'border-radius': '5px',
      'padding': '8px 15px',
      'cursor': 'pointer',
      'transition': 'background-color 0.3s, color 0.3s',
      'font-weight': 'bold'
    };
  }

  getSellProducts(): void {
    this.authService.getSellProducts().subscribe(
      (data) => {
        this.products = data;
        const baseUrl = 'http://127.0.0.1:5000/uploads'; // Replace with your Flask server URL

        this.products.forEach(product => {
          // Ensure the image_path is normalized (replace backslashes with forward slashes)
          product.image_url = product.image_path.replace(/\\/g, '/');
          product.image_url = `${baseUrl}/products/${product.image_url}`;
        });

        this.filteredProducts = this.products;
      },
      (error) => {
        console.error('Error fetching sell products', error);
      }
    );
  }

  selectCategory(category: Category): void {
    this.selectedCategory = category.name;
    this.applyFilter();
  }
  filterByPriceRange(range: string): void {
    this.selectedPriceRange = range;
    this.applyFilter();
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
  applyFilter(): void {
    this.filteredProducts = this.products;

    // Filter by category if a category is selected
    if (this.selectedCategory) {
        this.filteredProducts = this.filteredProducts.filter(product => product.category === this.selectedCategory);
    }

    // Filter by price range if a price range is selected
    if (this.selectedPriceRange) {
        this.filteredProducts = this.filteredProducts.filter(product => {
            switch (this.selectedPriceRange) {
                case 'cheap':
                    return product.price > 0 && product.price <= 50;
                case 'medium':
                    return product.price > 50 && product.price <= 100;
                case 'expensive':
                    return product.price > 100;
                default:
                    return true;
            }
        });
    }
  }
  saveProduct(product: Product): void {
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
        })
      });
      
    }else{
      this.snackBar.open('Product is already saved!', 'Close', {
        duration: 3000
      })
    }
  }
}
