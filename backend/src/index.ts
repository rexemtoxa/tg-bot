import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import postgres from 'postgres';
import {
  createSession,
  deleteSessionByTelegramID,
  deleteTempTokenByTelegramID,
  getSessionByToken,
  getTempTokeByTelegramID,
  saveTempToken,
} from './repository/sessions/sessions-queries_sql';
import { getUserByTelegramID, saveUserPassword, updateUserToken } from './repository/users/users-queries_sql';

dotenv.config();

const client = postgres({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.SSL === undefined ? 'require' : !!process.env.SSL,
});


const SALT = process.env.SALT || 'somesalt';
const PEPPER = process.env.PEPPER || 'somepepper';

function generateToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(64).toString('hex');
  const hash = crypto
    .createHmac('sha256', PEPPER)
    .update(token + SALT)
    .digest('hex');
  return { token, hash };
}

export class Context {
  constructor(
    public telegramID: string,
    createdAt: string
  ) { }
}

declare global {
  namespace Express {
    interface Request {
      context: Context;
    }
  }
}

const app = express();
const port = 3000;
app.use(express.json());
const staticPath = process.env.PATH_TO_STATIC || path.join(__dirname, '../../frontend/public');
console.log('staticPath', staticPath);
app.use(express.static(staticPath));
app.use(cookieParser());
const auth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.session;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const hash = crypto
    .createHmac('sha256', PEPPER)
    .update(token + SALT)
    .digest('hex');

  try {
    const result = await getSessionByToken(client, { sessionToken: hash });
    if (result && result.expiresAt && result.expiresAt > new Date() && result.telegramId) {
      const user = await getUserByTelegramID(client, { telegramId: result.telegramId });
      if (!user || user.createdAt === null) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      const ctx = new Context(result.telegramId, user.createdAt.toISOString());
      req.context = ctx;
      next();
      return;
    } else {
      res.setHeader('Set-Cookie', 'session=; Max-Age=0');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
  next();
};

app.get('/api/user', auth, async (req, res) => {
  const { telegramID } = req.context;
  try {
    const user = await getUserByTelegramID(client, { telegramId: telegramID });
    if (user === null) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      telegramID: user.telegramId,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/logout', auth, async (req, res) => {
  const { telegramID } = req.context;
  try {
    await deleteSessionByTelegramID(client, { telegramId: telegramID });
    res.clearCookie('session');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/signup', async (req, res) => {
  const { telegramID, password, token } = req.body;
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
      const { token, hash } = generateToken();

      await saveTempToken(client, { telegramId: telegramID, code: hash });
      return res.status(200).json({
        telegramID: user.telegramId,
        tempToken: token,
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/verify-token', async (req, res) => {
  const { telegramID, token, tempToken } = req.body;
  if (!telegramID || !token || !tempToken) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const [user, tempTokenHash] = await Promise.all([
      getUserByTelegramID(client, { telegramId: telegramID }),
      getTempTokeByTelegramID(client, { telegramId: telegramID }),
    ]);

    const badUserOrToken = user === null || tempTokenHash === null;
    if (badUserOrToken) {
      console.log('invalid user or temp token');
      await Promise.all([
        deleteSessionByTelegramID(client, { telegramId: telegramID }),
        deleteTempTokenByTelegramID(client, { telegramId: telegramID }),
      ]);
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (user.token !== token) {
      console.log('invalid user token');
      await Promise.all([
        deleteSessionByTelegramID(client, { telegramId: telegramID }),
        deleteTempTokenByTelegramID(client, { telegramId: telegramID }),
      ]);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const hash = crypto
      .createHmac('sha256', PEPPER)
      .update(tempToken + SALT)
      .digest('hex');

    const badTempToken = tempTokenHash.code !== hash || tempTokenHash.expiresAt < new Date();
    if (badTempToken) {
      await Promise.all([
        deleteSessionByTelegramID(client, { telegramId: telegramID }),
        deleteTempTokenByTelegramID(client, { telegramId: telegramID }),
      ]);
      console.log('invalid temp token');
      return res.status(401).json({ error: 'Invalid token' });
    }
    const { token: sessionToken, hash: tokenHash } = generateToken();
    const session = await createSession(client, { telegramId: telegramID, sessionToken: tokenHash });

    const now = new Date();
    now.setHours(now.getHours() + 24);
    const expires = session?.expiresAt || now;

    res.cookie('session', sessionToken, { httpOnly: true, secure: true, expires });
    return res.status(200).json({
      telegramID: user.telegramId,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(staticPath + '/index.html');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
