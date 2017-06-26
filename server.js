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
  var eventName = headers['x-github-event'];

  var jiraJson = request.body;

  if(eventName === 'issue'){

    insightEvent = {
      eventType:'JIRAEvent',
      eventName: eventName,

      id:            jiraJson.id,
      key:           jiraJson.key,
    }

  /*

  if(eventName === 'push'){

    insightEvent = {
      eventType:'JIRAEvent',
      eventName: eventName,

      created:            gitJson.created,
      deleted:            gitJson.deleted,
      forced:             gitJson.forced,

      repositoryId:       gitJson.repository.id,

      repositoryName:     gitJson.repository.name,
      repositoryFullName: gitJson.repository.full_name,
      repositoryOwnerName: gitJson.repository.owner.name,
      repositoryUrl:      gitJson.repository.url,
      repositoryGitUrl:   gitJson.repository.git_url,

      repositoryHomepage: gitJson.repository.homepage,
      repositorySize:     gitJson.repository.size,
      repositoryStargazers: gitJson.repository.stargazers_count,
      repositoryWatchers: gitJson.repository.watchers_count,

      repositoryLanguage:       gitJson.repository.language,
      repositoryHasIssues:      gitJson.repository.has_issues,
      repositoryHasDownloads:   gitJson.repository.has_downloads,

      repositoryForks:          gitJson.repository.forks,
      repositoryOpenIssues:     gitJson.repository.open_issues,
      repositoryDefaultBranch:  gitJson.repository.default_branch,
      repositoryMasterBranch:   gitJson.repository.master_branch,

      commitId:           gitJson.commits[0].id,
      commitMessage:      gitJson.commits[0].message,
      commitUrL :         gitJson.commits[0].url,
      commitUrL :         gitJson.commits[0].distinct,

      commitAddedCount:   gitJson.commits[0].added.length,
      commitRemovedCount: gitJson.commits[0].removed.length,
      commitModifiedCount:gitJson.commits[0].modified.length,

      commiterName:       gitJson.commits[0].name,
      commiterEmail:      gitJson.commits[0].email,

      pusherName:     gitJson.pusher.name,
      pusherEmail:    gitJson.pusher.email,

      senderLogin:    gitJson.sender.login,

      senderId:       gitJson.sender.id,
      senderType:     gitJson.sender.type,
      senderIsAdmin:  gitJson.sender.site_admin

    }
    return insightEvent;
  }
  if(eventName === 'delete'){
    return null;
  }
  if(eventName === 'create'){
    return null;
  }
  if(eventName === 'fork'){

      insightEvent = {
        eventType:'GITEvent',
        eventName: eventName,

        forkeeId:           gitJson.forkee.id,
        forkeeName:         gitJson.forkee.name,
        forkeeFullName:     gitJson.forkee.full_name,
        forkeePrivate:      gitJson.forkee.private,
        forkeeDescription:  gitJson.forkee.description,
        forkeeGitUrl:       gitJson.forkee.git_url,
        forkeeSize:         gitJson.forkee.size,
        forkeeStargazerCount: gitJson.forkee.stargazers_count,
        forkeeWatchersCount: gitJson.forkee.watchers_count,
        forkeeLanguage:     gitJson.forkee.language,
        forkeeHasIssues:    gitJson.forkee.has_issues,
        forkeeHasDownloads: gitJson.forkee.has_downloads,
        forkeeHasWiki:      gitJson.forkee.has_wiki,
        forkeeHasPages:     gitJson.forkee.has_pages,
        forkeeForksCounts:  gitJson.forkee.forks_count,
        forkeeMirrorUrl:    gitJson.forkee.mirror_url,
        forkeeOpenIssuesCount: gitJson.forkee.open_issues_count,
        forkeeForks:        gitJson.forkee.forks,
        forkeeOpenIssues:   gitJson.forkee.open_issues,
        forkeeWatchers:     gitJson.forkee.watchers,
        forkeeDefaultBranch: gitJson.forkee.default_branch,
        forkeePublic:       gitJson.forkee.public,

        repositoryId:       gitJson.repository.id,
        repositoryName:     gitJson.repository.name,
        repositoryFullName: gitJson.repository.full_name,
        repositoryOwnerName: gitJson.repository.owner.name,
        repositoryUrl:      gitJson.repository.url,
        repositoryGitUrl:   gitJson.repository.git_url,

        repositoryHomepage: gitJson.repository.homepage,
        repositorySize:     gitJson.repository.size,
        repositoryStargazers: gitJson.repository.stargazers_count,
        repositoryWatchers: gitJson.repository.watchers_count,

        repositoryLanguage:       gitJson.repository.language,
        repositoryHasIssues:      gitJson.repository.has_issues,
        repositoryHasDownloads:   gitJson.repository.has_downloads,

        repositoryForks:          gitJson.repository.forks_count,
        repositoryOpenIssues:     gitJson.repository.open_issues_count,
        repositoryDefaultBranch:  gitJson.repository.default_branch,
        repositoryMasterBranch:   gitJson.repository.master_branch
      }
      return insightEvent;
  }

  if(eventName === 'issue_comment'){

    insightEvent = {
      eventType:'GITEvent',
      eventName: eventName,

      action:       gitJson.action,
      issueUrl:     gitJson.issue.url,
      issueId:      gitJson.issue.id,
      issueTitle:   gitJson.issue.title,
      issueNumber:  gitJson.issue.number,

      issueRepositoryUrl: gitJson.issue.repository_url,
      issueUserLogin:     gitJson.issue.user.login,
      issueState:         gitJson.issue.state,
      issueLocked:        gitJson.issue.locked,
      issueBody:          gitJson.issue.body,

      commentId:          gitJson.comment.id,
      commentUser:        gitJson.comment.user.login,
      commentBody:        gitJson.comment.body,

      repositoryId:       gitJson.repository.id,
      repositoryName:     gitJson.repository.name,
      repositoryFullName: gitJson.repository.full_name,
      repositoryOwnerName: gitJson.repository.owner.name,
      repositoryUrl:      gitJson.repository.url,
      repositoryGitUrl:   gitJson.repository.git_url,

      repositoryHomepage: gitJson.repository.homepage,
      repositorySize:     gitJson.repository.size,
      repositoryStargazers: gitJson.repository.stargazers_count,
      repositoryWatchers: gitJson.repository.watchers_count,

      repositoryLanguage:       gitJson.repository.language,
      repositoryHasIssues:      gitJson.repository.has_issues,
      repositoryHasDownloads:   gitJson.repository.has_downloads,

      repositoryForks:          gitJson.repository.forks_count,
      repositoryOpenIssues:     gitJson.repository.open_issues_count,
      repositoryDefaultBranch:  gitJson.repository.default_branch,
      repositoryMasterBranch:   gitJson.repository.master_branch

    }
    return insightEvent;

  }
  if(eventName === 'issues'){

    insightEvent = {
      eventType:'GITEvent',
      eventName: eventName,

      action:         gitJson.action,
      issueUrl:       gitJson.issue.url,
      issueId:        gitJson.issue.id,
      issueTitle:     gitJson.issue.title,
      issueNumber:    gitJson.issue.number,

      issueRepositoryUrl: gitJson.issue.repository_url,
      issueUserLogin:     gitJson.issue.user.login,
      issueUserId:        gitJson.issue.user.id,
      issueState:         gitJson.issue.state,
      issueLocked:        gitJson.issue.locked,
      issueBody:          gitJson.issue.body,

      issueLabelId:       gitJson.issue.labels[0].id,
      issueLabelUrl:      gitJson.issue.labels[0].url,
      issueLabelName:     gitJson.issue.labels[0].name,

      issueLabelName:     gitJson.issue.state,
      issueLabelName:     gitJson.issue.locked,
      issueLabelName:     gitJson.issue.assignee.login,
      issueLabelName:     gitJson.issue.assignee.id,
      issueLabelName:     gitJson.issue.body,

      repositoryId:           gitJson.repository.id,
      repositoryDescription:  gitJson.repository.description,
      repositoryName:         gitJson.repository.name,
      repositoryFullName:     gitJson.repository.full_name,
      repositoryOwnerName:    gitJson.repository.owner.login,
      repositoryUrl:          gitJson.repository.url,
      repositoryGitUrl:       gitJson.repository.git_url,

      repositoryHomepage:   gitJson.repository.homepage,
      repositorySize:       gitJson.repository.size,
      repositoryStargazers: gitJson.repository.stargazers_count,
      repositoryWatchers:   gitJson.repository.watchers_count,

      repositoryLanguage:       gitJson.repository.language,
      repositoryHasIssues:      gitJson.repository.has_issues,
      repositoryHasDownloads:   gitJson.repository.has_downloads,

      repositoryForks:          gitJson.repository.forks_count,
      repositoryOpenIssues:     gitJson.repository.open_issues_count,
      repositoryDefaultBranch:  gitJson.repository.default_branch,
      repositoryMasterBranch:   gitJson.repository.master_branch,

      senderLogin: gitJson.sender.login,

      senderId: gitJson.sender.id,
      senderType: gitJson.sender.type,
      senderIsAdmin: gitJson.sender.site_admin
    }
    return insightEvent;
  }
  if(eventName === 'membership'){
    return null;
  }
  if(eventName === 'release'){
    return null;
  }
  if(eventName === 'org_block'){
    return null;
  }
  if(eventName === 'page_build'){
    return null;
  }
  if(eventName === 'public'){
    return null;
  }
  if(eventName === 'pull_request_review_comment'){
    return null;
  }
  if(eventName === 'pull_request_review'){
    return null;
  }
  if(eventName === 'pull_request'){

    insightEvent = {
      eventType:'GITEvent',
      eventName: eventName,

      action:         gitJson.action,

      pullRequestUrl:         gitJson.pull_request.url,
      pullRequestId:         gitJson.pull_request.id,
      pullRequestNumber:         gitJson.pull_request.number,
      pullRequestState:         gitJson.pull_request.state,
      pullRequestLocked:         gitJson.pull_request.locked,
      pullRequestTitle:         gitJson.pull_request.title,
      pullRequestUser:         gitJson.pull_request.user.login,

      pullRequestMerged:         gitJson.pull_request.merged,
      pullRequestCommits:         gitJson.pull_request.commits,
      pullRequestAdditions:         gitJson.pull_request.additions,
      pullRequestDeletions:         gitJson.pull_request.deletions,
      pullRequestChangedFiles:         gitJson.pull_request.changed_files,
      pullRequestTitle:         gitJson.pull_request.title,

      repositoryId:           gitJson.repository.id,
      repositoryDescription:  gitJson.repository.description,
      repositoryName:         gitJson.repository.name,
      repositoryFullName:     gitJson.repository.full_name,
      repositoryOwnerName:    gitJson.repository.owner.login,
      repositoryUrl:          gitJson.repository.url,
      repositoryGitUrl:       gitJson.repository.git_url,

      repositoryHomepage:   gitJson.repository.homepage,
      repositorySize:       gitJson.repository.size,
      repositoryStargazers: gitJson.repository.stargazers_count,
      repositoryWatchers:   gitJson.repository.watchers_count,

      repositoryLanguage:       gitJson.repository.language,
      repositoryHasIssues:      gitJson.repository.has_issues,
      repositoryHasDownloads:   gitJson.repository.has_downloads,

      repositoryForks:          gitJson.repository.forks_count,
      repositoryOpenIssues:     gitJson.repository.open_issues_count,
      repositoryDefaultBranch:  gitJson.repository.default_branch,
      repositoryMasterBranch:   gitJson.repository.master_branch,

      senderLogin:    gitJson.sender.login,

      senderId:       gitJson.sender.id,
      senderType:     gitJson.sender.type,
      senderIsAdmin:  gitJson.sender.site_admin

    }
    return insightEvent;
  }

  if(eventName === 'repository'){
    return null;
  }
  if(eventName === 'status'){
    return null;
  }
  if(eventName === 'team_add'){
    return null;
  }
  if(eventName === 'watch'){
    return null;
  }
  if(eventName === 'commit_comment'){
    return null;
  }
  if(eventName === 'deployment'){
    return null;
  }
  if(eventName === 'deployment_status'){
    return null;
  }
  if(eventName === 'fork'){
    return null;
  }
  if(eventName === 'gollum'){
    return null;
  }
*/
  console.log( '---------------- EventName: ' + eventName);

  insightEvent = {
    eventType:'GITEvent',
    eventName: eventName,

    id:       gitJson.id,
    key:      gitJson.key

    /*

    repositoryId:       gitJson.repository.id,
    repositoryName:     gitJson.repository.name,
    repositoryFullName: gitJson.repository.full_name,
    repositoryOwnerName: gitJson.repository.owner.name,
    repositoryUrl:      gitJson.repository.url,
    repositoryGitUrl:   gitJson.repository.git_url,

    repositoryHomepage: gitJson.repository.homepage,
    repositorySize:     gitJson.repository.size,
    repositoryStargazers: gitJson.repository.stargazers_count,
    repositoryWatchers: gitJson.repository.watchers_count,

    repositoryLanguage:       gitJson.repository.language,
    repositoryHasIssues:      gitJson.repository.has_issues,
    repositoryHasDownloads:   gitJson.repository.has_downloads,

    repositoryForks:          gitJson.repository.forks_count,
    repositoryOpenIssues:     gitJson.repository.open_issues_count,
    repositoryDefaultBranch:  gitJson.repository.default_branch,
    repositoryMasterBranch:   gitJson.repository.master_branch

    */

  }

  return insightEvent;
}

app.listen(port);

console.log("Listening on port ", port);

require("cf-deployment-tracker-client").track();
