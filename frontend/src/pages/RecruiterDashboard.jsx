import { useCallback, useEffect, useMemo, useState } from 'react';
import { Fragment } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import StatCard from '../components/StatCard.jsx';

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
  }, []);

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
            {user.role === 'OFFICER' ? 'All drive notices' : 'Post a drive, read the ranked list'}
          </h1>
        </div>
        <button className="btn-ink" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New drive notice
        </button>
      </div>

      {msg && (
        <p className={`border-2 px-4 py-3 text-sm ${msg.good ? 'border-ledger bg-ledger/5 text-ledger' : 'border-seal bg-seal/5 text-seal'}`} role="status">
          {msg.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="notices" value={drives.length} sub={`${stat.open} open now`} />
        <StatCard label="filings received" value={stat.apps} />
        <StatCard label="alerts" value="SNS" sub="one publish per drive go-live" />
      </div>

      <div className="ticket bg-white">
        <div className="rule-double" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="mono w-8 px-4 py-3 text-[10px] font-semibold text-ink-faint">#</th>
              <th className="px-2 py-3 font-display text-[13px] font-bold text-ink">drive notice</th>
              <th className="mono hidden px-2 py-3 text-[10px] font-semibold text-ink-faint lg:table-cell">gate</th>
              <th className="mono px-2 py-3 text-right text-[10px] font-semibold text-ink-faint">filings</th>
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
                    <span className="mono ml-2 text-[10px] text-ink-soft">{d.companyRef?.name}</span>
                  </td>
                  <td className="mono hidden px-2 py-3 text-[11px] text-ink-soft lg:table-cell">
                    {d.minCgpa ? `≥ ${d.minCgpa}` : 'any'} {d.branches?.length ? `, ${d.branches.join('/')}` : ''}
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
            Nothing posted yet. Press "New drive notice" and the students hear about it by SNS.
          </p>
        )}
      </div>

      <CreateDriveModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={load} flash={flash} />
    </div>
  );
}

/* ------------------------------------------------------- applicant ledger */
function ApplicantsList({ drive, flash, reload }) {
  const [apps, setApps] = useState(null);

  useEffect(() => {
    api(`/applications/drive/${drive.id}`)
      .then((r) => setApps(r.applications))
      .catch((e) => flash(false, e.message));
  }, [drive.id]);

  if (!apps) return <p className="mono py-4 text-sm text-ink-faint">opening ledger…</p>;
  if (apps.length === 0) {
    return <p className="py-5 pl-1 text-sm text-ink-soft">No filings for this drive yet.</p>;
  }

  const advance = async (id, result) => {
    try {
      await api(`/applications/${id}/rounds`, { method: 'POST', body: { result } });
      const r = await api(`/applications/drive/${drive.id}`);
      setApps(r.applications);
      flash(true, `Round result recorded: ${result.toLowerCase()}.`);
      reload();
    } catch (err) {
      flash(false, err.message);
    }
  };

  return (
    <div>
      <p className="mono mb-3 text-[10px] text-ink-faint">list of candidates — ranked by match score, engine already ran</p>
      <div className="space-y-3">
        {apps.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-4 border-2 border-ink/15 bg-white px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-ink bg-fold text-[11px] font-bold text-ink">
              {(a.user?.name || '??').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{a.user?.name}</p>
              <p className="mono truncate text-[10px] text-ink-soft">{a.user?.email}</p>
              {a.rejectedReasons?.length > 0 && (
                <p className="mt-1 text-[11px] text-seal">{a.rejectedReasons.join(' | ')}</p>
              )}
            </div>
            <div className="text-center">
              <span className="font-display text-xl font-extrabold text-ink">{Math.round(a.matchScore)}</span>
              <span className="mono block text-[9px] text-ink-faint">/ 100</span>
            </div>
            <StatusBadge status={a.status} />
            {!['OFFERED', 'REJECTED'].includes(a.status) && (
            <div className="flex gap-1.5">
              <button className="btn-form !px-2.5 !py-1.5 !text-[11px]" onClick={() => advance(a.id, 'SCHEDULED')}>
                schedule r{a.currentRound + 1}
              </button>
              <button className="btn-ink !px-2.5 !py-1.5 !text-[11px]" onClick={() => advance(a.id, 'CLEARED')}>
                cleared
              </button>
              <button className="btn-form !border-seal !px-2.5 !py-1.5 !text-[11px] !text-seal" onClick={() => advance(a.id, 'FAILED')}>
                out
              </button>
            </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- create notice */
function CreateDriveModal({ open, onClose, onDone, flash }) {
  const blank = {
    title: '', company: '', role: '', package: '', description: '',
    minCgpa: '7', branches: [], skills: 'python, sql', minSkills: '1', roundsTotal: '3',
    deadline: '', broadcast: true,
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
      flash(true, `Notice published. Alert status: ${res.alert || 'not sent'}.`);
    } catch (err) {
      flash(false, err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New drive notice" serial="PGH/DN" wide>
      <form onSubmit={submit}>
        <p className="mono mb-3 text-[10px] text-ink-faint">part I — the drive</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Title of the notice</label>
            <input className="field" required minLength={3} value={form.title} onChange={set('title')} placeholder="Cloud-Native Engineer Internship" />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="field" required value={form.company} onChange={set('company')} placeholder="ACME Technologies" />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="field" required value={form.role} onChange={set('role')} placeholder="AWS Cloud Intern" />
          </div>
          <div>
            <label className="label">Stipend or CTC</label>
            <input className="field" value={form.package} onChange={set('package')} placeholder="6 LPA" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">What the candidate will actually do</label>
            <textarea className="field min-h-24" required minLength={10} value={form.description} onChange={set('description')} />
          </div>
        </div>

        <div className="rule-1px my-6" />
        <p className="mono mb-3 text-[10px] text-ink-faint">part II — the gate</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">CGPA floor</label>
            <input className="field" type="number" step="0.1" min="0" max="10" value={form.minCgpa} onChange={set('minCgpa')} />
          </div>
          <div>
            <label className="label">Skills wanted — comma separated</label>
            <input className="field" value={form.skills} onChange={set('skills')} />
          </div>
          <div>
            <label className="label">Minimum matched skills</label>
            <input className="field" type="number" min="1" max="10" value={form.minSkills} onChange={set('minSkills')} />
          </div>
          <div>
            <label className="label">Interview rounds</label>
            <input className="field" type="number" min="1" max="8" value={form.roundsTotal} onChange={set('roundsTotal')} />
          </div>
          <div>
            <label className="label">Doors close on</label>
            <input className="field" type="date" value={form.deadline} onChange={set('deadline')} />
          </div>
          <div className="sm:col-span-2">
            <p className="label">Eligible branches — none selected means open to all</p>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((b) => (
                <label key={b}
                  className={`flex cursor-pointer items-center gap-2 border-2 px-3 py-1.5 transition ${
                    form.branches.includes(b) ? 'border-ink bg-fold' : 'border-ink/25 hover:border-ink'
                  }`}>
                  <input type="checkbox" className="box" checked={form.branches.includes(b)} onChange={() => toggleBranch(b)} />
                  <span className="mono text-[11px] font-semibold text-ink">{b}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" className="box" checked={form.broadcast} onChange={set('broadcast')} />
            <span className="text-[13px] text-ink-soft">Publish an SNS alert the moment this notice opens</span>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn-ink flex-1" disabled={busy}>{busy ? 'Publishing…' : 'Publish notice'}</button>
            <button type="button" className="btn-form" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
