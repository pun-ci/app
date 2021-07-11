import axios from "axios"
import { validate } from "uuid"
import { GithubApiConfig } from "../../config"
import { AuthenticationError } from "../token"
import { GithubOrg, GithubRepo, GithubRepoOwner, GithubUser, GithubUserResponse } from "./types"
import parseLink from 'parse-link-header'

export class GithubAuth {

    constructor(
        private clientId: string,
        private clientSecret: string
    ) { }

    // authUrl: 'https://github.com/login/oauth/access_token',
    // userUrl: 'https://api.github.com/user',

    public async getToken(code: string): Promise<string> {
        const authResponse = await axios.post('https://github.com/login/oauth/access_token',
            {
                'client_id': this.clientId,
                'client_secret': this.clientSecret,
                'code': code,
            },
            {
                headers: {
                    Accept: "application/json"
                }
            }
        )
        return authResponse.data.access_token
    }

    public async getUser(token: string): Promise<GithubUser> {
        const { data } = await axios.get('https://api.github.com/user',
            {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    Authorization: `Bearer ${token}`
                }
            }
        )
        return {
            email: data.email,
            id: data.id,
        }
    }

    public async getUserInfo(token: string): Promise<GithubUserResponse> {
        try {
            console.log({ token })
            const { data } = await axios.get('https://api.github.com/user',
                {
                    headers: {
                        Accept: "application/vnd.github.v3+json",
                        Authorization: `Bearer ${token}`,
                    }
                }
            )
            return {
                email: data.email,
                id: data.id,
                info: data
            }
        } catch (err) {
            throw new AuthenticationError()
        }
    }

}

export class GithubRepos {

    public async getRepos(owner: GithubRepoOwner, token: string): Promise<GithubRepo[]> {
        let result: GithubRepo[] = []
        let url = `https://api.github.com/users/${owner.name}/repos`
        while (true) {
            const res = await axios.get(url,
                {
                    headers: {
                        Accept: "application/vnd.github.v3+json",
                        Authorization: `Bearer ${token}`,
                    }
                }
            )
            result = result.concat(res.data.map((repo: any) => ({
                name: repo.name,
                id: repo.id,
                owner
            })))
            if (!res.headers.link) {
                break
            }
            console.log({l: res.headers.link})
            const links: any = parseLink(res.headers.link ?? '')
            console.log({links})
            if (!links.next) {
                break
            }
            url = links.next.url
        }
        return result
    }

}

export class GithubOrgs {

    public async getOrgs(userName: string, token: string): Promise<GithubOrg[]> {
        try {
            const { data } = await axios.get(`https://api.github.com/users/${userName}/orgs`,
                {
                    headers: {
                        Accept: "application/vnd.github.v3+json",
                        Authorization: `Bearer ${token}`,
                    }
                }
            )
            return data.map((org: any) => ({
                id: org.id,
                name: org.login
            }))
        } catch (err) {
            throw new AuthenticationError()
        }
    }

}
