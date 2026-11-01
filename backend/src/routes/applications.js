import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Student: get all my applications with full drive details and rounds
router.get('/my', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const apps = await prisma.application.findMany({
      where: { userId: req.user.id },
      include: {
        drive: {
          include: { companyRef: true },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ applications: apps });
  } catch (err) {
    next(err);
  }
});

// Recruiter/officer: applicants for one drive
router.get('/drive/:driveId', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const apps = await prisma.application.findMany({
      where: { driveId: req.params.driveId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                id: true,
                cgpa: true,
                branch: true,
                graduationYear: true,
                skills: true,
                phone: true,
                avatarUrl: true,
                usn: true,
                college: true,
                bio: true,
                linkedinUrl: true,
                githubUrl: true,
                resume: true,
              },
            },
          },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        drive: {
          include: { companyRef: true },
        },
      },
      orderBy: { matchScore: 'desc' },
    });
    res.json({ applications: apps });
  } catch (err) {
    next(err);
  }
});

// Recruiter/officer: export applicants to CSV
router.get('/export/:driveId', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const drive = await prisma.drive.findUnique({
      where: { id: req.params.driveId },
      include: { companyRef: true },
    });
    if (!drive) return next({ status: 404, message: 'Drive not found' });

    const apps = await prisma.application.findMany({
      where: { driveId: req.params.driveId },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { matchScore: 'desc' },
    });

    const headers = ['Rank', 'Name', 'USN', 'Email', 'College', 'Branch', 'CGPA', 'Match Score (%)', 'Status', 'Phone'];
    const rows = apps.map((a, i) => {
      const p = a.user.profile || {};
      return [
        i + 1,
        `"${(a.user.name || '').replace(/"/g, '""')}"`,
        `"${(p.usn || '').replace(/"/g, '""')}"`,
        `"${(a.user.email || '').replace(/"/g, '""')}"`,
        `"${(p.college || '').replace(/"/g, '""')}"`,
        `"${(p.branch || '').replace(/"/g, '""')}"`,
        p.cgpa ?? 'N/A',
        a.matchScore ?? 0,
        a.status,
        `"${(p.phone || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const safeTitle = drive.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="shortlist_${safeTitle}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// recruiter/officer advances an application through rounds
router.post('/:id/rounds', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const { result, notes, scheduledAt } = z
      .object({
        result: z.enum(['SCHEDULED', 'CLEARED', 'FAILED']),
        notes: z.string().optional(),
        scheduledAt: z.string().optional(),
      })
      .parse(req.body);

    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { drive: { include: { companyRef: true } } },
    });
    if (!app) return next({ status: 404, message: 'Application not found' });
    if (['OFFERED', 'REJECTED'].includes(app.status)) {
      return next({ status: 400, message: 'This application is already closed' });
    }

    const drive = app.drive;
    const roundNumber = app.currentRound + 1;

    const data =
      result === 'CLEARED' && roundNumber >= drive.roundsTotal
        ? { status: 'OFFERED', currentRound: roundNumber }
        : result === 'CLEARED'
          ? { status: 'ROUND_IN_PROGRESS', currentRound: roundNumber }
          : result === 'FAILED'
            ? { status: 'REJECTED', currentRound: roundNumber }
            : { status: 'ROUND_IN_PROGRESS' };

    const updated = await prisma.application.update({
      where: { id: app.id },
      data: {
        ...data,
        rounds: {
          create: {
            roundNumber,
            result,
            notes: notes || null,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          },
        },
      },
      include: {
        rounds: true,
        drive: { include: { companyRef: true } },
      },
    });

    const statusDisplay = data.status.replace(/_/g, ' ').toLowerCase();
    await prisma.notification.create({
      data: {
        userId: app.userId,
        driveId: drive.id,
        subject: `Application update - ${drive.companyRef.name} (${drive.title})`,
        message:
          result === 'SCHEDULED'
            ? `Round ${roundNumber} has been scheduled for you in ${drive.companyRef.name} drive. Check your admit card/hall ticket.`
            : `Round ${roundNumber} marked ${result.toLowerCase()}. Application status updated to: ${statusDisplay.toUpperCase()}.`,
        channel: 'INAPP',
      },
    });

    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
