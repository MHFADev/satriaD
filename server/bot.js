const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } = require('discord.js');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config({ path: './.env.local' });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'satriaD';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Satria@12';

let authToken = null;
let botStats = {
  uploads: 0,
  deletions: 0,
  lastLogin: null
};

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
    console.error('Failed to login to web API:', err.message);
    return false;
  }
}

client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  await loginToWeb();
  client.user.setActivity('Managing Satria Studio', { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Logging command activity
  console.log(`[${new Date().toLocaleTimeString()}] Command: ${command} by ${message.author.tag}`);

  if (command === 'upload') {
    const title = args.shift();
    const category = args.shift();
    const description = args.join(' ');
    const attachment = message.attachments.first();

    if (!title || !category || !attachment) {
      const helpEmbed = new EmbedBuilder()
        .setTitle('❌ Format Salah')
        .setColor(0xFF0000)
        .setDescription('Gunakan format: `!upload <judul> <kategori> <deskripsi>`\n\n**Contoh:**\n`!upload Logo_Baru Branding "Logo untuk klien X"`')
        .setFooter({ text: 'Pastikan melampirkan gambar!' });
      return message.reply({ embeds: [helpEmbed] });
    }

    const statusMsg = await message.reply('⏳ Sedang memproses upload...');

    try {
      if (!authToken) await loginToWeb();

      const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
      const formData = new FormData();
      formData.append('title', title.replace(/_/g, ' '));
      formData.append('category', category);
      formData.append('description', description);
      formData.append('image', Buffer.from(response.data), {
        filename: attachment.name,
        contentType: attachment.contentType,
      });

      const res = await axios.post(`${API_URL}/projects`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`,
        },
      });

      botStats.uploads++;
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Project Berhasil Diupload')
        .setURL(process.env.WEB_URL || '#')
        .setColor(0x00FF00)
        .addFields(
          { name: '📌 Judul', value: res.data.data.title, inline: true },
          { name: '🏷️ Kategori', value: res.data.data.category, inline: true },
          { name: '🆔 Project ID', value: `\`${res.data.data.id}\``, inline: true },
          { name: '📝 Deskripsi', value: description || 'Tidak ada deskripsi' }
        )
        .setImage(attachment.url)
        .setTimestamp()
        .setFooter({ text: `Diupload oleh ${message.author.username}` });

      await statusMsg.edit({ content: null, embeds: [embed] });
    } catch (err) {
      console.error(err);
      await statusMsg.edit(`❌ Gagal upload: ${err.response?.data?.message || err.message}`);
    }
  }

  if (command === 'list') {
    try {
      const res = await axios.get(`${API_URL}/projects`);
      const projects = res.data;
      
      if (projects.length === 0) return message.reply('📭 Belum ada project yang terdaftar.');

      const embed = new EmbedBuilder()
        .setTitle('📂 Daftar Project Satria Studio')
        .setColor(0x0099FF)
        .setTimestamp();

      const projectList = projects.slice(0, 10).map(p => 
        `**ID: \`${p.id}\`** | **${p.title}**\n└ *${p.category}*`
      ).join('\n\n');

      embed.setDescription(projectList + (projects.length > 10 ? `\n\n*...dan ${projects.length - 10} lainnya.*` : ''));

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply('❌ Gagal mengambil data project dari server.');
    }
  }

  if (command === 'delete') {
    const id = args[0];
    if (!id) return message.reply('Format: `!delete <id>`');

    try {
      if (!authToken) await loginToWeb();
      await axios.delete(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      botStats.deletions++;
      message.reply(`🗑️ Project dengan ID \`${id}\` telah dihapus dari database.`);
    } catch (err) {
      message.reply(`❌ Gagal menghapus project: ${err.response?.data?.message || err.message}`);
    }
  }

  if (command === 'stats') {
    const embed = new EmbedBuilder()
      .setTitle('📊 Statistik Bot & Server')
      .setColor(0xFFA500)
      .addFields(
        { name: '🚀 Total Upload', value: botStats.uploads.toString(), inline: true },
        { name: '🗑️ Total Hapus', value: botStats.deletions.toString(), inline: true },
        { name: '🔑 Login Terakhir', value: botStats.lastLogin || 'Belum Login', inline: false },
        { name: '📡 API Status', value: authToken ? '🟢 Online' : '🔴 Offline', inline: true }
      )
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }

  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('🛠️ Satria Studio Bot Help')
      .setColor(0x00FFFF)
      .setDescription('Gunakan prefix `!` sebelum perintah.')
      .addFields(
        { name: '`!upload <judul> <kategori> <deskripsi>`', value: 'Upload project baru (Lampirkan gambar)' },
        { name: '`!list`', value: 'Lihat 10 project terbaru' },
        { name: '`!delete <id>`', value: 'Hapus project berdasarkan ID' },
        { name: '`!stats`', value: 'Lihat statistik aktivitas bot' },
        { name: '`!help`', value: 'Tampilkan menu bantuan ini' }
      );
    
    message.reply({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);
