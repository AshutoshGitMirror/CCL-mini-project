import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Briefcase, GraduationCap, ExternalLink, Mail, Phone, Award, UserCheck, X } from 'lucide-react';
import { api } from '../api.js';
import Avatar from '../components/Avatar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';

const BRANCH_OPTIONS = ['ALL', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'AIML'];
const CGPA_OPTIONS = [
  { label: 'Any CGPA', value: '' },
  { label: '>= 7.5 CGPA', value: '7.5' },
  { label: '>= 8.0 CGPA', value: '8.0' },
  { label: '>= 8.5 CGPA', value: '8.5' },
  { label: '>= 9.0 CGPA', value: '9.0' },
];
const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Offered (Placed)', value: 'OFFERED' },
  { label: 'In Interview Rounds', value: 'IN_PROCESS' },
  { label: 'Available / Unplaced', value: 'AVAILABLE' },
];

export default function TalentPool() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('ALL');
  const [minCgpa, setMinCgpa] = useState('');
  const [status, setStatus] = useState('ALL');

  // Selected student for detail modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (branch !== 'ALL') params.append('branch', branch);
      if (minCgpa) params.append('minCgpa', minCgpa);
      if (status !== 'ALL') params.append('status', status);

      const res = await api(`/profile/students?${params.toString()}`);
      setStudents(res.students || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, branch, minCgpa, status]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const stats = useMemo(() => {
    const total = students.length;
    const placed = students.filter((s) => s.placementStatus === 'OFFERED').length;
    const inProcess = students.filter((s) => s.placementStatus === 'ROUND_IN_PROGRESS').length;
    return { total, placed, inProcess };
  }, [students]);

  return (
    <div className="animate-lift space-y-8">
      {/* Page Title */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] text-ink-faint">recruitment talent discovery</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-ink">
            Student Talent Directory
          </h1>
          <p className="mono mt-1 text-xs text-ink-soft">
            Explore verified candidate profiles, portfolios, and academic standing across campus
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="candidates indexed" value={stats.total} sub="active cohort" />
        <StatCard label="offers secured" value={stats.placed} sub="placed students" />
        <StatCard label="in recruitment rounds" value={stats.inProcess} sub="active evaluations" />
      </div>

      {/* Filter and Search Bar */}
      <div className="ticket bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-ink/15 pb-3">
          <span className="mono text-xs font-bold text-ink flex items-center gap-1.5 uppercase">
            <Filter className="h-4 w-4" /> Filter Candidate Roster
          </span>
          <button
            onClick={() => {
              setSearch('');
              setBranch('ALL');
              setMinCgpa('');
              setStatus('ALL');
            }}
            className="mono text-[11px] text-overprint underline hover:text-ink"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Search Student / Skill / USN</label>
            <div className="relative">
              <input
                type="text"
                className="field pl-6"
                placeholder="e.g. Aditi, AWS, 1RV22CS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-0 bottom-2 h-4 w-4 text-ink-faint" />
            </div>
          </div>

          <div>
            <label className="label">Engineering Branch</label>
            <select
              className="field cursor-pointer"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b === 'ALL' ? 'All Engineering Branches' : b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Minimum CGPA</label>
            <select
              className="field cursor-pointer"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
            >
              {CGPA_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Placement Status</label>
            <select
              className="field cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      {loading ? (
        <p className="mono text-sm text-ink-soft py-12 text-center">loading student ledger…</p>
      ) : error ? (
        <p className="border-2 border-seal bg-seal/5 p-4 text-seal text-sm">{error}</p>
      ) : students.length === 0 ? (
        <div className="border-2 border-dashed border-ink/25 p-12 text-center bg-white space-y-2">
          <p className="font-display font-bold text-ink">No candidates match your current filter.</p>
          <p className="mono text-xs text-ink-soft">Try broadening your search or resetting filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((s) => {
            const p = s.profile || {};
            return (
              <div
                key={s.id}
                className="ticket bg-white p-5 flex flex-col justify-between hover:border-overprint transition-colors"
              >
                <div>
                  {/* Top card row: Avatar & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={p.avatarUrl}
                        name={s.name}
                        size="lg"
                        className="shadow-[2px_2px_0_0_#17233B]"
                      />
                      <div>
                        <h3 className="font-display font-bold text-ink text-base leading-tight">
                          {s.name}
                        </h3>
                        <p className="mono text-[11px] text-ink-soft">{p.college || 'Engineering College'}</p>
                        <span className="mono text-[10px] font-semibold text-overprint">
                          USN: {p.usn || '1BM22CS---'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges: Branch & CGPA */}
                  <div className="flex items-center gap-2 mt-3 mb-2">
                    <span className="mono text-[10px] font-bold border border-ink px-2 py-0.5 bg-paper">
                      {p.branch || 'CSE'}
                    </span>
                    <span className="mono text-[10px] font-bold border border-ink px-2 py-0.5 bg-fold text-ledger">
                      CGPA {p.cgpa ?? '8.0'}
                    </span>
                    {s.placementStatus === 'OFFERED' ? (
                      <span className="stamp stamp-offer !text-[9px]">Offered</span>
                    ) : s.placementStatus === 'ROUND_IN_PROGRESS' ? (
                      <span className="stamp stamp-round !text-[9px]">In Rounds</span>
                    ) : (
                      <span className="stamp stamp-ink !text-[9px]">Available</span>
                    )}
                  </div>

                  {/* Offered company badge if placed */}
                  {s.offeredCompany && (
                    <div className="mb-2 p-1.5 border border-ledger bg-ledger/5 text-ledger text-[11px] flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> {s.offeredCompany}
                      </span>
                      <span className="mono font-bold">{s.offeredPackage}</span>
                    </div>
                  )}

                  {/* Bio */}
                  {p.bio && (
                    <p className="text-xs text-ink-soft line-clamp-2 my-2 italic">
                      "{p.bio}"
                    </p>
                  )}

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(p.skills || []).slice(0, 5).map((sk) => (
                      <span
                        key={sk}
                        className="mono text-[10px] border border-ink/25 px-1.5 py-0.5 bg-paper/60 text-ink"
                      >
                        {sk}
                      </span>
                    ))}
                    {(p.skills || []).length > 5 && (
                      <span className="mono text-[9px] text-ink-faint self-center">
                        +{p.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Links & Actions */}
                <div className="border-t border-ink/15 pt-3 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.linkedinUrl && (
                      <a
                        href={p.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="LinkedIn Profile"
                        className="text-ink-soft hover:text-overprint"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="GitHub Profile"
                        className="mono text-[11px] text-ink-soft hover:text-ink font-bold"
                      >
                        GH
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedStudent(s)}
                    className="btn-form !px-2.5 !py-1 !text-xs font-semibold"
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Dossier Modal */}
      {selectedStudent && (
        <StudentDossierModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

function StudentDossierModal({ student, onClose }) {
  const p = student.profile || {};
  const [fullDetail, setFullDetail] = useState(null);

  useEffect(() => {
    api(`/profile/students/${student.id}`)
      .then((res) => setFullDetail(res.student))
      .catch(() => null);
  }, [student.id]);

  const apps = fullDetail?.applications || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl bg-white border-4 border-ink shadow-[8px_8px_0_0_#17233B] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-6 py-4">
          <span className="mono text-xs font-bold text-ink uppercase">
            Candidate Official Dossier
          </span>
          <button onClick={onClose} className="p-1 hover:bg-fold text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Card */}
          <div className="flex flex-wrap items-center gap-5 border-2 border-ink p-4 bg-paper/40">
            <Avatar src={p.avatarUrl} name={student.name} size="xl" />
            <div className="space-y-1">
              <h2 className="font-display font-extrabold text-2xl text-ink leading-tight">
                {student.name}
              </h2>
              <p className="mono text-xs text-ink-soft">
                {p.college || 'Engineering College'} · USN: <strong className="text-overprint">{p.usn || 'N/A'}</strong>
              </p>
              <p className="mono text-xs text-ink-soft">
                {p.branch || 'Branch'} · Class of {p.graduationYear || '2026'} · CGPA <strong className="text-ledger">{p.cgpa ?? 'N/A'}</strong>
              </p>
              <div className="flex items-center gap-4 text-xs text-ink-soft pt-1">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {student.email}</span>
                {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>}
              </div>
            </div>
          </div>

          {/* Bio */}
          {p.bio && (
            <div className="border-2 border-ink p-4 bg-white">
              <span className="mono text-[10px] uppercase font-bold text-ink-faint block mb-1">Professional Bio</span>
              <p className="text-sm text-ink leading-relaxed">{p.bio}</p>
            </div>
          )}

          {/* Skills */}
          <div className="border-2 border-ink p-4 bg-white">
            <span className="mono text-[10px] uppercase font-bold text-ink-faint block mb-2">Verified Skill Stack</span>
            <div className="flex flex-wrap gap-1.5">
              {(p.skills || []).map((sk) => (
                <span key={sk} className="mono text-xs font-semibold border-2 border-ink px-2 py-0.5 bg-paper">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Placement Drive Filings */}
          <div className="border-2 border-ink p-4 bg-white space-y-3">
            <span className="mono text-[10px] uppercase font-bold text-ink-faint block">
              Placement Drive Applications & Evaluation Progress ({apps.length})
            </span>
            {apps.length === 0 ? (
              <p className="mono text-xs text-ink-soft">No applications recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {apps.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border border-ink/20 p-2.5 bg-paper/30">
                    <div>
                      <p className="font-semibold text-sm text-ink">{a.drive?.companyRef?.name}: {a.drive?.title}</p>
                      <p className="mono text-[11px] text-ink-soft">
                        Match Score: {a.matchScore}% · Rounds: {a.rounds?.length || 0}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t-2 border-ink bg-paper p-4 text-right">
          <button onClick={onClose} className="btn-ink">
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
