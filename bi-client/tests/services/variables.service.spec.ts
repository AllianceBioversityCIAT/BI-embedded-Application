import { TestBed } from '@angular/core/testing';
import { VariablesService } from '../../src/app/services/variables.service';

describe('NavigationBarService', () => {
  let service: VariablesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VariablesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
