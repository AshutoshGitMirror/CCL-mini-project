import { Router } from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth(), async (req, res, next) => {
  try {
    const [totalStudents, totalDrives, openDrives, applications, allStudents, drives] =
      await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.drive.count(),
        prisma.drive.count({ where: { status: 'OPEN' } }),
        prisma.application.findMany({
          include: {
            drive: { include: { companyRef: true } },
            user: { include: { profile: true } },
          },
        }),
        prisma.studentProfile.findMany({
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        prisma.drive.findMany({
          include: {
            companyRef: true,
            _count: { select: { applications: true } },
          },
        }),
      ]);

    // Unique students who received an offer
    const offeredApps = applications.filter((a) => a.status === 'OFFERED');
    const offeredStudentIds = new Set(offeredApps.map((a) => a.userId));
    const placedCount = offeredStudentIds.size;
    const placementRate = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0;

    // Parse packages to find avg and max LPA
    const packagesLpa = [];
    for (const d of drives) {
      if (d.package) {
        const match = d.package.match(/([\d.]+)\s*LPA/i);
        if (match) {
          packagesLpa.push(parseFloat(match[1]));
        }
      }
    }
    const highestPackage = packagesLpa.length ? Math.max(...packagesLpa) : 0;
    const avgPackage = packagesLpa.length
      ? (packagesLpa.reduce((a, b) => a + b, 0) / packagesLpa.length).toFixed(1)
      : '0.0';

    // Branch-wise stats
    const branchMap = {};
    for (const p of allStudents) {
      const b = p.branch || 'Unassigned';
      if (!branchMap[b]) branchMap[b] = { branch: b, total: 0, placed: 0 };
      branchMap[b].total += 1;
      if (offeredStudentIds.has(p.userId)) {
        branchMap[b].placed += 1;
      }
    }
    const branchWise = Object.values(branchMap).map((b) => ({
      ...b,
      rate: b.total > 0 ? Math.round((b.placed / b.total) * 100) : 0,
    }));

    // In-demand skills analysis (demanded by drives)
    const demandSkillMap = {};
    for (const d of drives) {
      for (const s of d.skills || []) {
        const k = s.toLowerCase();
        demandSkillMap[k] = (demandSkillMap[k] || 0) + 1;
      }
    }
    const topSkills = Object.entries(demandSkillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // Company participation & hirings
    const companyHiring = drives.map((d) => ({
      id: d.id,
      company: d.companyRef.name,
      role: d.role,
      package: d.package || 'Not disclosed',
      applicationsCount: d._count.applications,
      status: d.status,
    }));

    res.json({
      overview: {
        totalStudents,
        totalDrives,
        openDrives,
        totalApplications: applications.length,
        placedCount,
        placementRate,
        highestPackage: `${highestPackage} LPA`,
        averagePackage: `${avgPackage} LPA`,
      },
      branchWise,
      topSkills,
      companyHiring,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
