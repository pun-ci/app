import axios from "axios"
import { GithubApiConfig } from "../../config"
import { GithubUser } from "./types"

export class GithubAuth {

    constructor(
        private apiConfig: GithubApiConfig,
        private clientId: string,
        private clientSecret: string
    ) { }

    public async getToken(code: string): Promise<string> {
        const authResponse = await axios.post(this.apiConfig.authUrl,
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
        const { data } = await axios.get(this.apiConfig.userUrl,
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
            token: token
        }
    }

}
