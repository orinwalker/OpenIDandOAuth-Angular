import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth-service.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(private _authService: AuthService) {
    // subscribe to the broadcast (via a Subject)
    // to get notified when the user is logged in
    this._authService.loginChanged.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    })
  }

  ngOnInit() {
    // if the user loads a different tab in the browser then returns
    // to our app, then it is a fresh load of the application, 
    // (or when the user is redirected to the STS and back again)
    // so here we load the user on launch if there is already 
    // in session storage from a previous login
    this._authService.isLoggedIn().then(loggedIn => {
      this.isLoggedIn = loggedIn;
    })
  }

  login() {
    // there no use handling the promise because redirect to the STS 
    // immediately and app will be unloaded out of memory 
    this._authService.login();
  }

  logout() {
    this._authService.logout();
  }

  isAdmin() {
    return this._authService.authContext && this._authService.authContext.isAdmin;
  }
}
