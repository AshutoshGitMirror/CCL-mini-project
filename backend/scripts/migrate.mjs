import prisma from '../src/db.js';

async function migrate() {
  console.log('[migrate] Applying non-destructive column additions...');
  const stmts = [
    `ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
    `ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "usn" TEXT`,
    `ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "college" TEXT`,
    `ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "bio" TEXT`,
    `ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT`,
    `ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "githubUrl" TEXT`,
    `ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "portfolioUrl" TEXT`,
    `ALTER TABLE "Drive" ADD COLUMN IF NOT EXISTS "location" TEXT`,
    `ALTER TABLE "Drive" ADD COLUMN IF NOT EXISTS "jobType" TEXT`,
    `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "offerLetterUrl" TEXT`,
  ];

  for (const s of stmts) {
    try {
      await prisma.$executeRawUnsafe(s);
      console.log('✓ Executed:', s);
    } catch (e) {
      console.error('✗ Failed:', s, e.message);
    }
  }
  console.log('[migrate] Completed.');
  await prisma.$disconnect();
}

migrate();
