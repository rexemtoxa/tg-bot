import { BotDeps, DataBaseDeps, launchBot } from "../src/bot/launch-bot";

const mockDbDeps: jest.Mocked<DataBaseDeps> = {
  createUser: jest.fn().mockResolvedValue({}),
  getUserByTelegramID: jest.fn().mockResolvedValue({}),
};

// Mock implementations for bot dependencies
const mockBotDeps: jest.Mocked<BotDeps> = {
  start: jest.fn(),
  command: jest.fn(),
  launch: jest.fn().mockResolvedValue(undefined),
  telegram: {
    sendMessage: jest.fn(),
  },
};

const admins = ['533398165'];
const BASE_URL = 'http://example.com';


beforeAll(() => {
  launchBot(mockDbDeps, mockBotDeps, admins, BASE_URL);
});

describe('Bot Commands', () => {
  it('should respond to /start command', async () => {
    const ctx = {
      from: { id: 123456, first_name: 'TestUser' },
      reply: jest.fn(),
    };

    await mockBotDeps.start.mock.calls[0][0](ctx as any);

    expect(mockDbDeps.createUser).toHaveBeenCalledWith({
      telegramId: '123456',
      firstName: 'TestUser',
    });
    expect(ctx.reply).toHaveBeenCalledWith('Hello, TestUser!', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Open Web App',
              web_app: { url: `${BASE_URL}?telegramId=123456` },
            },
          ],
        ],
      },
    });
  });

  it('should respond to /adminhello command from admin', async () => {
    const ctx = {
      message: { text: '/adminhello 123456 Test message' },
      from: { id: 533398165 },
      reply: jest.fn(),
    };

    await mockBotDeps.command.mock.calls[0][1](ctx as any);

    expect(mockDbDeps.getUserByTelegramID).toHaveBeenCalledWith({
      telegramId: '123456',
    });
    expect(mockBotDeps.telegram.sendMessage).toHaveBeenCalledWith('123456', 'Test message');
    expect(ctx.reply).toHaveBeenCalledWith('Message sent.');
  });

  it('should reject /adminhello command from non-admin', async () => {
    const ctx = {
      message: { text: '/adminhello 123456 Test message' },
      from: { id: 123456 },
      reply: jest.fn(),
    };

    await mockBotDeps.command.mock.calls[0][1](ctx as any);

    expect(ctx.reply).toHaveBeenCalledWith('You are not authorized to use this command.');
  });

  it('should reject /adminhello command with invalid body', async () => {
    const ctx = {
      message: { text: '/adminhello' },
      reply: jest.fn(),
    };

    await mockBotDeps.command.mock.calls[0][1](ctx as any);

    expect(ctx.reply).toHaveBeenCalledWith(
      'Invalid command body, please provide a message like:\n```\n/adminhello 12345 Hello!\n```',
      { parse_mode: 'Markdown' }
    );
  });
});