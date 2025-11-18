import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContratosPage } from './contratos.page';

const routes: Routes = [
  {
    path: '',
    component: ContratosPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class ContratosPageModule { }
