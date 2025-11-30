const path = require('path');
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;

// Shared bot instance for all API endpoints
const bot = new TelegramBot(BOT_TOKEN);

// Shared storage for all API endpoints
const users = new Set();

module.exports = { bot, users };
