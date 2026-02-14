const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env.local' });

// --- CONFIGURATION ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'satriaD';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Satria@12';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Your Telegram user ID for security

let authToken = null;
let botStats = { uploads: 0, deletions: 0, lastLogin: null, ordersChecked: 0 };

// Initialize bot with polling
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// --- UTILS ---
async function loginToWeb() {
  try {
    const res = await axios.post(`${API_URL}/admin/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    authToken = res.data.token;
    botStats.lastLogin = new Date().toLocaleString();
    console.log(`[${new Date().toLocaleTimeString()}] Logged in to web API`);
    return true;
  } catch (err) {
    console.error('[AUTH ERROR]', err.message);
    return false;
  }
}

// Check if user is authorized
function isAuthorized(chatId) {
  if (!ADMIN_CHAT_ID) return true; // If not set, allow all (dev mode)
  return chatId.toString() === ADMIN_CHAT_ID.toString();
}

// --- KEYBOARD MENUS ---
const mainMenuKeyboard = {
  reply_markup: {
    keyboard: [
      ['📤 Upload Project', '📋 List Projects'],
      ['📊 Statistics', '📧 View Orders'],
      ['❓ Help', '🔄 Refresh Login']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

const uploadConfirmKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '✅ Confirm Upload', callback_data: 'confirm_upload' },
        { text: '❌ Cancel', callback_data: 'cancel_upload' }
      ]
    ]
  }
};

// --- BOT COMMANDS ---

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAuthorized(chatId)) {
    return bot.sendMessage(chatId, '⛔ You are not authorized to use this bot.');
  }

  const welcomeMessage = `
🎨 *Welcome to Satria Studio Admin Bot!*

Your Chat ID: \`${chatId}\`
Use this ID in your \.env file as ADMIN\_CHAT\_ID

Choose an option from the menu below or type:
• /upload \- Upload new project
• /list \- View all projects  
• /orders \- Check client orders
• /stats \- View bot statistics
• /help \- Show all commands

_Bot is ready to manage your portfolio!_ 🚀
  `;

  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    ...mainMenuKeyboard
  });

  await loginToWeb();
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  const helpText = `
📚 *Satria Studio Bot Commands*

*Project Management:*
• /upload \- Upload project with photo
• /list \- Show all projects
• /delete \<id\> \- Delete project by ID
• /search \<keyword\> \- Search projects

*Order Management:*
• /orders \- View recent client orders
• /order \<id\> \- View specific order details

*System:*
• /stats \- Bot statistics
• /health \- Check API health
• /login \- Force re\-login

*Quick Actions:*
Just send a photo with caption to quickly upload!
  `;

  bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

// Upload command with conversation flow
let uploadState = {}; // Store user upload state

bot.onText(/\/upload/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  uploadState[chatId] = { step: 'waiting_title' };
  
  bot.sendMessage(chatId, '📤 *Upload Project*\n\nStep 1/3: Send me the project title:', {
    parse_mode: 'Markdown'
  });
});

// Handle conversation flow for upload
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId) || !uploadState[chatId]) return;

  const state = uploadState[chatId];

  if (state.step === 'waiting_title' && msg.text && !msg.text.startsWith('/')) {
    state.title = msg.text;
    state.step = 'waiting_category';
    
    const categories = [
      ['Graphic Design', 'Logo Design'],
      ['Branding', 'UI/UX Design'],
      ['Web Development', 'Other']
    ];
    
    bot.sendMessage(chatId, 'Step 2/3: Select category:', {
      reply_markup: {
        keyboard: categories,
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }
  
  else if (state.step === 'waiting_category' && msg.text && !msg.text.startsWith('/')) {
    state.category = msg.text;
    state.step = 'waiting_description';
    
    bot.sendMessage(chatId, 'Step 3/3: Send me the description (or type "skip"):', {
      reply_markup: {
        keyboard: [['Skip']],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }
  
  else if (state.step === 'waiting_description' && msg.text && !msg.text.startsWith('/')) {
    state.description = msg.text === 'Skip' ? '' : msg.text;
    state.step = 'waiting_photo';
    
    bot.sendMessage(chatId, 'Great! Now send me the project image:', {
      reply_markup: { remove_keyboard: true }
    });
  }
  
  else if (state.step === 'waiting_photo' && msg.photo) {
    const photo = msg.photo[msg.photo.length - 1]; // Get highest quality
    state.photo = photo;
    
    const confirmMessage = `
📋 *Confirm Upload:*

*Title:* ${state.title}
*Category:* ${state.category}
*Description:* ${state.description || 'None'}

Send /confirm to upload or /cancel to abort.
    `;
    
    bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });
    bot.sendPhoto(chatId, photo.file_id, { caption: 'Preview' });
  }
});

// Confirm upload
bot.onText(/\/confirm/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId) || !uploadState[chatId]) return;

  const state = uploadState[chatId];
  const statusMsg = await bot.sendMessage(chatId, '⏳ Uploading to server...');

  try {
    if (!authToken) await loginToWeb();

    // Get photo file
    const fileLink = await bot.getFileLink(state.photo.file_id);
    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });

    const formData = new FormData();
    formData.append('title', state.title);
    formData.append('category', state.category);
    formData.append('description', state.description);
    formData.append('image', Buffer.from(response.data), {
      filename: 'project.jpg',
      contentType: 'image/jpeg',
    });

    const res = await axios.post(`${API_URL}/projects`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`,
      },
    });

    botStats.uploads++;
    
    bot.deleteMessage(chatId, statusMsg.message_id);
    bot.sendMessage(chatId, `
✅ *Project Uploaded Successfully!*

🆔 ID: \`${res.data.data.id}\`
📌 Title: ${res.data.data.title}
🏷️ Category: ${res.data.data.category}

_View it on your website!_
    `, { 
      parse_mode: 'Markdown',
      ...mainMenuKeyboard
    });

    delete uploadState[chatId];
  } catch (err) {
    bot.editMessageText(`❌ Upload failed: ${err.response?.data?.message || err.message}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id
    });
  }
});

// Cancel upload
bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  if (uploadState[chatId]) {
    delete uploadState[chatId];
    bot.sendMessage(chatId, '❌ Upload cancelled.', mainMenuKeyboard);
  }
});

// List projects
bot.onText(/\/list|📋 List Projects/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  const statusMsg = await bot.sendMessage(chatId, '⏳ Fetching projects...');

  try {
    const res = await axios.get(`${API_URL}/projects`);
    const projects = res.data;

    if (projects.length === 0) {
      return bot.editMessageText('📭 No projects found.', {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }

    let message = '📂 *Latest Projects*\n\n';
    projects.slice(0, 10).forEach((p, idx) => {
      message += `${idx + 1}. *ID: ${p.id}* - ${p.title}\n   🏷️ ${p.category}\n\n`;
    });

    if (projects.length > 10) {
      message += `_...and ${projects.length - 10} more projects_`;
    }

    bot.deleteMessage(chatId, statusMsg.message_id);
    bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      ...mainMenuKeyboard
    });
  } catch (err) {
    bot.editMessageText('❌ Failed to fetch projects.', {
      chat_id: chatId,
      message_id: statusMsg.message_id
    });
  }
});

// View orders
bot.onText(/\/orders|📧 View Orders/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  const statusMsg = await bot.sendMessage(chatId, '⏳ Fetching orders...');

  try {
    if (!authToken) await loginToWeb();
    
    const res = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const orders = res.data;

    botStats.ordersChecked++;

    if (orders.length === 0) {
      return bot.editMessageText('📭 No orders found.', {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }

    bot.deleteMessage(chatId, statusMsg.message_id);

    // Send each order as a separate message for better readability
    orders.slice(0, 5).forEach((order, idx) => {
      const orderText = `
📧 *Order #${order.id}*

👤 *Name:* ${order.name}
📱 *WhatsApp:* ${order.whatsapp}
🛠️ *Service:* ${order.service}
📅 *Deadline:* ${order.deadline || 'Not specified'}
📝 *Detail:* ${order.detail.substring(0, 200)}${order.detail.length > 200 ? '...' : ''}
      `;
      
      bot.sendMessage(chatId, orderText, { parse_mode: 'Markdown' });
    });

    bot.sendMessage(chatId, `_Showing ${Math.min(orders.length, 5)} of ${orders.length} orders_`, mainMenuKeyboard);
  } catch (err) {
    bot.editMessageText(`❌ Failed: ${err.response?.data?.message || err.message}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id
    });
  }
});

// Delete project
bot.onText(/\/delete (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  const projectId = match[1];
  
  try {
    if (!authToken) await loginToWeb();
    
    await axios.delete(`${API_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    botStats.deletions++;
    bot.sendMessage(chatId, `🗑️ Project #${projectId} deleted successfully.`, mainMenuKeyboard);
  } catch (err) {
    bot.sendMessage(chatId, `❌ Failed to delete: ${err.response?.data?.message || err.message}`);
  }
});

// Statistics
bot.onText(/\/stats|📊 Statistics/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  try {
    const healthRes = await axios.get(`${API_URL}/health`);
    const health = healthRes.data;

    const statsMessage = `
📊 *Bot Statistics*

🤖 *Bot Activity:*
• Uploads: ${botStats.uploads}
• Deletions: ${botStats.deletions}
• Orders Checked: ${botStats.ordersChecked}
• Last Login: ${botStats.lastLogin || 'Never'}

🌐 *API Status:*
• Status: ${health.status}
• Database: ${health.dbConnected ? '✅ Connected' : '❌ Error'}
• Admin Count: ${health.adminCount || 'N/A'}
• Time: ${health.timestamp}
    `;

    bot.sendMessage(chatId, statsMessage, { 
      parse_mode: 'Markdown',
      ...mainMenuKeyboard
    });
  } catch (err) {
    bot.sendMessage(chatId, `❌ Failed to get stats: ${err.message}`);
  }
});

// Refresh login
bot.onText(/\/login|🔄 Refresh Login/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  const success = await loginToWeb();
  if (success) {
    bot.sendMessage(chatId, '✅ Successfully re-logged in to web API.', mainMenuKeyboard);
  } else {
    bot.sendMessage(chatId, '❌ Login failed. Check credentials.', mainMenuKeyboard);
  }
});

// Quick upload - send photo directly
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;
  
  // If no caption, ignore or prompt
  if (!msg.caption) {
    return bot.sendMessage(chatId, '📸 I see a photo! To upload, send it with caption:\nFormat: `/upload Title | Category | Description`\n\nOr use the /upload command for step-by-step.', {
      parse_mode: 'Markdown'
    });
  }

  // Parse caption: /upload Title | Category | Description
  if (msg.caption.startsWith('/upload')) {
    const parts = msg.caption.replace('/upload', '').split('|').map(p => p.trim());
    const [title, category, description] = parts;

    if (!title || !category) {
      return bot.sendMessage(chatId, '❌ Format: `/upload Title | Category | Description`', { parse_mode: 'Markdown' });
    }

    const statusMsg = await bot.sendMessage(chatId, '⏳ Quick uploading...');

    try {
      if (!authToken) await loginToWeb();
      
      const photo = msg.photo[msg.photo.length - 1];
      const fileLink = await bot.getFileLink(photo.file_id);
      const response = await axios.get(fileLink, { responseType: 'arraybuffer' });

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description || '');
      formData.append('image', Buffer.from(response.data), {
        filename: 'project.jpg',
        contentType: 'image/jpeg',
      });

      const res = await axios.post(`${API_URL}/projects`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`,
        },
      });

      botStats.uploads++;
      
      bot.deleteMessage(chatId, statusMsg.message_id);
      bot.sendMessage(chatId, `✅ *Quick Upload Success!*\n\n🆔 ID: ${res.data.data.id}\n📌 ${title}`, { 
        parse_mode: 'Markdown',
        ...mainMenuKeyboard
      });
    } catch (err) {
      bot.editMessageText(`❌ Failed: ${err.response?.data?.message || err.message}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Telegram Bot Error:', error);
});

console.log('🤖 Telegram Bot is starting...');
console.log('Send /start to your bot in Telegram to begin!');
