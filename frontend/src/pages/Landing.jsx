import { Link } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';

/* Knockout barcode, pure CSS */
function Barcode({ className = '' }) {
  const widths = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 1, 2, 4];
  return (
    <div className={`flex items-end gap-[2px] ${className}`} aria-hidden>
      {widths.map((w, i) => (
        <span key={i} className="bg-ink" style={{ width: `${w}px`, height: `${60 + ((i * 13) % 30)}%` }} />
      ))}
    </div>
  );
}

/* The hero artifact: a Drive Notice / hall ticket, drawn entirely in CSS */
function DriveNoticeTicket() {
  return (
    <div className="animate-lift relative">
      {/* crop marks */}
      <span aria-hidden className="absolute -left-4 -top-4 h-5 w-5 border-l-2 border-t-2 border-ink" />
      <span aria-hidden className="absolute -right-4 -top-4 h-5 w-5 border-r-2 border-t-2 border-ink" />
      <span aria-hidden className="absolute -bottom-4 -left-4 h-5 w-5 border-b-2 border-l-2 border-ink" />
      <span aria-hidden className="absolute -bottom-4 -right-4 h-5 w-5 border-b-2 border-r-2 border-ink" />

      <div className="ticket bg-white">
        <div className="rule-double" />
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <p className="font-display text-2xl font-extrabold leading-none text-ink">CAMPUS DRIVE NOTICE</p>
            <p className="mono mt-1.5 text-[10px] text-ink-soft">issued under Rule 14(b), Training &amp; Placement Cell</p>
          </div>
          <p className="mono shrink-0 border-2 border-ink px-2 py-1 text-[10px] font-semibold text-ink">
            Nº 2026-0043
          </p>
        </div>

        <div className="mx-6 my-5 grid grid-cols-[84px_1fr] gap-x-4 border-2 border-ink px-4 py-4 text-[13px]">
          {/* photo box */}
          <div className="flex flex-col items-center">
            <Avatar
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
              name="Aditi Sharma"
              size="lg"
              className="!h-24 !w-20 shadow-[2px_2px_0_0_#17233B]"
            />
            <span className="mono text-[8px] uppercase tracking-wider text-ink-faint mt-1">Verified Photo</span>
          </div>
          <div className="space-y-2">
            {[
              ['Candidate', 'Aditi Sharma, CSE (IIT Bombay)', ''],
              ['USN', '1BM22CS001 · Class of 2026', ''],
              ['Drive', 'Amazon AWS · Cloud Support Intern (12 LPA)', ''],
              ['Gate', 'CGPA ≥ 8.0, CSE/IT/ECE/AIML, any 2: aws / docker / python', ''],
              ['Venue', 'APJ Abdul Kalam Tech Block, Lab 3', ''],
            ].map(([k, v]) => (
              <p key={k} className="leading-snug">
                <span className="mono inline-block w-[72px] text-[10px] text-ink-faint">{k}</span>
                <span className="font-medium text-ink">{v}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t-2 border-ink border-dashed px-6 py-4">
          <div className="flex items-center gap-4">
            <span aria-hidden className="h-3 w-3 rounded-full border-2 border-ink bg-paper" />
            <Barcode className="h-9 w-40" />
          </div>
          {/* the one stamp */}
          <span className="stamp stamp-open !text-[13px] !rotate-[-4deg] !border-[2.5px] !px-3 !py-1.5">shortlisted</span>
        </div>

        <div className="rule-double" />
        <div className="mx-14 flex items-center justify-between pb-4 pt-3">
          <p className="mono text-[10px] text-ink-faint">keep this portion for the interview rounds</p>
          <p className="mono text-[10px] text-ink-faint">pgh/notice/print-a4</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAuthed, user } = useAuth();

  return (
    <div className="pt-2">
      {/* ---------------------------------------------------------- hero */}
      <section className="grid items-center gap-14 lg:grid-cols-[1fr_460px] lg:gap-10">
        <div>
          <h1 className="font-display max-w-[13ch] text-[2.9rem] font-extrabold leading-[0.98] tracking-tight text-ink sm:text-6xl">
            Placement season, administered.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
            Campus drives shouldn't be a pile of forwarded PDFs. PlacementHub turns every drive into
            a form students can qualify for — the machine checks CGPA, branch and skills, the TPO
            publishes one alert, recruiters track rounds to offer letter.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {isAuthed ? (
              <Link to={homeFor(user.role)} className="btn-ink">Open your desk</Link>
            ) : (
              <>
                <Link to="/register" className="btn-ink">Get your hall ticket</Link>
                <Link to="/login" className="btn-form">Sign in</Link>
              </>
            )}
          </div>

          <dl className="mt-12 max-w-[52ch] border-t-2 border-ink">
            {[
              ['an application', 'scores itself against the drive criteria the moment it is filed'],
              ['a drive release', 'is one SNS publish, then student inboxes fan out'],
              ['a resume', 'is parsed once — OCR text is cached, never billed twice'],
            ].map(([t, d]) => (
              <div key={t} className="flex items-baseline gap-3 border-b border-ink/20 py-2.5">
                <dt className="mono shrink-0 text-[11px] text-overprint">{t}</dt>
                <dd className="text-sm text-ink-soft">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <DriveNoticeTicket />
      </section>

      {/* ------------------------------------------------- how scoring works */}
      <section className="mt-24">
        <h2 className="font-display text-2xl font-extrabold text-ink">How a student gets shortlisted</h2>
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-soft">
          The engine runs per drive, at apply time. Candidates see their own verdict instantly;
          recruiters receive the ranked list.
        </p>
        <ol className="mt-7 grid gap-4 md:grid-cols-4">
          {[
            ['Resume parsed', 'Textract reads the PDF once; skill words go to a dictionary we maintain.'],
            ['Gates checked', 'CGPA floor, eligible branches, minimum skill matches — all set per drive.'],
            ['Score written', '40% CGPA + 60% skill overlap, stored as an APPLIED or SHORTLISTED verdict in RDS.'],
            ['Rounds tracked', 'each cleared round is a transaction with the outcome and the timestamp.'],
          ].map(([t, d], i) => (
            <li key={t} className="ticket p-5">
              <p className="mono text-[10px] text-ink-faint">step {i + 1}</p>
              <p className="font-display mt-1 font-bold text-ink">{t}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------ service table */}
      <section className="mt-24">
        <h2 className="font-display text-2xl font-extrabold text-ink">The AWS work under the forms</h2>
        <div className="ticket mt-7 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {[
                ['EC2 + Auto Scaling', 'the API and web server live in an ASG behind an ALB; launch-day traffic stops being an outage'],
                ['RDS PostgreSQL', 'profiles, drives, applications, rounds — one ACID ledger, nightly backups'],
                ['S3', 'resumes upload straight from the browser with pre-signed URLs; the API never touches file bytes'],
                ['Textract', 'OCR for every uploaded PDF; one thousand free pages a month, then $1.50 per thousand'],
                ['SNS', 'drive alerts fan out; students subscribe their own inbox — no sender of last resort'],
                ['CloudWatch', 'dashboards and alarms hold the line during November crunch'],
                ['Terraform', 'every box above is one plan/apply — the team shares the repo, not the console'],
              ].map(([svc, role], i) => (
                <tr key={svc} className={i ? 'border-t border-ink/15' : ''}>
                  <td className="mono w-[190px] px-5 py-3 text-[12px] font-semibold text-overprint">{svc}</td>
                  <td className="px-5 py-3 pr-8 text-[13px] text-ink-soft">{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="ticket mt-24 flex flex-wrap items-center justify-between gap-6 bg-white p-8">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink">Three demo accounts, one to click each role</h2>
          <p className="mono mt-1 text-[12px] text-ink-soft">
            student: adi@cse.edu / student123 — recruiter: recruiter@infosysdemo.com / recruiter123 — officer: officer@placementhub.edu / officer123
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-ink">Sign in</Link>
          <Link to="/register" className="btn-form">Register</Link>
        </div>
      </section>
    </div>
  );
}
