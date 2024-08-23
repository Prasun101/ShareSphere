import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedproductsComponent } from './savedproducts.component';

describe('SavedproductsComponent', () => {
  let component: SavedproductsComponent;
  let fixture: ComponentFixture<SavedproductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedproductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavedproductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
