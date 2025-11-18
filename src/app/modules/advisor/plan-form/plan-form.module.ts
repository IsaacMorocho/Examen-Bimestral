import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanFormPage } from './plan-form.page';

const routes: Routes = [
  {
    path: '',
    component: PlanFormPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class PlanFormPageModule { }
