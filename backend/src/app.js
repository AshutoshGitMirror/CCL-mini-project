import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import driveRoutes from './routes/drives.js';
import applicationRoutes from './routes/applications.js';
import resumeRoutes from './routes/resume.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'placementhub-api', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// In containerized/standalone deployment, serve the frontend dist if present
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  // Zod schema failures are user input problems, not server faults.
  if (err?.name === 'ZodError') {
    const details = err.issues?.map((i) => `${i.path.join('.') || 'field'}: ${i.message}`) ?? [];
    return res.status(400).json({ error: details.join('; ') || 'Invalid request' });
  }
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'That record already exists' });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

export default app;

