import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatListPage } from './chat-list.page';

const routes: Routes = [
  {
    path: '',
    component: ChatListPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class ChatListPageModule { }
