// Optimized batch seed: fast and resilient for remote Amazon RDS
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { evaluateDrive } from '../src/lib/shortlist.js';

const prisma = new PrismaClient();
const hash = (pw) => bcrypt.hashSync(pw, 10);

async function main() {
  console.log('[seed] clearing existing data…');
  await prisma.notification.deleteMany();
  await prisma.interviewRound.deleteMany();
  await prisma.application.deleteMany();
  await prisma.drive.deleteMany();
  await prisma.company.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('[seed] creating officers and recruiters…');
  await prisma.user.createMany({
    data: [
      {
        email: 'officer@placementhub.edu',
        passwordHash: hash('officer123'),
        name: 'Dr. Rekha Menon (TPO)',
        role: 'OFFICER',
      },
      {
        email: 'recruiter@infosysdemo.com',
        passwordHash: hash('recruiter123'),
        name: 'Arun Kumar (Infosys)',
        role: 'RECRUITER',
      },
      {
        email: 'recruiter@amazon.com',
        passwordHash: hash('recruiter123'),
        name: 'Priyanka Sen (Amazon AWS)',
        role: 'RECRUITER',
      },
    ],
  });

  const indianStudentsData = [
    {
      name: 'Aditi Sharma',
      email: 'adi@cse.edu',
      cgpa: 9.2,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'IIT Bombay',
      usn: '1BM22CS001',
      phone: '+91 98450 12345',
      bio: 'Cloud & Distributed Systems Enthusiast | AWS Certified | Open Source Contributor',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/aditi-sharma-tech',
      githubUrl: 'https://github.com/aditisharma',
      skills: ['python', 'aws', 'react', 'machine learning', 'docker', 'sql'],
    },
    {
      name: 'Vikram Rao',
      email: 'vik@cse.edu',
      cgpa: 8.6,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'RVCE Bengaluru',
      usn: '1RV22CS142',
      phone: '+91 99012 34567',
      bio: 'Backend Architect & System Design Geek | Java Spring Boot & Microservices | LeetCode Knight',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/vikram-rao-dev',
      githubUrl: 'https://github.com/vikramrao',
      skills: ['java', 'dsa', 'sql', 'docker', 'kubernetes', 'spring boot'],
    },
    {
      name: 'Isha Nair',
      email: 'ish@ece.edu',
      cgpa: 8.1,
      branch: 'ECE',
      graduationYear: 2026,
      college: 'NIT Trichy',
      usn: 'NITT22EC039',
      phone: '+91 97412 88990',
      bio: 'Embedded Systems & IoT Engineer | Edge AI Enthusiast | C++ and Firmware Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/isha-nair',
      githubUrl: 'https://github.com/ishanair',
      skills: ['python', 'c++', 'sql', 'iot', 'linux', 'embedded c'],
    },
    {
      name: 'Neha Kulkarni',
      email: 'neha@it.edu',
      cgpa: 8.9,
      branch: 'IT',
      graduationYear: 2026,
      college: 'COEP Pune',
      usn: 'COEP22IT088',
      phone: '+91 94220 54321',
      bio: 'Full-stack MERN & Cloud Developer | Smart India Hackathon Winner | AWS Community Builder',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/neha-kulkarni-dev',
      githubUrl: 'https://github.com/nehakulkarni',
      skills: ['react', 'node.js', 'aws', 'sql', 'typescript', 'mongodb'],
    },
    {
      name: 'Raj Patel',
      email: 'raj@mech.edu',
      cgpa: 7.4,
      branch: 'MECH',
      graduationYear: 2026,
      college: 'BITS Pilani',
      usn: 'BITS22ME015',
      phone: '+91 98251 77665',
      bio: 'Robotics & Automation Engineer | CAD/CAM & Industrial IoT Enthusiast | Python for Engineers',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/raj-patel-mech',
      githubUrl: 'https://github.com/rajpatel',
      skills: ['excel', 'salesforce', 'python', 'matlab', 'cad'],
    },
    {
      name: 'Aditya Verma',
      email: 'aditya.v@dtu.edu',
      cgpa: 9.4,
      branch: 'AIML',
      graduationYear: 2026,
      college: 'DTU Delhi',
      usn: 'DTU22AI024',
      phone: '+91 98110 99887',
      bio: 'Deep Learning & GenAI Researcher | NeurIPS Workshop Author | PyTorch & LLM Fine-tuning',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/aditya-verma-ai',
      githubUrl: 'https://github.com/adityaverma',
      skills: ['python', 'machine learning', 'deep learning', 'pytorch', 'aws', 'docker'],
    },
    {
      name: 'Ananya Iyer',
      email: 'ananya.iyer@annauniv.edu',
      cgpa: 9.0,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'Anna University Chennai',
      usn: 'AU22CS076',
      phone: '+91 94440 22334',
      bio: 'Product Designer & Frontend Architect | Crafting accessible, beautiful digital experiences',
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/ananya-iyer',
      githubUrl: 'https://github.com/ananyaiyer',
      skills: ['react', 'typescript', 'tailwind css', 'ui/ux', 'node.js', 'sql'],
    },
    {
      name: 'Rohan Deshmukh',
      email: 'rohan.d@iiith.edu',
      cgpa: 8.8,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'IIIT Hyderabad',
      usn: 'IIITH22CS112',
      phone: '+91 98850 44332',
      bio: 'Cloud Native & High Throughput Systems | Go & Rust | Linux Kernel Contributor',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/rohan-deshmukh',
      githubUrl: 'https://github.com/rohandeshmukh',
      skills: ['go', 'kubernetes', 'docker', 'aws', 'python', 'dsa'],
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha.r@cbit.edu',
      cgpa: 8.5,
      branch: 'IT',
      graduationYear: 2026,
      college: 'CBIT Hyderabad',
      usn: 'CBIT22IT045',
      phone: '+91 91210 66778',
      bio: 'Data Engineering & Big Data Analyst | Apache Spark, SQL, and AWS Data Pipelines',
      avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a171ed282186?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/sneha-reddy-data',
      githubUrl: 'https://github.com/snehareddy',
      skills: ['sql', 'python', 'aws', 'power bi', 'excel', 'spark'],
    },
    {
      name: 'Karthik Nair',
      email: 'karthik.n@amrita.edu',
      cgpa: 8.2,
      branch: 'ECE',
      graduationYear: 2026,
      college: 'Amrita Vishwa Vidyapeetham',
      usn: 'AMR22EC061',
      phone: '+91 96330 11223',
      bio: 'Robotics & Signal Processing Enthusiast | Hardware-Software Co-Design | Embedded C',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/karthik-nair-ece',
      githubUrl: 'https://github.com/karthiknair',
      skills: ['c++', 'python', 'iot', 'embedded c', 'sql'],
    },
    {
      name: 'Priya Sharma',
      email: 'priya.s@nsut.edu',
      cgpa: 9.3,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'NSUT Delhi',
      usn: 'NSUT22CS103',
      phone: '+91 98101 22334',
      bio: 'Cloud Security & DevSecOps Engineer | Terraform & AWS Infrastructure as Code Advocate',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/priya-sharma-cloud',
      githubUrl: 'https://github.com/priyasharma',
      skills: ['aws', 'python', 'docker', 'terraform', 'linux', 'react'],
    },
    {
      name: 'Mohammed Zeeshan',
      email: 'zeeshan.m@jmi.edu',
      cgpa: 8.4,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'Jamia Millia Islamia',
      usn: 'JMI22CS018',
      phone: '+91 97110 55667',
      bio: 'Cross-platform Mobile & Web App Builder | Flutter & Node.js Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/mohammed-zeeshan-dev',
      githubUrl: 'https://github.com/mzeeshan',
      skills: ['react', 'node.js', 'flutter', 'sql', 'firebase', 'python'],
    },
    {
      name: 'Divya Mehra',
      email: 'divya.m@igdtuw.edu',
      cgpa: 8.7,
      branch: 'IT',
      graduationYear: 2026,
      college: 'IGDTUW Delhi',
      usn: 'IGD22IT032',
      phone: '+91 99990 44556',
      bio: 'FinTech & Full-stack Web Developer | Grace Hopper Scholar | React & Python',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/divya-mehra-tech',
      githubUrl: 'https://github.com/divyamehra',
      skills: ['react', 'python', 'sql', 'node.js', 'aws', 'dsa'],
    },
    {
      name: 'Arjun Patel',
      email: 'arjun.p@pdpu.edu',
      cgpa: 7.6,
      branch: 'MECH',
      graduationYear: 2026,
      college: 'Pandit Deendayal Energy University',
      usn: 'PDPU22ME077',
      phone: '+91 99790 12345',
      bio: 'Product Lifecycle & Supply Chain Analyst | Industrial IoT Enthusiast',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/arjun-patel-mech',
      githubUrl: 'https://github.com/arjunpatel',
      skills: ['excel', 'sql', 'salesforce', 'python'],
    },
    {
      name: 'Tanvi Kulkarni',
      email: 'tanvi.k@vjti.edu',
      cgpa: 9.1,
      branch: 'AIML',
      graduationYear: 2026,
      college: 'VJTI Mumbai',
      usn: 'VJTI22AI059',
      phone: '+91 98200 99001',
      bio: 'Computer Vision & AI Application Developer | OpenCV, YOLO, AWS SageMaker',
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/tanvi-kulkarni-ai',
      githubUrl: 'https://github.com/tanvikulkarni',
      skills: ['python', 'machine learning', 'deep learning', 'aws', 'opencv', 'react'],
    },
    {
      name: 'Sai Krishna Chaitanya',
      email: 'sai.krishna@jntu.edu',
      cgpa: 8.3,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'JNTU Hyderabad',
      usn: 'JNTU22CS189',
      phone: '+91 99490 88776',
      bio: 'Site Reliability Engineering & DevOps | AWS Cloud Architect Aspirant | Linux',
      avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/saikrishna-devops',
      githubUrl: 'https://github.com/saikrishna',
      skills: ['aws', 'docker', 'linux', 'python', 'sql', 'kubernetes'],
    },
    {
      name: 'Meera Nambiar',
      email: 'meera.n@cet.edu',
      cgpa: 9.5,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'College of Engineering Trivandrum',
      usn: 'CET22CS044',
      phone: '+91 94470 12389',
      bio: 'NLP & AI Ethics Researcher | PyTorch, Transformers, Hugging Face',
      avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/meera-nambiar',
      githubUrl: 'https://github.com/meeranambiar',
      skills: ['python', 'machine learning', 'nlp', 'pytorch', 'sql', 'aws'],
    },
    {
      name: 'Harish Sundaram',
      email: 'harish.s@psgtech.edu',
      cgpa: 7.9,
      branch: 'EEE',
      graduationYear: 2026,
      college: 'PSG College of Technology',
      usn: 'PSG22EE028',
      phone: '+91 98422 66778',
      bio: 'Smart Grids & Power Electronics | Python for Energy Analytics',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/harish-sundaram',
      githubUrl: 'https://github.com/harishsundaram',
      skills: ['python', 'c++', 'matlab', 'sql', 'iot'],
    },
    {
      name: 'Pooja Bhatt',
      email: 'pooja.b@daiict.edu',
      cgpa: 8.8,
      branch: 'IT',
      graduationYear: 2026,
      college: 'DA-IICT Gandhinagar',
      usn: 'DAI22IT012',
      phone: '+91 98980 33221',
      bio: 'Enterprise Systems & Microservices Specialist | Java Spring Boot, AWS',
      avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/pooja-bhatt-tech',
      githubUrl: 'https://github.com/poojabhatt',
      skills: ['java', 'spring boot', 'aws', 'sql', 'docker', 'react'],
    },
    {
      name: 'Siddharth Malhotra',
      email: 'sid.m@manipal.edu',
      cgpa: 8.5,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'Manipal Institute of Technology (MIT)',
      usn: 'MIT22CS210',
      phone: '+91 98330 55443',
      bio: 'Full-stack JavaScript & Cloud Engineer | React, Next.js, Node.js, AWS Lambda',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/sid-malhotra-dev',
      githubUrl: 'https://github.com/sidmalhotra',
      skills: ['react', 'node.js', 'aws', 'sql', 'docker', 'typescript'],
    },
    {
      name: 'Shreya Ghoshal',
      email: 'shreya.g@jadavpur.edu',
      cgpa: 9.6,
      branch: 'CSE',
      graduationYear: 2026,
      college: 'Jadavpur University Kolkata',
      usn: 'JU22CS083',
      phone: '+91 98310 77889',
      bio: 'Competitive Programmer & Algorithmic Specialist | Codeforces Master',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/shreya-ghoshal-cse',
      githubUrl: 'https://github.com/shreyaghoshal',
      skills: ['c++', 'dsa', 'java', 'python', 'sql', 'system design'],
    },
    {
      name: 'Vigneshwaran R',
      email: 'vignesh.r@ssn.edu',
      cgpa: 8.0,
      branch: 'ECE',
      graduationYear: 2026,
      college: 'SSN College of Engineering',
      usn: 'SSN22EC095',
      phone: '+91 94450 66778',
      bio: '5G Networks & Cloud Infrastructure Specialist | AWS Certified',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      linkedinUrl: 'https://linkedin.com/in/vigneshwaran-r',
      githubUrl: 'https://github.com/vigneshr',
      skills: ['python', 'aws', 'networking', 'linux', 'c++'],
    },
  ];

  console.log('[seed] creating student users, profiles, and resumes…');
  const userMap = {};
  for (const s of indianStudentsData) {
    const u = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: hash('student123'),
        name: s.name,
        role: 'STUDENT',
        profile: {
          create: {
            cgpa: s.cgpa,
            branch: s.branch,
            graduationYear: s.graduationYear,
            skills: s.skills,
            phone: s.phone,
            avatarUrl: s.avatarUrl,
            usn: s.usn,
            college: s.college,
            bio: s.bio,
            linkedinUrl: s.linkedinUrl,
            githubUrl: s.githubUrl,
            emailOptIn: true,
          },
        },
      },
      include: { profile: true },
    });

    await prisma.resume.create({
      data: {
        userId: u.id,
        filename: `${s.name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`,
        s3Key: `resumes/${u.id}/verified-resume.pdf`,
        extractedSkills: s.skills,
        parsedAt: new Date(),
      },
    });

    userMap[s.email] = { user: u, studentData: s };
  }

  console.log('[seed] creating companies…');
  const infosys = await prisma.company.create({ data: { name: 'Infosys' } });
  const amazon = await prisma.company.create({ data: { name: 'Amazon AWS' } });
  const zoho = await prisma.company.create({ data: { name: 'Zoho Corporation' } });
  const tcs = await prisma.company.create({ data: { name: 'TCS Digital' } });
  const microsoft = await prisma.company.create({ data: { name: 'Microsoft India' } });
  const swiggy = await prisma.company.create({ data: { name: 'Swiggy' } });

  console.log('[seed] creating drives…');
  const drivesData = [
    {
      companyId: amazon.id,
      title: 'Cloud Support & Solutions Architect Intern',
      role: 'AWS Cloud Intern',
      package: '12 LPA',
      location: 'Bengaluru / Hyderabad (Hybrid)',
      jobType: 'Internship + PPO',
      description:
        'Architect and deploy high-availability solutions on AWS: VPC topologies, EC2 fleets, Lambda serverless, and S3 storage patterns. Mentored by senior Solutions Architects.',
      minCgpa: 8.0,
      branches: ['CSE', 'IT', 'ECE', 'AIML'],
      skills: ['aws', 'docker', 'python'],
      minSkills: 2,
      roundsTotal: 3,
      deadline: new Date('2026-11-30'),
    },
    {
      companyId: microsoft.id,
      title: 'Software Development Engineer Intern 2026',
      role: 'SDE Intern',
      package: '16 LPA',
      location: 'Hyderabad / Noida',
      jobType: 'Summer Intern',
      description:
        'Build large scale distributed cloud services, AI platform tools, and developer utilities with world-class engineering teams.',
      minCgpa: 8.5,
      branches: ['CSE', 'IT', 'AIML'],
      skills: ['c++', 'dsa', 'python', 'system design'],
      minSkills: 2,
      roundsTotal: 4,
      deadline: new Date('2026-12-10'),
    },
    {
      companyId: swiggy.id,
      title: 'Backend Engineering Associate',
      role: 'Backend SDE-1',
      package: '10 LPA',
      location: 'Bengaluru, India',
      jobType: 'Full-time',
      description:
        'Solve hyper-local delivery logistics at scale. High-throughput event-driven microservices, Kafka streaming, Redis caching, and Go/Java systems.',
      minCgpa: 7.8,
      branches: ['CSE', 'IT', 'ECE', 'AIML'],
      skills: ['go', 'java', 'docker', 'sql', 'kubernetes'],
      minSkills: 2,
      roundsTotal: 3,
      deadline: new Date('2026-11-25'),
    },
    {
      companyId: zoho.id,
      title: 'Full-stack Product Developer Drive',
      role: 'Product Engineer',
      package: '7 LPA',
      location: 'Chennai / Tenkasi',
      jobType: 'Full-time',
      description:
        'Work on Zoho SaaS suite used by 100M+ users globally. Deep hands-on web technologies: custom UI components, React, Node backends.',
      minCgpa: 7.5,
      branches: ['CSE', 'IT', 'ECE'],
      skills: ['react', 'node.js', 'typescript'],
      minSkills: 1,
      roundsTotal: 3,
      deadline: new Date('2026-11-20'),
    },
    {
      companyId: infosys.id,
      title: 'Specialist Programmer & Systems Engineer',
      role: 'Specialist Programmer',
      package: '9.5 LPA',
      location: 'Mysuru / Bengaluru / Pune',
      jobType: 'Full-time',
      description:
        'Elite development squad: modern cloud-native architectures, micro-frontends, continuous integration, and enterprise AI transformation.',
      minCgpa: 7.0,
      branches: ['CSE', 'IT', 'ECE', 'EEE', 'AIML'],
      skills: ['python', 'sql', 'java'],
      minSkills: 1,
      roundsTotal: 3,
      deadline: new Date('2026-11-15'),
    },
    {
      companyId: tcs.id,
      title: 'TCS Digital Innovation Cadre',
      role: 'Digital Engineer',
      package: '7.5 LPA',
      location: 'Pan-India',
      jobType: 'Full-time',
      description:
        'Work in TCS Research & Innovation Labs on IoT, Cloud, Cybersecurity, and AI/ML applications.',
      minCgpa: 7.0,
      branches: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'AIML'],
      skills: ['python', 'sql', 'dsa'],
      minSkills: 1,
      roundsTotal: 3,
      deadline: new Date('2026-12-05'),
    },
  ];

  const createdDrives = [];
  for (const d of drivesData) {
    const drive = await prisma.drive.create({
      data: { ...d, status: 'OPEN' },
      include: { companyRef: true },
    });
    createdDrives.push(drive);
  }

  console.log('[seed] evaluating candidates and creating applications…');
  const appsToCreate = [];
  const roundsToCreate = [];

  for (const item of Object.values(userMap)) {
    const u = item.user;
    const profile = u.profile;

    for (const drive of createdDrives) {
      if (profile.branch === 'MECH' && (drive.title.includes('Cloud') || drive.title.includes('Software Development'))) {
        continue;
      }

      const verdict = evaluateDrive(drive, profile, profile.skills);
      const isOffered = verdict.passed && verdict.score >= 88;
      const isInProgress = verdict.passed && verdict.score >= 75 && !isOffered;

      const appStatus = isOffered ? 'OFFERED' : isInProgress ? 'ROUND_IN_PROGRESS' : verdict.passed ? 'SHORTLISTED' : 'REJECTED';
      const currentRound = isOffered ? drive.roundsTotal : isInProgress ? 2 : 0;

      appsToCreate.push({
        driveId: drive.id,
        userId: u.id,
        status: appStatus,
        matchScore: verdict.score,
        currentRound,
        rejectedReasons: verdict.passed ? [] : verdict.reasons,
      });
    }
  }

  // Batch insert applications
  console.log(`[seed] inserting ${appsToCreate.length} applications in batch…`);
  await prisma.application.createMany({
    data: appsToCreate,
  });

  // Fetch created applications to link rounds
  const createdApps = await prisma.application.findMany({
    where: { status: { in: ['OFFERED', 'ROUND_IN_PROGRESS'] } },
  });

  for (const app of createdApps) {
    if (app.status === 'OFFERED') {
      roundsToCreate.push(
        { applicationId: app.id, roundNumber: 1, result: 'CLEARED', notes: 'Excellent coding assessment (100%)' },
        { applicationId: app.id, roundNumber: 2, result: 'CLEARED', notes: 'Strong technical interview & system architecture' },
        { applicationId: app.id, roundNumber: 3, result: 'CLEARED', notes: 'Cleared Leadership & Culture Fit round' }
      );
    } else if (app.status === 'ROUND_IN_PROGRESS') {
      roundsToCreate.push(
        { applicationId: app.id, roundNumber: 1, result: 'CLEARED', notes: 'Cleared Online Assessment' },
        {
          applicationId: app.id,
          roundNumber: 2,
          result: 'SCHEDULED',
          notes: 'Technical Interview in APJ Abdul Kalam Tech Block Lab 3',
          scheduledAt: new Date(Date.now() + 86400000 * 3),
        }
      );
    }
  }

  if (roundsToCreate.length > 0) {
    console.log(`[seed] inserting ${roundsToCreate.length} interview rounds in batch…`);
    await prisma.interviewRound.createMany({
      data: roundsToCreate,
    });
  }

  console.log('[seed] creating broadcast notifications…');
  await prisma.notification.createMany({
    data: [
      {
        subject: 'Placement Season 2026 Inauguration',
        message:
          'Welcome to PlacementHub! Marquee recruiters including Amazon AWS, Microsoft India, Swiggy, Zoho, TCS, and Infosys have posted drives. Complete your profile, verify skills, and apply before deadlines.',
        channel: 'SNS',
        status: 'SENT',
      },
      {
        subject: 'Amazon AWS Cloud Internships - Shortlist Released',
        message:
          'Auto-shortlist generated by PlacementHub scoring engine. Shortlisted candidates should access their Hall Tickets / Admit Cards for Round 2 technical interviews.',
        channel: 'INAPP',
        status: 'LOGGED',
      },
      {
        subject: 'TPO Advisory: GitHub & Portfolio verification',
        message:
          'Recruiting partners will examine your external GitHub repositories and live portfolio demos during technical rounds.',
        channel: 'INAPP',
        status: 'LOGGED',
      },
    ],
  });

  console.log('[seed] ✓ Database seeded with rich Indian student dataset, companies, drives, and interview funnels!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
