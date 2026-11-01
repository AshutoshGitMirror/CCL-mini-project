import { useCallback, useEffect, useState } from 'react';
import { Bell, FileUp, Pencil, UploadCloud, Sparkles, ExternalLink, Award, FileText, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import StatCard from '../components/StatCard.jsx';
import Avatar from '../components/Avatar.jsx';
import AdmitCardModal from '../components/AdmitCardModal.jsx';
import OfferLetterModal from '../components/OfferLetterModal.jsx';
import SkillGapAdvisorModal from '../components/SkillGapAdvisorModal.jsx';

const AVATAR_PRESETS = [
  { label: 'Aditi (Tech)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
  { label: 'Vikram (Dev)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
  { label: 'Isha (ECE)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80' },
  { label: 'Aditya (AI)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { label: 'Ananya (Web)', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80' },
  { label: 'Rohan (Cloud)', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Neha (Fullstack)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
  { label: 'Raj (Mech)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
];

export default function StudentDashboard() {
  const { syncUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [me, setMe] = useState(null);
  const [drives, setDrives] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [msg, setMsg] = useState(null);

  // Creative feature modals
  const [activeAdmitCard, setActiveAdmitCard] = useState(null);
  const [activeOffer, setActiveOffer] = useState(null);
  const [activeAdvisorDrive, setActiveAdvisorDrive] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [p, d, n, myAppsRes] = await Promise.all([
        api('/profile/me'),
        api('/drives'),
        api('/notifications/me'),
        api('/applications/my').catch(() => ({ applications: [] })),
      ]);
      setProfile(p.profile);
      setMe(p.user);
      if (p.user) syncUser({ ...p.user, profile: p.profile });
      setDrives(d.drives);
      setMyApplications(myAppsRes.applications || []);
      setNotifications(n.notifications);
    } catch (err) {
      setMsg({ good: false, text: err.message });
    }
  }, [syncUser]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const appliedCount = myApplications.length;
  const offeredCount = myApplications.filter((a) => a.status === 'OFFERED').length;

  const flash = (good, text) => {
    setMsg({ good, text });
    setTimeout(() => setMsg(null), 4500);
  };

  if (!profile) {
    return <p className="mono text-sm text-ink-soft">loading your particulars…</p>;
  }

  return (
    <div className="animate-lift space-y-10">
      {/* Particulars Header Card */}
      <div className="ticket bg-white p-6 relative">
        <div className="rule-double mb-4" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <Avatar
              src={profile.avatarUrl}
              name={me?.name}
              size="xl"
              className="shadow-[4px_4px_0_0_#17233B]"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="mono text-[10px] uppercase font-bold text-ink-faint">
                  Verified Student Hall Ticket
                </span>
                {offeredCount > 0 && (
                  <span className="stamp stamp-offer !text-[9px]">Campus Placed</span>
                )}
              </div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                {me?.name}
              </h1>
              <p className="mono text-xs text-ink-soft">
                {profile.college || 'Engineering & Technology Campus'} · USN: <strong className="text-overprint">{profile.usn || '1BM22CS001'}</strong>
              </p>
              <p className="mono text-xs text-ink-soft">
                {profile.branch || 'Branch not set'} — CGPA <strong className="text-ledger">{profile.cgpa ?? 'not filed'}</strong> — Class of {profile.graduationYear ?? '2026'}
              </p>
              {profile.bio && (
                <p className="text-xs text-ink-soft pt-1 max-w-xl italic">
                  "{profile.bio}"
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 self-stretch sm:self-center">
            <button className="btn-form w-full sm:w-auto" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit Particulars & Avatar
            </button>
            <div className="flex items-center gap-3">
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs text-overprint flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> LinkedIn
                </a>
              )}
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs text-ink flex items-center gap-1 hover:underline font-bold"
                >
                  GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <p className={`border-2 px-4 py-3 text-sm ${msg.good ? 'border-ledger bg-ledger/5 text-ledger' : 'border-seal bg-seal/5 text-seal'}`} role="status">
          {msg.text}
        </p>
      )}

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Drives Open" value={drives.length} sub="Eligible campus notices" />
        <StatCard label="Your Filings" value={appliedCount} sub={`${offeredCount} offer(s) received`} />
        <StatCard label="Broadcast Alerts" value={notifications.length} sub="SNS + In-app notices" />
      </div>

      {/* Resume Upload & OCR Section */}
      <ResumeCard profile={profile} onFlash={flash} reload={loadAll} />

      {/* My Applications & Interview Admit Cards Section */}
      {myApplications.length > 0 && (
        <section className="space-y-4">
          <div className="rule-double mb-1" />
          <div className="flex items-baseline justify-between">
            <h2 className="font-display mt-4 text-xl font-extrabold text-ink flex items-center gap-2">
              <Award className="h-5 w-5 text-overprint" /> Your Applications & Interview Funnel
            </h2>
            <span className="mono text-[11px] text-ink-faint">live candidate ledger</span>
          </div>

          <div className="space-y-3">
            {myApplications.map((app) => (
              <div
                key={app.id}
                className="ticket bg-white p-4 flex flex-wrap items-center justify-between gap-4 border-2 border-ink"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink text-base">
                      {app.drive?.companyRef?.name || 'Recruiter'}: {app.drive?.title}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="mono text-xs text-ink-soft mt-0.5">
                    Role: {app.drive?.role} · Package: <strong className="text-ledger">{app.drive?.package || 'Standard'}</strong> · Match Score: {Math.round(app.matchScore)}%
                  </p>
                  {app.rounds?.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="mono text-[10px] uppercase font-bold text-ink-faint">Rounds:</span>
                      {app.rounds.map((r) => (
                        <span
                          key={r.id}
                          className={`mono text-[10px] px-1.5 py-0.5 border font-semibold ${
                            r.result === 'CLEARED'
                              ? 'border-ledger bg-ledger/10 text-ledger'
                              : r.result === 'SCHEDULED'
                              ? 'border-overprint bg-overprint/10 text-overprint'
                              : 'border-seal bg-seal/10 text-seal'
                          }`}
                        >
                          Round {r.roundNumber}: {r.result}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {app.status === 'OFFERED' ? (
                    <button
                      onClick={() => setActiveOffer(app)}
                      className="btn-ink !bg-ledger !border-ledger hover:!bg-ledger/90 text-white !text-xs inline-flex items-center gap-1.5 shadow-[2px_2px_0_0_#17233B]"
                    >
                      <Award className="h-4 w-4" /> View Selection Letter (LOI)
                    </button>
                  ) : ['SHORTLISTED', 'ROUND_IN_PROGRESS'].includes(app.status) ? (
                    <button
                      onClick={() => setActiveAdmitCard(app)}
                      className="btn-ink !text-xs inline-flex items-center gap-1.5"
                    >
                      <FileText className="h-4 w-4" /> View Placement Hall Ticket
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open Drives Notice Board */}
      <section>
        <div className="rule-double mb-1" />
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display mt-4 text-xl font-extrabold text-ink">
            Notice Board — Open Drives
          </h2>
          <p className="mono text-[11px] text-ink-faint">auto-screening gate evaluates before you apply</p>
        </div>
        <div className="space-y-4">
          {drives.length === 0 && (
            <p className="border-2 border-dashed border-ink/25 px-6 py-10 text-center text-sm text-ink-soft">
              No open drives today. Alerts reach your inbox the moment the TPO or a recruiter publishes.
            </p>
          )}
          {drives.map((d) => (
            <DriveRow
              key={d.id}
              drive={d}
              profile={profile}
              reload={loadAll}
              flash={flash}
              onOpenAdvisor={() => setActiveAdvisorDrive(d)}
              onOpenAdmitCard={(app) => setActiveAdmitCard(app)}
              onOpenOffer={(app) => setActiveOffer(app)}
            />
          ))}
        </div>
      </section>

      {/* Alert Slips */}
      <section>
        <div className="rule-double mb-5" />
        <h2 className="font-display mb-5 text-xl font-extrabold text-ink">Alert Slips</h2>
        <div className="space-y-3">
          {notifications.length === 0 && (
            <p className="border-2 border-dashed border-ink/25 px-6 py-8 text-center text-sm text-ink-soft">
              Nothing yet. Notices will appear here.
            </p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className="ticket relative bg-white px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-ink">{n.subject}</p>
                <span className="mono text-[10px] text-ink-faint">
                  {new Date(n.createdAt).toLocaleString('en-IN')} {n.channel === 'SNS' && '— via SNS'}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-[13px] text-ink-soft">{n.message}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        me={me}
        onFlash={flash}
        reload={loadAll}
      />

      <AdmitCardModal
        open={!!activeAdmitCard}
        onClose={() => setActiveAdmitCard(null)}
        application={activeAdmitCard}
        profile={profile}
        studentUser={me}
      />

      <OfferLetterModal
        open={!!activeOffer}
        onClose={() => setActiveOffer(null)}
        application={activeOffer}
        profile={profile}
        studentUser={me}
      />

      <SkillGapAdvisorModal
        open={!!activeAdvisorDrive}
        onClose={() => setActiveAdvisorDrive(null)}
        drive={activeAdvisorDrive}
        profile={profile}
      />
    </div>
  );
}

/* ---------------------------------------------------------- Resume Card */
function ResumeCard({ profile, onFlash, reload }) {
  const [busy, setBusy] = useState(false);
  const resume = profile.resume;

  const upload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return onFlash(false, 'Only PDFs are accepted.');
    if (file.size > 10 * 1024 * 1024) return onFlash(false, 'Resume must be 10 MB or smaller.');
    setBusy(true);
    try {
      try {
        const { uploadUrl, key } = await api('/resume/upload-link', {
          method: 'POST',
          body: { filename: file.name, contentType: 'application/pdf' },
        });
        const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: file });
        if (!res.ok) throw new Error(`S3 direct upload failed (${res.status})`);
        await api('/resume/confirm', { method: 'POST', body: { key } });
      } catch (directErr) {
        // Fallback to server-mediated upload
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await api('/resume/upload-direct', {
          method: 'POST',
          body: { filename: file.name, base64 },
        });
      }
      onFlash(true, 'Resume parsed & verified. Extracted skills and academic profile now feed the shortlist engine.');
      await reload();
    } catch (err) {
      onFlash(false, err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ticket bg-white">
      <div className="rule-double" />
      <div className="flex flex-wrap items-center gap-6 px-6 py-5">
        <div className="relative h-20 w-16 shrink-0 border-2 border-ink bg-fold">
          {resume && <FileUp className="absolute inset-0 m-auto h-6 w-6 text-ink" />}
          {!resume && <span className="mono absolute inset-x-1 bottom-1 text-center text-[8px] text-ink-faint">paste here</span>}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold text-ink">Your Verified Resume (S3 + OCR)</p>
          {resume ? (
            <>
              <div className="mt-0.5 flex items-center gap-3">
                <p className="mono truncate text-[11px] text-ink-soft">{resume.filename.split('/').pop()}</p>
                <button
                  type="button"
                  className="mono text-[10px] underline text-ink hover:text-ink-soft"
                  onClick={async () => {
                    try {
                      const { downloadUrl } = await api('/resume/download');
                      window.open(downloadUrl, '_blank');
                    } catch (e) {
                      onFlash(false, e.message);
                    }
                  }}
                >
                  view PDF
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(resume.extractedSkills?.length
                  ? resume.extractedSkills
                  : ['nothing extracted yet']
                ).slice(0, 12).map((s) => (
                  <span key={s} className="mono border border-ink/30 px-1.5 py-0.5 text-[10px] text-ink-soft">{s}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-[13px] text-ink-soft">
              Upload once to Amazon S3. The OCR parser extracts your skills; every drive then evaluates them for its gate.
            </p>
          )}
        </div>

        <label className={`btn-ink cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          <UploadCloud className="h-4 w-4" />
          {busy ? 'Parsing…' : resume ? 'Replace PDF' : 'Upload PDF'}
          <input type="file" accept="application/pdf" className="hidden" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      {busy && (
        <div className="mx-6 mb-4 h-1 bg-fold">
          <div className="h-full w-1/3 animate-pulse bg-ink" />
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Drive Row */
function DriveRow({ drive: d, profile, reload, flash, onOpenAdvisor, onOpenAdmitCard, onOpenOffer }) {
  const [busy, setBusy] = useState(false);
  const myApp = d.applications?.[0];
  const mySkills = new Set([
    ...(profile.resume?.extractedSkills || []).map((s) => s.toLowerCase()),
    ...(profile.skills || []).map((s) => s.toLowerCase()),
  ]);
  const matched = (d.skills || []).filter((s) => mySkills.has(s.toLowerCase()));

  const apply = async () => {
    setBusy(true);
    try {
      const { application, verdict } = await api(`/drives/${d.id}/apply`, { method: 'POST' });
      await reload();
      flash(
        verdict.passed,
        verdict.passed
          ? `Filed and STAMPED SHORTLISTED automatically. Score: ${application.matchScore}/100.`
          : `Filed, but the gate did not open this time. ${verdict.reasons.join(' | ')}`
      );
    } catch (err) {
      flash(false, err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="ticket flex flex-col sm:flex-row gap-5 bg-white p-5 sm:p-0">
      {/* seat number rail */}
      <div className="hidden w-14 shrink-0 border-r-2 border-dashed border-ink/25 py-5 sm:block">
        <span className="mono block rotate-180 pl-3 text-[10px] tracking-widest text-ink-faint [writing-mode:vertical-rl]">
          gate Nº 2026-{d.id.slice(-4)}
        </span>
      </div>

      <div className="min-w-0 flex-1 sm:py-5 sm:pr-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-extrabold text-ink">{d.title}</h3>
          <StatusBadge status={myApp ? myApp.status : d.status} />
        </div>
        <p className="mono mt-1 text-[11px] text-ink-soft">
          <strong>{d.companyRef?.name}</strong> — {d.role}{d.package && ` — ${d.package}`}{d.location && ` (${d.location})`}
        </p>

        <div className="mt-4 grid gap-x-8 gap-y-1.5 text-[13px] sm:grid-cols-[auto_1fr]">
          <span className="mono w-24 text-[10px] leading-5 text-ink-faint">Gate criteria</span>
          <span className="text-ink-soft">
            CGPA ≥ {d.minCgpa ?? 'any'}
            {d.branches?.length ? `, ${d.branches.join(', ')}` : ', all branches'}
            {d.skills?.length ? `, ${d.minSkills || 1} of ${d.skills.join(' / ')}` : ''}
          </span>
          <span className="mono w-24 text-[10px] leading-5 text-ink-faint">Skills overlap</span>
          <span>
            {(d.skills || []).map((s) => (
              <span
                key={s}
                className={`mono mr-1.5 inline-block border px-1.5 py-0.5 text-[10px] ${
                  matched.includes(s) ? 'border-ledger/50 bg-ledger/5 text-ledger' : 'border-ink/20 text-ink-faint'
                }`}
              >
                {s}
              </span>
            ))}
            {!(d.skills || []).length && <span className="text-ink-faint">no skill gate</span>}
          </span>
          <span className="mono w-24 text-[10px] leading-5 text-ink-faint">Filings & Time</span>
          <span className="text-ink-soft">
            {d._count?.applications ?? 0} filings{d.deadline && ` — doors close ${new Date(d.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
          </span>
        </div>

        {/* Advisor link */}
        <div className="mt-3 pt-2 border-t border-ink/10 flex items-center justify-between">
          <button
            onClick={onOpenAdvisor}
            className="mono text-xs text-overprint hover:text-ink font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-overprint" /> ATS Match & Skill Gap Advisor
          </button>
        </div>
      </div>

      <div className="flex sm:w-36 shrink-0 flex-col items-center justify-center gap-2 border-t sm:border-t-0 sm:border-l-2 border-dashed border-ink/25 pt-4 sm:pt-0 px-3">
        {myApp ? (
          <div className="text-center space-y-1">
            <span className="mono text-[11px] text-ink-faint">score</span>
            <span className="font-display block text-2xl font-extrabold text-ink">{Math.round(myApp.matchScore)}</span>
            <span className="mono block text-[10px] text-ink-faint">out of 100</span>

            {myApp.status === 'OFFERED' ? (
              <button
                onClick={() => onOpenOffer({ ...myApp, drive: d })}
                className="mono text-[10px] text-ledger underline block mt-1 font-bold"
              >
                Letter of Intent
              </button>
            ) : ['SHORTLISTED', 'ROUND_IN_PROGRESS'].includes(myApp.status) ? (
              <button
                onClick={() => onOpenAdmitCard({ ...myApp, drive: d })}
                className="mono text-[10px] text-overprint underline block mt-1 font-bold"
              >
                Admit Card
              </button>
            ) : null}
          </div>
        ) : (
          <button className="btn-ink !px-3 !text-xs w-full" onClick={apply} disabled={busy || !profile.resume}>
            {busy ? 'filing…' : 'file now'}
          </button>
        )}
        {!myApp && !profile.resume && (
          <span className="mono text-center text-[10px] leading-tight text-seal">resume needed first</span>
        )}
        {myApp && myApp.status === 'REJECTED' && (
          <span className="text-center text-[10px] leading-tight text-ink-soft">{myApp.rejectedReasons?.[0]}</span>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ Edit Profile */
function EditProfileModal({ open, onClose, profile, me, onFlash, reload }) {
  const [form, setForm] = useState({
    name: me?.name || '',
    cgpa: profile.cgpa ?? '',
    branch: profile.branch ?? '',
    graduationYear: profile.graduationYear ?? 2026,
    skills: (profile.skills || []).join(', '),
    phone: profile.phone ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    usn: profile.usn ?? '',
    college: profile.college ?? '',
    bio: profile.bio ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    githubUrl: profile.githubUrl ?? '',
    emailOptIn: profile.emailOptIn ?? true,
  });

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      await api('/profile/me', {
        method: 'PUT',
        body: {
          name: form.name || undefined,
          cgpa: form.cgpa === '' ? undefined : form.cgpa,
          branch: form.branch || undefined,
          graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
          phone: form.phone || undefined,
          avatarUrl: form.avatarUrl || undefined,
          usn: form.usn || undefined,
          college: form.college || undefined,
          bio: form.bio || undefined,
          linkedinUrl: form.linkedinUrl || undefined,
          githubUrl: form.githubUrl || undefined,
          emailOptIn: form.emailOptIn,
        },
      });
      onFlash(true, 'Particulars and student profile image updated.');
      await reload();
      onClose();
    } catch (err) {
      onFlash(false, err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Amend Your Particulars & Profile Image" serial="PGH/AMD">
      <form onSubmit={save} className="grid gap-5 sm:grid-cols-2 max-h-[75vh] overflow-y-auto pr-1">
        {/* Avatar Preset Selector */}
        <div className="sm:col-span-2 border-2 border-ink p-3 bg-paper/40 space-y-2">
          <label className="label">Profile Image / Avatar Preset (Select or enter custom URL)</label>
          <div className="flex flex-wrap gap-2 items-center">
            {AVATAR_PRESETS.map((av) => (
              <button
                key={av.label}
                type="button"
                onClick={() => setForm({ ...form, avatarUrl: av.url })}
                className={`relative border-2 ${form.avatarUrl === av.url ? 'border-overprint ring-2 ring-overprint' : 'border-ink'} p-0.5 bg-white transition hover:scale-105`}
                title={av.label}
              >
                <img src={av.url} alt={av.label} className="h-9 w-9 object-cover" />
              </button>
            ))}
          </div>
          <input
            className="field !text-xs mt-2"
            value={form.avatarUrl}
            onChange={set('avatarUrl')}
            placeholder="Custom Profile Image URL (https://...)"
          />
        </div>

        <div>
          <label className="label">Full Name</label>
          <input className="field" value={form.name} onChange={set('name')} required />
        </div>

        <div>
          <label className="label">University Seat Number (USN / Roll No)</label>
          <input className="field" value={form.usn} onChange={set('usn')} placeholder="e.g. 1RV22CS142" />
        </div>

        <div>
          <label className="label">College / Institute Name</label>
          <input className="field" value={form.college} onChange={set('college')} placeholder="e.g. IIT Bombay / RVCE Bengaluru" />
        </div>

        <div>
          <label className="label">Branch</label>
          <select className="field" value={form.branch} onChange={set('branch')}>
            <option value="">not chosen</option>
            {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML'].map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="label">CGPA (0 - 10)</label>
          <input className="field" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={set('cgpa')} />
        </div>

        <div>
          <label className="label">Graduation Year</label>
          <input className="field" type="number" value={form.graduationYear} onChange={set('graduationYear')} />
        </div>

        <div>
          <label className="label">Contact Phone</label>
          <input className="field" value={form.phone} onChange={set('phone')} placeholder="+91 98000 00000" />
        </div>

        <div>
          <label className="label">LinkedIn Profile URL</label>
          <input className="field" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/..." />
        </div>

        <div className="sm:col-span-2">
          <label className="label">GitHub Profile URL</label>
          <input className="field" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/..." />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Professional Headline / Bio</label>
          <input
            className="field"
            value={form.bio}
            onChange={set('bio')}
            placeholder="e.g. Cloud & Distributed Systems Enthusiast | AWS Certified Cloud Practitioner"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Skills (comma-separated) — OCR parser also appends from resume</label>
          <input className="field" value={form.skills} onChange={set('skills')} placeholder="python, aws, react, docker, sql" />
        </div>

        <label className="flex items-center gap-3 sm:col-span-2">
          <input type="checkbox" className="box" checked={form.emailOptIn} onChange={set('emailOptIn')} />
          <span className="text-[13px] text-ink-soft">Keep me subscribed to SNS drive alerts</span>
        </label>

        <div className="flex gap-2 sm:col-span-2 pt-2">
          <button className="btn-ink flex-1">Save Particulars</button>
          <button type="button" className="btn-form" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
