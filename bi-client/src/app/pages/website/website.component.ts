import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBarComponent } from '../../components/side-bar/side-bar.component';
import { constants } from '../../data/constants';

@Component({
  selector: 'app-website',
  standalone: true,
  imports: [RouterOutlet, SideBarComponent],
  templateUrl: './website.component.html',
  styleUrl: './website.component.scss'
})
export default class WebsiteComponent {
  constants = constants;
}
