var newrelic = require("newrelic");
var getMetricEmitter = require('@newrelic/native-metrics');
var http = require('http');
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var unirest = require('unirest');
var port = process.env.PORT || 8080;

var emitter = getMetricEmitter({timeout: 15000});
emitter.unbind();
emitter.bind(10000);

// create application/json parser
var jsonParser = bodyParser.json();

app.post("/insights/:accountNumber/key/:xinsertkey", jsonParser, function(request, response){

  //getting account Number from Path
  var accountNumber = request.params['accountNumber'];

  //getting Key from Secret
  var xInsertKey = request.params['xinsertkey'];

  //parse event, create an Insights-Formatted event based on JSON
  var insightEvent = parseEvent(request);

  console.log(JSON.stringify(insightEvent));

  if(insightEvent != null){

    //posting message to Insights
    unirest.post('https://insights-collector.newrelic.com/v1/accounts/'+accountNumber+'/events')
      .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Insert-Key': xInsertKey})
      .send(JSON.stringify(insightEvent))
      .end(function (response) {
        console.log(response.body);
    });
      //this is misleading, need to do error handling and/or status check to reflect real responses
      response.end('{"success":"added"}');
  } else {
    response.end('{"success":"not added"}');

  }


});

app.use(express.static(__dirname + '/public'));

//function to parse JSON from GIT and build Insights event
//Code is far from ideal, the idea is just to create a PoC-like service to validate the idea. Parsing can be greatly improved
function parseEvent(request){

  var insightEvent;

  var headers = request.headers;

  //GIT event type as declared by GIT
  //var eventName = headers['x-github-event'];


  var gitJson = request.body;

  insightEvent = {
    eventType:'JIRAEvent',
    webhookEvent: gitJson.webhookEvent,
    sampleEvent: gitJson.event,
    issueKey: gitJson.issue.key,
    issueId: gitJson.issue.id,
    issueDescription: gitJson.issue.fields.description,
    issueProject: gitJson.issue.fields.project.name

  }

  return insightEvent;
  
  console.log( '---------------- EventName: ');

  insightEvent = {
    eventType:'GITEvent'
  }

  return insightEvent;
}

app.listen(port);

console.log("Listening on port ", port);

require("cf-deployment-tracker-client").track();
