const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var example = require('./index2.js');
require('dotenv').config();
var serverless = require('serverless-http');


const app = express();

app.use(express.json())
app.use(cors());


const utils = require('../utils');

//Testing

//example.searchRecord();
//INIT Zoho Client
const ZCRMRestClient = require('zcrmsdk');

const configJson = {
    "client_id": "1000.PSJ0Y9MV9HDXWG25V5JF5Q8929QJPH", //mandatory
    "client_secret": "45435eb74026628b5dadb16d7b6cd0a3e5f6db3c7b", //mandatory
    "redirect_url": "http:/localhost:3000", //mandatory
    "user_identifier": "tim@geminisolution.co.za",
    "base_url": "www.zohoapis.com", //optional ,"www.zohoapis.com" is default value
    "iamurl": "accounts.zoho.com", //optional ,"accounts.zoho.com" is default value
    "version": "v2.1", //optional ,"v2" is default value
    "tokenmanagement": `${__dirname}/tokenManagement.js`
}

async function initialiseClient() {
    console.log("TOKEN DIR", configJson.tokenmanagement);
    await ZCRMRestClient.initialize(configJson);
}

async function bootstrapOauthFromSelfClient() {
    await initialiseClient();
    //do whatever required after initialize
    grant_token = "1000.b88a25aea1ac2d59d86d8c10fbabdbd6.47950c760625a52b3161d3b04213010c";
    user_identifier = "tim@geminisolution.co.za";

    const authResponse = await ZCRMRestClient.generateAuthTokens(user_identifier, grant_token);

    console.log("access token :" + authResponse.access_token);
    console.log("refresh token :" + authResponse.refresh_token);
    console.log("expires in :" + authResponse.expires_in);
   
}

async function testSDK() {
    await initialiseClient();
      const ZCRMRestClient = require('zcrmsdk');

      var input = {
          module: 'Allocators',
          params: {
            page: 0,
            per_page: 50,
            criteria: '((Keyword_1:equals:syz) or (Keyword_2:equals:syz) or (Keyword_3:equals:syz))'
          }
        }
        let testresponse = {};
        let message = '';
        message = await ZCRMRestClient.API.MODULES.search(input).then(function (response) {
        testresponse = JSON.parse(response.body).data;

        console.log("test response status === " +testresponse.status)
        if(testresponse.status === 'error') {
            console.log("test response status thrown === " +testresponse.message);
            innermessage = testresponse.message;
        } else {
            console.log("test response successful === " +testresponse.message);
            innermessage = 'success';
        }


        console.log(testresponse);

        //if(testresponse.status.error) console.log('got an error');
        //if(response.error) console.log('got an error')
        });

        return "HELLO" +innermessage;
     
}

// bootstrapOauthFromSelfClient();
// testSDK();


const db = utils.createDBConnection();

console.log('before route init')



const allocatorsRouter = require('../routes/allocators');
const accountsRouter = require('../routes/accounts');
const adminRouter = require('../routes/admin');
const fileRouter = require('../routes/files')



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.options('*', cors());
app.use('/allocators', cors(), allocatorsRouter);
app.use('/accounts', cors(), accountsRouter);
app.use('/admin', cors(), adminRouter);
app.use('/files', cors(), fileRouter);


app.listen(3000, function() {
    console.log('Server runnin on localhost: 3000');
});
console.log('Server init2')

module.exports = app;




