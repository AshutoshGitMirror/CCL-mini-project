import { useCallback, useEffect, useState } from 'react';
import { Bell, FileUp, Pencil, UploadCloud } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import StatCard from '../components/StatCard.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [me, setMe] = useState(null);
  const [drives, setDrives] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [p, d, n] = await Promise.all([api('/profile/me'), api('/drives'), api('/notifications/me')]);
      setProfile(p.profile);
      setMe(p.user);
      setDrives(d.drives);
      setNotifications(n.notifications);
    } catch (err) {
      setMsg({ good: false, text: err.message });
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const applied = drives.filter((d) => d.applications?.length > 0).length;

  const flash = (good, text) => {
    setMsg({ good, text });
    setTimeout(() => setMsg(null), 4000);
  };

  if (!profile) {
    return <p className="mono text-sm text-ink-soft">loading your particulars…</p>;
  }

  return (
    <div className="animate-lift space-y-10">
      {/* particulars header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] text-ink-faint">candidate particulars</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-ink">{me?.name}</h1>
          <p className="mono mt-1.5 text-[12px] text-ink-soft">
            {profile.branch || 'branch not filed'} — CGPA {profile.cgpa ?? 'not filed'} — class of {profile.graduationYear ?? '—'}
          </p>
        </div>
        <button className="btn-form" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit particulars
        </button>
      </div>

      {msg && (
        <p className={`border-2 px-4 py-3 text-sm ${msg.good ? 'border-ledger bg-ledger/5 text-ledger' : 'border-seal bg-seal/5 text-seal'}`} role="status">
          {msg.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="drives open" value={drives.length} />
        <StatCard label="you applied" value={applied} />
        <StatCard label="alerts" value={notifications.length} />
      </div>

      <ResumeCard profile={profile} onFlash={flash} reload={loadAll} />

      {/* ------------------------------------------------------ open drives */}
      <section>
        <div className="rule-double mb-1" />
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display mt-4 text-xl font-extrabold text-ink">Notice board — open drives</h2>
          <p className="mono text-[11px] text-ink-faint">the gate row tells you before you apply</p>
        </div>
        <div className="space-y-4">
          {drives.length === 0 && (
            <p className="border-2 border-dashed border-ink/25 px-6 py-10 text-center text-sm text-ink-soft">
              No open drives today. Alerts reach your inbox the moment the TPO or a recruiter publishes.
            </p>
          )}
          {drives.map((d) => (
            <DriveRow key={d.id} drive={d} profile={profile} reload={loadAll} flash={flash} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ alerts slips */}
      <section>
        <div className="rule-double mb-5" />
        <h2 className="font-display mb-5 text-xl font-extrabold text-ink">Alert slips</h2>
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

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} me={me} onFlash={flash} reload={loadAll} />
    </div>
  );
}

/* ---------------------------------------------------------- resume upload */
function ResumeCard({ profile, onFlash, reload }) {
  const [busy, setBusy] = useState(false);
  const resume = profile.resume;

  const upload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return onFlash(false, 'Only PDFs are accepted.');
    setBusy(true);
    try {
      const { uploadUrl, key } = await api('/resume/upload-link', {
        method: 'POST',
        body: { filename: file.name, contentType: 'application/pdf' },
      });
      const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: file });
      if (!res.ok) throw new Error(`Storage upload failed (${res.status})`);
      await api('/resume/confirm', { method: 'POST', body: { key } });
      onFlash(true, 'Resume parsed. Extracted skills now feed the shortlist engine.');
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
          <p className="font-display text-lg font-extrabold text-ink">Your resume</p>
          {resume ? (
            <>
              <p className="mono mt-0.5 truncate text-[11px] text-ink-soft">{resume.filename.split('/').pop()}</p>
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
              Upload once. The parser lists your skills; every drive then reads them for its gate.
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

/* --------------------------------------------------------------- drive row */
function DriveRow({ drive: d, profile, reload, flash }) {
  const [busy, setBusy] = useState(false);
  const myApp = d.applications?.[0];
  const mySkills = new Set([...(profile.resume?.extractedSkills || []), ...(profile.skills || [])]);
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
    <article className="ticket flex gap-5 bg-white">
      {/* seat number rail */}
      <div className="hidden w-14 shrink-0 border-r-2 border-dashed border-ink/25 py-5 sm:block">
        <span className="mono block rotate-180 pl-3 text-[10px] tracking-widest text-ink-faint [writing-mode:vertical-rl]">
          gate Nº 2026-{d.id.slice(-4)}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-5 pr-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-extrabold text-ink">{d.title}</h3>
          <StatusBadge status={myApp ? myApp.status : d.status} />
        </div>
        <p className="mono mt-1 text-[11px] text-ink-soft">
          {d.companyRef?.name} — {d.role}{d.package && ` — ${d.package}`}
        </p>

        <div className="mt-4 grid gap-x-8 gap-y-1.5 text-[13px] sm:grid-cols-[auto_1fr]">
          <span className="mono w-24 text-[10px] leading-5 text-ink-faint">gate</span>
          <span className="text-ink-soft">
            CGPA ≥ {d.minCgpa ?? 'any'}
            {d.branches?.length ? `, ${d.branches.join(', ')}` : ', all branches'}
            {d.skills?.length ? `, ${d.minSkills || 1} of ${d.skills.join(' / ')}` : ''}
          </span>
          <span className="mono w-24 text-[10px] leading-5 text-ink-faint">your skills</span>
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
          <span className="mono w-24 text-[10px] leading-5 text-ink-faint">counts</span>
          <span className="text-ink-soft">
            {d._count?.applications ?? 0} filings{d.deadline && ` — doors close ${new Date(d.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
          </span>
        </div>
      </div>

      <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 border-l-2 border-dashed border-ink/25 px-3">
        {myApp ? (
          <span className="text-center">
            <span className="mono text-[11px] text-ink-faint">score</span>
            <span className="font-display block text-2xl font-extrabold text-ink">{Math.round(myApp.matchScore)}</span>
            <span className="mono block text-[10px] text-ink-faint">out of 100</span>
          </span>
        ) : (
          <button className="btn-ink !px-3 !text-xs" onClick={apply} disabled={busy || !profile.resume}>
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

/* ------------------------------------------------------------ edit profile */
function EditProfileModal({ open, onClose, profile, me, onFlash, reload }) {
  const [form, setForm] = useState({
    name: me?.name || '',
    cgpa: profile.cgpa ?? '',
    branch: profile.branch ?? '',
    graduationYear: profile.graduationYear ?? '',
    skills: (profile.skills || []).join(', '),
    phone: profile.phone ?? '',
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
          graduationYear: form.graduationYear || undefined,
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
          phone: form.phone || undefined,
          emailOptIn: form.emailOptIn,
        },
      });
      onFlash(true, 'Particulars updated.');
      await reload();
      onClose();
    } catch (err) {
      onFlash(false, err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Amend your particulars" serial="PGH/AMD">
      <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input className="field" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label">CGPA</label>
          <input className="field" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={set('cgpa')} />
        </div>
        <div>
          <label className="label">Branch</label>
          <select className="field" value={form.branch} onChange={set('branch')}>
            <option value="">not chosen</option>
            {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML'].map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Graduation year</label>
          <input className="field" type="number" value={form.graduationYear} onChange={set('graduationYear')} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="field" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Skills — the resume parser adds its own automatically</label>
          <input className="field" value={form.skills} onChange={set('skills')} placeholder="python, react, sql" />
        </div>
        <label className="flex items-center gap-3 sm:col-span-2">
          <input type="checkbox" className="box" checked={form.emailOptIn} onChange={set('emailOptIn')} />
          <span className="text-[13px] text-ink-soft">Keep me subscribed to drive alerts</span>
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button className="btn-ink flex-1">Save particulars</button>
          <button type="button" className="btn-form" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
