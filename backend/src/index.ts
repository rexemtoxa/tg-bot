import { Telegraf } from 'telegraf';
import { Client } from 'pg';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const db = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT!),
});

db.connect().then(() => {
  db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT UNIQUE,
            first_name TEXT
        )
    `);
});

const admins = ['533398165'];

bot.start(async (ctx) => {
  const { id, first_name } = ctx.from;
  await db.query('INSERT INTO users (telegram_id, first_name) VALUES ($1, $2) ON CONFLICT (telegram_id) DO NOTHING', [id, first_name]);
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

  const user = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
  if (user.rows.length === 0) {
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
    await db.query('INSERT INTO users (telegram_id, password, token, created_at) VALUES ($1, $2, $3, NOW())', [telegramID, password, token]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { telegramID, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE telegram_id = $1 AND password = $2', [telegramID, password]);
    if (result.rows.length === 1) {
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
    const result = await db.query('SELECT * FROM users WHERE telegram_id = $1 AND token = $2', [telegramID, token]);
    if (result.rows.length === 1) {
      res.status(200).json(result.rows[0]);
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
