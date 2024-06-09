import dotenv from 'dotenv';
import postgres from 'postgres';
import { Telegraf } from 'telegraf';
import { getBotDeps } from '../repository/bot-deps';
import { launchBot } from './launch-bot';

dotenv.config();

const client = postgres({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: 'require',
});
const admins = ['533398165'];
const botDeps = getBotDeps(client);
const BASE_URL = process.env.BASE_URL;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
launchBot(botDeps, bot, admins, BASE_URL!);
