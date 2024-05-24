import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'bi/:reportName',
    loadComponent: () => import('./pages/bi/bi.component')
  },
  {
    path: 'bi/:reportName/:event',
    loadComponent: () => import('./pages/bi/bi.component')
  },
  {
    path: 'bi-list',
    loadComponent: () => import('./pages/bi-list/bi-list.component')
  },
  {
    path: '',
    loadComponent: () => import('./pages/not-found/not-found.component')
  },
  {
    path: 'website',
    loadComponent: () => import('./pages/website/website.component'),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/website/pages/home/home.component')
      },
      {
        path: 'list',
        loadComponent: () => import('./pages/website/pages/report-list/report-list.component')
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full'
  }
];
