import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { broadcast } from '../lib/sns.js';
import { evaluateDrive } from '../lib/shortlist.js';

const router = Router();

// The UI sends empty strings for optional fields; normalise them away before
// validation so a recruiter can leave "package" or "deadline" blank.
const blankToUndefined = (value) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const driveSchema = z.object({
  title: z.string().trim().min(3),
  company: z.string().trim().min(2),
  role: z.string().trim().min(2),
  description: z.string().trim().min(10),
  package: z.preprocess(blankToUndefined, z.string().min(2).optional()),
  location: z.preprocess(blankToUndefined, z.string().min(2).optional()),
  jobType: z.preprocess(blankToUndefined, z.string().min(2).optional()),
  minCgpa: z.preprocess(
    blankToUndefined,
    z.coerce.number().min(0).max(10).optional()
  ),
  branches: z.array(z.string().trim().min(1)).default([]),
  skills: z.array(z.string().trim().min(1)).default([]),
  minSkills: z.coerce.number().int().min(1).max(10).default(1),
  roundsTotal: z.coerce.number().int().min(1).max(8).default(3),
  deadline: z.preprocess(blankToUndefined, z.string().min(4).optional()),
  broadcast: z.boolean().optional(),
});

// list drives (students see OPEN; recruiters/officers see all)
router.get('/', requireAuth(), async (req, res, next) => {
  try {
    const where = req.user.role === 'STUDENT' ? { status: 'OPEN' } : {};
    const include = {
      companyRef: true,
      _count: { select: { applications: true } },
      // let the student see their own filings inline with each drive
      ...(req.user.role === 'STUDENT'
        ? { applications: { where: { userId: req.user.id } } }
        : {}),
    };
    const drives = await prisma.drive.findMany({ where, include, orderBy: { createdAt: 'desc' } });
    res.json({ drives });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth(), async (req, res, next) => {
  try {
    const drive = await prisma.drive.findUnique({
      where: { id: req.params.id },
      include: {
        companyRef: true,
        applications:
          req.user.role === 'STUDENT'
            ? { where: { userId: req.user.id } }
            : { include: { user: { include: { profile: { include: { resume: true } } } } } },
      },
    });
    if (!drive) return next({ status: 404, message: 'Drive not found' });
    res.json({ drive });
  } catch (err) {
    next(err);
  }
});

// student applies to a drive -> auto-shortlist runs immediately
router.post('/:id/apply', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const drive = await prisma.drive.findUnique({ where: { id: req.params.id } });
    if (!drive) return next({ status: 404, message: 'Drive not found' });
    if (drive.status !== 'OPEN') return next({ status: 400, message: 'Drive is not open' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
      include: { resume: true },
    });
    if (!profile?.resume) {
      return next({ status: 400, message: 'Upload your resume before applying' });
    }

    const extracted = [...(profile.resume.extractedSkills || []), ...(profile.skills || [])];
    const verdict = evaluateDrive(drive, profile, extracted);

    const app = await prisma.application.upsert({
      where: { driveId_userId: { driveId: drive.id, userId: req.user.id } },
      update: {},
      create: {
        driveId: drive.id,
        userId: req.user.id,
        status: verdict.passed ? 'SHORTLISTED' : 'REJECTED',
        matchScore: verdict.score,
        rejectedReasons: verdict.passed ? [] : verdict.reasons,
      },
      include: { drive: true },
    });

    res.status(201).json({ application: app, verdict });
  } catch (err) {
    next(err);
  }
});

// recruiter/officer: publish a new drive notice (and optionally fan out SNS)
router.post('/', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const data = driveSchema.parse(req.body);
    const { broadcast: sendAlert, ...fields } = data;

    const company = await prisma.company.upsert({
      where: { name: fields.company },
      update: {},
      create: { name: fields.company },
    });

    const parsedDeadline = data.deadline ? new Date(data.deadline) : null;
    const deadline =
      parsedDeadline && !Number.isNaN(parsedDeadline.valueOf()) ? parsedDeadline : null;

    const drive = await prisma.drive.create({
      data: {
        title: data.title,
        role: data.role,
        description: data.description,
        package: data.package ?? null,
        location: data.location ?? null,
        jobType: data.jobType ?? null,
        minCgpa: data.minCgpa ?? null,
        branches: data.branches,
        skills: data.skills,
        minSkills: Number(data.minSkills),
        roundsTotal: Number(data.roundsTotal),
        deadline,
        status: 'OPEN',
        companyId: company.id,
      },
      include: { companyRef: true },
    });

    // Default to broadcasting (old behaviour), but honour an explicit false.
    let alertResult;
    if (sendAlert !== false) {
      const alert = {
        subject: `New drive: ${company.name} - ${data.title}`,
        message: [
          `A new placement drive is live on PlacementHub.`,
          ``,
          `Company: ${company.name}`,
          `Role: ${data.role} (${data.package || 'package as per policy'})`,
          data.minCgpa != null ? `Eligibility: CGPA >= ${data.minCgpa}` : null,
          data.branches?.length ? `Eligible branches: ${data.branches.join(', ')}` : null,
          data.skills?.length ? `Skills wanted: ${data.skills.join(', ')}` : null,
          deadline ? `Apply by: ${deadline.toISOString().slice(0, 10)}` : null,
          ``,
          `Log in to PlacementHub to apply.`,
        ]
          .filter((l) => l !== null)
          .join('\n'),
        driveId: drive.id,
      };
      alertResult = await broadcast(alert);
    }

    res.status(201).json({ drive, alert: alertResult?.status ?? 'SKIPPED' });
  } catch (err) {
    next(err);
  }
});

// close a drive
router.post('/:id/close', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const drive = await prisma.drive.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED' },
    });
    res.json({ drive });
  } catch (err) {
    next(err);
  }
});

export default router;
