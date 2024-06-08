import { Telegraf } from 'telegraf';
import { CreateUserRow, GetUserByTelegramIDRow } from '../repository/users/users-queries_sql';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);


export interface DataBaseDeps {
  createUser(args: { telegramId: string, firstName: string }): Promise<CreateUserRow | null>;
  getUserByTelegramID(args: { telegramId: string }): Promise<GetUserByTelegramIDRow | null>;
}


export const launchBot = (dbDeps: DataBaseDeps, admins: string[], baseUrl: string): void => {
  bot.start(async (ctx) => {
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

  bot.command('adminhello', async (ctx) => {
    console.log('Admin command received')
    const [_, telegram_id, ...messageParts] = ctx.message.text.split(' ');
    const message = messageParts.join(' ');

    if (!admins.includes(String(ctx.from.id))) {
      return ctx.reply('You are not authorized to use this command.');
    }

    const user = await dbDeps.getUserByTelegramID({ telegramId: telegram_id });
    if (user === null) {
      return ctx.reply('User not found.');
    }

    await bot.telegram.sendMessage(telegram_id, message);
    ctx.reply('Message sent.');
  });

  bot.launch().then(() => {
    console.log('Bot is running...');
  });

}

