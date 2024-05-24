import { Component } from '@angular/core';
import { ReportListSharedComponent } from '../../../../components/report-list-shared/report-list-shared.component';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [ReportListSharedComponent],
  templateUrl: './report-list.component.html'
})
export default class ReportListComponent {}
