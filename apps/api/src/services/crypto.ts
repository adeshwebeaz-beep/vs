import crypto from 'node:crypto';
import { env } from '../config/env.js';

const key = crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decrypt(payload: string): string {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivRaw, 'base64'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

export function signWebhook(timestamp: string, body: string): string {
  return crypto
    .createHmac('sha256', env.WEBHOOK_SIGNING_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

export function verifyWebhook(timestamp: string, body: string, signature: string): boolean {
  const maxAgeMs = 5 * 60 * 1000;
  if (Math.abs(Date.now() - Number(timestamp)) > maxAgeMs) return false;
  const expected = signWebhook(timestamp, body);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
