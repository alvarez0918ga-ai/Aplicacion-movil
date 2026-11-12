import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'bienvenida', pathMatch: 'full' },
  {
    path: 'bienvenida',
    loadChildren: () =>
      import('./bienvenida/bienvenida.module').then(m => m.BienvenidaPageModule),
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./register/register.module').then(m => m.RegisterPageModule),
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then(m => m.HomePageModule),
  },
  {
    path: 'camara',
    loadChildren: () => import('./camara/camara.module').then(m => m.CamaraPageModule)
  },
  {
    path: 'registrarM',
    loadChildren: () =>
      import('./registrarM/registrarM.module').then(m => m.RegistrarMPageModule),
  },
  {
    path: 'perfil',
    loadChildren: () =>
      import('./perfil/perfil.module').then(m => m.PerfilPageModule),
  },
  {
    path: 'medicamentos',
    loadChildren: () =>
      import('./medicamentos/medicamentos.module').then(m => m.MedicamentosPageModule),
  },
  {
    path: 'tabs/medicamentos',
    redirectTo: 'medicamentos',
    pathMatch: 'full',
  },
  {
    path: 'notificaciones',
    loadChildren: () => import('./pages/notificaciones/notificaciones.module').then( m => m.NotificacionesPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }