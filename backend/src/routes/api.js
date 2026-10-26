import { Router } from 'express';
import { randomInt, randomBytes, createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { authenticate, allowRoles, signSession, sessionCookieOptions, tokenHash } from '../auth.js';
import { sendOtpEmail } from '../services/email.js';
import { saveImage, removeLocalImage } from '../services/storage.js';

export const api = Router();
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const clean = (value) => typeof value === 'string' ? value.trim() : value;
const validate = (schema, source = 'body') => (req, res, next) => { const parsed = schema.safeParse(req[source]); if (!parsed.success) return next(new HttpError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid request.')); req[source] = parsed.data; next(); };
const emailSchema = z.string().trim().email().max(254).transform((v) => v.toLowerCase());
const otpLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { code: 'RATE_LIMITED', message: 'Too many verification requests. Try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } });
const signIn = (res, user) => res.cookie(config.AUTH_COOKIE_NAME, signSession(user), sessionCookieOptions());
const publicUser = ({ id, fullName, email, rollNumber, department, role, emailVerifiedAt }) => ({ id, fullName, email, rollNumber, department, role, emailVerifiedAt });
const otpDigest = (otp, email) => createHmac('sha256', config.OTP_PEPPER).update(`${email}:${otp}`).digest('hex');
import { timingSafeEqual } from 'node:crypto';
export const compareDigest = (a, b) => { const aa = Buffer.from(a, 'hex'), bb = Buffer.from(b, 'hex'); return aa.length === bb.length && timingSafeEqual(aa, bb); };
export const hashOtp = otpDigest;
const registerInfo = z.object({ fullName: z.string().trim().min(2).max(120), email: emailSchema, rollNumber: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9/-]+$/), department: z.string().trim().min(2).max(100) });

api.get('/health', (req, res) => res.json({ status: 'ok' }));

api.post('/auth/register/request-otp', otpLimiter, validate(registerInfo), asyncRoute(async (req, res) => {
  const { fullName, email, rollNumber, department } = req.body;
  if (await prisma.user.findFirst({ where: { OR: [{ email }, { rollNumber }] } })) throw new HttpError(409, 'ACCOUNT_EXISTS', 'An account with this email or roll number already exists.');
  const previous = await prisma.otpChallenge.findFirst({ where: { email, consumedAt: null }, orderBy: { createdAt: 'desc' } });
  if (previous && previous.resendAfter > new Date()) throw new HttpError(429, 'OTP_COOLDOWN', 'Please wait before requesting another code.');
  const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const now = new Date();
  const challenge = await prisma.$transaction(async (tx) => {
    await tx.otpChallenge.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: now } });
    return tx.otpChallenge.create({ data: { email, fullName, rollNumber, department, otpHash: otpDigest(otp, email), expiresAt: new Date(now.getTime() + config.OTP_TTL_MINUTES * 60_000), resendAfter: new Date(now.getTime() + config.OTP_RESEND_SECONDS * 1000) } });
  });
  try { await sendOtpEmail(email, otp); }
  catch (error) { await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } }); throw new HttpError(503, 'EMAIL_UNAVAILABLE', 'Verification email could not be sent. Please try again later.'); }
  res.status(202).json({ expiresIn: config.OTP_TTL_MINUTES * 60, resendAfter: config.OTP_RESEND_SECONDS });
}));

api.post('/auth/register/verify-otp', otpLimiter, validate(z.object({ email: emailSchema, otp: z.string().trim().regex(/^\d{6}$/) })), asyncRoute(async (req, res) => {
  const { email, otp } = req.body;
  const challenge = await prisma.otpChallenge.findFirst({ where: { email, consumedAt: null }, orderBy: { createdAt: 'desc' } });
  if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= config.OTP_MAX_ATTEMPTS) throw new HttpError(400, 'OTP_INVALID', 'The code is invalid or expired. Request a new code.');
  if (!compareDigest(challenge.otpHash, otpDigest(otp, email))) {
    const attempts = challenge.attempts + 1;
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts, ...(attempts >= config.OTP_MAX_ATTEMPTS ? { consumedAt: new Date() } : {}) } });
    throw new HttpError(400, 'OTP_INVALID', 'The code is invalid or expired. Request a new code.');
  }
  const plain = randomBytes(32).toString('base64url');
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.otpChallenge.updateMany({ where: { id: challenge.id, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: config.OTP_MAX_ATTEMPTS } }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) throw new HttpError(400, 'OTP_INVALID', 'The code is invalid or expired. Request a new code.');
    await tx.registrationGrant.create({ data: { tokenHash: tokenHash(plain), email, fullName: challenge.fullName, rollNumber: challenge.rollNumber, department: challenge.department, expiresAt: new Date(Date.now() + config.OTP_VERIFICATION_TTL_MINUTES * 60_000) } });
  });
  res.json({ verificationToken: plain });
}));

api.post('/auth/register/complete', authLimiter, validate(z.object({ verificationToken: z.string().min(40).max(100), fullName: z.string().trim().min(2).max(120), email: emailSchema, rollNumber: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9/-]+$/), department: z.string().trim().min(2).max(100), password: z.string().min(10).max(72) })), asyncRoute(async (req, res) => {
  const b = req.body;
  const grant = await prisma.registrationGrant.findUnique({ where: { tokenHash: tokenHash(b.verificationToken) } });
  if (!grant || grant.consumedAt || grant.expiresAt <= new Date() || grant.email !== b.email || grant.fullName !== b.fullName || grant.rollNumber !== b.rollNumber || grant.department !== b.department) throw new HttpError(400, 'VERIFICATION_INVALID', 'Email verification is invalid or expired. Verify your email again.');
  const passwordHash = await bcrypt.hash(b.password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const marked = await tx.registrationGrant.updateMany({ where: { id: grant.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
    if (marked.count !== 1) throw new HttpError(409, 'VERIFICATION_USED', 'This verification has already been used.');
    return tx.user.create({ data: { fullName: grant.fullName, email: grant.email, rollNumber: grant.rollNumber, department: grant.department, passwordHash, role: 'STUDENT', emailVerifiedAt: new Date() } });
  });
  signIn(res, user); res.status(201).json({ user: publicUser(user) });
}));

api.post('/auth/login', authLimiter, validate(z.object({ identifier: z.string().trim().min(3).max(254), password: z.string().min(1).max(72) })), asyncRoute(async (req, res) => {
  const identifier = req.body.identifier.toLowerCase();
  const user = await prisma.user.findFirst({ where: identifier.includes('@') ? { email: identifier } : { rollNumber: req.body.identifier.trim() } });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email/roll number or password is incorrect.');
  if (!user.emailVerifiedAt) throw new HttpError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before logging in.');
  signIn(res, user); res.json({ user: publicUser(user) });
}));
api.post('/auth/logout', (req, res) => res.clearCookie(config.AUTH_COOKIE_NAME, { httpOnly: true, secure: config.AUTH_COOKIE_SECURE, sameSite: config.AUTH_COOKIE_SAME_SITE, path: '/' }).json({ success: true }));
api.get('/auth/me', authenticate, (req, res) => res.json({ user: req.user }));
api.get('/auth/profile', authenticate, (req, res) => res.json({ user: req.user }));

api.get('/hubs', asyncRoute(async (req, res) => res.json(await prisma.hub.findMany({ orderBy: { name: 'asc' } }))));
api.get('/hubs/:id', asyncRoute(async (req, res) => { const hub = await prisma.hub.findUnique({ where: { id: req.params.id } }); if (!hub) throw new HttpError(404, 'NOT_FOUND', 'Hub not found.'); res.json(hub); }));
const eventInclude = { hub: { select: { id: true, name: true } } };
function eventDto(e) { return { id: e.id, title: e.title, hubId: e.hubId, category: e.category, date: e.date.toISOString().slice(0, 10), startTime: e.startTime, endTime: e.endTime, venue: e.venue, status: e.date >= new Date(new Date().toDateString()) ? 'upcoming' : 'past', summary: e.summary, description: e.description, highlights: e.highlights, imageUrl: e.imageUrl, registrationFormUrl: e.registrationFormUrl, hub: e.hub }; }
api.get('/events', asyncRoute(async (req, res) => {
  const status = z.enum(['upcoming', 'past']).optional().safeParse(req.query.status); if (!status.success) throw new HttpError(400, 'VALIDATION_ERROR', 'status must be upcoming or past.');
  const where = { published: true, ...(status.data === 'upcoming' ? { date: { gte: new Date(new Date().toDateString()) } } : status.data === 'past' ? { date: { lt: new Date(new Date().toDateString()) } } : {}) };
  const events = await prisma.jycEvent.findMany({ where, include: eventInclude, orderBy: { date: status.data === 'past' ? 'desc' : 'asc' } }); res.json(events.map(eventDto));
}));
api.get('/events/:id', asyncRoute(async (req, res) => { const e = await prisma.jycEvent.findFirst({ where: { id: req.params.id, published: true }, include: eventInclude }); if (!e) throw new HttpError(404, 'NOT_FOUND', 'Event not found.'); res.json(eventDto(e)); }));
api.get('/council', asyncRoute(async (req, res) => res.json(await prisma.councilMember.findMany({ orderBy: { sortOrder: 'asc' } }))));
api.get('/faculty-coordinator', asyncRoute(async (req, res) => {
  const coordinator = await prisma.facultyCoordinator.findUnique({ where: { id: 'primary' } });
  if (!coordinator) throw new HttpError(404, 'NOT_FOUND', 'Faculty coordinator information is not available yet.');
  res.json(coordinator);
}));
api.get('/announcements', asyncRoute(async (req, res) => { const rows = await prisma.announcement.findMany({ where: { published: true }, orderBy: { date: 'desc' }, select: { id: true, title: true, body: true, date: true } }); res.json(rows.map((a) => ({ ...a, date: a.date.toISOString().slice(0, 10) }))); }));
api.get('/dashboard', authenticate, asyncRoute(async (req, res) => {
  const announcements = await prisma.announcement.findMany({ where: { published: true }, orderBy: { date: 'desc' }, take: 10, select: { id: true, title: true, body: true, date: true } });
  res.json({ user: req.user, announcements: announcements.map((a) => ({ ...a, date: a.date.toISOString().slice(0, 10) })) });
}));

api.post('/contact', rateLimit({ windowMs: 60 * 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false }), validate(z.object({ name: z.string().trim().min(2).max(120), email: emailSchema, message: z.string().trim().min(10).max(5000), website: z.string().max(0).optional().default(''), formStartedAt: z.coerce.number().optional() })), asyncRoute(async (req, res) => {
  if (req.body.website) throw new HttpError(400, 'SPAM_REJECTED', 'Unable to accept this message.');
  if (req.body.formStartedAt && Date.now() - req.body.formStartedAt < config.CONTACT_MIN_SECONDS * 1000) throw new HttpError(400, 'SPAM_REJECTED', 'Please take a moment before submitting.');
  const ipHash = createHmac('sha256', config.OTP_PEPPER).update(req.ip ?? 'unknown').digest('hex');
  const recent = await prisma.contactMessage.count({ where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60_000) } } }); if (recent >= 5) throw new HttpError(429, 'RATE_LIMITED', 'Too many messages. Try again later.');
  await prisma.contactMessage.create({ data: { name: req.body.name, email: req.body.email, message: req.body.message, ipHash } }); res.status(201).json({ success: true });
}));

api.get('/gallery', asyncRoute(async (req, res) => {
  const hubId = typeof req.query.hubId === 'string' && req.query.hubId ? req.query.hubId : undefined;
  res.json(await prisma.galleryImage.findMany({
    ...(hubId ? { where: { hubId } } : {}), orderBy: { createdAt: 'desc' },
    select: { id: true, hubId: true, url: true, alt: true, caption: true, category: true, createdAt: true },
  }));
}));
api.get('/assets/:slot', asyncRoute(async (req, res) => { const slot = req.params.slot.toUpperCase(); if (!['HERO', 'LOGIN', 'REGISTER', 'ABOUT', 'CAMPUS'].includes(slot)) throw new HttpError(404, 'NOT_FOUND', 'Asset slot not found.'); const asset = await prisma.siteAsset.findUnique({ where: { slot } }); if (!asset) throw new HttpError(404, 'NOT_FOUND', 'Asset not found.'); res.json(asset); }));

// Management routes are deliberately role-gated. Uploads use raw octet streams to avoid unbounded multipart parsing.
api.get('/admin/overview', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => {
  const [students, events, hubs, announcements] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }), prisma.jycEvent.count(), prisma.hub.count(), prisma.announcement.count(),
  ]);
  res.json({ students, events, hubs, announcements });
}));
api.get('/admin/events', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => {
  const rows = await prisma.jycEvent.findMany({ include: eventInclude, orderBy: { date: 'desc' } });
  res.json(rows.map((event) => ({ ...eventDto(event), published: event.published })));
}));
api.get('/admin/announcements', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => {
  const rows = await prisma.announcement.findMany({ orderBy: { date: 'desc' } });
  res.json(rows.map((item) => ({ ...item, date: item.date.toISOString().slice(0, 10) })));
}));
const announcementInput = z.object({ title: z.string().trim().min(2).max(200), body: z.string().trim().max(10000).optional().nullable(), date: z.coerce.date().optional(), published: z.boolean().optional() });
api.post('/admin/announcements', authenticate, allowRoles('ADMIN', 'COORDINATOR'), validate(announcementInput.extend({ published: z.boolean().default(false) })), asyncRoute(async (req, res) => res.status(201).json(await prisma.announcement.create({ data: req.body }))));
api.patch('/admin/announcements/:id', authenticate, allowRoles('ADMIN'), validate(announcementInput.partial()), asyncRoute(async (req, res) => res.json(await prisma.announcement.update({ where: { id: req.params.id }, data: req.body }))));
api.delete('/admin/announcements/:id', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => { await prisma.announcement.delete({ where: { id: req.params.id } }); res.json({ success: true }); }));
api.get('/admin/gallery', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => {
  res.json(await prisma.galleryImage.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, hubId: true, url: true, alt: true, caption: true, category: true, createdAt: true } }));
}));
const googleFormUrl = z.string().url().refine((value) => { try { const url = new URL(value); return url.hostname === 'docs.google.com' && url.pathname.startsWith('/forms/'); } catch { return false; } }, 'Enter a Google Forms responder URL.');
const hubInput = z.object({ id: z.string().trim().min(2).max(80), name: z.string().trim().min(2).max(120), tagline: z.string().trim().max(200), description: z.string().trim().min(1).max(5000), icon: z.string().trim().min(1).max(50), councilGroup: z.string().trim().min(1).max(120), imageUrl: z.string().url().optional().nullable(), registrationFormUrl: googleFormUrl.optional().nullable() });
api.post('/admin/hubs', authenticate, allowRoles('ADMIN'), validate(hubInput), asyncRoute(async (req, res) => res.status(201).json(await prisma.hub.create({ data: req.body }))));
const hubUpdate = hubInput.omit({ id: true }).partial();
api.patch('/admin/hubs/:id', authenticate, allowRoles('ADMIN'), validate(hubUpdate), asyncRoute(async (req, res) => {
  const clearImage = Object.hasOwn(req.body, 'imageUrl') && req.body.imageUrl === null;
  const mediaWhere = { kind_entityId: { kind: 'hub', entityId: req.params.id } };
  const previous = clearImage ? await prisma.mediaAsset.findUnique({ where: mediaWhere }) : null;
  const hub = await prisma.$transaction(async (tx) => {
    const updated = await tx.hub.update({ where: { id: req.params.id }, data: req.body });
    if (clearImage) await tx.mediaAsset.deleteMany({ where: { kind: 'hub', entityId: req.params.id } });
    return updated;
  });
  if (previous) await removeLocalImage(previous.storageKey);
  res.json(hub);
}));
api.delete('/admin/hubs/:id', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => {
  const eventCount = await prisma.jycEvent.count({ where: { hubId: req.params.id } });
  if (eventCount) throw new HttpError(409, 'HUB_HAS_EVENTS', 'This hub still has events. Delete or move those events before deleting the hub.');
  await prisma.$transaction([
    prisma.mediaAsset.deleteMany({ where: { kind: 'hub', entityId: req.params.id } }),
    prisma.hub.delete({ where: { id: req.params.id } }),
  ]);
  res.json({ success: true });
}));
const eventInput = z.object({ title: z.string().trim().min(2).max(200), hubId: z.string().min(1), category: z.string().trim().max(100).default(''), date: z.coerce.date(), startTime: z.string().trim().max(40).default(''), endTime: z.string().trim().max(40).default(''), venue: z.string().trim().max(200).default(''), summary: z.string().trim().max(500).default(''), description: z.string().trim().max(10000).default(''), highlights: z.array(z.string().trim().min(1).max(300)).max(30).default([]), imageUrl: z.string().url().optional().nullable(), registrationFormUrl: googleFormUrl.optional().nullable(), published: z.boolean().default(false) });
api.post('/admin/events', authenticate, allowRoles('ADMIN', 'COORDINATOR'), validate(eventInput), asyncRoute(async (req, res) => {
  if (req.body.published && !req.body.registrationFormUrl) throw new HttpError(409, 'REGISTRATION_FORM_REQUIRED', 'Add a Google Form URL to this event before publishing it.');
  res.status(201).json(await prisma.jycEvent.create({ data: req.body }));
}));
api.patch('/admin/events/:id', authenticate, allowRoles('ADMIN', 'COORDINATOR'), validate(eventInput.partial()), asyncRoute(async (req, res) => {
  const current = await prisma.jycEvent.findUnique({ where: { id: req.params.id }, select: { published: true, registrationFormUrl: true } });
  if (!current) throw new HttpError(404, 'NOT_FOUND', 'Event not found.');
  const published = req.body.published ?? current.published;
  const registrationFormUrl = Object.hasOwn(req.body, 'registrationFormUrl') ? req.body.registrationFormUrl : current.registrationFormUrl;
  if (published && !registrationFormUrl) throw new HttpError(409, 'REGISTRATION_FORM_REQUIRED', 'Add a Google Form URL to this event before publishing it.');
  res.json(await prisma.jycEvent.update({ where: { id: req.params.id }, data: req.body }));
}));
api.delete('/admin/events/:id', authenticate, allowRoles('ADMIN', 'COORDINATOR'), asyncRoute(async (req, res) => {
  await prisma.jycEvent.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));
api.post('/admin/images', authenticate, allowRoles('ADMIN', 'COORDINATOR'), asyncRoute(async (req, res) => {
  const type = req.get('content-type'); if (!type?.startsWith('image/')) throw new HttpError(400, 'INVALID_IMAGE', 'Send an image with its image content type.');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 8 * 1024 * 1024) throw new HttpError(413, 'IMAGE_TOO_LARGE', 'Image must be 8 MB or smaller.'); chunks.push(chunk); }
  const hubId = typeof req.query.hubId === 'string' && req.query.hubId ? req.query.hubId : null;
  if (hubId && !(await prisma.hub.findUnique({ where: { id: hubId }, select: { id: true } }))) throw new HttpError(404, 'HUB_NOT_FOUND', 'Choose a valid hub for this gallery image.');
  const result = await saveImage({ buffer: Buffer.concat(chunks), mimeType: type });
  const image = await prisma.galleryImage.create({ data: { hubId, url: result.url, storageKey: result.key, mimeType: type, sizeBytes: size, alt: String(req.query.alt ?? '').slice(0, 250) || 'JYC image', caption: req.query.caption ? String(req.query.caption).slice(0, 500) : null, category: req.query.category ? String(req.query.category).slice(0, 80) : null } });
  res.status(201).json(image);
}));
api.post('/admin/media/:kind/:id', authenticate, allowRoles('ADMIN', 'COORDINATOR'), asyncRoute(async (req, res) => {
  const kind = req.params.kind;
  if (!['hub', 'event', 'council'].includes(kind)) throw new HttpError(400, 'VALIDATION_ERROR', 'kind must be hub, event, or council.');
  const type = req.get('content-type'); if (!type?.startsWith('image/')) throw new HttpError(400, 'INVALID_IMAGE', 'Send an image with its image content type.');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 8 * 1024 * 1024) throw new HttpError(413, 'IMAGE_TOO_LARGE', 'Image must be 8 MB or smaller.'); chunks.push(chunk); }
  const stored = await saveImage({ buffer: Buffer.concat(chunks), mimeType: type });
  const where = kind === 'council' ? { enrollment: req.params.id } : { id: req.params.id };
  const update = kind === 'hub' ? prisma.hub.update({ where, data: { imageUrl: stored.url } })
    : kind === 'event' ? prisma.jycEvent.update({ where, data: { imageUrl: stored.url } })
      : prisma.councilMember.update({ where, data: { photoUrl: stored.url } });
  const record = await update;
  const asset = await prisma.mediaAsset.upsert({
    where: { kind_entityId: { kind, entityId: req.params.id } },
    create: { kind, entityId: req.params.id, url: stored.url, storageKey: stored.key, mimeType: type, sizeBytes: size, alt: String(req.query.alt ?? `${kind} image`).slice(0, 250) },
    update: { url: stored.url, storageKey: stored.key, mimeType: type, sizeBytes: size, alt: String(req.query.alt ?? `${kind} image`).slice(0, 250) },
  });
  res.status(201).json({ url: stored.url, record, asset });
}));
api.delete('/admin/media/council/:id', authenticate, allowRoles('ADMIN', 'COORDINATOR'), asyncRoute(async (req, res) => {
  const member = await prisma.councilMember.findUnique({ where: { enrollment: req.params.id } });
  if (!member) throw new HttpError(404, 'NOT_FOUND', 'Council member not found.');
  const asset = await prisma.mediaAsset.findUnique({ where: { kind_entityId: { kind: 'council', entityId: req.params.id } } });
  await prisma.councilMember.update({ where: { enrollment: req.params.id }, data: { photoUrl: null } });
  if (asset) {
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    await removeLocalImage(asset.storageKey);
  }
  res.json({ success: true });
}));
api.put('/admin/assets/:slot', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => {
  const slot = req.params.slot.toUpperCase(); if (!['HERO', 'LOGIN', 'REGISTER', 'ABOUT', 'CAMPUS'].includes(slot)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid asset slot.');
  const type = req.get('content-type'); if (!type?.startsWith('image/')) throw new HttpError(400, 'INVALID_IMAGE', 'Send an image with its image content type.');
  const chunks = []; let size = 0; for await (const chunk of req) { size += chunk.length; if (size > 8 * 1024 * 1024) throw new HttpError(413, 'IMAGE_TOO_LARGE', 'Image must be 8 MB or smaller.'); chunks.push(chunk); }
  const image = await saveImage({ buffer: Buffer.concat(chunks), mimeType: type });
  const previous = await prisma.siteAsset.findUnique({ where: { slot } });
  const assetData = { url: image.url, storageKey: image.key, mimeType: type, sizeBytes: size, alt: String(req.query.alt ?? '').slice(0, 250) };
  const asset = await prisma.siteAsset.upsert({ where: { slot }, create: { slot, ...assetData }, update: assetData });
  if (previous) await removeLocalImage(previous.storageKey); res.json(asset);
}));
api.delete('/admin/assets/:slot', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => {
  const slot = req.params.slot.toUpperCase();
  if (!['HERO', 'LOGIN', 'REGISTER', 'ABOUT', 'CAMPUS'].includes(slot)) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid asset slot.');
  const previous = await prisma.siteAsset.findUnique({ where: { slot } });
  if (previous) {
    await prisma.siteAsset.delete({ where: { slot } });
    await removeLocalImage(previous.storageKey);
  }
  res.json({ success: true });
}));
api.delete('/admin/gallery/:id', authenticate, allowRoles('ADMIN', 'COORDINATOR'), asyncRoute(async (req, res) => { const image = await prisma.galleryImage.findUnique({ where: { id: req.params.id } }); if (!image) throw new HttpError(404, 'NOT_FOUND', 'Image not found.'); await prisma.galleryImage.delete({ where: { id: image.id } }); await removeLocalImage(image.storageKey); res.json({ success: true }); }));

api.patch('/admin/faculty-coordinator', authenticate, allowRoles('ADMIN'), validate(z.object({ name: z.string().trim().min(2).max(120), designation: z.string().trim().min(2).max(160) })), asyncRoute(async (req, res) => {
  const record = await prisma.facultyCoordinator.upsert({ where: { id: 'primary' }, create: { id: 'primary', ...req.body }, update: req.body });
  res.json(record);
}));
api.post('/admin/faculty-coordinator/photo', authenticate, allowRoles('ADMIN'), asyncRoute(async (req, res) => {
  const type = req.get('content-type');
  if (!type?.startsWith('image/')) throw new HttpError(400, 'INVALID_IMAGE', 'Choose an image file to upload.');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 8 * 1024 * 1024) throw new HttpError(413, 'IMAGE_TOO_LARGE', 'Image must be 8 MB or smaller.'); chunks.push(chunk); }
  const stored = await saveImage({ buffer: Buffer.concat(chunks), mimeType: type });
  const prior = await prisma.mediaAsset.findUnique({ where: { kind_entityId: { kind: 'faculty-coordinator', entityId: 'primary' } } });
  const record = await prisma.facultyCoordinator.upsert({ where: { id: 'primary' }, create: { id: 'primary', name: 'Dr. Rakhi Pandey', designation: 'Faculty Incharge (Student Welfare)', photoUrl: stored.url }, update: { photoUrl: stored.url } });
  await prisma.mediaAsset.upsert({
    where: { kind_entityId: { kind: 'faculty-coordinator', entityId: 'primary' } },
    create: { kind: 'faculty-coordinator', entityId: 'primary', url: stored.url, storageKey: stored.key, mimeType: type, sizeBytes: size, alt: `${record.name} — ${record.designation}` },
    update: { url: stored.url, storageKey: stored.key, mimeType: type, sizeBytes: size, alt: `${record.name} — ${record.designation}` },
  });
  if (prior) await removeLocalImage(prior.storageKey);
  res.status(201).json(record);
}));

