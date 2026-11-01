import { Router } from 'express';
import { z } from 'zod';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { presignResumeUpload, presignResumeDownload, uploadResumeDirect, s3, bucket } from '../lib/s3.js';
import { ensureBucket } from '../lib/ensureBucket.js';
import { extractBuf, extractSkills, extractAcademicHistory, textractText } from '../lib/resumeParser.js';

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

    // A student may only confirm an object the server allocated to them.
    if (!key.startsWith(`resumes/${req.user.id}/`)) {
      return next({ status: 403, message: 'That upload does not belong to you' });
    }

    // Read bytes from S3 (LocalStack or real AWS)
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = Buffer.from(await obj.Body.transformToByteArray());

    let text = '';
    let parserUsed = process.env.RESUME_PARSER || 'local';

    if (parserUsed === 'textract') {
      try {
        console.log(`[textract] Sending ${bytes.length} bytes to Amazon Textract...`);
        text = await textractText(bytes);
        console.log(`[textract] OCR completed successfully (${text.length} characters extracted)`);
      } catch (err) {
        console.warn('[textract] Textract call failed, using local PDF parser fallback:', err.message);
        text = await extractBuf(bytes);
        parserUsed = 'local-fallback';
      }
    } else {
      text = await extractBuf(bytes);
    }

    const skills = extractSkills(text);
    const academic = extractAcademicHistory(text);

    const resume = await prisma.resume.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, filename: key, s3Key: key, extractedSkills: skills, parsedAt: new Date() },
      update: { filename: key, s3Key: key, extractedSkills: skills, parsedAt: new Date() },
    });

    // Auto-populate student profile CGPA, branch, or graduation year if currently not set
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (profile) {
      const updates = {};
      if (profile.cgpa == null && academic.cgpa != null) updates.cgpa = academic.cgpa;
      if (!profile.branch && academic.branch) updates.branch = academic.branch;
      if (profile.graduationYear == null && academic.graduationYear != null) updates.graduationYear = academic.graduationYear;
      if (Object.keys(updates).length > 0) {
        await prisma.studentProfile.update({
          where: { userId: req.user.id },
          data: updates,
        });
      }
    }

    res.json({ resume, skills, academic, parserUsed });
  } catch (err) {
    next(err);
  }
});

/**
 * Direct upload fallback for cases where browser-to-S3 direct PUT encounters CORS or network limits
 */
router.post('/upload-direct', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const { filename, base64 } = z
      .object({ filename: z.string().min(1), base64: z.string().min(1) })
      .parse(req.body);

    await ensureBucket();
    const key = `resumes/${req.user.id}/${Date.now()}-${filename.split('/').pop()}`;
    const buffer = Buffer.from(base64, 'base64');
    await uploadResumeDirect(key, buffer, 'application/pdf');

    // Run parser directly on the buffer
    let text = '';
    let parserUsed = process.env.RESUME_PARSER || 'local';
    if (parserUsed === 'textract') {
      try {
        text = await textractText(buffer);
      } catch (err) {
        console.warn('[textract] Direct upload Textract fallback:', err.message);
        text = await extractBuf(buffer);
        parserUsed = 'local-fallback';
      }
    } else {
      text = await extractBuf(buffer);
    }

    const skills = extractSkills(text);
    const academic = extractAcademicHistory(text);

    const resume = await prisma.resume.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, filename: key, s3Key: key, extractedSkills: skills, parsedAt: new Date() },
      update: { filename: key, s3Key: key, extractedSkills: skills, parsedAt: new Date() },
    });

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (profile) {
      const updates = {};
      if (profile.cgpa == null && academic.cgpa != null) updates.cgpa = academic.cgpa;
      if (!profile.branch && academic.branch) updates.branch = academic.branch;
      if (profile.graduationYear == null && academic.graduationYear != null) updates.graduationYear = academic.graduationYear;
      if (Object.keys(updates).length > 0) {
        await prisma.studentProfile.update({
          where: { userId: req.user.id },
          data: updates,
        });
      }
    }

    res.json({ resume, skills, academic, parserUsed });
  } catch (err) {
    next(err);
  }
});

/**
 * Pre-signed download link to securely view the resume PDF from S3
 */
router.get('/download', requireAuth('STUDENT'), async (req, res, next) => {
  try {
    const resume = await prisma.resume.findUnique({ where: { userId: req.user.id } });
    if (!resume) return next({ status: 404, message: 'Resume not found' });
    const downloadUrl = await presignResumeDownload(resume.s3Key);
    res.json({ downloadUrl, filename: resume.filename });
  } catch (err) {
    next(err);
  }
});

router.get('/view/:userId', requireAuth('RECRUITER', 'OFFICER'), async (req, res, next) => {
  try {
    const resume = await prisma.resume.findUnique({ where: { userId: req.params.userId } });
    if (!resume) return next({ status: 404, message: 'Resume not found' });
    const downloadUrl = await presignResumeDownload(resume.s3Key);
    res.json({ downloadUrl, filename: resume.filename });
  } catch (err) {
    next(err);
  }
});

export default router;

