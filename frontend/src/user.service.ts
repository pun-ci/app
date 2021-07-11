import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {GithubUserResponse} from './app/user/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) {
    console.log('666');
  }

  getUser() {
    return this.http.get<{user: GithubUserResponse}>(
      '/api/v1/user/me', { observe: 'response' });
  }
}
