import postgres from 'postgres'
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { getUserByTelegramID, saveUserPassword, updateUserToken } from './repository/users/users-queries_sql';
import { createSession, getSessionByToken, deleteSessionByTelegramID } from './repository/sessions/sessions-queries_sql';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';


dotenv.config();
const client = postgres({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: 'require'
});

const SALT = process.env.SALT || 'somesalt';
const PEPPER = process.env.PEPPER || 'somepepper';

function generateToken(): { token: string, hash: string } {
  const token = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHmac('sha256', PEPPER).update(token + SALT).digest('hex');
  return { token, hash };
}

export class Context {
  constructor(public telegramID: string) { }

}

declare global {
  namespace Express {
    interface Request {
      context: Context
    }
  }
}


const app = express();
const port = 3000;
app.use(express.json());
app.use(express.static(process.env.PATH_TO_STATIC || path.join(__dirname, '../../frontend/public')));
app.use(cookieParser())
const auth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.session;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const hash = crypto.createHmac('sha256', PEPPER).update(token + SALT).digest('hex');

  try {
    const result = await getSessionByToken(client, { sessionToken: hash });
    if (result && result.expiresAt && result.expiresAt > new Date() && result.telegramId) {
      const ctx = new Context(result.telegramId);
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
      const { token, hash } = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      res.cookie('session', token, { httpOnly: true, secure: true, expires: expiresAt });
      await createSession(client, { telegramId: telegramID, sessionToken: hash, expiresAt });
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/verify-token', auth, async (req, res) => {
  const { telegramID, token } = req.body;
  console.log('Verify token request received');
  if (req.context?.telegramID !== telegramID) {

    return res.status(401).json({ error: 'Invalid token' });
  }
  try {

    const user = await getUserByTelegramID(client, { telegramId: telegramID });

    if (user === null) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (user.token === token) {
      return res.status(200).json({
        telegramID: user.telegramId,
        createdAt: user.createdAt
      });
    } else {
      await deleteSessionByTelegramID(client, { telegramId: telegramID });
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('*', (req, res) => {
  console.log('GET request received for the static');
  res.sendFile(process.env.PATH_TO_STATIC || path.join(__dirname, '../../frontend/public') + '/index.html');
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
