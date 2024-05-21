import { TestBed } from '@angular/core/testing';
import { LoaderComponent } from '../../src/app/components/loader/loader.component';

describe('BiListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderComponent]
    }).compileComponents();
  });

  test('should create the app', () => {
    const fixture = TestBed.createComponent(LoaderComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
