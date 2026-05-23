import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/forms-responses/forms-responses.page').then((m) => m.FormsResponsesPage),
  },
  {
    path: 'responses',
    pathMatch: 'full',
    redirectTo: '',
  },
];
