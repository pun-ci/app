import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UserService} from '../user.service';
import {GithubUserResponse} from './user/user';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  user: GithubUserResponse = null;
  logged = false;

  constructor(
      private http: HttpClient,
      private userService: UserService
              ) {
  }

// todo: spinner
  async  ngOnInit() {
    let response = await this.userService.getUser().toPromise();

    if (response.status == 200) {
      console.log(response);
      this.logged = true;
      this.user = response.body.user as GithubUserResponse;
      console.log(this.user);
    } else {
      console.log({response});
    }
  }

}




