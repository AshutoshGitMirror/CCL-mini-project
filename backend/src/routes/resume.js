import { Router } from 'express';
import { z } from 'zod';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { presignResumeUpload, s3, bucket } from '../lib/s3.js';
import { ensureBucket } from '../lib/ensureBucket.js';
import { extractBuf, extractSkills } from '../lib/resumeParser.js';

const router = Router();

/**
 * Two-step upload so file bytes never flow through the API server (EC2):
 *   1) get a pre-signed PUT URL (browser -> S3/LocalStack directly)
 *   2) after uploading, call /confirm so we record the object & parse it
 */
router.post('/upload-link', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const { filename, contentType } = z
      .object({ filename: z.string().min(1), contentType: z.string().startsWith('application/pdf') })
      .parse(req.body);

    if (!filename.toLowerCase().endsWith('.pdf')) {
      return next({ status: 400, message: 'Only PDF resumes are accepted' });
    }

    await ensureBucket();
    const key = `resumes/${req.user.id}/${Date.now()}-${filename.split('/').pop()}`;
    const uploadUrl = await presignResumeUpload(key, contentType);

    res.json({ uploadUrl, key });
  } catch (err) {
    next(err);
  }
});

router.post('/confirm', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const { key } = z.object({ key: z.string().min(1) }).parse(req.body);

    // The bytes live in S3 (LocalStack or real AWS). Read them back once and
    // parse from the buffer — the OCR text is then cached in RDS and never
    // re-read, so Textract-style billing only ever happens once per resume.
    let skills = [];
    if (process.env.RESUME_PARSER !== 'textract') {
      const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const bytes = Buffer.from(await obj.Body.transformToByteArray());
      const text = await extractBuf(bytes);
      skills = extractSkills(text);
    }

    const resume = await prisma.resume.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, filename: key, s3Key: key, extractedSkills: skills, parsedAt: new Date() },
      update: { filename: key, s3Key: key, extractedSkills: skills, parsedAt: new Date() },
    });

    res.json({ resume, skills });
  } catch (err) {
    next(err);
  }
});

export default router;
