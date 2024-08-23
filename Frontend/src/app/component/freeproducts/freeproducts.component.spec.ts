import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeproductsComponent } from './freeproducts.component';

describe('FreeproductsComponent', () => {
  let component: FreeproductsComponent;
  let fixture: ComponentFixture<FreeproductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeproductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeproductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
