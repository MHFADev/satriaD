const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// --- CONFIGURATION ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'satriaD';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Satria@12';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Your Telegram user ID for security

if (!TELEGRAM_TOKEN) {
  throw new Error('TELEGRAM_TOKEN is missing. Set TELEGRAM_TOKEN in .env.local');
}

console.log('🤖 Telegram Bot Config Loaded');
console.log('- API_URL:', API_URL);
console.log('- ADMIN_CHAT_ID:', ADMIN_CHAT_ID ? 'SET' : 'NOT SET');
console.log('- TELEGRAM_TOKEN:', `SET (len=${String(TELEGRAM_TOKEN).length})`);

let authToken = null;
let botStats = { uploads: 0, deletions: 0, lastLogin: null, ordersChecked: 0 };

// Initialize bot with polling
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const stateByChat = new Map();

function setState(chatId, next) {
  stateByChat.set(String(chatId), next);
}

function getState(chatId) {
  return stateByChat.get(String(chatId));
}

function clearState(chatId) {
  stateByChat.delete(String(chatId));
}

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

function dashboardInlineKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📤 Upload', callback_data: 'dash:upload' },
          { text: '🧾 Template', callback_data: 'dash:template' }
        ],
        [
          { text: '📋 Projects', callback_data: 'dash:projects:0' },
          { text: '📧 Orders', callback_data: 'dash:orders:0' }
        ],
        [
          { text: '📊 Stats', callback_data: 'dash:stats' },
          { text: '🔄 Login', callback_data: 'dash:login' }
        ],
        [
          { text: '❓ Help', callback_data: 'dash:help' }
        ]
      ]
    }
  };
}

function uploadCategoryInlineKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Graphic Design', callback_data: 'up:cat:Graphic Design' },
          { text: 'Logo Design', callback_data: 'up:cat:Logo Design' }
        ],
        [
          { text: 'Branding', callback_data: 'up:cat:Branding' },
          { text: 'UI/UX Design', callback_data: 'up:cat:UI/UX Design' }
        ],
        [
          { text: 'Web Development', callback_data: 'up:cat:Web Development' },
          { text: 'Other', callback_data: 'up:cat:Other' }
        ],
        [
          { text: '❌ Cancel', callback_data: 'up:cancel' }
        ]
      ]
    }
  };
}

function uploadConfirmInlineKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Publish', callback_data: 'up:confirm' },
          { text: '❌ Cancel', callback_data: 'up:cancel' }
        ]
      ]
    }
  };
}

function listPagerInlineKeyboard(kind, page, hasPrev, hasNext) {
  const prev = { text: '⬅️ Prev', callback_data: `dash:${kind}:${Math.max(0, page - 1)}` };
  const next = { text: 'Next ➡️', callback_data: `dash:${kind}:${page + 1}` };
  const home = { text: '🏠 Dashboard', callback_data: 'dash:home' };
  const row = [];
  if (hasPrev) row.push(prev);
  row.push(home);
  if (hasNext) row.push(next);
  return { reply_markup: { inline_keyboard: [row] } };
}

async function ensureLogin() {
  if (authToken) return true;
  return loginToWeb();
}

function renderUploadPreview(state) {
  return `📋 *Review Project*

*Title:* ${state.title}
*Category:* ${state.category}
*Description:* ${state.description || 'None'}

Klik *Publish* untuk upload.`;
}

async function sendDashboard(chatId, extraText) {
  const text = extraText
    ? `${extraText}\n\nPilih menu di bawah:`
    : 'Pilih menu di bawah:';
  return bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...dashboardInlineKeyboard()
  });
}

function templateText() {
  return `🧾 *Template Caption Upload (paling gampang)*

1) Kirim foto
2) Isi caption dengan format ini:

\`/upload Judul | Kategori | Deskripsi\`

Contoh:
\`/upload Logo Satria | Branding | Logo minimalis untuk klien A\``;
}

async function listProjects(chatId, page) {
  const pageSize = 5;
  const res = await axios.get(`${API_URL}/projects`);
  const projects = Array.isArray(res.data) ? res.data : [];
  const start = page * pageSize;
  const slice = projects.slice(start, start + pageSize);

  if (slice.length === 0) {
    return bot.sendMessage(chatId, '📭 Tidak ada project di halaman ini.', {
      ...listPagerInlineKeyboard('projects', page, page > 0, start < projects.length)
    });
  }

  let text = '📋 *Projects*\n\n';
  slice.forEach((p, idx) => {
    text += `${start + idx + 1}. *${p.title}*\n   ID: \`${p.id}\` | ${p.category}\n\n`;
  });

  const hasPrev = page > 0;
  const hasNext = start + pageSize < projects.length;
  return bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...listPagerInlineKeyboard('projects', page, hasPrev, hasNext)
  });
}

async function listOrders(chatId, page) {
  const pageSize = 3;
  const ok = await ensureLogin();
  if (!ok) {
    return bot.sendMessage(chatId, '❌ Login ke API gagal. Coba tekan tombol 🔄 Login di dashboard.', dashboardInlineKeyboard());
  }

  const res = await axios.get(`${API_URL}/orders`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const orders = Array.isArray(res.data) ? res.data : [];
  botStats.ordersChecked++;
  const start = page * pageSize;
  const slice = orders.slice(start, start + pageSize);

  if (slice.length === 0) {
    return bot.sendMessage(chatId, '📭 Tidak ada order di halaman ini.', {
      ...listPagerInlineKeyboard('orders', page, page > 0, start < orders.length)
    });
  }

  let text = '📧 *Orders*\n\n';
  slice.forEach((o, idx) => {
    const detail = (o.detail || '').toString();
    const short = detail.length > 160 ? `${detail.slice(0, 160)}...` : detail;
    text += `${start + idx + 1}. *#${o.id}* - ${o.service}\n   👤 ${o.name}\n   📱 ${o.whatsapp}\n   📅 ${o.deadline || 'N/A'}\n   📝 ${short}\n\n`;
  });

  const hasPrev = page > 0;
  const hasNext = start + pageSize < orders.length;
  return bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...listPagerInlineKeyboard('orders', page, hasPrev, hasNext)
  });
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
  await sendDashboard(chatId, '✅ Dashboard ready');
});

bot.onText(/\/(menu|dashboard)/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;
  await sendDashboard(chatId);
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

  const raw = (msg.text || '').replace('/upload', '').trim();
  if (raw.includes('|')) {
    const parts = raw.split('|').map(p => p.trim()).filter(Boolean);
    const [title, category, description] = parts;
    if (!title || !category) {
      await bot.sendMessage(chatId, '❌ Format: /upload Judul | Kategori | Deskripsi', { parse_mode: 'Markdown' });
      return bot.sendMessage(chatId, templateText(), { parse_mode: 'Markdown', ...dashboardInlineKeyboard() });
    }
    uploadState[chatId] = {
      step: 'waiting_photo',
      title,
      category,
      description: description || ''
    };
    return bot.sendMessage(chatId, '📸 Kirim fotonya sekarang untuk publish.', { parse_mode: 'Markdown' });
  }

  uploadState[chatId] = { step: 'waiting_title' };
  setState(chatId, { flow: 'upload' });
  bot.sendMessage(chatId, '📤 *Upload Project*\n\nKirim judul project:', {
    parse_mode: 'Markdown',
    ...dashboardInlineKeyboard()
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
    return bot.sendMessage(chatId, 'Pilih kategori:', {
      parse_mode: 'Markdown',
      ...uploadCategoryInlineKeyboard()
    });
  }

  else if (state.step === 'waiting_description' && msg.text && !msg.text.startsWith('/')) {
    state.description = msg.text === 'Skip' ? '' : msg.text;
    state.step = 'waiting_photo';
    return bot.sendMessage(chatId, '📸 Kirim fotonya sekarang:', {
      parse_mode: 'Markdown'
    });
  }
  
  else if (state.step === 'waiting_photo' && msg.photo) {
    const photo = msg.photo[msg.photo.length - 1]; // Get highest quality
    state.photo = photo;
    await bot.sendPhoto(chatId, photo.file_id, { caption: 'Preview' });
    return bot.sendMessage(chatId, renderUploadPreview(state), {
      parse_mode: 'Markdown',
      ...uploadConfirmInlineKeyboard()
    });
  }
});

// Cancel upload
bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  if (uploadState[chatId]) {
    delete uploadState[chatId];
    clearState(chatId);
    bot.sendMessage(chatId, '❌ Upload cancelled.', mainMenuKeyboard);
  }
});

// List projects
bot.onText(/\/list|📋 List Projects/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  try {
    await listProjects(chatId, 0);
  } catch (err) {
    bot.sendMessage(chatId, '❌ Failed to fetch projects.', { ...dashboardInlineKeyboard() });
  }
});

// View orders
bot.onText(/\/orders|📧 View Orders/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return;

  try {
    await listOrders(chatId, 0);
  } catch (err) {
    bot.sendMessage(chatId, `❌ Failed: ${err.response?.data?.message || err.message}`, dashboardInlineKeyboard());
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
    await bot.sendMessage(chatId, templateText(), { parse_mode: 'Markdown' });
    return sendDashboard(chatId, '📸 Kirim foto dengan caption template di atas, atau tekan Upload untuk wizard.');
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
