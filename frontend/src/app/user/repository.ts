export type GithubOrg = {
  name: string
  id: number
}

export type GithubRepo = {
  name: string
  id: number
  owner: GithubRepoOwner
}

export type GithubRepoOwner = {
  name: string
  type: 'user' | 'org'
}
