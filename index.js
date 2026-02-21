require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const crypto = require('crypto');
const { extractShippingLabel } = require('./lib/genai');
const { generateShippingLabel } = require('./lib/pdf');
const { generateShippingLabelPNG } = require('./lib/label-png');

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

// Temporary storage for media (In real app, use Cloud Storage or Redis)
const pdfCache = new Map();
const imageCache = new Map();

// Route to serve PDF
app.get('/pdf/:id', (req, res) => {
  const pdfBuffer = pdfCache.get(req.params.id);
  if (pdfBuffer) {
    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } else {
    res.status(404).send('Not Found');
  }
});

// Route to serve Image
app.get('/image/:id', (req, res) => {
  const imageBuffer = imageCache.get(req.params.id);
  if (imageBuffer) {
    res.contentType('image/png');
    res.send(imageBuffer);
  } else {
    res.status(404).send('Not Found');
  }
});

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
    // 1. Extract info from Gemini
    const shippingLabel = await extractShippingLabel(userText);
    console.log('Extracted Data:', JSON.stringify(shippingLabel, null, 2));

    // 2. Generate PDF and PNG Buffers
    const [pdfBuffer, pngBuffer] = await Promise.all([
      generateShippingLabel(shippingLabel),
      generateShippingLabelPNG(shippingLabel)
    ]);

    // 3. Store media and get public URLs
    const mediaId = crypto.randomUUID();
    pdfCache.set(mediaId, pdfBuffer);
    imageCache.set(mediaId, pngBuffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const pdfUrl = `${baseUrl}/pdf/${mediaId}`;
    const imageUrl = `${baseUrl}/image/${mediaId}`;

    // 4. Reply to user with Image and PDF link as alternative
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'image',
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl
        },
        {
          type: 'text',
          text: `ดาวน์โหลดแบบ PDF สำหรับพิมพ์ได้ที่:\n${pdfUrl}`
        }
      ],
    });
  } catch (error) {
    console.error('Error processing shipping label:', error);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผลข้อมูล' }],
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
