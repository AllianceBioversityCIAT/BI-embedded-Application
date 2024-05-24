import { inject, Injectable } from '@angular/core';
import { BiImplementationService } from './bi-implementation.service';
import { GetBiReports } from '../shared/api.interface';

@Injectable({
  providedIn: 'root'
})
export class ReportControlListService {
  reportList: GetBiReports[] = [];

  biImplementationSE = inject(BiImplementationService);

  constructor() {
    this.getBiReportsWithCredentials();
  }

  getBiReportsWithCredentials() {
    this.biImplementationSE.getBiReports().subscribe(resp => {
      this.reportList = resp;
    });
  }
}
