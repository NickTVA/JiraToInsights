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
  //var eventName = gitJson.webhookEvent


  var gitJson = request.body;
  
  //Issues
  if(gitJson.webhookEvent === 'jira:issue_created'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Issue'
      eventName: 'Created',
      webhookEvent: gitJson.webhookEvent,

      issueKey: gitJson.issue.key,
      issueId: gitJson.issue.id,
      issueDescription: gitJson.issue.fields.description,
      issueProject: gitJson.issue.fields.project.name

    }

    return insightEvent;
  }
  /*
    if(eventName === 'jira:issue_updated'){

      insightEvent = {

        eventType: 'JIRAEvent',
        eventName: 'Issue Updated',
        webhookEvent: gitJson.webhookEvent,

        issueKey: gitJson.issue.key,
        issueId: gitJson.issue.id,
        issueDescription: gitJson.issue.fields.description,
        issueProject: gitJson.issue.fields.project.name

      }

      return insightEvent;
    }
    
    if(eventName === 'jira:issue_deleted'){

      insightEvent = {

        eventType: 'JIRAEvent',
        eventName: 'Issue Deleted',
        webhookEvent: gitJson.webhookEvent,

        issueKey: gitJson.issue.key,
        issueId: gitJson.issue.id,
        issueDescription: gitJson.issue.fields.description,
        issueProject: gitJson.issue.fields.project.name

      }

      return insightEvent;
    }

    if(eventName === 'jira:worklog_updated'){

      insightEvent = {

        eventType: 'JIRAEvent',
        eventName: 'Worklog Updated',
        webhookEvent: gitJson.webhookEvent,

        issueKey: gitJson.issue.key,
        issueId: gitJson.issue.id,
        issueDescription: gitJson.issue.fields.description,
        issueProject: gitJson.issue.fields.project.name

      }

      return insightEvent;
    }

    //Comments
    //need to test
    if(eventName === 'comment_created'){

      insightEvent = {

        eventType: 'JIRAEvent',
        eventName: 'Comment Created',
        webhookEvent: gitJson.webhookEvent,

        issueKey: gitJson.issue.key,
        issueId: gitJson.issue.id,
        issueDescription: gitJson.issue.fields.description,
        issueProject: gitJson.issue.fields.project.name

      }

      return insightEvent;
    }

    if(eventName === 'comment_updated'){

      insightEvent = {

        eventType: 'JIRAEvent',
        eventName: 'Comment Updated',
        webhookEvent: gitJson.webhookEvent,

        issueKey: gitJson.issue.key,
        issueId: gitJson.issue.id,
        issueDescription: gitJson.issue.fields.description,
        issueProject: gitJson.issue.fields.project.name

      }

      return insightEvent;
    }
  */
  
  //Projects

  if(gitJson.webhookEvent === 'project_created'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Project'
      eventName: 'Created',
      webhookEvent: gitJson.webhookEvent,

      projectKey: gitJson.project.key,
      projectId: gitJson.project.id,
      projectDescription: gitJson.project.description,
      projectUrl: gitJson.project.name

    }

    return insightEvent;
  }
  /*
    if(eventName === 'project_updated'){

      insightEvent = {

        eventType: 'JIRAEvent',
        eventName: 'Project Updated',
        webhookEvent: gitJson.webhookEvent,

        issueKey: gitJson.issue.key,
        issueId: gitJson.issue.id,
        issueDescription: gitJson.issue.fields.description,
        issueProject: gitJson.issue.fields.project.name

      }

      return insightEvent;
    }

    if(eventName === 'project_deleted'){

      insightEvent = {

        eventType: 'JIRAEvent',
        eventName: 'Project Deleted',
        webhookEvent: gitJson.webhookEvent,

        issueKey: gitJson.issue.key,
        issueId: gitJson.issue.id,
        issueDescription: gitJson.issue.fields.description,
        issueProject: gitJson.issue.fields.project.name

      }

      return insightEvent;
    }
  */


  console.log( '---------------- EventName: ');

  insightEvent = {
    eventType:'JIRAEvent'
  }

  return insightEvent;
}

app.listen(port);

console.log("Listening on port ", port);

require("cf-deployment-tracker-client").track();
