import { Component, inject } from '@angular/core';
import { ReportListSharedComponent } from '../../../../components/report-list-shared/report-list-shared.component';
import { ReportControlListService } from '../../../../services/report-control-list.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReportListSharedComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export default class HomeComponent {
  reportControlListSE = inject(ReportControlListService);
}
