const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const route = require('./route.js');
const jobs = require('./jobs.js');
const config = require('config');

const app = new Koa();
const router = new Router();

route(router);

jobs.postTokenPrices.start();
jobs.postDaiPrice.start();
jobs.updateDepositMaturity.start();

app
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods());

const { port } = config.get('server');

app.listen(port);
console.log(`Listening on port: ${port}`);
