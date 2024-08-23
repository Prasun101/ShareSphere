import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatedproductsComponent } from './createdproducts.component';

describe('CreatedproductsComponent', () => {
  let component: CreatedproductsComponent;
  let fixture: ComponentFixture<CreatedproductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatedproductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatedproductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
