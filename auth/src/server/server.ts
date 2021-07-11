import fastify, { FastifyReply, FastifyRequest } from 'fastify'
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
import fastifyFormBody from 'fastify-formbody'

assert(process.env.GITHUB_AUTH_URL?.match(/.+/))
assert(process.env.GITHUB_AUTH_CLIENT_ID?.match(/.+/))
assert(process.env.GITHUB_CLIENT_SECRET?.match(/.+/))
assert(process.env.EVENTSTOREDB_URL?.match(/.+/))
assert(process.env.AUTH_PORT?.match(/\d+/))
assert(process.env.JWT_SECRET?.match(/.+/))

const GITHUB_AUTH_URL = String(process.env.GITHUB_AUTH_URL)
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
server.register(fastifyFormBody)

server.get('/auth/', async () => {
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

const saveToken = (reply: FastifyReply, token: string) => {
    reply.header('Set-Cookie', serialize(TOKEN_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    }))
}

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
            saveToken(reply, token)
        } catch (err) {
            throw err
        } finally {
            reply.redirect('/')
        }
    }
})

server.route({
    method: 'GET',
    url: '/auth/github',
    handler: async (request, reply) => {
        reply.redirect(GITHUB_AUTH_URL)
    }
})

server.route({
    method: 'POST',
    url: '/auth/logout',
    handler: async (request, reply) => {
        const token = request.cookies.punci_token
        if (token) {
            const sessionId = tokens.getSessionIdFromToken(token)
            sessions.delete(sessionId)
        }
        deleteToken(reply)
        reply.redirect('/')
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
                deleteToken(reply)
                return { msg: 'Unauthorized' }
            }
            throw err
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
