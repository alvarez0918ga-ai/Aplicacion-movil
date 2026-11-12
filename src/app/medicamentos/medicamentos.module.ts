import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { MedicamentosPageRoutingModule } from './medicamentos-routing.module';
import { MedicamentosPage } from './medicamentos.page';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MedicamentosPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [MedicamentosPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MedicamentosPageModule { }
