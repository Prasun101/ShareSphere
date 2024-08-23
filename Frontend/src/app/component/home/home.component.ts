import { Component } from '@angular/core';


interface SideNavToggle{
  screenWidth:number;
  collapsed:boolean;
}
@Component({
    selector: 'app-home',
    
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    
})
export class HomeComponent {
  isSeller: boolean = false;
  isSideNavCollapsed =false;
  screenWidth= 0;
  posts: any;


  onToggleSideNav(data: SideNavToggle):void{
    this.screenWidth =data.screenWidth;
    this.isSideNavCollapsed =data.collapsed;

  }
  
}
