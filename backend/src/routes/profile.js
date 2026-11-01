import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const blankToUndefined = (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val);

const profileSchema = z.object({
  name: z.preprocess(blankToUndefined, z.string().min(2).optional()),
  cgpa: z.preprocess(blankToUndefined, z.coerce.number().min(0).max(10).optional()),
  branch: z.preprocess(blankToUndefined, z.string().trim().min(2).optional()),
  graduationYear: z.preprocess(blankToUndefined, z.coerce.number().int().min(2020).max(2035).optional()),
  skills: z.array(z.string().min(1)).max(40).optional(),
  phone: z.preprocess(blankToUndefined, z.string().max(25).optional()),
  emailOptIn: z.boolean().optional(),
  avatarUrl: z.preprocess(blankToUndefined, z.string().url().max(500).optional()),
  usn: z.preprocess(blankToUndefined, z.string().max(30).optional()),
  college: z.preprocess(blankToUndefined, z.string().max(100).optional()),
  bio: z.preprocess(blankToUndefined, z.string().max(300).optional()),
  linkedinUrl: z.preprocess(blankToUndefined, z.string().url().max(200).optional()),
  githubUrl: z.preprocess(blankToUndefined, z.string().url().max(200).optional()),
  portfolioUrl: z.preprocess(blankToUndefined, z.string().url().max(200).optional()),
});

// Students: manual skills entry complements the resume-extracted ones.
router.get('/me', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.upsert({
      where: { userId: req.user.id },
      update: {},
      create: { userId: req.user.id },
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

    const updateFields = {};
    for (const [k, v] of Object.entries(profileData)) {
      if (v !== undefined) updateFields[k] = v;
    }

    const profile = await prisma.studentProfile.upsert({
      where: { userId: req.user.id },
      update: updateFields,
      create: {
        userId: req.user.id,
        cgpa: profileData.cgpa ?? null,
        branch: profileData.branch ?? null,
        graduationYear: profileData.graduationYear ?? null,
        skills: profileData.skills ?? [],
        phone: profileData.phone ?? null,
        emailOptIn: profileData.emailOptIn ?? true,
        avatarUrl: profileData.avatarUrl ?? null,
        usn: profileData.usn ?? null,
        college: profileData.college ?? null,
        bio: profileData.bio ?? null,
        linkedinUrl: profileData.linkedinUrl ?? null,
        githubUrl: profileData.githubUrl ?? null,
        portfolioUrl: profileData.portfolioUrl ?? null,
      },
      include: { resume: true },
    });

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

// Recruiters & Officers: Browse and search student talent pool
router.get('/students', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const { q, branch, minCgpa, skill, status } = req.query;

    const where = {
      role: 'STUDENT',
      profile: {
        isNot: null,
      },
    };

    if (branch && branch !== 'ALL') {
      where.profile = { ...where.profile, branch };
    }

    if (minCgpa) {
      const cg = parseFloat(minCgpa);
      if (!Number.isNaN(cg)) {
        where.profile = { ...where.profile, cgpa: { gte: cg } };
      }
    }

    if (skill) {
      where.profile = {
        ...where.profile,
        skills: { has: skill.toLowerCase().trim() },
      };
    }

    let users = await prisma.user.findMany({
      where,
      include: {
        profile: {
          include: { resume: true },
        },
        applications: {
          include: {
            drive: {
              select: { id: true, title: true, role: true, package: true, companyRef: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // In-memory text search across name, email, college, USN, and bio
    if (q && q.trim()) {
      const needle = q.toLowerCase().trim();
      users = users.filter((u) => {
        const p = u.profile || {};
        return (
          u.name.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle) ||
          (p.college && p.college.toLowerCase().includes(needle)) ||
          (p.usn && p.usn.toLowerCase().includes(needle)) ||
          (p.bio && p.bio.toLowerCase().includes(needle)) ||
          (p.skills && p.skills.some((s) => s.toLowerCase().includes(needle)))
        );
      });
    }

    // Filter by recruitment status if specified
    if (status && status !== 'ALL') {
      users = users.filter((u) => {
        const hasOffer = u.applications.some((a) => a.status === 'OFFERED');
        const inProcess = u.applications.some((a) =>
          ['SHORTLISTED', 'ROUND_IN_PROGRESS'].includes(a.status)
        );
        if (status === 'OFFERED') return hasOffer;
        if (status === 'IN_PROCESS') return inProcess && !hasOffer;
        if (status === 'AVAILABLE') return !hasOffer && !inProcess;
        return true;
      });
    }

    // Format response with quick placement status summary
    const formatted = users.map((u) => {
      const hasOffer = u.applications.find((a) => a.status === 'OFFERED');
      const inProcess = u.applications.find((a) =>
        ['SHORTLISTED', 'ROUND_IN_PROGRESS'].includes(a.status)
      );
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        profile: u.profile,
        applicationsCount: u.applications.length,
        placementStatus: hasOffer
          ? 'OFFERED'
          : inProcess
            ? 'ROUND_IN_PROGRESS'
            : u.applications.length > 0
              ? 'APPLIED'
              : 'AVAILABLE',
        offeredCompany: hasOffer?.drive?.companyRef?.name ?? null,
        offeredPackage: hasOffer?.drive?.package ?? null,
      };
    });

    res.json({ students: formatted, total: formatted.length });
  } catch (err) {
    next(err);
  }
});

// Single student profile detail
router.get('/students/:userId', requireAuth(), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        profile: {
          include: { resume: true },
        },
        applications: {
          include: {
            drive: {
              include: { companyRef: true },
            },
            rounds: true,
          },
        },
      },
    });

    if (!user) return next({ status: 404, message: 'Student not found' });
    res.json({ student: user });
  } catch (err) {
    next(err);
  }
});

export default router;
