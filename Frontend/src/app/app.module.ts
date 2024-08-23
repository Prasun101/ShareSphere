import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './component/login/login.component';
import { SignupComponent } from './component/signup/signup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from './auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SidenavComponent } from './component/sidenav/sidenav.component';
import { HomeComponent } from './component/home/home.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { TokenInterceptor } from './token.interceptor';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { ProfileComponent } from './component/profile-management/profile/profile.component';
import { BillingComponent } from './component/profile-management/billing/billing.component';
import { ProfileManagementComponent } from './component/profile-management/profile-management.component';
import {NgxStripeModule} from 'ngx-stripe';
import { MegaMenuModule } from 'primeng/megamenu';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { ChipModule } from 'primeng/chip';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { YourProductsComponent } from './component/your-products/your-products.component';
import { FreeproductsComponent } from './component/freeproducts/freeproducts.component';
import { SavedProductsComponent } from './component/savedproducts/savedproducts.component';
import { CreatedproductsComponent } from './component/createdproducts/createdproducts.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ActivityComponent } from './component/activity/activity.component';
import { ConfirmationService, MessageService } from 'primeng/api'; 
import { SellerproductsComponent } from './component/sellerproducts/sellerproducts.component';
import { OrdersComponent } from './component/orders/orders.component';
import { PromoteComponent } from './component/promote/promote.component';
import { SellerAccountComponent } from './component/seller-account/seller-account.component';
import { FirstPageComponent } from './component/first-page/first-page.component';


const config: SocketIoConfig = { url: 'http://localhost:5000', options: {} };

const routes:any = [];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    SidenavComponent,
    HomeComponent,
    DashboardComponent,
    ProfileComponent,
    BillingComponent,
    ProfileManagementComponent,
    YourProductsComponent,
    FreeproductsComponent,
    SavedProductsComponent,
    CreatedproductsComponent,
    ActivityComponent,
    SellerproductsComponent,
    OrdersComponent,
    PromoteComponent,
    SellerAccountComponent,
    FirstPageComponent
    
  ],
  imports: [
    MatSnackBarModule,
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    AppRoutingModule,
    MegaMenuModule,
    HttpClientModule,
    MatIconModule,
    NgxStripeModule.forRoot('pk_test_51PlEjbP5jAgM3OlZ14vpuEbu79B5dL7AqpECLcP1Djn5vgBFcJCPkoPgEQfxojtEr0CyWs8LvEK56d3mJsH9AEdx00HVJr7ONO'),
    SocketIoModule.forRoot(config),
    RouterModule.forRoot(routes),
    ReactiveFormsModule,
    FormsModule,
    FormsModule,
    ChipModule,
    CarouselModule,
    ButtonModule,
    TagModule,
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
    ConfirmDialogModule
    
  ],
  
  providers: [
    AuthService,
    ConfirmationService,
    MessageService,

    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
