import { Context, Telegram, Telegraf } from 'telegraf';
import { CreateUserRow, GetUserByTelegramIDRow } from '../repository/users/users-queries_sql';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { getBotDeps } from '../repository/bot-deps';
import postgres from 'postgres';
import dotenv from 'dotenv';


export interface DataBaseDeps {
  createUser(args: { telegramId: string, firstName: string }): Promise<CreateUserRow | null>;
  getUserByTelegramID(args: { telegramId: string }): Promise<GetUserByTelegramIDRow | null>;
}

export interface BotDeps {
  start(callback: (ctx: Context) => Promise<void>): void;
  command(command: string, callback: (ctx: Context & { message: Update.New & Update.NonChannel & Message.TextMessage }) => Promise<void>): void;
  launch(): Promise<void>;
  telegram: {
    sendMessage: Telegram['sendMessage']
  }
}

export const launchBot = (dbDeps: DataBaseDeps, bot: BotDeps, admins: string[], baseUrl: string): void => {
  bot.start(async (ctx) => {
    if (ctx.from === undefined) {
      console.error('ctx.from is undefined');
      ctx.reply('Error');
      return;
    }
    const { id, first_name } = ctx.from;
    try {
      await dbDeps.createUser({ telegramId: String(id), firstName: first_name });
    } catch (error) {
      console.log(error);
      await ctx.reply('Database error');
      return;
    }


    await ctx.reply(`Hello, ${first_name}!`, {
      reply_markup: {
        inline_keyboard: [[{ text: 'Open Web App', web_app: { url: baseUrl as string + `?telegramId=${id}` } }]]
      }
    });
  });

  const isCommandMessageValid = (ctx: Context & { message: Update.New & Update.NonChannel & Message.TextMessage }): boolean => {
    if (!ctx.message?.text) {
      return false;
    }
    return ctx.message.text.split(' ').length > 1;
  }


  bot.command('adminhello', async (ctx) => {
    if (!isCommandMessageValid(ctx)) {
      ctx.reply('Invalid command body, please provide a message like:\n```\n/adminhello 12345 Hello!\n```', { parse_mode: 'Markdown' });
      return;
    }
    const [_, telegram_id, ...messageParts] = ctx.message?.text.split(' ');
    const message = messageParts.join(' ');

    if (!admins.includes(String(ctx.from?.id))) {
      ctx.reply('You are not authorized to use this command.');
      return;
    }

    const user = await dbDeps.getUserByTelegramID({ telegramId: telegram_id });
    if (user === null) {
      ctx.reply('User not found.');
      return;
    }

    await bot.telegram.sendMessage(telegram_id, message);
    ctx.reply('Message sent.');
  });

  bot.launch().then(() => {
    console.log('Bot is running...');
  });

}

const client = postgres({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});
const admins = ['533398165'];
const botDeps = getBotDeps(client);
const BASE_URL = process.env.BASE_URL;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
launchBot(botDeps, bot, admins, BASE_URL!);
dotenv.config();