import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'responses',
  },
  {
    path: 'responses',
    loadComponent: () =>
      import('./features/forms-responses/forms-responses.page').then((m) => m.FormsResponsesPage),
  },
];
