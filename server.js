const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
require('dotenv').config()

const app = express().use(bodyParser.json());
const port = process.env.PORT || 8080;

app.listen(port, () => console.log('webhook is listening on port '+port));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
  const body = req.body;
   // Checks this is an event from a page subscription
   if (body.object === 'page') {
    body.entry.forEach(parseEntry);
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

function parseEntry(entry) {
  const event = entry.messaging[0]
  const senderId = event.sender.id;
  const text = event.message.text;
  callSendAPI(senderId, {
    text: 'hello - '+ text
  });
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);      
    }
  }
});
