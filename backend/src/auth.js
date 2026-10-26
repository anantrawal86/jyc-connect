import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { config } from './config.js';
import { prisma } from './db.js';
import { HttpError } from './errors.js';

export const tokenHash = (value) => createHash('sha256').update(value).digest('hex');
export function sessionCookieOptions() { return { httpOnly: true, secure: config.AUTH_COOKIE_SECURE, sameSite: config.AUTH_COOKIE_SAME_SITE, path: '/', maxAge: config.AUTH_SESSION_DAYS * 86400000 }; }
export function signSession(user) { return jwt.sign({ sub: user.id, role: user.role }, config.AUTH_JWT_SECRET, { expiresIn: `${config.AUTH_SESSION_DAYS}d`, issuer: 'jyc-connect' }); }
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[config.AUTH_COOKIE_NAME];
    if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
    const claims = jwt.verify(token, config.AUTH_JWT_SECRET, { issuer: 'jyc-connect' });
    const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, fullName: true, email: true, rollNumber: true, department: true, role: true, emailVerifiedAt: true } });
    if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
    req.user = user; next();
  } catch (e) {
    if (e instanceof HttpError) return next(e);
    // Only invalid or expired tokens mean the user is signed out. Database and
    // other server errors must remain server errors, or the UI will redirect
    // users to login and make a broken dashboard look like a logout.
    if (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError' || e?.name === 'NotBeforeError')
      return next(new HttpError(401, 'UNAUTHENTICATED', 'Please log in to continue.'));
    return next(e);
  }
}
export const allowRoles = (...roles) => (req, res, next) => roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
