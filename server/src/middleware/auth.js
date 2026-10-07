import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { forbidden, unauthorized } from '../lib/http.js';

export const publicUser = (u) =>
  u && {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    newsletter: u.newsletter,
    street: u.street,
    city: u.city,
    zip: u.zip,
    country: u.country,
    createdAt: u.createdAt,
  };

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

export function setAuthCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 7 * 24 * 3600 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, { path: '/' });
}

/** Attaches req.user when a valid token is present; never rejects. */
export async function loadUser(req, _res, next) {
  const header = req.headers.authorization;
  const token = req.cookies?.[config.cookieName] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
    if (user && !user.blocked) req.user = user;
  } catch {
    /* invalid or expired token: treat as anonymous */
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) throw unauthorized();
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) throw unauthorized();
  if (req.user.role !== 'ADMIN') throw forbidden();
  next();
}
