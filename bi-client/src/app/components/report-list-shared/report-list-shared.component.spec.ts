import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportListSharedComponent } from './report-list-shared.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ReportListSharedComponent', () => {
  let component: ReportListSharedComponent;
  let fixture: ComponentFixture<ReportListSharedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportListSharedComponent, HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'testId' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportListSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
