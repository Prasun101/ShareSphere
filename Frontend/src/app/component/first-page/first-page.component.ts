import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';

// Define the Product interface
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number; // Add originalPrice to store the random price
  image_path?: string;
}

@Component({
  selector: 'app-first-page',
  templateUrl: './first-page.component.html',
  styleUrls: ['./first-page.component.css']
})
export class FirstPageComponent implements OnInit {

  products: Product[] = [];
  chunkedProducts: Product[][] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadProducts();
  }

  // Function to chunk products into groups of 3
  chunkArray(arr: Product[], chunkSize: number): Product[][] {
    const results = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      results.push(arr.slice(i, i + chunkSize));
    }
    return results;
  }

  // Function to generate a random price for display
  generateRandomPrice(): number {
    return Math.floor(Math.random() * 100) + 10; // Random price between $10 and $100
  }

  loadProducts() {
    this.authService.getFreeProducts().subscribe({
      next: (products) => {
        if (products) {
          // Assign a random price to each product as originalPrice
          this.products = products.map((product: any) => ({
            ...product,
            originalPrice: this.generateRandomPrice()
          }));
          this.chunkedProducts = this.chunkArray(this.products, 3); // Chunk the products for display
          console.log(this.chunkedProducts);
        } else {
          console.error('Failed to fetch products - received null or undefined');
        }
      },
      error: (err) => {
        console.error('Failed to fetch products', err);
      }
    });
  }
}
