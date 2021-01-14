const express = require('express');
const router = express.Router({
    mergeParams: true
});
const ZCRMRestClient = require('zcrmsdk');
const utils = require('../utils.js');
const url = require('url');
const _ = require('lodash');
const eventController = require('../controllers/events-log');
const cors = require('cors');

router.post('/search', async (req, res, next) => {
    
    console.log("Before search token reqd")

    var formData = req.body;
    var requestParams = formData.keyword.toString().split(" ");
    console.log("hhhheeee123", requestParams);
    input = {};
    input.module = "Allocators";
    var params = {};
    params.page = 0;
    params.per_page = 50;
    var searchStr = "(";
    var dataToSend = [];
    var slicedParams = [];

    slicedParams = requestParams.slice(0, 3);


    slicedParams.forEach((item, index) => {

        var newItem = item.replace("(", "\\(").replace(")", "\\)");
        searchStr += "(Keyword_1:equals:" + newItem + ") or (Keyword_2:equals:" + newItem + ") or (Keyword_3:equals:" + newItem + ")";

        if (index !== slicedParams.length - 1)
            searchStr += " or ";
        else
            searchStr += ")";
    });

    params.criteria = searchStr.replace(/\/\/+/g, '/');
    console.log("here again", searchStr)


    input.params = params;
    var keywords = [];
    console.log("INPUT:", input);
   // const testing = await utils.testSDK(input);

   // return res.status(200).json({ data: testing });
    // .then(function (response) {
    //     console.log("response from async func:", response);
    //     return res.status(200).json({ data: testing });
    // });
    
    ZCRMRestClient.API.MODULES.search(input).then(function (response) {
        const result = response.body;
        console.log(result)
        var resultsToFilter = JSON.parse(response.body).data;

        console.log('in search')
        if(resultsToFilter) {
            resultsToFilter.forEach(data => {
                var entireSearchStr = formData.keyword.toString().toLowerCase();
           // console.log("if: " + entireSearchStr + " includes '" + data.Keyword_1 + "' or '" + data.Keyword_2 + "' or '" + data.Keyword_3 + "'")
                // if ((data.Keyword_1 && entireSearchStr.includes(data.Keyword_1.toLowerCase()) || (data.Keyword_2 && entireSearchStr.includes(data.Keyword_2.toLowerCase())) || (data.Keyword_3 && entireSearchStr.includes(data.Keyword_3.toLowerCase())))) {
                //     dataToSend.push(data)
                // }
                if ((data.Keyword_1 && entireSearchStr.toLowerCase() === data.Keyword_1.toLowerCase()) || (data.Keyword_2 && entireSearchStr.toLowerCase() === data.Keyword_2.toLowerCase()) || (data.Keyword_3 && entireSearchStr.toLowerCase() === data.Keyword_3.toLowerCase())) {
                    dataToSend.push(data)
                }
            });
        }
        
        //console.log(dataToSend)
    }).catch(error => console.log("ZOHO error", error)).then(function (response) {
        console.log(requestParams.length)
        var newSearchStr = "(";
        if (requestParams.length > 2) {
            params.page = 0;
            params.per_page = 50;
            var nextSlice = [];

            nextSlice = requestParams.slice(2);

            nextSlice.forEach((item, index) => {

                var newItem = item.replace("(", "\\(").replace(")", "\\)");
                newSearchStr += "(Keyword_1:equals:" + newItem + ") or (Keyword_2:equals:" + newItem + ") or (Keyword_3:equals:" + newItem + ")";

                if (index !== nextSlice.length - 1)
                    newSearchStr += " or ";
                else
                    newSearchStr += ")";
            });

            params.criteria = newSearchStr.replace(/\/\/+/g, '/');

            console.log(params.criteria)
            input.params = params;
            var keywords = [];

            ZCRMRestClient.API.MODULES.search(input).then(function (response) {
                const result = response.body;

                var resultsToFilter = JSON.parse(response.body).data;

                response_info = JSON.parse(response.body).info;
               // console.log(response_info.more_records);
               if(resultsToFilter) {
                    resultsToFilter.forEach(data => {
                        var entireSearchStr = formData.keyword.toString().toLowerCase();
                    // console.log("if " +entireSearchStr+" includes ", data.Keyword_1.toLowerCase());
                    // console.log(data.Keyword_1, data.Keyword_2);
                    //  console.log(data.Keyword_1);
                    if ((data.Keyword_1 && entireSearchStr.includes(data.Keyword_1.toLowerCase()) || (data.Keyword_2 && entireSearchStr.includes(data.Keyword_2.toLowerCase())) || (data.Keyword_3 && entireSearchStr.includes(data.Keyword_3.toLowerCase())))) {
                        dataToSend.push(data)
                        }
                    });
                }
                
            }).catch(error => console.log(error))
        }
    })
    .then(function() { eventController.logEvent("search", requestParams, formData.userId) })
    .then(function (response) {
        //res.send({ data: dataToSend });
        return res.status(200).json({ data: dataToSend });
    });

});


// CONCLUSION - THE ZOHO API RULE OF RETURNING ALL MATCHES CONTAINING A WORD DOES NOT APPLY WHEN THE WORD HAS A '(' 


router.post('/', (req, res) => {
    input = {};
    input.module = "Allocators";
    var params = {};

    params.phone = '888-555-2145';
    input.body = req.body;

    ZCRMRestClient.API.MODULES.post(input).then(function (response) {
        res.send(response.body);
    });

});
router.get('/:id', (req, res) => {
    input = {};
    input.module = "Allocators";
    var params = {};
    console.log("requested", req.params.id)
    input.id = req.params.id;

    var dataToSend = [];

    ZCRMRestClient.API.MODULES.get(input).then(function (response) {
        var dataSet = JSON.parse(response.body).data;
        dataSet.forEach((item, index) => {
            dataToSend.push(item);
        });


    }).then(function (response) {
        input = {};
        input.module = "Client_Segmentation";
        var params = {};
        params.page = 0;
        params.per_page = 5;
        input.params = params;

        ZCRMRestClient.API.MODULES.get(input).then(function (response) {

            var CSegdata = JSON.parse(response.body).data;

            CSegdata.forEach(csdata => {

                if (csdata.Name == dataToSend[0].CS_Classification) {
                    dataToSend.splice(1, 0, { 'CSDATA': csdata })

                }
            });

        }).catch(error => console.log(error))
        .then(function() { eventController.logEvent("viewdetails", dataToSend[0].Name, "admin@armswissrep.com") })
        .then(function (response) {
            //res.send({ data: dataToSend });
            return res.status(200).json({ data: dataToSend });
        });

    });

});
router.get('/', (req, res) => {
    const db = utils.createDBConnection();

    var sql = `SELECT * FROM users`;
    //console.log(sql);
    db.query(sql, function (err, result) {
        if (err) throw err;

        
        else {
            return res.status(200).json(result);
        }
    });
    
})
module.exports = router