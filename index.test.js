const request = require('supertest');
const express = require('express');
const line = require('@line/bot-sdk');

// mock line bot sdk
jest.mock('@line/bot-sdk', () => {
  const express = require('express');
  const mockReplyMessage = jest.fn().mockResolvedValue({});
  return {
    middleware: jest.fn(() => express.json()),
    messagingApi: {
      MessagingApiClient: jest.fn().mockImplementation(() => ({
        replyMessage: mockReplyMessage,
      })),
    },
    _mockReplyMessage: mockReplyMessage,
  };
});

// mock lib/genai
jest.mock('./lib/genai', () => {
  const mockExtractShippingLabel = jest.fn().mockResolvedValue('สวัสดีครับ ผมคือ AI ผู้ช่วย');
  return {
    extractShippingLabel: mockExtractShippingLabel,
    _mockExtractShippingLabel: mockExtractShippingLabel,
  };
});

// import app after mocks are set
const app = require('./index');

describe('LINE Webhook API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ควรรับข้อความตัวอักษรและตอบกลับด้วยผลลัพธ์จาก extractShippingLabel', async () => {
    const event = {
      type: 'message',
      replyToken: 'test-reply-token',
      message: {
        type: 'text',
        text: 'สวัสดี',
      },
    };

    const response = await request(app)
      .post('/webhook')
      .send({ events: [event] });

    expect(response.status).toBe(200);

    // ตรวจสอบว่าเรียก extractShippingLabel หรือไม่
    const { _mockExtractShippingLabel } = require('./lib/genai');
    expect(_mockExtractShippingLabel).toHaveBeenCalledWith('สวัสดี');

    // ตรวจสอบว่าเรียก replyMessage หรือไม่
    const { _mockReplyMessage } = require('@line/bot-sdk');
    expect(_mockReplyMessage).toHaveBeenCalledWith({
      replyToken: 'test-reply-token',
      messages: [{ type: 'text', text: 'สวัสดีครับ ผมคือ AI ผู้ช่วย' }],
    });
  });

  it('ควรจัดการกรณี extractShippingLabel เกิดข้อผิดพลาด', async () => {
    const { _mockExtractShippingLabel } = require('./lib/genai');
    _mockExtractShippingLabel.mockRejectedValueOnce(new Error('AI Error'));

    const event = {
      type: 'message',
      replyToken: 'test-reply-token',
      message: {
        type: 'text',
        text: 'error test',
      },
    };

    const response = await request(app)
      .post('/webhook')
      .send({ events: [event] });

    expect(response.status).toBe(200);

    const { _mockReplyMessage } = require('@line/bot-sdk');
    expect(_mockReplyMessage).toHaveBeenCalledWith({
      replyToken: 'test-reply-token',
      messages: [{ type: 'text', text: 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล' }],
    });
  });
});
