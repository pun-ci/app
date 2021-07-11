import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {GithubRepo} from "./app/user/repository";

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {

  constructor(private http: HttpClient) {
    console.log('666');
  }

  getRepositories() {
    return this.http.get<{repos: GithubRepo[]}>(
      '/api/v1/repo', { observe: 'response' });
  }
}
