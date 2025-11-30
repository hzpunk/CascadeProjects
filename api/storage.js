const path = require('path');
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Force polling mode for local testing
const isLocal = !WEBHOOK_URL || WEBHOOK_URL.includes('localhost') || process.env.NODE_ENV !== 'production';

// Shared bot instance for all API endpoints
const bot = isLocal 
  ? new TelegramBot(BOT_TOKEN)  // Polling mode
  : new TelegramBot(BOT_TOKEN, { webHook: true });  // Webhook mode

console.log(`Bot mode: ${isLocal ? 'POLLING' : 'WEBHOOK'}`);

// Shared storage for all API endpoints
const users = new Set();

module.exports = { bot, users };
