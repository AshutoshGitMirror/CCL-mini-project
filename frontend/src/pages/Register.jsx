import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';

const ROLES = [
  { id: 'STUDENT', blurb: 'profile, resume, apply to drives' },
  { id: 'RECRUITER', blurb: 'post drives, review ranked applicants' },
  { id: 'OFFICER', blurb: 'oversee all drives, publish alerts' },
];

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'STUDENT',
    cgpa: '', branch: '', graduationYear: '2026', emailOptIn: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: v });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password, role: form.role, emailOptIn: form.emailOptIn,
      };
      if (form.role === 'STUDENT') {
        if (form.cgpa) payload.cgpa = form.cgpa;
        if (form.branch) payload.branch = form.branch;
        if (form.graduationYear) payload.graduationYear = form.graduationYear;
      }
      const user = await register(payload);
      navigate(homeFor(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-lift mx-auto mt-4 max-w-2xl">
      <form onSubmit={submit} className="ticket bg-white">
        <div className="flex items-center justify-between px-8 pt-7">
          <p className="font-display text-xl font-extrabold text-ink">Application for placement</p>
          <p className="mono border-2 border-ink px-2 py-0.5 text-[10px] font-semibold">PGH/REG/2026</p>
        </div>
        <div className="px-8 pb-8 pt-5">
          <p className="text-sm text-ink-soft">Particulars filled here become your hall ticket. Get them right the first time.</p>

          {error && (
            <p className="mt-4 border-2 border-seal bg-seal/5 px-4 py-3 text-sm text-seal" role="alert">{error}</p>
          )}

          {/* role */}
          <div className="mt-7">
            <p className="mono mb-2 text-[11px] text-ink-faint">i apply as</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ROLES.map((r) => (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-start gap-3 border-2 px-4 py-3 transition ${
                    form.role === r.id ? 'border-ink bg-fold' : 'border-ink/30 hover:border-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    className="box mt-0.5"
                    checked={form.role === r.id}
                    onChange={() => setForm({ ...form, role: r.id })}
                  />
                  <span>
                    <span className="block font-semibold text-ink">{r.id === 'OFFICER' ? 'TPO office' : r.id.charAt(0) + r.id.slice(1).toLowerCase()}</span>
                    <span className="block text-[11px] leading-snug text-ink-soft">{r.blurb}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* identity */}
          <div className="rule-1px my-6" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reg-name">Full name</label>
              <input id="reg-name" className="field" required minLength={2} value={form.name} onChange={set('name')} placeholder="Aditi Sharma" />
            </div>
            <div>
              <label className="label" htmlFor="reg-email">Email id</label>
              <input id="reg-email" type="email" required className="field" value={form.email} onChange={set('email')} placeholder="you@campus.edu" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="reg-pw">Password — minimum eight characters</label>
              <input id="reg-pw" type="password" required minLength={8} className="field" value={form.password} onChange={set('password')} />
            </div>
          </div>

          {form.role === 'STUDENT' && (
            <>
              <div className="rule-1px my-6" />
              <div className="grid gap-5 rounded-none border-2 border-ink/20 bg-paper p-5 sm:grid-cols-3">
                <div>
                  <label className="label" htmlFor="reg-cgpa">CGPA (out of 10)</label>
                  <input id="reg-cgpa" type="number" step="0.01" min="0" max="10" className="field" value={form.cgpa} onChange={set('cgpa')} placeholder="8.75" />
                </div>
                <div>
                  <label className="label" htmlFor="reg-branch">Branch</label>
                  <select id="reg-branch" className="field" value={form.branch} onChange={set('branch')}>
                    <option value="">not chosen</option>
                    {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="reg-year">Graduation year</label>
                  <input id="reg-year" type="number" className="field" value={form.graduationYear} onChange={set('graduationYear')} />
                </div>
                <label className="flex items-center gap-3 sm:col-span-3">
                  <input type="checkbox" className="box" checked={form.emailOptIn} onChange={set('emailOptIn')} />
                  <span className="text-[13px] text-ink-soft">Send me drive alerts when a company publishes</span>
                </label>
              </div>
            </>
          )}

          <div className="mt-8 flex items-center gap-3">
            <button className="btn-ink flex-1" disabled={busy}>{busy ? 'Filing…' : 'File application'}</button>
            <Link to="/" className="btn-form">Cancel</Link>
          </div>

          <p className="mt-5 text-center text-sm text-ink-soft">
            Already filed? <Link to="/login" className="font-semibold text-overprint underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
