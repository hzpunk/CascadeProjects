const path = require('path');

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const { users } = require('./storage');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Create bot instance (no polling needed for API endpoints)
const bot = new TelegramBot(BOT_TOKEN);

module.exports = async (req, res) => {
  try {
    console.log('=== STATS REQUEST ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Total users: ${users.size}`);
    console.log('==================');
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const stats = {
      totalUsers: users.size,
      lastBroadcast: new Date().toLocaleString('ru-RU'),
      users: Array.from(users)
    };
    
    console.log(`Stats response:`, JSON.stringify(stats, null, 2));
    console.log('==================');
    
    res.json(stats);
  } catch (error) {
    console.error('=== STATS ERROR ===');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Error:`, error.message);
    console.error(`Stack:`, error.stack);
    console.error('==================');
    
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
