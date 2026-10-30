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
backend :  cp backend/.env.example backend/.env && npm install && (docker compose up -d) \
           npx prisma db push && node prisma/seed.mjs && npm run dev
frontend:  cp -R frontend . && npm install && npm run dev   →  http://localhost:5173
```

Demo logins: `adi@cse.edu / student123` · `recruiter@infosysdemo.com / recruiter123` ·
`officer@placementhub.edu / officer123`.

## Layout

```
backend/    Express API · Prisma schema+seed · SNS fan-out lib · shortlist engine·
            S3 pre-signer · Textract-or-local parser
frontend/   React + Vite, "hall ticket" design system (paper, ink, stamps)
infra/      terraform/roots/mine (real AWS: RDS+SNS, live) · roots/friend (EC2+alarm)
docker-compose.yml  postgres + localstack for free local AWS emulation
```

## The outstanding story

- Auto-shortlisting at apply time: CGPA gate ∧ branch gate ∧ skill-overlap ≥ minimum;
  score = 40% CGPA + 60% overlap, written to RDS as a verdict — no human triage.
- One SNS publish per drive go-live → opted-in student inboxes + an ACID-copied
  notification ledger in-postgres for the audit trail.
- Resume parsing is abstracted: `RESUME_PARSER=local` (free, pdf-parse) for dev,
  `RESUME_PARSER=textract` (real OCR, billed per page) for the demo branch.
