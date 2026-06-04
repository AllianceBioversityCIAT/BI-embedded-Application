import { TestBed } from '@angular/core/testing';

import { ReportControlListService } from './report-control-list.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ReportControlListService', () => {
  let service: ReportControlListService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'testId' })
          }
        }
      ]
    });
    service = TestBed.inject(ReportControlListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
