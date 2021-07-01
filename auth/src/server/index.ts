import fastify, { FastifyRequest } from 'fastify'
import { strict as assert } from 'assert'
import axios, { AxiosResponse } from 'axios'
import { GithubAuth } from '../github'
import config from '../../config'

assert(process.env.GITHUB_AUTH_CLIENT_ID?.match(/.+/))
assert(process.env.GITHUB_CLIENT_SECRET?.match(/.+/))
const GITHUB_AUTH_CLIENT_ID = String(process.env.GITHUB_AUTH_CLIENT_ID)
const GITHUB_CLIENT_SECRET = String(process.env.GITHUB_CLIENT_SECRET)

const server = fastify({ logger: false })

const auth = new GithubAuth(
    config.githubApi,
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
        const res = await auth.getUser(githubToken)
        return res
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
