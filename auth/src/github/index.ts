import axios from "axios"
import { validate } from "uuid"
import { GithubApiConfig } from "../../config"
import { AuthenticationError } from "../token"
import { GithubUser, GithubUserResponse } from "./types"

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
        }
    }

    public async getUserInfo(token: string): Promise<GithubUserResponse> {
        console.log({ token })
        try {
            const { data } = await axios.get(this.apiConfig.userUrl,
                {
                    headers: {
                        Accept: "application/vnd.github.v3+json",
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            console.log({ data })
            return {
                email: data.email,
                id: data.id,
                info: data
            }
        } catch (err) {
            console.log({ err })
            throw new AuthenticationError()
        }
    }

}
