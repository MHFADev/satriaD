const app = require('../server/index');
const serverless = require('serverless-http');

module.exports = serverless(app);
