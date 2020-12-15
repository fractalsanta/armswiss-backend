//Proposed configuration for API used by Angular app
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const router = express.Router();
const api = require('./routes/api');
const ZCRMRestClient = require('zcrmsdk');
const fs = require('fs');

var refresh_token = '';
const app = express();
var token = app.get('access_token');
const PORT = 3000;


app.use(express.json())

// Enable CORS
app.use(function( req, res, next ) {
res.header("Access-Control-Allow-Origin", "*");
res.header("Access-Control-Allow-Headers", "x-requested-with, content-type");
res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
res.header("Access-Control-Allow-Credentials", "true");
res.header("Access-Control-Max-Age", "1000000000");
// intercept OPTIONS method 
if ('OPTIONS' == req.method) { res.send(200); } else { next(); } 
});

const utils = require('./utils.js');
const allocatorsRouter = require('./routes/allocators');
const accountsRouter = require('./routes/accounts');
const adminRouter = require('./routes/admin');
const fileRouter = require('./routes/files')

app.use('/allocators', allocatorsRouter);
app.use('/accounts', accountsRouter);
app.use('/admin', adminRouter);
app.use('/files', fileRouter);
app.use(cors());
if(!app.get('access_token')) {
    utils.initAPI();
}
app.listen(PORT, function() {
    console.log('Server runnin on localhost: ', +PORT);
});
 