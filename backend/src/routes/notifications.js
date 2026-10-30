import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { broadcast, transport } from '../lib/sns.js';

const router = Router();

// student's own notification feed
router.get('/me', requireAuth(), async (req, res, next) => {
  try {
    const items = await prisma.notification.findMany({
      where: { OR: [{ userId: req.user.id }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    res.json({ notifications: items, transport: transport() });
  } catch (err) {
    next(err);
  }
});

// officers/recruiters: send a manual broadcast (SNS + audit row)
router.post('/send', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const { subject, message } = z
      .object({ subject: z.string().min(3), message: z.string().min(3) })
      .parse(req.body);
    res.json(await broadcast({ subject, message }));
  } catch (err) {
    next(err);
  }
});

// officers: audit trail of everything sent
router.get('/audit', requireAuth('OFFICER'), async (_req, res, next) => {
  try {
    const items = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ notifications: items });
  } catch (err) {
    next(err);
  }
});

export default router;
