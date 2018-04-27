/**
 * Created by donaldyu on 2018/4/27.
 */
const Koa = require('koa');
const route = require('koa-route');
const fs = require('fs');
const path = require('path');
const app = new Koa();
const serve = require('koa-static');

const staticFile = serve(path.join(__dirname, 'public'));

app.use(staticFile);

app.listen(3000);
console.log('app started at port 3000...');