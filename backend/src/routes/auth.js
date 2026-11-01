import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  authMode,
  isCognitoConfigured,
  userPoolId,
  clientId,
  cognitoRegion,
  cognitoRegister,
  cognitoLogin,
  syncCognitoUserToDb,
} from '../lib/cognito.js';

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

// Return active authentication mode & Cognito cloud status to frontend
router.get('/config', (req, res) => {
  res.json({
    authMode,
    isCognitoConfigured,
    cognito: isCognitoConfigured
      ? {
          userPoolId,
          clientId,
          region: cognitoRegion,
        }
      : null,
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase();

    // 1. Amazon Cognito Mode
    if (authMode === 'cognito' && isCognitoConfigured) {
      try {
        const cognitoRes = await cognitoRegister({
          email,
          password: data.password,
          name: data.name,
          role: data.role,
        });

        // Sync into RDS PostgreSQL for relational integrity
        const user = await syncCognitoUserToDb(
          {
            sub: cognitoRes.UserSub || `cognito-${Date.now()}`,
            email,
            name: data.name,
            'custom:role': data.role,
          },
          data.name
        );

        if (data.role === 'STUDENT') {
          await prisma.studentProfile.upsert({
            where: { userId: user.id },
            update: {
              cgpa: data.cgpa ?? null,
              branch: data.branch ?? null,
              graduationYear: data.graduationYear ?? null,
              emailOptIn: data.emailOptIn ?? true,
            },
            create: {
              userId: user.id,
              cgpa: data.cgpa ?? null,
              branch: data.branch ?? null,
              graduationYear: data.graduationYear ?? null,
              emailOptIn: data.emailOptIn ?? true,
              skills: [],
            },
          });
        }

        // Return token (local fallback token or prompt for sign-in)
        return res.status(201).json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token: sign(user),
          authMode: 'cognito',
          cognitoUserSub: cognitoRes.UserSub,
          message: 'User registered in Amazon Cognito User Pool',
        });
      } catch (cognitoErr) {
        console.error('[cognito] Registration error:', cognitoErr.message);
        return next({ status: 400, message: `Cognito registration: ${cognitoErr.message}` });
      }
    }

    // 2. Default Local Database + JWT Mode
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return next({ status: 409, message: 'That email is already registered' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
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

    res.status(201).json({ user, token: sign(user), authMode: 'jwt' });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string() })
      .parse(req.body);

    const normalizedEmail = email.toLowerCase();

    // 1. Amazon Cognito Mode
    if (authMode === 'cognito' && isCognitoConfigured) {
      try {
        const tokens = await cognitoLogin({ email: normalizedEmail, password });
        
        // Ensure user is synced with RDS PostgreSQL
        const user = await syncCognitoUserToDb({
          sub: tokens.idToken, // Temporary placeholder until verified or decode
          email: normalizedEmail,
        });

        return res.json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token: tokens.idToken, // Cognito ID Token is the primary bearer token
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          authMode: 'cognito',
        });
      } catch (cognitoErr) {
        console.warn('[cognito] Login failed, checking local database fallback:', cognitoErr.message);
        // Fall back to local database check if Cognito credentials fail or during development
      }
    }

    // 2. Default Local Database + JWT Mode
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.passwordHash === 'COGNITO_MANAGED_IDENTITY' || !(await bcrypt.compare(password, user.passwordHash))) {
      return next({ status: 401, message: 'Invalid email or password' });
    }

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: sign(user),
      authMode: 'jwt',
    });
  } catch (err) {
    next(err);
  }
});

// Lightweight session check / user refresh for the frontend header.
router.get('/me', requireAuth(), async (req, res) => {
  res.json({ user: req.user, authMode });
});

export default router;
