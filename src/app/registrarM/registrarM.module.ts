import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';

import { RegistrarMPageRoutingModule } from './registrarM-routing.module';
import { RegistrarMPage } from './registrarM.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistrarMPageRoutingModule
  ],
  declarations: [RegistrarMPage]
})
export class RegistrarMPageModule {}

