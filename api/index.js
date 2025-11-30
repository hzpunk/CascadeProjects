const path = require('path');

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required');
  console.error('Create .env file with BOT_TOKEN=your_token');
  process.exit(1);
}

// Use polling for local development, webhook for production
const bot = WEBHOOK_URL 
  ? new TelegramBot(BOT_TOKEN, { webHook: true })
  : new TelegramBot(BOT_TOKEN, { polling: true });

if (WEBHOOK_URL) {
  bot.setWebHook(WEBHOOK_URL);
  console.log('Webhook mode:', WEBHOOK_URL);
} else {
  console.log('Polling mode - bot is ready for local testing');
}

// In-memory user storage (in production, use a database)
const users = new Set();

// Enhanced message logging
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || 'No username';
  const firstName = msg.from.first_name || 'No first name';
  const lastName = msg.from.last_name || '';
  const messageText = msg.text || 'Non-text message';
  const messageType = msg.text ? 'text' : msg.photo ? 'photo' : msg.document ? 'document' : msg.audio ? 'audio' : msg.video ? 'video' : 'other';
  
  // Full logging
  console.log('=== MESSAGE LOG ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Chat ID: ${chatId}`);
  console.log(`User ID: ${userId}`);
  console.log(`Username: @${username}`);
  console.log(`Name: ${firstName} ${lastName}`.trim());
  console.log(`Message Type: ${messageType}`);
  console.log(`Message Content: ${messageText}`);
  console.log('==================');
  
  if (messageText && !messageText.startsWith('/')) {
    bot.sendMessage(chatId, 'Используйте /start для начала или /notify для получения уведомления о запуске.');
  }
});

// Enhanced start command with logging
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || 'No username';
  
  // Log user registration
  console.log('=== USER REGISTRATION ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Chat ID: ${chatId}`);
  console.log(`User ID: ${userId}`);
  console.log(`Username: @${username}`);
  console.log(`Action: User started bot`);
  console.log('Total users now:', users.size + 1);
  console.log('========================');
  
  users.add(chatId);
  bot.sendMessage(chatId, '🚀 Добро пожаловать в Hzlab бот!\n\nЯ уведомлю вас о запуске нашего сайта. Оставайтесь на связи!');
});

// Enhanced admin command to send to all stored users
bot.onText(/\/admin_notify/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || 'No username';
  
  // Log admin command attempt
  console.log('=== ADMIN COMMAND ATTEMPT ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Chat ID: ${chatId}`);
  console.log(`User ID: ${userId}`);
  console.log(`Username: @${username}`);
  console.log(`Command: /admin_notify`);
  console.log('============================');
  
  // Simple admin check - replace with your actual admin chat ID
  const ADMIN_CHAT_ID = process.env.ADMIN_IDS || chatId;
  
  if (chatId.toString() !== ADMIN_CHAT_ID.toString()) {
    console.log(`ACCESS DENIED: User ${userId} (@${username}) tried to use admin command`);
    bot.sendMessage(chatId, '⛔ У вас нет прав для выполнения этой команды');
    return;
  }

  try {
    console.log(`ACCESS GRANTED: Admin ${userId} (@${username}) executing /admin_notify`);
    
    const launchMessage = '🚀 Hzlab запущен!\n\n🌐 Сайт теперь доступен: https://hzlabik.ru\n\nСпасибо за ваше терпение и поддержку! 🎉';
    const imagePath = path.join(__dirname, '..', 'img', 'hzlab.jpeg');
    
    // Send to all stored users
    let successCount = 0;
    let failedUsers = [];
    
    console.log(`Sending notifications to ${users.size} users...`);
    
    for (const userId of users) {
      try {
        // Send message with image
        await bot.sendPhoto(userId, imagePath, {
          caption: launchMessage,
          parse_mode: 'HTML'
        });
        successCount++;
        console.log(`✅ Successfully sent to user: ${userId}`);
      } catch (error) {
        console.error(`❌ Failed to send to user ${userId}:`, error.message);
        failedUsers.push(userId);
      }
    }
    
    console.log(`=== BROADCAST RESULTS ===`);
    console.log(`Total users: ${users.size}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failedUsers.length}`);
    if (failedUsers.length > 0) {
      console.log(`Failed user IDs:`, failedUsers);
    }
    console.log('========================');
    
    bot.sendMessage(chatId, `✅ Уведомление о запуске отправлено ${successCount} пользователям`);
    
  } catch (error) {
    console.error('Error sending admin notification:', error);
    bot.sendMessage(chatId, '❌ Ошибка при отправке уведомления');
  }
});

// Webhook handler - simplified
module.exports = async (req, res) => {
  try {
    console.log('=== WEBHOOK REQUEST ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log('==================');
    
    // Process Telegram webhook update
    if (WEBHOOK_URL) {
      console.log('Processing webhook update...');
      await bot.processUpdate(req.body);
      console.log('Webhook update processed successfully');
    } else {
      console.log('ERROR: Webhook handler called in polling mode');
      throw new Error('Webhook handler called in polling mode');
    }
    
    console.log('Webhook request handled successfully');
    res.status(200).send('OK');
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Method: ${req.method}`);
    console.error(`URL: ${req.url}`);
    console.error(`Error:`, error.message);
    console.error(`Stack:`, error.stack);
    console.error('========================');
    
    res.status(500).send('Error');
  }
};
