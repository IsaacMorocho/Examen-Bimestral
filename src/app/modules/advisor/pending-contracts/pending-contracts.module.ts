import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendingContractsPage } from './pending-contracts.page';

const routes: Routes = [
  {
    path: '',
    component: PendingContractsPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class PendingContractsPageModule { }
