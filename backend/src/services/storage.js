import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

export async function saveImage({ buffer, mimeType }) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) throw Object.assign(new Error('Only JPEG, PNG, WebP, and GIF images are supported.'), { status: 400, code: 'INVALID_IMAGE' });
  if (buffer.length > 8 * 1024 * 1024) throw Object.assign(new Error('Image must be 8 MB or smaller.'), { status: 413, code: 'IMAGE_TOO_LARGE' });
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[mimeType];
  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
  if (config.STORAGE_DRIVER === 's3') {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    if (!config.S3_BUCKET || !config.S3_REGION || !config.S3_ACCESS_KEY_ID || !config.S3_SECRET_ACCESS_KEY || !config.S3_PUBLIC_BASE_URL) throw new Error('S3 storage configuration is incomplete.');
    const client = new S3Client({ region: config.S3_REGION, endpoint: config.S3_ENDPOINT || undefined, forcePathStyle: config.S3_FORCE_PATH_STYLE, credentials: { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY } });
    await client.send(new PutObjectCommand({ Bucket: config.S3_BUCKET, Key: key, Body: buffer, ContentType: mimeType }));
    return { key, url: `${config.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}` };
  }
  const root = path.resolve(config.LOCAL_STORAGE_DIR);
  const filename = path.resolve(root, key);
  await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, buffer, { flag: 'wx' });
  return { key, url: `${config.PUBLIC_API_URL.replace(/\/$/, '')}/uploads/${key.replaceAll('\\', '/')}` };
}
export async function removeLocalImage(key) {
  if (config.STORAGE_DRIVER !== 'local') return;
  const root = path.resolve(config.LOCAL_STORAGE_DIR), target = path.resolve(root, key);
  if (!target.startsWith(`${root}${path.sep}`)) return;
  await unlink(target).catch(() => {});
}
