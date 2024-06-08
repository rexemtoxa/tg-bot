import { Context, Telegram } from 'telegraf';
import { CreateUserRow, GetUserByTelegramIDRow } from '../repository/users/users-queries_sql';
import { Message, Update } from 'telegraf/typings/core/types/typegram';

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

  bot.command('adminhello', async (ctx) => {
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

