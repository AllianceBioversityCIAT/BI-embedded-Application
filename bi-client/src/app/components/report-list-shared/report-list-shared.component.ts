import { Component, inject } from '@angular/core';
import { BiImplementationService } from '../../services/bi-implementation.service';
import { RouterModule } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ReportControlListService } from '../../services/report-control-list.service';

@Component({
  selector: 'app-report-list-shared',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './report-list-shared.component.html',
  styleUrl: './report-list-shared.component.scss',
  animations: [
    trigger('expandable', [
      state('expand', style({ height: '*' })),
      state('collapse', style({ height: '0' })),
      transition('collapse => expand', animate('.3s cubic-bezier(0.455, 0.03, 0.515, 0.955)')),
      transition('expand => collapse', animate('.3s cubic-bezier(0.455, 0.03, 0.515, 0.955)'))
    ])
  ]
})
export class ReportListSharedComponent {
  biImplementationSE = inject(BiImplementationService);
  reportControlListSE = inject(ReportControlListService);
  expanded = false;

  expandItem(data: { expanded: boolean }) {
    data.expanded = !data.expanded;
  }
  toggleExpand() {
    this.expanded = !this.expanded;
    this,
      this.reportControlListSE.reportList.forEach(report => {
        report.expanded = this.expanded;
      });
  }
}
