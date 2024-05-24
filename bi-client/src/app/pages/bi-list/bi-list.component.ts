import { Component, inject, OnInit } from '@angular/core';
import { BiImplementationService } from '../../services/bi-implementation.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GetBiReports } from '../../shared/api.interface';
import { constants } from '../../data/constants';

@Component({
  selector: 'app-bi-list',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './bi-list.component.html',
  styleUrl: './bi-list.component.scss'
})
export default class BiListComponent implements OnInit {
  reportsInformation: GetBiReports[] = [];
  biImplementationSE = inject(BiImplementationService);
  constants = constants;
  ngOnInit(): void {
    this.getBiReportsWithCredentials();
  }
  getBiReportsWithCredentials() {
    this.biImplementationSE.getBiReports().subscribe(resp => {
      this.reportsInformation = resp;
    });
  }
}
