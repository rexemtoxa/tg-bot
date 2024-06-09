import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { getSessionByToken } from '../repository/sessions/sessions-queries_sql';
import { getUserByTelegramID } from '../repository/users/users-queries_sql';
import { client } from '../utils/db';

const SALT = process.env.SALT || 'somesalt';
const PEPPER = process.env.PEPPER || 'somepepper';

export class Context {
  constructor(
    public telegramID: string,
    createdAt: string
  ) {}
}

declare global {
  namespace Express {
    interface Request {
      context: Context;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
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
};
