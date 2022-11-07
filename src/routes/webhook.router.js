const express = require('express');
const fetch = require('node-fetch');

const webhookRequestRouter = express.Router();

// Webhook challenge
webhookRequestRouter.get("/", async (req, res) => {
    console.log(req);
    if (
        req.query['hub.mode'] == 'subscribe' &&
        req.query['hub.verify_token'] == process.env.WHATSAPP_API_TOKEN
    ) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(400);
    }
});

// Webhook event
webhookRequestRouter.post("/", async (req, res) => {
    if (req.body.object) {
        if (
          req.body.entry &&
          req.body.entry[0].changes &&
          req.body.entry[0].changes[0] &&
          req.body.entry[0].changes[0].value.messages &&
          req.body.entry[0].changes[0].value.messages[0]
        ) {
            let phone_number_id =
                req.body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

            let whatsapp_api_url = 'https://graph.facebook.com/v15.0/' + process.env.WHATSAPP_API_BOT_ID + '/messages';
            let data = {
                to: process.env.WHATSAPP_API_AUTH_PHONE,
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                type: 'text',
                text: {
                    preview_url: false,
                    body: '_From webhook.router.js:_' + '\n' + msg_body
                }
              };

            var postReq = {
                method: "POST",
                headers: {
                  'Authorization': 'Bearer ' + process.env.WHATSAPP_API_AUTH_BEARER,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                json: true
            };

            fetch(whatsapp_api_url, postReq)
                .then(data => {
                    return data.json()
                })
                .then(res => {
                    console.log(res)
                })
                .catch(error => console.log(error));
        }
        res.sendStatus(200);
      } else {
        // Return a '404 Not Found' if event is not from a WhatsApp API
        res.sendStatus(404);
      }
});


module.exports = webhookRequestRouter;