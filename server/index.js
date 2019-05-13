const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const route = require('./route.js')
const jobs = require('./jobs.js')
const { port } = require('../config.js').server

const app = new Koa()
const router = new Router()

route(router)

jobs.postTokenPrices.start()

app
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(port)
console.log(`Listening on port: ${port}`)
