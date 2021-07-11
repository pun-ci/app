import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { strict as assert } from 'assert'
import axios, { AxiosResponse } from 'axios'
import { GithubAuth, GithubOrgs, GithubRepos } from '../github/github'
import config from '../../config'
import { createDb } from '../events'
import { Users } from '../user'
import { Session } from '../user/session'
import { AuthenticationError, Tokens } from '../token'
import { serialize } from 'cookie'
import fastifyCookie from 'fastify-cookie'
import fastifyFormBody from 'fastify-formbody'
import { GithubRepoOwner } from '../github/types'
import {flatten} from 'lodash'

assert(process.env.GITHUB_AUTH_URL?.match(/.+/))
assert(process.env.GITHUB_AUTH_CLIENT_ID?.match(/.+/))
assert(process.env.GITHUB_CLIENT_SECRET?.match(/.+/))
assert(process.env.EVENTSTOREDB_URL?.match(/.+/))
assert(process.env.API_PORT?.match(/\d+/))
assert(process.env.JWT_SECRET?.match(/.+/))

const GITHUB_AUTH_URL = String(process.env.GITHUB_AUTH_URL)
const GITHUB_AUTH_CLIENT_ID = String(process.env.GITHUB_AUTH_CLIENT_ID)
const GITHUB_CLIENT_SECRET = String(process.env.GITHUB_CLIENT_SECRET)
const EVENTSTOREDB_URL = String(process.env.EVENTSTOREDB_URL)
const JWT_SECRET = String(process.env.JWT_SECRET)
const API_PORT = Number.parseInt(process.env.API_PORT ?? '')


const githubRepos = new GithubRepos()
const githubAuth = new GithubAuth(GITHUB_AUTH_CLIENT_ID, GITHUB_CLIENT_SECRET)
const githubOrgs = new GithubOrgs()

const eventstore = createDb(EVENTSTOREDB_URL)

const users = new Users(eventstore)
const sessions = new Session(eventstore)
const tokens = new Tokens(JWT_SECRET)

const server = fastify({ logger: true })

server.register(fastifyCookie)
server.register(fastifyFormBody)

server.get('/api/', async () => {
    return {
        status: 'OK'
    }
})

const TOKEN_NAME = 'punci_token'

const deleteToken = (reply: FastifyReply) => {
    reply.header('Set-Cookie', serialize(TOKEN_NAME, '', {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT'),
    }))
}

server.route({
    method: 'GET',
    url: '/api/v1/repo',
    handler: async (request, reply) => {
        try {
            const token = request.cookies.punci_token
            if (!token) {
                throw new AuthenticationError()
            }
            const sessionId = tokens.getSessionIdFromToken(token)
            const githubToken = await sessions.getGithubToken(sessionId)
            const user = await githubAuth.getUserInfo(githubToken)
            const orgs = await githubOrgs.getOrgs(user.info.login, githubToken)
            let owners: GithubRepoOwner[] = [
                {
                    name: user.info.login,
                    type: 'user',
                }
            ]
            orgs.forEach(org => {
                owners = owners.concat([{
                    name: org.name,
                    type: 'org',
                }])
            })
            const repos = await Promise.all(owners.map(async owner => {
                return await githubRepos.getRepos(owner, githubToken)
            }))
            return {repos}
        } catch (err) {
            console.log({ERR: err})
            if (err.constructor.name === AuthenticationError.name) {
                console.trace()
                reply.status(401)
                deleteToken(reply)
                return { msg: 'Unauthorized' }
            }
            throw err
        }
    }
})

server.route({
    method: 'GET',
    url: '/api/v1/github-org',
    handler: async (request, reply) => {
        try {
            const token = request.cookies.punci_token
            if (!token) {
                throw new AuthenticationError()
            }
            const sessionId = tokens.getSessionIdFromToken(token)
            const githubToken = await sessions.getGithubToken(sessionId)
            const user = await githubAuth.getUserInfo(githubToken)
            const orgs = await githubOrgs.getOrgs(user.info.login, githubToken)
            return {orgs}
        } catch (err) {
            if (err.constructor.name === AuthenticationError.name) {
                reply.status(401)
                deleteToken(reply)
                return { msg: 'Unauthorized' }
            }
            throw err
        }
    }
})

export const startServer = async () => {
    try {
        await server.listen(API_PORT)
        console.log(`API server started on port ${API_PORT}`)
    } catch (err) {
        console.error(err)
        server.log.error(err)
        process.exit(-1)
    }
}

// const token = request.cookies.punci_token
// if (!token) {
//     throw new AuthenticationError()
// }
// const sessionId = tokens.getSessionIdFromToken(token)
// const githubToken = await sessions.getGithubToken(sessionId)
// const user = await githubAuth.getUserInfo(githubToken)