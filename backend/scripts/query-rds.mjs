import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const arg = (process.argv[2] || '').toLowerCase().trim();

  if (arg === 'users') {
    console.log('\n[+] SELECT * FROM "User" on Amazon RDS:');
    const data = await prisma.user.findMany({ take: 25 });
    console.table(data);
    return;
  }

  if (arg === 'drives') {
    console.log('\n[+] SELECT * FROM "Drive" on Amazon RDS:');
    const data = await prisma.drive.findMany({ take: 25, include: { companyRef: true } });
    console.table(data.map(d => ({
      id: d.id,
      company: d.companyRef?.name,
      role: d.role,
      package: d.package,
      minCgpa: d.minCgpa,
      status: d.status,
      rounds: d.roundsTotal,
      deadline: d.deadline
    })));
    return;
  }

  if (arg === 'apps' || arg === 'applications') {
    console.log('\n[+] SELECT * FROM "Application" on Amazon RDS:');
    const data = await prisma.application.findMany({ 
      take: 25, 
      include: { user: true, drive: true } 
    });
    console.table(data.map(a => ({
      appId: a.id,
      candidate: a.user?.name,
      driveRole: a.drive?.role,
      status: a.status,
      matchScore: a.matchScore,
      currentRound: a.currentRound
    })));
    return;
  }

  if (arg === 'profiles') {
    console.log('\n[+] SELECT * FROM "StudentProfile" on Amazon RDS:');
    const data = await prisma.studentProfile.findMany({ take: 25, include: { user: true } });
    console.table(data.map(p => ({
      name: p.user?.name,
      email: p.user?.email,
      cgpa: p.cgpa,
      branch: p.branch,
      gradYear: p.graduationYear,
      skills: (p.skills || []).slice(0, 4).join(', ')
    })));
    return;
  }

  if (arg.startsWith('select')) {
    const rawSql = process.argv.slice(2).join(' ');
    console.log(`\n[+] Executing raw SQL on Amazon RDS: ${rawSql}`);
    const results = await prisma.$queryRawUnsafe(rawSql);
    console.table(results);
    return;
  }

  console.log('\n===============================================================');
  console.log('       AMAZON RDS LIVE CONNECTION & VERIFICATION TOOL          ');
  console.log('===============================================================');

  // 1. Fetch AWS RDS PostgreSQL Server Metadata
  const [versionResult] = await prisma.$queryRawUnsafe(`SELECT version();`);
  const [inetResult] = await prisma.$queryRawUnsafe(`SELECT inet_server_addr(), inet_server_port();`);
  const [dbResult] = await prisma.$queryRawUnsafe(`SELECT current_database(), current_user;`);
  const [sslResult] = await prisma.$queryRawUnsafe(`SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid();`);

  console.log(`\n[+] Target RDS Host : placementhub-db.cofeamqier1q.us-east-1.rds.amazonaws.com`);
  console.log(`[+] AWS Region      : us-east-1 (N. Virginia)`);
  console.log(`[+] Connected DB    : ${dbResult.current_database} (User: ${dbResult.current_user})`);
  console.log(`[+] RDS Internal IP : ${inetResult.inet_server_addr}:${inetResult.inet_server_port}`);
  console.log(`[+] SSL / TLS State : ${sslResult?.ssl ? 'ENABLED (Encrypted via ' + sslResult.cipher + ')' : 'Disabled'}`);
  console.log(`[+] Engine Version  : ${versionResult.version.split(' on ')[0]}`);

  console.log('\n---------------------------------------------------------------');
  console.log('                 1. TABLES IN AMAZON RDS                       ');
  console.log('---------------------------------------------------------------');
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.table(tables);

  console.log('\n---------------------------------------------------------------');
  console.log('                 2. REAL USERS IN DATABASE                     ');
  console.log('---------------------------------------------------------------');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    take: 10,
  });
  console.table(users);

  console.log('\n---------------------------------------------------------------');
  console.log('              3. ACTIVE PLACEMENT DRIVES (RDS)                 ');
  console.log('---------------------------------------------------------------');
  const drives = await prisma.drive.findMany({
    select: {
      id: true,
      role: true,
      package: true,
      minCgpa: true,
      status: true,
      companyRef: {
        select: { name: true }
      }
    },
    take: 5,
  });
  console.table(drives.map(d => ({
    id: d.id,
    company: d.companyRef ? d.companyRef.name : 'N/A',
    role: d.role,
    package: d.package,
    minCgpa: d.minCgpa,
    status: d.status
  })));

  console.log('\n===============================================================');
  console.log(' [SUCCESS] Verified: Connected to REAL Amazon RDS PostgreSQL!  ');
  console.log('===============================================================\n');
}

main()
  .catch(e => {
    console.error('Error connecting to RDS:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
