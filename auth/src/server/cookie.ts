import { FastifyReply } from 'fastify'
import { CookieSerializeOptions, serialize } from 'cookie'

const TOKEN_NAME = 'punci_token'

const options: CookieSerializeOptions = {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
}

export const deleteToken = (reply: FastifyReply) => {
    reply.header('Set-Cookie', serialize(TOKEN_NAME, '', {
        ...options,
        expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT'),
    }))
}

export const saveToken = (reply: FastifyReply, token: string) => {
    reply.header('Set-Cookie', serialize(TOKEN_NAME, token, options))
}
