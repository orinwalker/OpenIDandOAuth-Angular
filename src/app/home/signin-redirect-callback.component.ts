import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/auth-service.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin-callback',
  template: `<div>One moment, logging in...</div>`
})

export class SigninRedirectCallbackComponent implements OnInit {
  constructor(private _authService: AuthService,
              private _router: Router) { }

  ngOnInit() {
    // when the login is complete navigate to the root
    // don't handle the user since the auth service handles it
    this._authService.completeLogin().then(user => {
      // remove signin and SigninRedirectCallback component
      // from the back navigation stack 
      this._router.navigate(['/'], { replaceUrl: true });
    })
  }
}