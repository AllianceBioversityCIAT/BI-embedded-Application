import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { BiImplementationService } from '../../src/app/services/bi-implementation.service';
import BiListComponent from '../../src/app/pages/bi-list/bi-list.component';

describe('BiListComponent', () => {
  let component: BiListComponent;
  let fixture: ComponentFixture<BiListComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiListComponent, HttpClientModule, RouterModule],
      providers: [
        BiImplementationService,
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'testId' })
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(BiListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    test('should call getBiReportsWithCredentials', () => {
      const getBiReportsWithCredentialsSpy = jest.spyOn(component, 'getBiReportsWithCredentials');
      component.ngOnInit();
      expect(getBiReportsWithCredentialsSpy).toHaveBeenCalled();
    });
  });
  describe('getBiReportsWithCredentials', () => {
    test('should call biImplementationSE.getBiReports', () => {
      const biImplementationSE =
        fixture.debugElement.injector.get<BiImplementationService>(BiImplementationService);
      const getBiReportsSpy = jest
        .spyOn(biImplementationSE, 'getBiReports')
        .mockReturnValue(of([]));
      component.getBiReportsWithCredentials();
      expect(getBiReportsSpy).toHaveBeenCalled();
    });
  });
});
