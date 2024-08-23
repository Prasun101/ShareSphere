import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { SignupComponent } from './component/signup/signup.component';
import { HomeComponent } from './component/home/home.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { OrdersComponent } from './component/orders/orders.component';
import { SellerAccountComponent } from './component/seller-account/seller-account.component';
import { PromoteComponent } from './component/promote/promote.component';
import { YourProductsComponent } from './component/your-products/your-products.component';
import { FirstPageComponent } from './component/first-page/first-page.component';
import { FreeproductsComponent } from './component/freeproducts/freeproducts.component';
import { SavedProductsComponent } from './component/savedproducts/savedproducts.component';
import { ChatComponent } from './component/chat/chat.component';
import { ProfileComponent } from './component/profile-management/profile/profile.component';
import { BillingComponent } from './component/profile-management/billing/billing.component';
import { SecurityComponent } from './component/profile-management/security/security.component';
import { NotificationComponent } from './component/profile-management/notification/notification.component';
import { ProfileManagementComponent } from './component/profile-management/profile-management.component';
import { CheckoutComponent } from './component/checkout/checkout.component';
import { EachproductComponent } from './component/eachproduct/eachproduct.component';
import { SuccesspaymentComponent } from './component/successpayment/successpayment.component';
import { CancelpaymentComponent } from './component/cancelpayment/cancelpayment.component';
import { HomepageComponent } from './component/homepage/homepage.component';
import { AuthGuard } from './guards/auth.guard';
import { CreatedproductsComponent } from './component/createdproducts/createdproducts.component';
import { ActivityComponent } from './component/activity/activity.component';
import { SellerproductsComponent } from './component/sellerproducts/sellerproducts.component';


const routes: Routes = [
  { path: '', redirectTo: 'firstpage', pathMatch: 'full' },
  { path: 'firstpage',component: FirstPageComponent, canActivate: [AuthGuard]} ,
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomepageComponent},
  { path: 'yourproducts', component: SellerproductsComponent},
  { path: 'dashboard', component: DashboardComponent },
  { path: 'products', component: YourProductsComponent },
  { path: 'activity', component: ActivityComponent },
  { path: 'products/:product_id', component: EachproductComponent },
  { path: 'createdproducts', component: CreatedproductsComponent },
  { path: 'freeproducts', component: FreeproductsComponent },
  { path: 'first-page', component: FirstPageComponent } ,
  { path: 'savedproducts', component: SavedProductsComponent },
  { path: 'promote', component: PromoteComponent },
  { path: 'selleraccount', component: SellerAccountComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'cart', component: CheckoutComponent },
  { path: 'success', component: SuccesspaymentComponent },
  { path: 'cancel', component: CancelpaymentComponent },
  { path: 'home/messages/:recipientId', component: ChatComponent },
  { path: 'profilemgnt', component: ProfileManagementComponent ,children: [
    { path: '', component: ProfileComponent},
    { path: 'billing', component: BillingComponent },
    { path: 'security', component: SecurityComponent },
    { path: 'notifications', component: NotificationComponent },
    
  ]}
]
  

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
