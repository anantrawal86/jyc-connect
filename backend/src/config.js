import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url(),
  AUTH_JWT_SECRET: z.string().min(32),
  AUTH_COOKIE_NAME: z.string().default('jyc_session'),
  AUTH_COOKIE_SECURE: z.string().default('false').transform((v) => v === 'true'),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  AUTH_SESSION_DAYS: z.coerce.number().int().positive().default(7),
  OTP_PEPPER: z.string().min(24),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_RESEND_SECONDS: z.coerce.number().int().positive().default(60),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_VERIFICATION_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  SMTP_HOST: z.string().optional().default(''), SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().optional().default(''), SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM: z.string().min(3), STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./uploads'), PUBLIC_API_URL: z.string().url(),
  S3_BUCKET: z.string().optional().default(''), S3_REGION: z.string().optional().default(''),
  S3_ENDPOINT: z.string().optional().default(''), S3_ACCESS_KEY_ID: z.string().optional().default(''),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(''), S3_PUBLIC_BASE_URL: z.string().optional().default(''),
  S3_FORCE_PATH_STYLE: z.string().default('false').transform((v) => v === 'true'),
  CONTACT_MIN_SECONDS: z.coerce.number().int().min(0).default(3),
});
export const config = schema.parse(process.env);
if (config.NODE_ENV === 'production' && config.AUTH_JWT_SECRET.includes('replace_with')) throw new Error('Set a unique AUTH_JWT_SECRET in production');
if (config.AUTH_COOKIE_SAME_SITE === 'none' && !config.AUTH_COOKIE_SECURE) throw new Error('AUTH_COOKIE_SECURE=true is required when AUTH_COOKIE_SAME_SITE=none');
if (config.NODE_ENV === 'production' && config.STORAGE_DRIVER === 'local') throw new Error('Production requires STORAGE_DRIVER=s3');
if (config.NODE_ENV === 'production' && (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD)) throw new Error('SMTP configuration is required in production');
