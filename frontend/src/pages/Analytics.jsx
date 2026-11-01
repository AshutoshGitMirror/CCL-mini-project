import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Users, Briefcase, Zap, Printer } from 'lucide-react';
import { api } from '../api.js';
import StatCard from '../components/StatCard.jsx';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/analytics')
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="mono text-sm text-ink-soft py-12 text-center">generating campus placement intelligence ledger…</p>;
  }

  if (error || !data) {
    return (
      <div className="border-2 border-seal bg-seal/5 p-4 text-seal text-sm">
        Failed to load analytics: {error || 'No data'}
      </div>
    );
  }

  const { overview, branchWise, topSkills, companyHiring } = data;

  return (
    <div className="animate-lift space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] text-ink-faint">training and placement cell intelligence</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-ink">
            Placement Analytics & Metrics
          </h1>
          <p className="mono mt-1 text-xs text-ink-soft">
            Live cohort indicators · Amazon RDS ACID Ledger · Academic Batch 2026
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-form !text-xs inline-flex items-center gap-1.5 print:hidden"
        >
          <Printer className="h-3.5 w-3.5" /> Print Intelligence Sheet
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Placement Rate"
          value={`${overview.placementRate}%`}
          sub={`${overview.placedCount} of ${overview.totalStudents} placed`}
        />
        <StatCard
          label="Highest CTC Offered"
          value={overview.highestPackage}
          sub="Microsoft India / AWS"
        />
        <StatCard
          label="Average CTC (Cohort)"
          value={overview.averagePackage}
          sub="Across all offers"
        />
        <StatCard
          label="Total Corporate Drives"
          value={overview.totalDrives}
          sub={`${overview.openDrives} open now`}
        />
      </div>

      {/* Branch-wise Placement Statistics */}
      <section className="space-y-4">
        <div className="rule-double" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-ink flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-ledger" /> Branch-wise Placement Distribution
          </h2>
          <span className="mono text-[11px] text-ink-faint">real-time conversion ledger</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchWise.map((b) => (
            <div key={b.branch} className="ticket bg-white p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display font-extrabold text-ink text-lg">{b.branch}</span>
                <span className="mono text-xs font-bold text-ledger">{b.rate}% Placed</span>
              </div>
              <div className="h-3 w-full bg-fold border border-ink overflow-hidden">
                <div
                  className="h-full bg-ledger transition-all duration-500"
                  style={{ width: `${b.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-ink-soft mono">
                <span>{b.placed} placed</span>
                <span>{b.total} students</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* In-Demand Skills & Top Recruiters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most in-demand skills */}
        <div className="ticket bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/15 pb-3">
            <h3 className="font-display font-bold text-ink text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-overprint" /> Top Corporate Skills in Demand
            </h3>
            <span className="mono text-[10px] text-ink-faint">drive criteria frequency</span>
          </div>

          <div className="space-y-3">
            {topSkills.map((s, idx) => {
              const maxCount = Math.max(...topSkills.map((x) => x.count), 1);
              const pct = Math.round((s.count / maxCount) * 100);
              return (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="mono uppercase text-ink">
                      #{idx + 1} {s.name}
                    </span>
                    <span className="mono text-ink-soft">{s.count} drives</span>
                  </div>
                  <div className="h-2 w-full bg-fold border border-ink/40 overflow-hidden">
                    <div
                      className="h-full bg-overprint transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corporate Hiring Table */}
        <div className="ticket bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/15 pb-3">
            <h3 className="font-display font-bold text-ink text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-ink" /> Corporate Partners & Packages
            </h3>
            <span className="mono text-[10px] text-ink-faint">{companyHiring.length} active drives</span>
          </div>

          <div className="space-y-2.5 overflow-x-auto">
            {companyHiring.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border-b border-ink/10 pb-2 text-sm"
              >
                <div>
                  <span className="font-bold text-ink">{c.company}</span>
                  <p className="mono text-[11px] text-ink-soft">{c.role}</p>
                </div>
                <div className="text-right">
                  <span className="mono font-bold text-ledger text-xs">{c.package}</span>
                  <p className="mono text-[10px] text-ink-faint">{c.applicationsCount} filings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
