import fastify, { FastifyRequest } from 'fastify'
import { strict as assert } from 'assert'
import axios, { AxiosResponse } from 'axios'
import { GithubAuth } from '../github'

assert(process.env.GITHUB_AUTH_CLIENT_ID?.match(/.+/))
assert(process.env.GITHUB_CLIENT_SECRET?.match(/.+/))
assert(process.env.GITHUB_API_AUTH?.match(/.+/))
const GITHUB_AUTH_CLIENT_ID = String(process.env.GITHUB_AUTH_CLIENT_ID)
const GITHUB_CLIENT_SECRET = String(process.env.GITHUB_CLIENT_SECRET)
const GITHUB_API_AUTH = String(process.env.GITHUB_API_AUTH)

const server = fastify({ logger: false })

const auth = new GithubAuth(
    GITHUB_API_AUTH,
    GITHUB_AUTH_CLIENT_ID,
    GITHUB_CLIENT_SECRET
)

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
        const { code } = request.query as { code: string }
        const githubToken = await auth.getToken(code)
        return { githubToken }
    }
})

export const startServer = async () => {
    try {
        await server.listen(5200)
    } catch (err) {
        server.log.error(err)
        process.exit(-1)
    }
}
