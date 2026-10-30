import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  cgpa: z.coerce.number().min(0).max(10).optional(),
  branch: z.string().trim().min(2).optional(),
  graduationYear: z.coerce.number().int().min(2020).max(2035).optional(),
  skills: z.array(z.string().min(1)).max(40).optional(),
  phone: z.string().max(20).optional(),
  emailOptIn: z.boolean().optional(),
});

// Students: manual skills entry complements the resume-extracted ones.
router.get('/me', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
      include: { resume: true },
    });
    res.json({ profile, user: req.user });
  } catch (err) {
    next(err);
  }
});

router.put('/me', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const { name, ...profileData } = data;

    if (name) await prisma.user.update({ where: { id: req.user.id }, data: { name } });

    const profile = await prisma.studentProfile.upsert({
      where: { userId: req.user.id },
      update: {
        ...(profileData.cgpa !== undefined ? { cgpa: profileData.cgpa } : {}),
        ...(profileData.branch !== undefined ? { branch: profileData.branch } : {}),
        ...(profileData.graduationYear !== undefined
          ? { graduationYear: profileData.graduationYear }
          : {}),
        ...(profileData.skills !== undefined ? { skills: profileData.skills } : {}),
        ...(profileData.phone !== undefined ? { phone: profileData.phone } : {}),
        ...(profileData.emailOptIn !== undefined ? { emailOptIn: profileData.emailOptIn } : {}),
      },
      create: {
        userId: req.user.id,
        cgpa: profileData.cgpa ?? null,
        branch: profileData.branch ?? null,
        graduationYear: profileData.graduationYear ?? null,
        skills: profileData.skills ?? [],
        phone: profileData.phone ?? null,
        emailOptIn: profileData.emailOptIn ?? true,
      },
      include: { resume: true },
    });

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;
