import crypto from 'crypto';

const SALT = process.env.SALT || 'somesalt';
const PEPPER = process.env.PEPPER || 'somepepper';

export function generateToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(64).toString('hex');
  const hash = crypto
    .createHmac('sha256', PEPPER)
    .update(token + SALT)
    .digest('hex');
  return { token, hash };
}
