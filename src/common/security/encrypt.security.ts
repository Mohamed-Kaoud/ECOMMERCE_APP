import crypto from 'node:crypto';

const IV_LENGTH = 16;

export function Encrypt(text: string) {

  const encryption_key = Buffer.from(process.env.ENCRYPTION_KEY!);

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv('aes-256-cbc', encryption_key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');

  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function Decrypt(text: string) {
    
  const encryption_key = Buffer.from(process.env.ENCRYPTION_KEY!);

  const [ivHex, encryptedText] = text.split(':');

  const iv = Buffer.from(ivHex!, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', encryption_key, iv);

  let decrypted = decipher.update(encryptedText!, 'hex', 'utf8');

  decrypted += decipher.final('utf8');

  return decrypted;
}
