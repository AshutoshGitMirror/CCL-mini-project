// Seed: demo users, companies, drives, applications (real shortlist verdicts).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { evaluateDrive } from '../src/lib/shortlist.js';

const prisma = new PrismaClient();
const hash = (pw) => bcrypt.hashSync(pw, 10);

async function main() {
  console.log('[seed] clearing existing demo data…');
  await prisma.notification.deleteMany();
  await prisma.interviewRound.deleteMany();
  await prisma.application.deleteMany();
  await prisma.drive.deleteMany();
  await prisma.company.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('[seed] users…');
  await prisma.user.create({
    data: {
      email: 'officer@placementhub.edu',
      passwordHash: hash('officer123'),
      name: 'Dr. Rekha Menon (TPO)',
      role: 'OFFICER',
    },
  });
  await prisma.user.create({
    data: {
      email: 'recruiter@infosysdemo.com',
      passwordHash: hash('recruiter123'),
      name: 'Arun Kumar (Infosys)',
      role: 'RECRUITER',
    },
  });

  const demoStudents = [
    { name: 'Aditi Sharma', email: 'adi@cse.edu', cgpa: 9.1, branch: 'CSE', skills: ['python', 'aws', 'react', 'machine learning'] },
    { name: 'Vikram Rao', email: 'vik@cse.edu', cgpa: 8.4, branch: 'CSE', skills: ['java', 'dsa', 'sql', 'docker'] },
    { name: 'Isha Nair', email: 'ish@ece.edu', cgpa: 7.8, branch: 'ECE', skills: ['python', 'c++', 'sql'] },
    { name: 'Neha Kulkarni', email: 'neha@it.edu', cgpa: 8.9, branch: 'IT', skills: ['react', 'node.js', 'aws', 'sql'] },
    { name: 'Raj Patel', email: 'raj@mech.edu', cgpa: 7.2, branch: 'MECH', skills: ['excel', 'salesforce'] },
  ];
  const students = [];
  for (const s of demoStudents) {
    const u = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: hash('student123'),
        name: s.name,
        role: 'STUDENT',
        profile: {
          create: { cgpa: s.cgpa, branch: s.branch, graduationYear: 2026, skills: s.skills, phone: '+91 90000 00000' },
        },
      },
      include: { profile: true },
    });
    students.push(u);
  }

  console.log('[seed] companies + drives…');
  const infosys = await prisma.company.create({ data: { name: 'Infosys (demo)' } });
  const zoho = await prisma.company.create({ data: { name: 'Zoho (demo)' } });
  const amazon = await prisma.company.create({ data: { name: 'Amazon (demo)' } });

  const drives = [];
  const mkDrive = (companyId, d) =>
    prisma.drive.create({ data: { ...d, companyId, status: 'OPEN' } }).then((x) => drives.push(x));

  await mkDrive(infosys.id, {
    title: 'Systems Engineer Internship 2026',
    role: 'Full-stack Engineer Trainee',
    package: '4.5 LPA',
    description:
      'Join a delivery squad from day one: build features, write tests, sit in on client calls. Backed by our famous "zero-cost MTA" training programme: 11 weeks on full-stack + cloud before your first assignment.',
    minCgpa: 7.0,
    branches: ['CSE', 'IT', 'ECE'],
    skills: ['python', 'sql', 'java'],
    minSkills: 1,
    roundsTotal: 3,
    deadline: new Date('2026-11-15'),
  });

  await mkDrive(amazon.id, {
    title: 'Cloud-Native Engineer Internship',
    role: 'AWS Cloud Intern',
    package: '6 LPA',
    description:
      'Design and ship on AWS: VPC topologies, EC2 fleets, Lambda functions, S3 storage patterns. Kubernetes + Terraform exposure welcome. Mentored by a senior SDE; project ships to production.',
    minCgpa: 8.0,
    branches: ['CSE', 'IT', 'ECE', 'EEE'],
    skills: ['aws', 'docker', 'python'],
    minSkills: 2,
    roundsTotal: 3,
    deadline: new Date('2026-11-30'),
  });

  await mkDrive(zoho.id, {
    title: 'Full-stack Developer Drive',
    role: 'JavaScript Developer',
    package: '5.5 LPA',
    description:
      'React + Node monorepo. You will build features customers actually see and review code with senior engineers every week.',
    minCgpa: 7.5,
    branches: ['CSE', 'IT'],
    skills: ['react', 'node.js'],
    minSkills: 1,
    roundsTotal: 4,
    deadline: new Date('2026-11-20'),
  });

  await mkDrive(infosys.id, {
    title: 'Data Analyst Internship',
    role: 'Analytics Intern',
    package: '5 LPA',
    description: 'SQL, dashboards and storytelling with data across our retail vertical.',
    minCgpa: 7.0,
    branches: [],
    skills: ['sql', 'excel', 'power bi'],
    minSkills: 1,
    roundsTotal: 2,
    deadline: new Date('2026-12-05'),
  });

  console.log('[seed] applications via the real shortlist engine…');
  for (const user of students) {
    for (const drive of drives) {
      if (user.email === 'raj@mech.edu' && drive.title.startsWith('Cloud')) continue;
      const verdict = evaluateDrive(drive, user.profile, user.profile.skills);
      await prisma.application.create({
        data: {
          driveId: drive.id,
          userId: user.id,
          status: verdict.passed ? 'SHORTLISTED' : 'REJECTED',
          matchScore: verdict.score,
          rejectedReasons: verdict.passed ? [] : verdict.reasons,
        },
      });
    }
  }

  console.log('[seed] notifications…');
  await prisma.notification.create({
    data: {
      subject: 'Placement season 2026 begins',
      message: 'Drives are now open on PlacementHub. Complete your profile, upload your resume (PDF) and apply before deadlines.',
      channel: 'INAPP',
    },
  });

  console.log('[seed] done.');
  console.log('  officer  : officer@placementhub.edu / officer123');
  console.log('  recruiter: recruiter@infosysdemo.com / recruiter123');
  console.log('  student  : adi@cse.edu / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
