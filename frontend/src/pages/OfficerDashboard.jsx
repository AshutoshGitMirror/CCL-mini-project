import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Radio, Send, Users, BarChart3, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function OfficerDashboard() {
  const [drives, setDrives] = useState([]);
  const [audit, setAudit] = useState(null);
  const [transport, setTransport] = useState('');
  const [form, setForm] = useState({ subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const flash = (good, text) => {
    setMsg({ good, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      const [d, a] = await Promise.all([api('/drives'), api('/notifications/me')]);
      setDrives(d.drives);
      const auditRes = await api('/notifications/audit').catch(() => null);
      setAudit(auditRes?.notifications ?? a.notifications);
      setTransport(a.transport);
    } catch (err) {
      flash(false, err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api('/notifications/send', { method: 'POST', body: form });
      flash(
        true,
        res.status === 'SENT'
          ? `Published. SNS confirmed: ${res.messageId?.slice(0, 10)}…`
          : 'Saved to the ledger, but no SNS topic is wired yet (local mode).'
      );
      setForm({ subject: '', message: '' });
      await load();
    } catch (err) {
      flash(false, err.message);
    } finally {
      setBusy(false);
    }
  };

  const totalApps = drives.reduce((n, d) => n + (d._count?.applications || 0), 0);

  return (
    <div className="animate-lift space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] text-ink-faint">training and placement office</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-ink">Everything on One Sheet</h1>
          <p className="mono mt-1 text-xs text-ink-soft">Campus oversight, corporate notices, and broadcast communications</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/talent-pool" className="btn-form !px-3 !py-1.5 !text-xs font-semibold inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-overprint" /> Student Talent Pool
          </Link>
          <Link to="/analytics" className="btn-ink !px-3 !py-1.5 !text-xs font-semibold inline-flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-white" /> Placement Analytics
          </Link>
        </div>
      </div>

      {msg && (
        <p className={`border-2 px-4 py-3 text-sm ${msg.good ? 'border-ledger bg-ledger/5 text-ledger' : 'border-seal bg-seal/5 text-seal'}`} role="status">
          {msg.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="drives under supervision" value={drives.length} />
        <StatCard label="filings across them" value={totalApps} />
        <StatCard
          label="alert transport"
          value={transport === 'sns' ? 'SNS live' : 'ledger only'}
          sub={transport === 'sns' ? 'publishes to the real topic' : 'wire SNS_TOPIC_ARN in .env to publish'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* broadcast desk */}
        <div className="ticket bg-white">
          <div className="rule-double" />
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="font-display flex items-center gap-2 text-lg font-extrabold text-ink">
              <Megaphone className="h-5 w-5 text-ink" /> Broadcast desk
            </h2>
            <span className="mono flex items-center gap-1.5 text-[10px] text-ink-soft">
              <Radio className="h-3.5 w-3.5" /> {transport === 'sns' ? 'sns + in-app' : 'in-app only'}
            </span>
          </div>
          <form onSubmit={send} className="space-y-4 px-6 pb-6">
            <div>
              <label className="label">Subject line of the notice</label>
              <input
                className="field"
                required
                minLength={3}
                placeholder="Campus Drive: Amazon (demo) opens today"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notice body</label>
              <textarea
                className="field min-h-28"
                required
                minLength={3}
                placeholder="Who it is for, what to prepare, when doors close."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button className="btn-ink" disabled={busy}>
              <Send className="h-4 w-4" /> {busy ? 'Publishing…' : 'Publish to SNS'}
            </button>
          </form>
        </div>

        {/* audit ledger */}
        <div className="ticket bg-white">
          <div className="rule-double" />
          <h2 className="font-display px-6 py-4 text-lg font-extrabold text-ink">Transmission register</h2>
          <div className="max-h-96 space-y-2 overflow-y-auto px-6 pb-6">
            {(audit || []).length === 0 && (
              <p className="border-2 border-dashed border-ink/25 px-4 py-8 text-center text-sm text-ink-soft">
                The register is empty. Every publish lands here, with its SNS acknowledgement.
              </p>
            )}
            {(audit || []).map((n) => (
              <div key={n.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/15 py-2.5">
                <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{n.subject}</p>
                <span className={`stamp ${n.status === 'SENT' ? 'stamp-open' : n.status?.startsWith('FAILED') ? 'stamp-no' : 'stamp-gone'} !rotate-0 !text-[10px]`}>
                  {n.status}
                </span>
                <p className="mono w-full text-[10px] text-ink-faint">
                  {new Date(n.createdAt).toLocaleString('en-IN')}{n.messageId ? ` — SNS ${n.messageId.slice(0, 12)}…` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* drives oversight */}
      <div className="ticket bg-white">
        <div className="rule-double" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="mono px-5 py-3 text-[10px] font-semibold text-ink-faint">drive</th>
              <th className="mono px-4 py-3 text-[10px] font-semibold text-ink-faint">gate</th>
              <th className="mono px-4 py-3 text-right text-[10px] font-semibold text-ink-faint">filings</th>
              <th className="mono px-5 py-3 text-right text-[10px] font-semibold text-ink-faint">state</th>
            </tr>
          </thead>
          <tbody>
            {drives.map((d) => (
              <tr key={d.id} className="border-b border-ink/15 last:border-0">
                <td className="px-5 py-3">
                  <span className="font-semibold text-ink">{d.title}</span>
                  <span className="mono ml-2 text-[10px] text-ink-soft">{d.companyRef?.name}</span>
                </td>
                <td className="mono px-4 py-3 text-[11px] text-ink-soft">
                  {d.minCgpa ? `≥ ${d.minCgpa}` : 'any'} {d.branches?.length ? d.branches.join('/') : 'all'}
                </td>
                <td className="mono px-4 py-3 text-right font-semibold text-ink">{d._count?.applications ?? 0}</td>
                <td className="px-5 py-3 text-right">
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
