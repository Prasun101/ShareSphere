import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  isLoading: boolean = false;
  isModalOpen: boolean = false;
  productForm: FormGroup;
  selectedImage: string | null = null;
  imageFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      price: ['', Validators.required],
      images: ['']
    });
  }

  ngOnInit() {
    this.createAreaChart();
    this.createPieChart();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  createAreaChart() {
    Chart.register(...registerables);
    const ctx = document.getElementById('myAreaChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [{
          label: 'Sales (£)',
          backgroundColor: 'rgba(98, 24, 235, 0.5)',
          borderColor: 'rgb(98, 24, 235)',
          data: [9000, 14000, 10000, 12000, 16000, 12000, 17000],
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Month'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Amount'
            }
          }
        }
      }
    });
  }

  createPieChart() {
    const ctx = document.getElementById('myPieChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Electronics', 'Clothing', 'Books', 'Home Appliances'],
        datasets: [{
          label: 'Sales by Category',
          backgroundColor: [
            'rgba(255, 99, 132)',
            'rgba(54, 162, 235)',
            'rgba(255, 206, 86)',
            'rgba(100, 192, 192)'
          ],
          data: [2500, 1500, 1800, 1200]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                return `${tooltipItem.label}: £${tooltipItem.raw}`;
              }
            }
          }
        }
      }
    });
  }

  addNewproduct() {
    if (this.productForm.valid && this.imageFile) {
      this.isLoading = true;
      const formData = new FormData();
      formData.append('title', this.productForm.value.title);
      formData.append('description', this.productForm.value.description);
      formData.append('category', this.productForm.value.category);
      formData.append('price', this.productForm.value.price);
      if (this.imageFile) {
        formData.append('image', this.imageFile);
      }

      this.authService.createProduct(formData).subscribe({
        next: (response) => {
          this.snackBar.open('Product created successfully!', 'Close', {
            duration: 3000
          });
          this.productForm.reset();
          this.selectedImage = null;
          this.imageFile = null;
          this.isLoading = false;
          this.closeModal();
        },
        error: (error: HttpErrorResponse) => {
          this.snackBar.open('Failed to create product: ' + error.message, 'Close', {
            duration: 3000
          });
          this.isLoading = false;
        }
      });
    }
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
