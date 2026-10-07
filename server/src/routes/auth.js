import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db.js';
import { badRequest, parse, unauthorized, forbidden } from '../lib/http.js';
import { clearAuthCookie, publicUser, setAuthCookie, signToken } from '../middleware/auth.js';
import { getSettings } from '../lib/settings.js';

const router = Router();

// Brute-force protection for credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Příliš mnoho pokusů. Zkuste to prosím za chvíli.' },
});

const password = z
  .string()
  .min(8, 'Heslo musí mít alespoň 8 znaků.')
  .regex(/[A-Za-z]/, 'Heslo musí obsahovat písmeno.')
  .regex(/[0-9]/, 'Heslo musí obsahovat číslici.');

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Neplatný e-mail.'),
  password,
  firstName: z.string().trim().min(1, 'Vyplňte jméno.').max(60),
  lastName: z.string().trim().min(1, 'Vyplňte příjmení.').max(60),
  newsletter: z.boolean().optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Musíte souhlasit s obchodními podmínkami.' }) }),
});

router.post('/register', authLimiter, async (req, res) => {
  const settings = await getSettings();
  if (!settings.features.registration) throw forbidden('Registrace je momentálně vypnutá.');
  const data = parse(registerSchema, req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw badRequest('Účet s tímto e-mailem už existuje.');
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
      firstName: data.firstName,
      lastName: data.lastName,
      newsletter: Boolean(data.newsletter),
    },
  });
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Neplatný e-mail.'),
  password: z.string().min(1, 'Vyplňte heslo.'),
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password: pw } = parse(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(pw, user.passwordHash))) {
    throw unauthorized('Nesprávný e-mail nebo heslo.');
  }
  if (user.blocked) throw forbidden('Tento účet byl zablokován.');
  setAuthCookie(res, signToken(user));
  res.json({ user: publicUser(user) });
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: publicUser(req.user) || null });
});

export { password as passwordSchema };
export default router;
