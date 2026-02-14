const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
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

async function loginToWeb() {
  try {
    const res = await axios.post(`${API_URL}/admin/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    authToken = res.data.token;
    console.log('Logged in to web API');
  } catch (err) {
    console.error('Failed to login to web API:', err.message);
  }
}

client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  await loginToWeb();
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'upload') {
    const title = args.shift();
    const category = args.shift();
    const description = args.join(' ');
    const attachment = message.attachments.first();

    if (!title || !category || !attachment) {
      return message.reply('Format: `!upload <title> <category> <description>` (attach image)');
    }

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
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`,
        },
      });

      const embed = new EmbedBuilder()
        .setTitle('Project Uploaded Successfully')
        .setColor(0x00FF00)
        .addFields(
          { name: 'Title', value: res.data.data.title },
          { name: 'Category', value: res.data.data.category },
          { name: 'ID', value: res.data.data.id.toString() }
        )
        .setImage(attachment.url);

      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      message.reply(`Failed to upload: ${err.response?.data?.message || err.message}`);
    }
  }

  if (command === 'list') {
    try {
      const res = await axios.get(`${API_URL}/projects`);
      const projects = res.data;
      
      if (projects.length === 0) return message.reply('No projects found.');

      const embed = new EmbedBuilder()
        .setTitle('Project List')
        .setColor(0x0099FF)
        .setDescription(projects.map(p => `**ID: ${p.id}** - ${p.title} (${p.category})`).join('\n').substring(0, 2048));

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply('Failed to fetch projects.');
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
      message.reply(`Project with ID ${id} deleted.`);
    } catch (err) {
      message.reply(`Failed to delete project: ${err.response?.data?.message || err.message}`);
    }
  }
});

client.login(DISCORD_TOKEN);
