import axios from "axios"

export class GithubAuth {

    constructor(
        private authUrl: string,
        private clientId: string,
        private clientSecret: string
    ) { }

    public async getToken(code: string): Promise<string> {
        const authResponse = await axios.post(this.authUrl,
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
}
