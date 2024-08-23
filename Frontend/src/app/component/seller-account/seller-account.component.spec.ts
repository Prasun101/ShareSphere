import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerAccountComponent } from './seller-account.component';

describe('SellerAccountComponent', () => {
  let component: SellerAccountComponent;
  let fixture: ComponentFixture<SellerAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerAccountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
