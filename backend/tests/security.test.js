import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/jyc_test';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.AUTH_JWT_SECRET = 'test-secret-that-is-long-enough-to-use-in-tests';
process.env.OTP_PEPPER = 'test-otp-pepper-secret-at-least-24';
process.env.PUBLIC_API_URL = 'http://localhost:4000';
process.env.SMTP_FROM = 'Test <test@example.org>';

let request, app, prisma, signSession, allowRoles, HttpError, hashOtp, compareDigest;
before(async () => {
  ({ default: app } = await import('../src/app.js'));
  ({ prisma } = await import('../src/db.js'));
  ({ signSession, allowRoles } = await import('../src/auth.js'));
  ({ HttpError } = await import('../src/errors.js'));
  ({ hashOtp, compareDigest } = await import('../src/routes/api.js'));
  const supertest = (await import('supertest')).default;
  request = supertest(app);
});
after(async () => { if (prisma) await prisma.$disconnect(); });

test('OTP values are keyed hashes and compare without accepting a different code', () => {
  const digest = hashOtp('123456', 'student@example.edu');
  assert.equal(digest.length, 64);
  assert.equal(compareDigest(digest, hashOtp('123456', 'student@example.edu')), true);
  assert.equal(compareDigest(digest, hashOtp('123457', 'student@example.edu')), false);
  assert.equal(compareDigest(digest, hashOtp('123456', 'other@example.edu')), false);
});

test('public health works and invalid registration payloads are rejected before DB access', async () => {
  assert.equal((await request.get('/api/health')).status, 200);
  const result = await request.post('/api/auth/register/request-otp').send({ fullName: 'A', email: 'not-email', rollNumber: '' });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, 'VALIDATION_ERROR');
});

test('event registrations use external forms; no backend registration route is exposed', async () => {
  const result = await request.post('/api/events/event-1/register');
  assert.equal(result.status, 404);
  assert.equal(result.body.code, 'NOT_FOUND');
});

test('faculty coordinator editing and photo upload reject anonymous users', async () => {
  const edit = await request.patch('/api/admin/faculty-coordinator').send({ name: 'Dr. Example', designation: 'Faculty Coordinator' });
  assert.equal(edit.status, 401);
  const photo = await request.post('/api/admin/faculty-coordinator/photo').set('Content-Type', 'image/png').send(Buffer.from('not-an-image'));
  assert.equal(photo.status, 401);
});

test('role middleware denies students from management routes and permits assigned roles', async () => {
  const guard = allowRoles('ADMIN', 'COORDINATOR');
  const denied = await new Promise((resolve) => guard({ user: { role: 'STUDENT' } }, {}, (e) => resolve(e)));
  assert.ok(denied instanceof HttpError);
  assert.equal(denied.status, 403);
  const allowed = await new Promise((resolve) => guard({ user: { role: 'COORDINATOR' } }, {}, resolve));
  assert.equal(allowed, undefined);
});

test('database schema enforces one registration per user and event', async () => {
  const { readFile } = await import('node:fs/promises');
  const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
  assert.match(schema, /@@unique\(\[userId, eventId\]\)/);
  assert.match(schema, /role\s+Role\s+@default\(STUDENT\)/);
});
