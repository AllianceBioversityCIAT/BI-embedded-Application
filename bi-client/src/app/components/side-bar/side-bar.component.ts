import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideBarComponent {
  options = [
    {
      name: 'Home',
      link: '/website/home',
      icon: 'home'
    },
    {
      name: 'List',
      link: '/website/list',
      icon: 'list'
    }
    // {
    //   name: 'Widget',
    //   link: '/website/list',
    //   icon: 'code'
    // }
  ];
}
