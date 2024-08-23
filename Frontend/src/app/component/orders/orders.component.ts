import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface Order {
  orderId: string;
  date: Date;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  
  orders = [
    {
        product: {
            title: "Sneakers",
            price: 78,
            description: "Comfortable and stylish sneakers.",
            category: "Clothing",
            image_path: "https://images.squarespace-cdn.com/content/v1/5c641b18da50d324fa8e85f0/e7cdbf2e-28db-4450-b6b5-e53fe2489baa/nike+women+pegasus+40+review+chloe+hamard.JPG?format=1000w"
        },
        customer: {
            name: "John Doe",
            email: "john.doe@example.com"
        },
        status: "Pending"
    },
    {
        product: {
            title: "Teal T-Shirt",
            price: 49,
            description: "Soft cotton t-shirt in teal.",
            category: "Clothing",
            image_path: "https://th.bing.com/th/id/R.77a2bdd0d68e339ba597329b228a8f98?rik=r2rRl3MbDD3VEA&pid=ImgRaw&r=0"
        },
        customer: {
            name: "Jane Smith",
            email: "jane.smith@example.com"
        },
        status: "Shipped"
    },
    {
        product: {
            title: "Yellow Earbuds",
            price: 89,
            description: "Wireless earbuds with superior sound quality.",
            category: "Electronics",
            image_path: "https://th.bing.com/th/id/OIP.UkwT21G5qvsm1cUO-_faPwHaHa?w=1500&h=1500&rs=1&pid=ImgDetMain"
        },
        customer: {
            name: "Mike Johnson",
            email: "mike.johnson@example.com"
        },
        status: "Delivered"
    }
];



  constructor() { }

  ngOnInit(): void {
    
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'warning';
      case 'shipped':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return undefined; // If no match is found, return undefined or any other default severity
    }
  }
  
}
