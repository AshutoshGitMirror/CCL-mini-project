import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth, homeFor } from '../auth.jsx';

const NAV = {
  STUDENT: [{ to: '/student', label: 'My hall ticket' }],
  RECRUITER: [{ to: '/recruiter', label: 'Drive console' }],
  OFFICER: [
    { to: '/recruiter', label: 'Drives' },
    { to: '/officer', label: 'TPO office' },
  ],
};

const ROLE_TINT = { STUDENT: 'text-overprint', RECRUITER: 'text-ledger', OFFICER: 'text-ink' };

export default function Layout({ children }) {
  const { isAuthed, user, logout } = useAuth();
  const navigate = useNavigate();
  const links = isAuthed && user ? NAV[user.role] ?? [] : [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-extrabold tracking-tight text-ink">
              Placement<span className="text-overprint">Hub</span>
            </span>
            <span className="mono hidden text-[10px] text-ink-faint sm:inline">est. roll 10638</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {links.map(({ to, label }) => (
              <NavLink
                key={to + label}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm transition ${
                    isActive
                      ? 'font-semibold text-ink underline decoration-overprint decoration-[3px] underline-offset-[6px]'
                      : 'text-ink-soft hover:text-ink'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {isAuthed ? (
              <>
                <Link
                  to={homeFor(user.role)}
                  title="Alerts"
                  className="relative grid h-9 w-9 place-items-center border-2 border-ink bg-white transition hover:bg-fold"
                >
                  <Bell className="h-4 w-4 text-ink" />
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 bg-seal" />
                </Link>
                <div className="flex items-center gap-2.5 border-2 border-ink bg-white px-2.5 py-1.5">
                  {/* ID-card photo box */}
                  <span className={`grid h-7 w-7 place-items-center border border-ink text-[11px] font-bold ${ROLE_TINT[user.role]}`}>
                    {user.name?.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden text-sm leading-tight sm:block">
                    <span className="block font-semibold text-ink">{user.name}</span>
                    <span className="mono block text-[10px] text-ink-faint">{user.role.toLowerCase()}</span>
                  </span>
                </div>
                <button className="btn-form" onClick={() => { logout(); navigate('/'); }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-form">Sign in</Link>
                <Link to="/register" className="btn-ink">Get your hall ticket</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">{children}</main>

      <footer className="border-t-2 border-ink bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
          <p className="mono text-[11px] text-ink-faint">PlacementHub · complete campus placement system · seeded in us-east-1</p>
          <p className="mono text-[11px] text-ink-faint">EC2 · RDS · S3 · Textract · SNS · CloudWatch · Terraform</p>
        </div>
      </footer>
    </div>
  );
}
