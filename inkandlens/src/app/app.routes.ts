import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { UserPortal } from './components/user/user';
import { AdminPortal } from './components/admin/admin';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'user', component: UserPortal },
    { path: 'admin', component: AdminPortal },
    { path: '**', redirectTo: 'login' }
];
