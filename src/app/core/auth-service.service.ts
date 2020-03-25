import { CoreModule } from './core.module';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: CoreModule
})

  // providedIn: 'root'
export class AuthServiceService {

  constructor() { }
}
