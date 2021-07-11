#!/usr/bin/env node

const axios = require('axios')
const express = require('express')
const httpProxy = require('http-proxy')
const morgan = require('morgan')
const chalk = require('chalk')
const assert = require('assert').strict
const { setTimeout } = require('timers/promises')

const MAIN_PORT = Number.parseInt(process.env.MAIN_PORT)
const FRONTEND_PORT = Number.parseInt(process.env.FRONTEND_PORT)
const AUTH_PORT = Number.parseInt(process.env.AUTH_PORT)
const API_PORT = Number.parseInt(process.env.API_PORT)

assert(MAIN_PORT > 0)
assert(FRONTEND_PORT > 0)
assert(AUTH_PORT > 0)

const WAIT_FOR = [
    { name: 'Frontend', url: `http://localhost:${FRONTEND_PORT}` },
    { name: 'Auth service', url: `http://localhost:${AUTH_PORT}/auth/` },
    { name: 'API service', url: `http://localhost:${API_PORT}/api/` },
]

const server = express()
const proxy = httpProxy.createProxyServer({})

proxy.on('error', (err, req, res) => {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end(err.toString())
})

server.use(morgan('tiny'))

server.use((req, res) => {
    const targetPort = [
        { regex: /^\/auth\//, port: AUTH_PORT },
        { regex: /^\/api\/v1\/user\//, port: AUTH_PORT },
        { regex: /^\/api\/v1\//, port: API_PORT },
        { regex: /.*/, port: FRONTEND_PORT },
    ].find(route => req.path.match(route.regex)).port
    const target = `${req.protocol}://${req.headers.host.split(':')[0]}:${targetPort}`
    proxy.web(req, res, { target })
})

const main = async () => {

    await Promise.all(
        WAIT_FOR.map(async endpoint => {
            while (true) {
                try {
                    await axios.get(endpoint.url)
                    console.info(`${endpoint.name} is up`)
                    return
                } catch (err) {
                    await setTimeout(100)
                }
            }
        })
    )

    server.listen(MAIN_PORT, () => {
        console.info(`Reverse proxy started: ${chalk.yellow.bold(`http://localhost:${MAIN_PORT}`)}`)
    })
}

main()
