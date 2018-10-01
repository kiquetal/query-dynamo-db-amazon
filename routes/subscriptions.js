var express = require('express');
var router = express.Router();
var aws=require("aws-sdk");

/* GET home page. */

const TransactionState={
    "SUBSCRIBED":"SUB",
    "UNSUBSCRIBED":"UNS",
    "UPDATED":"UPD"

};

router.get("/:subscriptionId",function(req,res,next){

    var subscriptionId=req.params.subscriptionId;
    aws.config.update({accessKeyId: 'AKIAIYM6ILBTK5NFUOGQ', secretAccessKey: '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', region: "us-east-1"});
    var docClient=new aws.DynamoDB.DocumentClient();

    var toObj={
        "msisdn":subscriptionId
    };
    var params={
        TableName:"amazon-subscriptions",
        Key:toObj

    };

    docClient.get(params,function(err,data) {

        if (err) {
            res.json({"error": {"msg": "could not update item", "description": err.toLocaleString()}})
        }
        else {
            res.json(data);
        }
    });


});

router.put("/:subscriptionId",function(req,res,next)
{
    var subscriptionId=req.params.subscriptionId;
    aws.config.update({accessKeyId: 'AKIAIYM6ILBTK5NFUOGQ', secretAccessKey: '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', region: "us-east-1"});
    var docClient=new aws.DynamoDB.DocumentClient();

    var toObj={
        "msisdn":subscriptionId
    };
    console.log(JSON.stringify(toObj))
    var params={
        TableName:"amazon-subscriptions",
        Key:toObj,
        ConditionExpression:"attribute_exists(#msisdn)",
        ExpressionAttributeNames : {"#msisdn":"msisdn"},

        UpdateExpression:"SET subscriptionCode = :subscriptionCode",
        ExpressionAttributeValues:{
            ":subscriptionCode":req.body.subscriptionCode
        },
        ReturnValues:"ALL_NEW"


    };

    docClient.update(params,function(err,data){

        if (err)
        {
            res.json({"error":{"msg":"could not update item","description":err.toLocaleString()}})
        }
        else {
            console.log("agregando a las subscripitons"+JSON.stringify(data))
            var txTransacion={}
            txTransacion["id"]=new Date().toISOString()+subscriptionId;
            txTransacion["state"]=TransactionState.UPDATED;
            txTransacion["updateFields"]=data
            txTransacion["timestamp"]=new Date().toJSON();
            txTransacion["plans"]=req.body.plans;
            txTransacion["msisdn"]=toObj["msisdn"]
            // res.json("ok");
            createTransaction(txTransacion,res);
        }

    });

});


router.delete("/:subscriptionId",function(req,res,next)
{

    var subscriptionId=req.params.subscriptionId;
    aws.config.update({accessKeyId: 'AKIAIYM6ILBTK5NFUOGQ', secretAccessKey: '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', region: "us-east-1"});
    var toObj={
        "msisdn":subscriptionId
    };
    var docClient=new aws.DynamoDB.DocumentClient();

    var params={
        TableName:"amazon-subscriptions",
        Key:toObj,
        ConditionExpression:"attribute_exists(#msisdn)",
        ExpressionAttributeNames : {"#msisdn":"msisdn"},
        ReturnValues:"ALL_OLD"

    };

    docClient.delete(params,function(err,data){
        if (err)
        {
            res.json({"error":{"msg":"could not delete item","description":err.toLocaleString()}})
        }
        else {
            console.log("agregando a las subscripitons"+JSON.stringify(data))
            var txTransacion={}
            txTransacion["id"]=new Date().toISOString()+subscriptionId;
            txTransacion["state"]=TransactionState.UNSUBSCRIBED;
            txTransacion["timestamp"]=new Date().toJSON();
            txTransacion["msisdn"]=toObj["msisdn"]
            txTransacion["originalFields"]=data
            // res.json("ok");
            createTransaction(txTransacion,res);
        }
    })


});


router.post('/',function(req,res,next)
{

    console.log("obtaining from "+ req.body);

    var toObj=req.body;
    toObj["timestamp"]=new Date().toJSON();
    console.log(toObj);
    console.log(toObj["msisdn"]);
    aws.config.update({accessKeyId: 'AKIAIYM6ILBTK5NFUOGQ', secretAccessKey: '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', region: "us-east-1"});
    var docClient=new aws.DynamoDB.DocumentClient();
    var params={
        TableName:"amazon-subscriptions",
        Item:toObj,
        ConditionExpression:"attribute_not_exists(#msisdn)",
        ExpressionAttributeNames : {"#msisdn":"msisdn"}

    };


    docClient.put(params,function(err,data){
        if (err)
        {
            res.json({"error":{"msg":"could not add item","description":err.toLocaleString()}})
        }
        else {
        console.log("agregando a las subscripitons"+JSON.stringify(data))
        var txTransacion={}
        txTransacion["id"]=new Date().toISOString()+req.body["msisdn"];
        txTransacion["state"]=TransactionState.SUBSCRIBED;
        txTransacion["timestamp"]=new Date().toJSON();
        txTransacion["originalFields"]=params.Item;
        txTransacion["msisdn"]=toObj["msisdn"]
      // res.json("ok");
         createTransaction(txTransacion,res);
            }
        })




});


function createTransaction(txBody,res)
{
    aws.config.update({accessKeyId: 'AKIAIYM6ILBTK5NFUOGQ', secretAccessKey: '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', region: "us-east-1"});
    const docClient=new aws.DynamoDB.DocumentClient();

    const params={
        TableName:"amazon-transactions",
        Item:txBody

    }

    docClient.put(params,function (err,data){

        if (err)
        {
            res.json({"error":{"description":err.toString()}});
        }
        else {
        res.json(params.Item);
            }
        })


}

router.get('/', function(req, res, next) {


    aws.config.update({accessKeyId: 'AKIAIYM6ILBTK5NFUOGQ', secretAccessKey: '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', region: "us-east-1"});
    const docClient=new aws.DynamoDB.DocumentClient();
    const params={
        TableName:"amazon-subscriptions",

    }


    docClient.scan(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {

            res.json(data);
        }
    });

});

module.exports = router;
