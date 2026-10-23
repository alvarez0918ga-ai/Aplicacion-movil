import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular/lazy';

import { BienvenidaPageRoutingModule } from './bienvenida-routing.module';
import { BienvenidaPage } from './bienvenida.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    BienvenidaPageRoutingModule,
  ],
  declarations: [BienvenidaPage],
})
export class BienvenidaPageModule {}