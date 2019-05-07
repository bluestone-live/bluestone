const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const route = require('./route.js')

const PORT = 3000

const app = new Koa()
const router = new Router()

route(router)

app
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(PORT)
console.log(`Listening on port: ${PORT}`)
