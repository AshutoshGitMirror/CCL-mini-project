import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';

const DEMO = [
  { role: 'Student', email: 'adi@cse.edu', password: 'student123' },
  { role: 'Recruiter', email: 'recruiter@infosysdemo.com', password: 'recruiter123' },
  { role: 'TPO office', email: 'officer@placementhub.edu', password: 'officer123' },
];

export default function Login() {
  const { login, authConfig } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const doLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(homeFor(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-lift mx-auto mt-4 max-w-md">
      <form onSubmit={doLogin} className="ticket bg-white">
        <div className="flex items-center justify-between px-7 pt-6">
          <p className="font-display text-xl font-extrabold text-ink">Office of the TPO</p>
          <p className="mono border-2 border-ink px-2 py-0.5 text-[10px] font-semibold">FORM PGH-01</p>
        </div>
        <div className="px-7 pb-7 pt-5">
          <p className="text-sm text-ink-soft">Enter your particulars to receive your hall ticket.</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="mono rounded border border-ink/20 bg-sand/60 px-2 py-0.5 text-[10px] text-ink-soft">
              Auth Provider: {authConfig?.authMode === 'cognito' ? 'Amazon Cognito (Cloud Native)' : 'JWT + bcrypt (Local)'}
            </span>
          </div>

          {error && (
            <p className="mt-4 border-2 border-seal bg-seal/5 px-4 py-3 text-sm text-seal" role="alert">
              {error}
            </p>
          )}

          <div className="mt-7 space-y-5">
            <div>
              <label className="label" htmlFor="email">Email id</label>
              <input id="email" type="email" required autoComplete="email" className="field"
                placeholder="you@campus.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password" className="field"
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button className="btn-ink mt-8 w-full" disabled={busy}>
            {busy ? 'Checking…' : 'Sign in'}
          </button>

          <p className="mt-5 text-center text-sm text-ink-soft">
            New candidate? <Link to="/register" className="font-semibold text-overprint underline underline-offset-4">Register first</Link>
          </p>
        </div>
      </form>

      <div className="ticket mt-4 bg-white p-5">
        <p className="mono text-[11px] text-ink-faint">demo desks — click to prefill</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DEMO.map((d) => (
            <button key={d.role} type="button" className="btn-form !justify-start flex-col items-start !gap-0 px-4"
              onClick={() => { setEmail(d.email); setPassword(d.password); }}>
              <span className="font-semibold">{d.role}</span>
              <span className="mono text-[10px] text-ink-faint">{d.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
