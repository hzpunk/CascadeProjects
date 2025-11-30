const path = require('path');

require('dotenv').config();

const { bot, users } = require('./storage');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Helper function to send message with retry (faster)
async function sendMessageWithRetry(userId, message, imagePath = null, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (imagePath) {
        await bot.sendPhoto(userId, imagePath, {
          caption: message,
          parse_mode: 'HTML'
        });
        console.log(`✅ Photo sent to user ${userId}`);
      } else {
        await bot.sendMessage(userId, message, { 
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
        console.log(`✅ Message sent to user ${userId}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed for user ${userId}:`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`❌ All attempts failed for user ${userId}`);
        return false;
      }
      
      // Faster retry: 500ms, 1000ms
      const delay = attempt * 500;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

module.exports = async (req, res) => {
  try {
    console.log('=== BROADCAST REQUEST ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Request body:`, JSON.stringify(req.body, null, 2));
    console.log(`Total users: ${users.size}`);
    console.log('==================');
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { message, withImage } = req.body;
    const imagePath = path.join(__dirname, '..', 'img', 'hzlab.jpeg');
    
    console.log(`Message length: ${message ? message.length : 0}`);
    console.log(`With image: ${withImage}`);
    console.log(`Total users to broadcast: ${users.size}`);
    console.log(`Image path: ${imagePath}`);
    
    let successCount = 0;
    let failedUsers = [];
    
    console.log(`Starting web broadcast to ${users.size} users...`);
    
    // Send all messages concurrently for faster response
    const promises = Array.from(users).map(async (userId) => {
      const success = await sendMessageWithRetry(
        userId, 
        message, 
        withImage ? imagePath : null
      );
      
      if (success) {
        successCount++;
      } else {
        failedUsers.push(userId);
      }
      
      // Minimal delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
      return success;
    });
    
    await Promise.all(promises);
    
    console.log('=== BROADCAST RESULTS ===');
    console.log(`Total users: ${users.size}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failedUsers.length}`);
    if (failedUsers.length > 0) {
      console.log(`Failed user IDs:`, failedUsers);
    }
    console.log('========================');
    
    const result = {
      success: true,
      successful: successCount,
      failed: failedUsers.length,
      total: users.size,
      failedUsers: failedUsers
    };
    
    console.log(`Sending response:`, JSON.stringify(result, null, 2));
    res.json(result);
    
  } catch (error) {
    console.error('=== BROADCAST ERROR ===');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Error:`, error.message);
    console.error(`Stack:`, error.stack);
    console.error('====================');
    
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
