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

export function hashToken(token: string): string {
  return crypto
    .createHmac('sha256', PEPPER)
    .update(token + SALT)
    .digest('hex');
}

export function compareHash(input: string, hash: string | null): boolean {
  if (!hash) {
    return false;
  }
  const inputHash = crypto
    .createHmac('sha256', PEPPER)
    .update(input + SALT)
    .digest('hex');
  console.log('compareHash', inputHash, hash, input);
  return inputHash === hash;
}
