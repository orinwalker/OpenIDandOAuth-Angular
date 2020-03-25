import { Injectable } from '@angular/core';
import { UserManager, User } from 'oidc-client';
import { Constants } from '../constants';
import { Subject } from 'rxjs';
import { CoreModule } from './core.module';
import { HttpClient } from '@angular/common/http';
import { AuthContext } from '../model/auth-context';

@Injectable()
export class AuthService {
  private _userManager: UserManager;
  private _user: User;

  // Allows broadcast of login status
  private _loginChangedSubject = new Subject<boolean>();

  loginChanged = this._loginChangedSubject.asObservable();
  authContext: AuthContext;

  constructor(private _httpClient: HttpClient) {
    const stsSettings = {
      // this is the URL for the STS
      authority: Constants.stsAuthority,  
      // just a string name for the clientId
      client_id: Constants.clientId,      
      // points to app root 
      redirect_uri: `${Constants.clientRoot}signin-callback`, 
      // these are scopes that are allowed
      scope: 'openid profile projects-api', 
      // if using implicit flow then use 'id_token token'
      // this is the type of response (auth code flow with pixi)
      response_type: 'code',  
      // where to redirect after logout (route to a view component)
      post_logout_redirect_uri: `${Constants.clientRoot}signout-callback`,
      
      automaticSilentRenew: true,
      silent_redirect_uri: `${Constants.clientRoot}assets/silent-callback.html`,
     
      // NOTE: uncomment this to work with Auth0
      // metadata: {
      //   issuer: `${Constants.stsAuthority}`,
      //   authorization_endpoint: `${Constants.stsAuthority}authorize?audience=projects-api`,
      //   jwks_uri: `${Constants.stsAuthority}.well-known/jwks.json`,
      //   token_endpoint: `${Constants.stsAuthority}oauth/token`,
      //   userinfo_endpoint: `${Constants.stsAuthority}userinfo`,
      //   end_session_endpoint: `${Constants.stsAuthority}v2/logout?client_id=${Constants.clientId}&returnTo=${encodeURI(Constants.clientRoot)}signout-callback`
      // }
    };
    this._userManager = new UserManager(stsSettings);
    this._userManager.events.addAccessTokenExpired(_ => {
      // the token expired:
      // fire the observable to broadcast that the login status has changed
      this._loginChangedSubject.next(false);
    });
    this._userManager.events.addUserLoaded(user => {
      if (this._user !== user) {
        this._user = user;
        this.loadSecurityContext();
        // login is completed:
        // fire the observable to broadcast that the login status has changed
        this._loginChangedSubject.next(!!user && !user.expired);
      }
    });

  }

  login() {
    // run the code:
    // GET https://securingangularappscoursev2-sts.azurewebsites.net/connect/authorize?client_id=spa-client&redirect_uri=http%3A%2F%2Flocalhost%3A4200%2Fsignin-callback&response_type=code&scope=openid%20profile%20projects-api&state=1f04bd374ea24b35aab3352a3e1f43d5&code_challenge=p9G47n-gROMkWQvwYS5KFe2DFZYnv79BiC9NNgNoXlg&code_challenge_method=S256&response_mode=query 
    // return the promise from this redirect
    return this._userManager.signinRedirect();
  }

  // returns a promise that lets us know if the user is logged in
  isLoggedIn(): Promise<boolean> {
    return this._userManager.getUser().then(user => {
      const userCurrent = !!user && !user.expired;
      if (this._user !== user) {
        // query the observable to get the users login status
        this._loginChangedSubject.next(userCurrent);
      }
      if (userCurrent && !this.authContext) {
        this.loadSecurityContext();
      }
      this._user = user;
      return userCurrent;
    });
  }

  completeLogin() {
    // get the response from the STS
    return this._userManager.signinRedirectCallback().then(user => {
      // set the logged in user here in the auth service
      this._user = user;
      // broad cast this to the observable
      this._loginChangedSubject.next(!!user && !user.expired);
      return user;
    });
  }

  logout() {
    // redirect to STS to logout to invalidate token and sign in session
    this._userManager.signoutRedirect();
  }

  completeLogout() {
    // invalidate user 
    this._user = null;
    // invalidate user object
    this._loginChangedSubject.next(false);
    return this._userManager.signoutRedirectCallback();
  }

  getAccessToken() {
    return this._userManager.getUser().then(user => {
      if (!!user && !user.expired) {
        return user.access_token;
      }
      else {
        return null;
      }
    });
  }

  loadSecurityContext() {
    this._httpClient
      .get<AuthContext>(`${Constants.apiRoot}Projects/AuthContext`)
      .subscribe(
        context => {
          this.authContext = new AuthContext();
          this.authContext.claims = context.claims;
          this.authContext.userProfile = context.userProfile;
        },
        error => console.error(error)
      );
  }

}