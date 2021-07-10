export type GithubApiConfig = {
    authUrl: string,
    userUrl: string,
}

const config = {
    githubApi: {
        authUrl: 'https://github.com/login/oauth/access_token',
        userUrl: 'https://api.github.com/user',
    }
}

export default config
