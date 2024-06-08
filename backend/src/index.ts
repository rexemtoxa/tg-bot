import { Telegraf } from 'telegraf';
import postgres from 'postgres'
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createUser, getUserByTelegramID, saveUserPassword, updateUserToken } from './repository/users/queries_sql';

dotenv.config();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const client = postgres({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});

const admins = ['533398165'];

bot.start(async (ctx) => {
  const { id, first_name } = ctx.from;
  try {
    await createUser(client, { telegramId: String(id), firstName: first_name });
  } catch (error) {
    console.log(error);
    await ctx.reply('Database error');
    return;
  }


  await ctx.reply(`Hello, ${first_name}!`, {
    reply_markup: {
      inline_keyboard: [[{ text: 'Open Web App', web_app: { url: 'https://google.com' } }]]
    }
  });
});

bot.command('adminhello', async (ctx) => {
  console.log('Admin command received')
  const [command, telegram_id, ...messageParts] = ctx.message.text.split(' ');
  const message = messageParts.join(' ');

  if (!admins.includes(String(ctx.from.id))) {
    return ctx.reply('You are not authorized to use this command.');
  }

  const user = await getUserByTelegramID(client, { telegramId: telegram_id });
  if (user === null) {
    return ctx.reply('User not found.');
  }

  await bot.telegram.sendMessage(telegram_id, message);
  ctx.reply('Message sent.');
});

bot.launch().then(() => {
  console.log('Bot is running...');
});



const app = express();
const port = 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/public')));


app.post('/api/signup', async (req, res) => {
  const { telegramID, password, token } = req.body;
  console.log('Signup request received');
  console.log(req.body);
  try {
    await saveUserPassword(client, { telegramId: telegramID, password: password });
    await updateUserToken(client, { telegramId: telegramID, token: token });
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { telegramID, password } = req.body;
  try {
    const user = await getUserByTelegramID(client, { telegramId: telegramID });
    if (user === null) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.password === password) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/verify-token', async (req, res) => {
  const { telegramID, token } = req.body;
  try {

    const user = await getUserByTelegramID(client, { telegramId: telegramID });
    if (user === null) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (user.token === token) {
      res.status(200).json({
        telegramID: user.telegramId,
        createdAt: user.createdAt
      });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('*', (req, res) => {
  console.log('GET request received for the static');
  res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
