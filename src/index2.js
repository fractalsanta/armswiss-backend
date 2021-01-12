//var crmclient = require("zcrmsdk");
const ZCRMRestClient = require('zcrmsdk');
class ZohoClient{
    constructor(){


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

        ZCRMRestClient.initialize(configJson);
    }
    async isTokenGenerated(){
        var persistenceModule = require(ZCRMRestClient.getPersistenceModule());
        try{
            let token = await persistenceModule.getOAuthTokens(ZCRMRestClient.getUserIdentifier());
            return token != undefined && token.length != 0 ? true: false;
        }catch(e){
            return false;
        }
    }

    async searchRecord(){
        if(!await this.isTokenGenerated()){
            await ZCRMRestClient.generateAuthTokens(ZCRMRestClient.getUserIdentifier(),"1000.0d52e74e0086daf3456b4ec97d402591.3c5bb8ff21ff332d0a77db6f39779525").then(function(auth_response){
                console.log("access token :"+auth_response.access_token);
                console.log("refresh token :"+auth_response.refresh_token);
                console.log("expires in :"+auth_response.expires_in);
            });
        }

        // Records to be inserted are constructed as JSON objects of a JSON array, which corresponds to the 'data' key
        // of the input
        // The field names and their values are sent as key-value pairs of the JSON object of a record
        // The field API names can be found at Setup -> DEVELOPER SPACE -> APIs in the online CRM account view
        // For example, 'Company' and 'Last_Name' are API names of fields of the Leads module

       // var leadJSON = JSON.parse(`{ \"data\": [ { \"Company\": \"Zylker\", \"Last_Name\": \"Patrica\" }, { \"Company\": \"Zylker\", \"Last_Name\": \"Boyle\" } ] }`);
       var input = {
        module: 'Allocators',
        params: {
          page: 0,
          per_page: 50,
          criteria: '((Keyword_1:equals:syz) or (Keyword_2:equals:syz) or (Keyword_3:equals:syz))'
        }
      }
        // // The JSON array is sent in the 'body' element of the 'input' of the request
       // input.body = leadJSON;
        await ZCRMRestClient.API.MODULES.search(input).then(function(response, error) {
            // Response of the API call is returned in the 'body'
            // The result of every individual record insersion is returned as a JSON object of the
            // JSON array corresponding to the 'data' key of the response
            console.log("sss", JSON.parse(response.body).data);
            
        });
    }
}
obj = new ZohoClient();
//obj.insertRecord();

module.exports = obj;
 