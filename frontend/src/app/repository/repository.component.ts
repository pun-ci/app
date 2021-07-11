import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {RepositoryService} from "../../repository.service";
import {uniq} from "lodash";

@Component({
  selector: 'app-repository',
  templateUrl: './repository.component.html',
  styleUrls: ['./repository.component.scss']
})
export class RepositoryComponent implements OnInit {

  repositoriesList: any = null;

  constructor(
    private http: HttpClient,
    private repositoryService: RepositoryService
  ) {

  }

  async ngOnInit() {
    let response = await this.repositoryService.getRepositories().toPromise();
    const reposityByOwners = uniq(response.body.repos.map(repo => repo.owner )).map(owner => ({
      owner,
      repos: response.body.repos.filter(repo => repo.owner.name === owner.name)
    }))
    this.repositoriesList = reposityByOwners;
    console.log(this.repositoriesList);
  }

}
