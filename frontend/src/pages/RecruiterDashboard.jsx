import { useCallback, useEffect, useMemo, useState } from 'react';
import { Fragment } from 'react';
import { ChevronDown, Plus, Download, Filter, ExternalLink, Calendar, CheckCircle2, UserX } from 'lucide-react';
import { api, getToken } from '../api.js';
import { useAuth } from '../auth.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import StatCard from '../components/StatCard.jsx';
import Avatar from '../components/Avatar.jsx';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML'];

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [openRows, setOpenRows] = useState(() => new Set());
  const [msg, setMsg] = useState(null);

  const flash = (good, text) => {
    setMsg({ good, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      const { drives } = await api('/drives');
      setDrives(drives);
    } catch (err) {
      flash(false, err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stat = useMemo(() => ({
    open: drives.filter((d) => d.status === 'OPEN').length,
    apps: drives.reduce((n, d) => n + (d._count?.applications || 0), 0),
  }), [drives]);

  const toggleRow = (id) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-lift space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] text-ink-faint">{user.role === 'OFFICER' ? 'TPO office' : 'recruiter desk'}</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-ink">
            {user.role === 'OFFICER' ? 'Campus Placement Drives' : 'Post Drives & Screen Candidates'}
          </h1>
          <p className="mono mt-1 text-xs text-ink-soft">
            Auto-screened via shortlisting engine · Ranked by CGPA & verified skill overlap
          </p>
        </div>
        <button className="btn-ink" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Drive Notice
        </button>
      </div>

      {msg && (
        <p className={`border-2 px-4 py-3 text-sm ${msg.good ? 'border-ledger bg-ledger/5 text-ledger' : 'border-seal bg-seal/5 text-seal'}`} role="status">
          {msg.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Placement Notices" value={drives.length} sub={`${stat.open} accepting filings`} />
        <StatCard label="Total Filings" value={stat.apps} sub="Across all companies" />
        <StatCard label="Alert Fan-Out" value="Amazon SNS" sub="Real-time multi-account dispatch" />
      </div>

      <div className="ticket bg-white">
        <div className="rule-double" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left bg-paper/60">
              <th className="mono w-8 px-4 py-3 text-[10px] font-semibold text-ink-faint">#</th>
              <th className="px-2 py-3 font-display text-[13px] font-bold text-ink">Drive Particulars</th>
              <th className="mono hidden px-2 py-3 text-[10px] font-semibold text-ink-faint lg:table-cell">Eligibility Gate</th>
              <th className="mono px-2 py-3 text-right text-[10px] font-semibold text-ink-faint">Filings</th>
              <th className="w-8 px-3" aria-hidden />
              <th className="w-40 px-4 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {drives.map((d, i) => (
              <Fragment key={d.id}>
                <tr
                  tabIndex={0}
                  role="button"
                  aria-expanded={openRows.has(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleRow(d.id);
                    }
                  }}
                  className={`cursor-pointer outline-none border-b border-ink/15 transition hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-overprint ${openRows.has(d.id) ? 'bg-paper' : ''}`}
                  onClick={() => toggleRow(d.id)}>
                  <td className="mono px-4 py-3 text-[11px] text-ink-faint">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-2 py-3">
                    <span className="font-semibold text-ink">{d.title}</span>
                    <span className="mono ml-2 text-[10px] text-ink-soft">[{d.companyRef?.name}]</span>
                    {d.package && <span className="mono ml-2 text-[10px] font-bold text-ledger">{d.package}</span>}
                  </td>
                  <td className="mono hidden px-2 py-3 text-[11px] text-ink-soft lg:table-cell">
                    {d.minCgpa ? `≥ ${d.minCgpa} CGPA` : 'any CGPA'} {d.branches?.length ? `, ${d.branches.join('/')}` : ''}
                  </td>
                  <td className="mono px-2 py-3 text-right font-semibold text-ink">{d._count?.applications ?? 0}</td>
                  <td className="px-3 text-center">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="pl-2">
                    <ChevronDown className={`h-4 w-4 text-ink-faint transition ${openRows.has(d.id) ? 'rotate-180' : ''}`} />
                  </td>
                </tr>
                {openRows.has(d.id) && (
                  <tr key={d.id + '-panel'}>
                    <td colSpan={6} className="border-b border-ink/15 bg-paper px-4 pb-5 pt-2">
                      <ApplicantsList drive={d} flash={flash} reload={load} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {drives.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-ink-soft">
            Nothing posted yet. Press "New drive notice" to publish to students and SNS subscribers.
          </p>
        )}
      </div>

      <CreateDriveModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={load} flash={flash} />
    </div>
  );
}

/* ------------------------------------------------------- Applicant Ledger */
function ApplicantsList({ drive, flash, reload }) {
  const [apps, setApps] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api(`/applications/drive/${drive.id}`)
      .then((r) => setApps(r.applications))
      .catch((e) => flash(false, e.message));
  }, [drive.id]);

  if (!apps) return <p className="mono py-4 text-sm text-ink-faint">opening applicant ledger…</p>;
  if (apps.length === 0) {
    return <p className="py-5 pl-1 text-sm text-ink-soft">No filings recorded for this drive notice yet.</p>;
  }

  const advance = async (id, result) => {
    try {
      await api(`/applications/${id}/rounds`, { method: 'POST', body: { result } });
      const r = await api(`/applications/drive/${drive.id}`);
      setApps(r.applications);
      flash(true, `Round evaluation recorded: ${result.toLowerCase()}. Notification dispatched.`);
      reload();
    } catch (err) {
      flash(false, err.message);
    }
  };

  const closeDrive = async () => {
    try {
      await api(`/drives/${drive.id}/close`, { method: 'POST' });
      flash(true, 'Drive notice closed. No new filings will be accepted.');
      reload();
    } catch (err) {
      flash(false, err.message);
    }
  };

  const downloadCsv = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/applications/export/${drive.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to generate CSV export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shortlist_${drive.title.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      flash(false, err.message);
    }
  };

  const filteredApps = apps.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Action Header & CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-2">
        <div className="flex items-center gap-2">
          <p className="mono text-[11px] font-bold text-ink uppercase">
            Candidate Ranking & Funnel ({apps.length} applicants)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCsv}
            className="btn-form !px-2.5 !py-1 !text-xs font-semibold inline-flex items-center gap-1.5"
            title="Download candidates spreadsheet"
          >
            <Download className="h-3.5 w-3.5 text-overprint" /> Export Shortlist (CSV)
          </button>

          {drive.status === 'OPEN' && (
            <button className="btn-form !border-seal !text-seal !px-2.5 !py-1 !text-xs font-semibold" onClick={closeDrive}>
              Close Notice
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 mono text-[10px]">
        {['ALL', 'SHORTLISTED', 'ROUND_IN_PROGRESS', 'OFFERED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-2 py-1 border ${
              statusFilter === st
                ? 'border-ink bg-ink text-white font-bold'
                : 'border-ink/20 bg-white text-ink-soft hover:bg-paper'
            }`}
          >
            {st.replace(/_/g, ' ')} ({apps.filter((a) => st === 'ALL' || a.status === st).length})
          </button>
        ))}
      </div>

      {/* Candidate Rows with Avatar and Particulars */}
      <div className="space-y-3">
        {filteredApps.map((a, idx) => {
          const p = a.user?.profile || {};
          return (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-4 border-2 border-ink/20 bg-white p-3.5 shadow-sm"
            >
              {/* Rank */}
              <span className="mono text-xs font-bold text-ink-faint w-5 text-center">
                #{idx + 1}
              </span>

              {/* Student Profile Avatar */}
              <Avatar
                src={p.avatarUrl}
                name={a.user?.name}
                size="md"
                className="shadow-[2px_2px_0_0_#17233B]"
              />

              {/* Candidate Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-sm">{a.user?.name}</span>
                  <button
                    type="button"
                    className="mono text-[10px] underline text-overprint hover:text-ink font-semibold"
                    onClick={async () => {
                      try {
                        const { downloadUrl } = await api(`/resume/view/${a.userId}`);
                        window.open(downloadUrl, '_blank');
                      } catch (e) {
                        flash(false, e.message);
                      }
                    }}
                  >
                    view verified resume
                  </button>
                </div>
                <p className="mono truncate text-[11px] text-ink-soft">
                  {p.college || 'Campus'} · USN: <strong className="text-ink">{p.usn || 'N/A'}</strong> · {p.branch || 'CSE'} (CGPA: {p.cgpa ?? 'N/A'})
                </p>
                {a.rejectedReasons?.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-seal font-medium">{a.rejectedReasons.join(' | ')}</p>
                )}
              </div>

              {/* Match Score */}
              <div className="text-center px-2">
                <span className="font-display text-xl font-extrabold text-ink">
                  {Math.round(a.matchScore)}
                </span>
                <span className="mono block text-[9px] text-ink-faint">/ 100</span>
              </div>

              {/* Status Badge */}
              <StatusBadge status={a.status} />

              {/* Recruiter Round Control Actions */}
              {!['OFFERED', 'REJECTED'].includes(a.status) && (
                <div className="flex items-center gap-1.5">
                  <button
                    className="btn-form !px-2 !py-1 !text-[10px] font-semibold"
                    onClick={() => advance(a.id, 'SCHEDULED')}
                    title="Schedule next technical round"
                  >
                    Schedule R{a.currentRound + 1}
                  </button>
                  <button
                    className="btn-ink !px-2.5 !py-1 !text-[10px] font-semibold"
                    onClick={() => advance(a.id, 'CLEARED')}
                    title="Mark candidate cleared"
                  >
                    Pass Round
                  </button>
                  <button
                    className="btn-form !border-seal !px-2 !py-1 !text-[10px] !text-seal font-semibold hover:!bg-seal/10"
                    onClick={() => advance(a.id, 'FAILED')}
                    title="Disqualify from drive"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Create Notice Modal */
function CreateDriveModal({ open, onClose, onDone, flash }) {
  const blank = {
    title: '',
    company: '',
    role: '',
    package: '',
    location: 'Bengaluru / Hyderabad (Hybrid)',
    jobType: 'Full-time',
    description: '',
    minCgpa: '7.5',
    branches: ['CSE', 'IT'],
    skills: 'python, aws, sql',
    minSkills: '1',
    roundsTotal: '3',
    deadline: '',
    broadcast: true,
  };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const toggleBranch = (b) =>
    setForm({
      ...form,
      branches: form.branches.includes(b) ? form.branches.filter((x) => x !== b) : [...form.branches, b],
    });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };
      const res = await api('/drives', { method: 'POST', body });
      onDone();
      onClose();
      setForm(blank);
      flash(true, `Notice published. SNS alert broadcast status: ${res.alert || 'SENT'}.`);
    } catch (err) {
      flash(false, err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Publish New Placement Drive Notice" serial="DRV/PUB">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 max-h-[75vh] overflow-y-auto pr-1">
        <div className="sm:col-span-2">
          <label className="label">Drive Title</label>
          <input className="field" required value={form.title} onChange={set('title')} placeholder="e.g. AWS Cloud Solutions Engineer 2026" />
        </div>

        <div>
          <label className="label">Company Name</label>
          <input className="field" required value={form.company} onChange={set('company')} placeholder="e.g. Amazon AWS" />
        </div>

        <div>
          <label className="label">Role / Designation</label>
          <input className="field" required value={form.role} onChange={set('role')} placeholder="e.g. Cloud Engineer Trainee" />
        </div>

        <div>
          <label className="label">Compensation (CTC / Package)</label>
          <input className="field" value={form.package} onChange={set('package')} placeholder="e.g. 12 LPA" />
        </div>

        <div>
          <label className="label">Job Location</label>
          <input className="field" value={form.location} onChange={set('location')} placeholder="e.g. Bengaluru / Remote" />
        </div>

        <div>
          <label className="label">Job Cadre / Type</label>
          <select className="field" value={form.jobType} onChange={set('jobType')}>
            <option>Full-time</option>
            <option>Internship + PPO</option>
            <option>Summer Internship</option>
          </select>
        </div>

        <div>
          <label className="label">Application Deadline</label>
          <input className="field" type="date" value={form.deadline} onChange={set('deadline')} />
        </div>

        <div>
          <label className="label">Minimum CGPA Requirement</label>
          <input className="field" type="number" step="0.1" min="0" max="10" value={form.minCgpa} onChange={set('minCgpa')} />
        </div>

        <div>
          <label className="label">Total Interview Rounds</label>
          <input className="field" type="number" min="1" max="6" value={form.roundsTotal} onChange={set('roundsTotal')} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Eligible Engineering Branches</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {BRANCHES.map((b) => (
              <button
                type="button"
                key={b}
                onClick={() => toggleBranch(b)}
                className={`mono px-2.5 py-1 text-xs border-2 font-semibold transition ${
                  form.branches.includes(b)
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/20 bg-white text-ink hover:bg-paper'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Required Tech Skills (comma-separated)</label>
          <input className="field" value={form.skills} onChange={set('skills')} placeholder="python, aws, docker, sql" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Job Description & Interview Format</label>
          <textarea
            className="field !h-24 resize-none border border-ink/40 p-2 text-sm"
            required
            value={form.description}
            onChange={set('description')}
            placeholder="Details of the role, technical expectation, interview round sequence..."
          />
        </div>

        <label className="flex items-center gap-3 sm:col-span-2 border-t border-ink/15 pt-2">
          <input type="checkbox" className="box" checked={form.broadcast} onChange={set('broadcast')} />
          <span className="text-[13px] text-ink-soft">Broadcast immediately via Amazon SNS to opted-in student emails</span>
        </label>

        <div className="flex gap-2 sm:col-span-2 pt-2">
          <button className="btn-ink flex-1" disabled={busy}>
            {busy ? 'Publishing…' : 'Publish Drive Notice'}
          </button>
          <button type="button" className="btn-form" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
