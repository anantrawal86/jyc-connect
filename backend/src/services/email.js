import nodemailer from 'nodemailer';
import { config } from '../config.js';
let transporter;
export async function sendOtpEmail(email, otp) {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD) {
    if (config.NODE_ENV !== 'production') throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.');
    throw new Error('Email delivery is unavailable.');
  }
  transporter ??= nodemailer.createTransport({ host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_SECURE, auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } });
  await transporter.sendMail({ from: config.SMTP_FROM, to: email, subject: 'Your JYC Connect verification code', text: `Your verification code is ${otp}. It expires in ${config.OTP_TTL_MINUTES} minutes. If you did not request this, ignore this email.` });
}
