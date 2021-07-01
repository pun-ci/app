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

assert(MAIN_PORT > 0)
assert(FRONTEND_PORT > 0)

const WAIT_FOR = [
    `http://localhost:${FRONTEND_PORT}`
]

const server = express()
const proxy = httpProxy.createProxyServer({})

proxy.on('error', (err, req, res) => {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Something is broken, maybe try again in a few secoonds.')
})

server.use(morgan('tiny'))

server.use((req, res) => {
    const target = `${req.protocol}://${req.headers.host.split(':')[0]}:${FRONTEND_PORT}`
    proxy.web(req, res, { target })
})

const main = async () => {

    await Promise.all(
        WAIT_FOR.map(async host => {
            while (true) {
                try {
                    await axios.get(host)
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
