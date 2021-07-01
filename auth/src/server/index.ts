import fastify, { FastifyRequest } from 'fastify'
import { strict as assert } from 'assert'
import axios, { AxiosResponse } from 'axios'

assert(process.env.GITHUB_AUTH_CLIENT_ID?.match(/.+/))
assert(process.env.GITHUB_CLIENT_SECRET?.match(/.+/))
assert(process.env.GITHUB_API_AUTH?.match(/.+/))
const GITHUB_AUTH_CLIENT_ID = String(process.env.GITHUB_AUTH_CLIENT_ID)
const GITHUB_CLIENT_SECRET = String(process.env.GITHUB_CLIENT_SECRET)
const GITHUB_API_AUTH = String(process.env.GITHUB_API_AUTH)

const server = fastify({ logger: false })

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
        const authResponse = await axios.post(GITHUB_API_AUTH,
            {
                'client_id': GITHUB_AUTH_CLIENT_ID,
                'client_secret': GITHUB_CLIENT_SECRET,
                'code': code,
            },
            {
                headers: {
                    Accept: "application/json"
                }
            }
        )
        console.log(authResponse)
        const githubToken = authResponse.data.access_token

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
