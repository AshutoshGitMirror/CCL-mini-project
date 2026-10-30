import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../db.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2),
  role: z.enum(['STUDENT', 'RECRUITER', 'OFFICER']),
  // student-only optional fields provided at signup
  cgpa: z.coerce.number().min(0).max(10).optional(),
  branch: z.string().trim().min(2).optional(),
  graduationYear: z.coerce.number().int().min(2020).max(2035).optional(),
  emailOptIn: z.boolean().optional(),
});

function sign(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) return next({ status: 409, message: 'That email is already registered' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        role: data.role,
        ...(data.role === 'STUDENT'
          ? {
              profile: {
                create: {
                  cgpa: data.cgpa ?? null,
                  branch: data.branch ?? null,
                  graduationYear: data.graduationYear ?? null,
                  emailOptIn: data.emailOptIn ?? true,
                },
              },
            }
          : {}),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    res.status(201).json({ user, token: sign(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string() })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next({ status: 401, message: 'Invalid email or password' });
    }
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: sign(user),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
