import { Component, inject, OnInit } from '@angular/core';
import { GetBiReports } from '../../shared/api.interface';
import { BiImplementationService } from '../../services/bi-implementation.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-report-list-shared',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './report-list-shared.component.html',
  styleUrl: './report-list-shared.component.scss'
})
export class ReportListSharedComponent implements OnInit {
  reportsInformation: GetBiReports[] = [];
  biImplementationSE = inject(BiImplementationService);
  ngOnInit(): void {
    this.getBiReportsWithCredentials();
  }
  getBiReportsWithCredentials() {
    this.biImplementationSE.getBiReports().subscribe(resp => {
      this.reportsInformation = resp;
      console.log(resp);
    });
  }
}
