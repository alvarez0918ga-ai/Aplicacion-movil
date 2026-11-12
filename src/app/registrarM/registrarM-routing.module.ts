import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistrarMPage } from './registrarM.page';

const routes: Routes = [
  {
    path: '',
    component: RegistrarMPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistrarMPageRoutingModule {}

