require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { extractShippingLabel } = require('./lib/genai');

// configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// initialize clients
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const app = express();

// webhook route
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  // filter only text messages
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userText = event.message.text;
  console.log(`Received message: ${userText}`);

  try {
    // get response from gemini ai
    const responseText = await extractShippingLabel(userText);

    // reply to user
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: responseText }],
    });
  } catch (error) {
    console.error('Error calling Gemini AI:', error);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล' }],
    });
  }
}

// export app for testing
module.exports = app;

// start server only if not testing
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
