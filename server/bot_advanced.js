const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActivityType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require('discord.js');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config({ path: './.env.local' });

// --- CONFIGURATION ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1472245680952184887';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'satriaD';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Satria@12';

let authToken = null;
let botStats = { uploads: 0, deletions: 0, lastLogin: null, ordersHandled: 0 };

// --- UTILS ---
async function loginToWeb() {
  try {
    const res = await axios.post(`${API_URL}/admin/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    authToken = res.data.token;
    botStats.lastLogin = new Date().toLocaleString();
    return true;
  } catch (err) {
    console.error('[AUTH ERROR]', err.message);
    return false;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// --- SLASH COMMANDS REGISTRATION ---
const commands = [
  new SlashCommandBuilder()
    .setName('upload')
    .setDescription('Upload project baru ke website')
    .addStringOption(opt => opt.setName('judul').setDescription('Judul project').setRequired(true))
    .addStringOption(opt => opt.setName('kategori').setDescription('Kategori project').setRequired(true))
    .addAttachmentOption(opt => opt.setName('gambar').setDescription('Gambar project').setRequired(true))
    .addStringOption(opt => opt.setName('deskripsi').setDescription('Deskripsi project')),
  
  new SlashCommandBuilder()
    .setName('list')
    .setDescription('Lihat daftar project terbaru'),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Lihat statistik bot dan server'),
    
  new SlashCommandBuilder()
    .setName('orders')
    .setDescription('Lihat pesanan terbaru dari klien')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// --- EVENTS ---
client.once('ready', async () => {
  console.log(`🚀 Advanced Bot ready as ${client.user.tag}`);
  await loginToWeb();
  client.user.setActivity('Satria Studio Dashboard', { type: ActivityType.Competing });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'upload') {
    await interaction.deferReply();
    const title = interaction.options.getString('judul');
    const category = interaction.options.getString('kategori');
    const description = interaction.options.getString('deskripsi') || '';
    const attachment = interaction.options.getAttachment('gambar');

    try {
      if (!authToken) await loginToWeb();
      const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('image', Buffer.from(response.data), {
        filename: attachment.name,
        contentType: attachment.contentType,
      });

      const res = await axios.post(`${API_URL}/projects`, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${authToken}` },
      });

      botStats.uploads++;
      const embed = new EmbedBuilder()
        .setTitle('✨ Project Terpublikasi!')
        .setColor(0x00FF99)
        .addFields(
          { name: '📌 Judul', value: res.data.data.title, inline: true },
          { name: '🏷️ Kategori', value: res.data.data.category, inline: true },
          { name: '📝 Deskripsi', value: description || 'No description' }
        )
        .setImage(attachment.url)
        .setTimestamp()
        .setFooter({ text: `ID: ${res.data.data.id}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Gagal: ${err.response?.data?.message || err.message}`);
    }
  }

  if (commandName === 'list') {
    await interaction.deferReply();
    try {
      const res = await axios.get(`${API_URL}/projects`);
      const projects = res.data;
      
      const embed = new EmbedBuilder()
        .setTitle('📂 Project Satria Studio')
        .setColor(0x3498db)
        .setTimestamp();

      const fields = projects.slice(0, 5).map(p => ({
        name: `ID: ${p.id} | ${p.title}`,
        value: `Category: ${p.category}`,
      }));

      embed.addFields(fields);
      if (projects.length > 5) embed.setFooter({ text: `+ ${projects.length - 5} project lainnya` });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply('❌ Gagal mengambil data.');
    }
  }

  if (commandName === 'stats') {
    const embed = new EmbedBuilder()
      .setTitle('📊 Analytics Real-time')
      .setColor(0xebd400)
      .addFields(
        { name: '📤 Uploads', value: `\`${botStats.uploads}\``, inline: true },
        { name: '🗑️ Deletions', value: `\`${botStats.deletions}\``, inline: true },
        { name: '📦 Orders', value: `\`${botStats.ordersHandled}\``, inline: true },
        { name: '🔑 Session', value: botStats.lastLogin || 'N/A' }
      )
      .setThumbnail(client.user.displayAvatarURL());
    
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'orders') {
    await interaction.deferReply();
    try {
      if (!authToken) await loginToWeb();
      const res = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const orders = res.data;

      const embed = new EmbedBuilder()
        .setTitle('📧 Pesanan Masuk (Terbaru)')
        .setColor(0xFF4500)
        .setTimestamp();

      if (orders.length === 0) {
        embed.setDescription('Belum ada pesanan.');
      } else {
        orders.slice(0, 3).forEach(o => {
          embed.addFields({
            name: `👤 ${o.name} - ${o.service}`,
            value: `📱 WA: ${o.whatsapp}\n📅 Deadline: ${o.deadline || 'N/A'}\n📄 Detail: ${o.detail.substring(0, 100)}...`
          });
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply('❌ Gagal mengambil data pesanan.');
    }
  }
});

client.login(DISCORD_TOKEN);
