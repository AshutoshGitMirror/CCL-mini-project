import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { evaluateDrive } from '../lib/shortlist.js';

const router = Router();

// recruiter/officer: applicants for one drive
router.get('/drive/:driveId', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const apps = await prisma.application.findMany({
      where: { driveId: req.params.driveId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { matchScore: 'desc' },
    });
    res.json({ applications: apps });
  } catch (err) {
    next(err);
  }
});

// recruiter/officer advances an application through rounds
router.post('/:id/rounds', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const { result } = z
      .object({ result: z.enum(['SCHEDULED', 'CLEARED', 'FAILED']) })
      .parse(req.body);
    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app) return next({ status: 404, message: 'Application not found' });

    const drive = await prisma.drive.findUnique({ where: { id: app.driveId } });
    const nextRound = app.currentRound + 1;

    const data =
      result === 'CLEARED' && nextRound >= drive.roundsTotal
        ? { status: 'OFFERED', currentRound: nextRound }
        : result === 'CLEARED'
          ? { status: 'ROUND_IN_PROGRESS', currentRound: nextRound }
          : result === 'FAILED'
            ? { status: 'REJECTED' }
            : { status: 'ROUND_IN_PROGRESS' };

    const updated = await prisma.application.update({
      where: { id: app.id },
      data: {
        ...data,
        rounds: {
          create: { roundNumber: data.currentRound ?? app.currentRound, result },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: app.userId,
        subject: `Application update - ${drive.title}`,
        message: `Your application moved to: ${data.status.replace(/_/g, ' ').toLowerCase()}`,
        channel: 'INAPP',
      },
    });

    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
