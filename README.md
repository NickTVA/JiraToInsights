# Github To Insights

The Github to Insights Integration is basically a Node.JS service hosted on IBM Bluemix. The service endpoint expects a POST message from Github's Webhook, parses the data and sends it to Insights.

More information on Github's Webhook settings can be found here: https://developer.github.com/webhooks/

This integration is still a prototype, the code can (and should) be cleaned/improved before we open it to more customers. As part of the prototyping phase, I just implemented parsing a subset of the Github events. Implementing all of them should be relatively easy, it is just time-consuming now as I am parsing everything manually.

Ideally we shouldn't include the key on the URL but that was the easiest way to make it work, in the future we can create an "official" integration with Github with a proper settings page, but the current setup does it for now.

I included our agent in the app now, but it is not sending a lot of data at this point, I will eventually add some custom instrumentation there.

Please find setup information on the Jive's post: https://newrelic.jiveon.com/community/technical-sales-service/blog/2017/06/05/githubnew-relic-integration
