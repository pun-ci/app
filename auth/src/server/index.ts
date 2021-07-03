import fastify, { FastifyRequest } from 'fastify'
import { strict as assert } from 'assert'
import axios, { AxiosResponse } from 'axios'
import { GithubAuth } from '../github'
import config from '../../config'
import { createDb } from '../events'
import { Users } from '../user'
import { Session } from '../user/session'
import { AuthenticationError, Tokens } from '../token'
import { serialize } from 'cookie'
import fastifyCookie from 'fastify-cookie'

assert(process.env.GITHUB_AUTH_CLIENT_ID?.match(/.+/))
assert(process.env.GITHUB_CLIENT_SECRET?.match(/.+/))
assert(process.env.EVENTSTOREDB_URL?.match(/.+/))
assert(process.env.AUTH_PORT?.match(/\d+/))
assert(process.env.JWT_SECRET?.match(/.+/))

const GITHUB_AUTH_CLIENT_ID = String(process.env.GITHUB_AUTH_CLIENT_ID)
const GITHUB_CLIENT_SECRET = String(process.env.GITHUB_CLIENT_SECRET)
const EVENTSTOREDB_URL = String(process.env.EVENTSTOREDB_URL)
const JWT_SECRET = String(process.env.JWT_SECRET)
const AUTH_PORT = Number.parseInt(process.env.AUTH_PORT ?? '')


const githubAuth = new GithubAuth(
    config.githubApi,
    GITHUB_AUTH_CLIENT_ID,
    GITHUB_CLIENT_SECRET
)

const eventstore = createDb(EVENTSTOREDB_URL)

const users = new Users(eventstore)
const sessions = new Session(eventstore)
const tokens = new Tokens(JWT_SECRET)

const server = fastify({ logger: true })

server.register(fastifyCookie)

server.get('/auth/', async () => {
    return {
        status: 'OK'
    }
})

server.route({
    method: 'GET',
    url: '/auth/github/callback',
    schema: {
        querystring: {
            code: {
                type: 'string'
            }
        }
    },
    handler: async (request, reply) => {
        try {
            const { code } = request.query as { code: string }
            const githubToken = await githubAuth.getToken(code)
            const githubUser = await githubAuth.getUser(githubToken)
            const userId = await users.getUserIdByGithubUserId(githubUser.id)
            const sessionId = await sessions.createSessionId({ userId, githubToken })
            const token = tokens.createToken(sessionId)
            reply.header('Set-Cookie', serialize('punci_token', token, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
            }))
        } catch (err) {
            throw err
        } finally {
            reply.redirect('/')
        }
    }
})

server.route({
    method: 'GET',
    url: '/api/v1/user/me',
    handler: async (request, reply) => {
        try {
            const token = request.cookies.punci_token
            if (!token) {
                throw new AuthenticationError()
            }
            const sessionId = tokens.getSessionIdFromToken(token)
            const githubToken = await sessions.getGithubToken(sessionId)
            const user = await githubAuth.getUserInfo(githubToken)
            return { user }
        } catch (err) {
            if (err.constructor.name === AuthenticationError.name) {
                reply.status(401)
                reply.header('Set-Cookie', serialize('punci_token', '', {
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT')
                }))
                return { msg: 'Unauthorized' }
            }
        }
    }
})

export const startServer = async () => {
    try {
        await server.listen(AUTH_PORT)
        console.log(`Auth server started on port ${AUTH_PORT}`)
    } catch (err) {
        console.error(err)
        server.log.error(err)
        process.exit(-1)
    }
}
