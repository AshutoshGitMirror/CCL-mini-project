[<img src="assets/icon.svg" width="56" height="56" alt="">](#)

# PlacementHub

Cloud-native **internship & placement management** system for campus. Node + Express +
Prisma (API) · React (UI) · PostgreSQL on **Amazon RDS** · **Amazon S3** resumes via
pre-signed uploads · **Amazon Textract** OCR with a zero-cost local parser fallback ·
**Amazon SNS** drive-alert fan-out · **Terraform** (official AWS provider) for
infrastructure. Local development runs against Docker (Postgres + LocalStack), so the
only AWS resource that ever has to exist is the one you point it at.

> **New teammate?** Read [`handoff.md`](handoff.md) — it has the connection details.
> It is deliberately **not committed** (contains a live password); ask your teammate to send it privately.
> Windows-friendly setup, and the account-split plan for grading.

## Quick start (any platform)

```bash
# backend
cd backend
cp .env.example .env
npm install
docker compose up -d            # Postgres 5432 + LocalStack 4566
npx prisma db push
node prisma/seed.mjs
npm run dev                     # API on http://localhost:4000

# frontend (new terminal)
cd frontend
npm install
npm run dev                     # UI on http://localhost:5173
```

Demo logins:
- Student: `adi@cse.edu / student123` (Aditi Sharma, IIT Bombay)
- Student: `vik@cse.edu / student123` (Vikram Rao, RVCE Bengaluru)
- Student: `aditya.v@dtu.edu / student123` (Aditya Verma, DTU Delhi)
- Recruiter: `recruiter@infosysdemo.com / recruiter123` (Arun Kumar, Infosys)
- Recruiter: `recruiter@amazon.com / recruiter123` (Priyanka Sen, Amazon AWS)
- TPO: `officer@placementhub.edu / officer123` (Dr. Rekha Menon, TPO Head)

## Deploy to AWS (your account)

The app is packaged into `deploy/placementhub-app.zip`, uploaded to S3 by Terraform,
and pulled by the EC2 instance at boot. Build the frontend and the bundle first:

```bash
cd frontend && npm run build && cd ..
node scripts/build-bundle.mjs

cd infra/roots/friend
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Terraform prints `app_url`; open that URL. The stack creates a single public EC2
instance in a VPC, plus an S3 bucket, IAM role (or reuses an existing instance
profile), CloudWatch logs, dashboard and a CPU alarm. There is no ALB or ASG, so
the only hourly compute cost is the one `t3.micro`. It connects to the shared
RDS/SNS resources through `db_url` / `sns_topic_arn` variables. The instance
installs Node 22 and uses the free local PDF parser by default
(`resume_parser = "local"`).

**Cost control:** the instance is a single `t3.micro` (free-tier eligible) and its
public IPv4 address is billed at the normal AWS rate. The public IP can change if
the instance is stopped and started. Run `terraform destroy` when you finish
grading to remove the instance, its disk, and the rest of the stack.

AWS Academy accounts that cannot create IAM roles should use the lab profile:

```bash
terraform apply -var="existing_instance_profile_name=LabInstanceProfile"
```

The shared SNS topic lives in the other account; publishing works only after that
account grants `sns:Publish` to this account (see `handoff.md` §3). Terraform also
creates a local fallback topic, so alerts still get a real MessageId and show as
`SENT` while the cross-account permission is pending.

## Layout

```
backend/    Express API · Prisma schema+seed · SNS fan-out lib · shortlist engine
            · S3 pre-signer · Textract-or-local parser
frontend/   React + Vite, "hall ticket" design system (paper, ink, stamps)
infra/      terraform/roots/mine (real AWS: RDS+SNS, live) · roots/friend (EC2+alarm)
scripts/    build-bundle.mjs — stages backend + frontend/dist for EC2
docker-compose.yml  postgres + localstack for free local AWS emulation
```

## The outstanding story & creative features

- **Extensive Indian Student Recruitment Dataset & Verified Profile Avatars**:
  Real-world cohort of Indian engineering students across premier institutions (IIT Bombay, RVCE Bengaluru, NIT Trichy, COEP Pune, DTU Delhi, Anna University, IIIT Hyderabad, BITS Pilani). Profiles include verified photo avatars, USN / roll numbers, branch, CGPA, graduation batch, professional bios, and direct links to GitHub & LinkedIn.
- **Interactive Student Talent Directory ("Talent Pool")**:
  Recruiters and TPOs can search, filter (by branch, minimum CGPA, and placement status), and inspect candidate dossiers with full application history and round progress.
- **Official Campus Placement Hall Ticket & Gate Pass**:
  Admitted candidates can view and print an official university Hall Ticket with candidate photo, USN, reporting venue, interview round details, and TPO digital authorization seal.
- **Official Selection Letter of Intent (LOI)**:
  Candidates who receive an offer can preview and download a formal company placement Letter of Intent with compensation package (LPA), role, and institutional stamps.
- **ATS Resume Match & Skill Gap Advisor**:
  Students receive an instant breakdown of their ATS compatibility score (40% academic CGPA + 60% verified skills overlap), checking branch eligibility, matched skills, missing skills, and targeted technical preparation guidance.
- **Campus Placement Analytics & Metrics Dashboard**:
  Live cohort intelligence for TPOs and recruiters: real-time placement conversion rate, highest CTC (16 LPA), average CTC (10.3 LPA), branch-wise placement progress bars, top corporate hiring partners, and in-demand skills analysis.
- **One-Click Candidate Export to CSV**:
  Recruiters and TPO officers can export drive candidate shortlists directly into structured CSV spreadsheets for offline interviews and administrative archives.
- **Auto-shortlisting at apply time**: CGPA gate ∧ branch gate ∧ skill-overlap ≥ minimum;
  score = 40% CGPA + 60% overlap, written to RDS as a verdict — no human triage.
- **One SNS publish per drive go-live** → opted-in student inboxes + an ACID-copied
  notification ledger in-postgres for the audit trail.
- **Resume parsing is abstracted**: `RESUME_PARSER=local` (free, pdf-parse) for dev,
  `RESUME_PARSER=textract` (real OCR, billed per page) for the demo branch.
