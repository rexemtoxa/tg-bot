import crypto from 'crypto';
import {
  createSession,
  deleteSessionByTelegramID,
  deleteTempTokenByTelegramID,
  getTempTokeByTelegramID,
} from '../repository/sessions/sessions-queries_sql';
import { GetUserByTelegramIDRow, getUserByTelegramID } from '../repository/users/users-queries_sql';
import { client } from '../utils/db';
import { compareHash } from '../utils/token';

const SALT = process.env.SALT || 'somesalt';
const PEPPER = process.env.PEPPER || 'somepepper';

export async function validateUserAndToken(telegramID: string, token: string): Promise<GetUserByTelegramIDRow | null> {
  const user = await getUserByTelegramID(client, { telegramId: telegramID });
  if (user === null || !compareHash(token, user.token)) {
    await deleteSessionAndTempToken(telegramID);
    return null;
  }
  return user;
}

export async function validateTempToken(telegramID: string, tempToken: string) {
  const tempTokenHash = await getTempTokeByTelegramID(client, { telegramId: telegramID });
  if (tempTokenHash === null) {
    await deleteSessionAndTempToken(telegramID);
    return null;
  }

  const hash = crypto
    .createHmac('sha256', PEPPER)
    .update(tempToken + SALT)
    .digest('hex');

  if (tempTokenHash.code !== hash || tempTokenHash.expiresAt < new Date()) {
    await deleteSessionAndTempToken(telegramID);
    return null;
  }
  return tempTokenHash;
}

async function deleteSessionAndTempToken(telegramID: string) {
  await Promise.all([
    deleteSessionByTelegramID(client, { telegramId: telegramID }),
    deleteTempTokenByTelegramID(client, { telegramId: telegramID }),
  ]);
}

export async function generateSession(telegramID: string) {
  const { token: sessionToken, hash: tokenHash } = generateToken();
  const session = await createSession(client, { telegramId: telegramID, sessionToken: tokenHash });

  const now = new Date();
  now.setHours(now.getHours() + 24);
  const expires = session?.expiresAt || now;

  return { sessionToken, expires };
}

function generateToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(64).toString('hex');
  const hash = crypto
    .createHmac('sha256', PEPPER)
    .update(token + SALT)
    .digest('hex');
  return { token, hash };
}
