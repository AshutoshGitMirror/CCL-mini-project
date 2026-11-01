import { X, CheckCircle2, AlertTriangle, Sparkles, BookOpen, Target, Check } from 'lucide-react';

export default function SkillGapAdvisorModal({ open, onClose, drive, profile, userSkills = [] }) {
  if (!open || !drive) return null;

  const p = profile || {};
  const mySkills = Array.from(
    new Set([...(userSkills || []), ...(p.skills || []), ...(p.resume?.extractedSkills || [])])
  ).map((s) => s.toLowerCase());

  const driveSkills = (drive.skills || []).map((s) => s.toLowerCase());
  const matched = driveSkills.filter((s) => mySkills.includes(s));
  const missing = driveSkills.filter((s) => !mySkills.includes(s));

  // Eligibility checks
  const cgpaPass = p.cgpa == null ? false : drive.minCgpa == null || p.cgpa >= drive.minCgpa;
  const branchPass =
    !drive.branches?.length || (p.branch && drive.branches.includes(p.branch));
  const skillsPass =
    !driveSkills.length || matched.length >= (drive.minSkills || 1);

  const overallPass = cgpaPass && branchPass && skillsPass;

  // Score computation
  const skillRatio = driveSkills.length ? matched.length / driveSkills.length : 1;
  const cgpaPart = p.cgpa != null ? Math.round(Math.min(1, p.cgpa / 10) * 40) : 0;
  const skillPart = Math.round(skillRatio * 60);
  const matchScore = Math.round(cgpaPart + skillPart);

  // Prep guidance tips based on missing skills or role
  const getPrepTips = () => {
    const tips = [];
    if (missing.includes('aws')) {
      tips.push('Review AWS Core Services: VPC peering, EC2 instance types, IAM policies, and S3 lifecycle rules.');
    }
    if (missing.includes('docker') || missing.includes('kubernetes')) {
      tips.push('Practice container basics: Dockerfile optimization, multi-stage builds, and Pod networking.');
    }
    if (missing.includes('python')) {
      tips.push('Brush up Python memory management, list comprehensions, decorators, and basic pytest scripting.');
    }
    if (missing.includes('sql')) {
      tips.push('Review SQL Joins, Indexing strategies (B-Tree), ACID properties, and window functions (ROW_NUMBER/RANK).');
    }
    if (missing.includes('react')) {
      tips.push('Brush up React Hooks (useCallback, useMemo, custom hooks), component lifecycle, and state lifting.');
    }
    if (missing.includes('dsa') || missing.includes('c++')) {
      tips.push('Revise LeetCode medium topics: Dynamic Programming, Graph BFS/DFS, Trees, and Two-pointer problems.');
    }
    if (tips.length === 0) {
      tips.push('Your skills match all listed criteria! Focus on System Design patterns and behavioural STAR interview stories.');
      tips.push('Review your resume projects and be ready to explain architectural trade-offs you made.');
    }
    return tips;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl bg-white border-4 border-ink shadow-[8px_8px_0_0_#17233B] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-overprint" />
            <div>
              <h2 className="font-display font-extrabold text-ink text-lg leading-tight">
                ATS Match & Skill Gap Advisor
              </h2>
              <p className="mono text-[11px] text-ink-soft">
                {drive.companyRef?.name || 'Recruiter'} · {drive.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-fold text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Score & Verdict Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center border-2 border-ink p-5 bg-paper/40">
            <div className="text-center p-3 border-2 border-ink bg-white min-w-[120px]">
              <span className="mono text-[10px] uppercase font-bold text-ink-faint block">
                ATS Fit Score
              </span>
              <span className="font-display font-black text-4xl text-ink">
                {matchScore}
                <span className="text-lg text-ink-faint font-normal">/100</span>
              </span>
              <div className="mt-1">
                {overallPass ? (
                  <span className="stamp stamp-open !text-[9px]">Eligible to Apply</span>
                ) : (
                  <span className="stamp stamp-no !text-[9px]">Criteria Gap</span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h4 className="font-display font-bold text-ink">Eligibility Checklist:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className={`p-2 border ${cgpaPass ? 'border-ledger bg-ledger/10 text-ledger' : 'border-seal bg-seal/10 text-seal'}`}>
                  <span className="font-bold block">CGPA Gate</span>
                  <span>{drive.minCgpa ? `Req >= ${drive.minCgpa}` : 'Any'} (You: {p.cgpa ?? 'None'})</span>
                </div>
                <div className={`p-2 border ${branchPass ? 'border-ledger bg-ledger/10 text-ledger' : 'border-seal bg-seal/10 text-seal'}`}>
                  <span className="font-bold block">Branch Gate</span>
                  <span>{drive.branches?.length ? drive.branches.join(', ') : 'All Branches'}</span>
                </div>
                <div className={`p-2 border ${skillsPass ? 'border-ledger bg-ledger/10 text-ledger' : 'border-seal bg-seal/10 text-seal'}`}>
                  <span className="font-bold block">Skill Match</span>
                  <span>{matched.length} of {drive.minSkills || 1} required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score breakdown metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-ink p-3 bg-white">
              <div className="flex justify-between items-baseline mb-1">
                <span className="mono text-[11px] font-bold text-ink uppercase">Academic Weight (CGPA)</span>
                <span className="mono text-xs font-bold text-overprint">{cgpaPart} / 40 pts</span>
              </div>
              <div className="h-2.5 w-full bg-fold border border-ink overflow-hidden">
                <div className="h-full bg-overprint transition-all" style={{ width: `${(cgpaPart / 40) * 100}%` }}></div>
              </div>
              <p className="mono text-[10px] text-ink-faint mt-1">40% allocated based on cumulative grade point average</p>
            </div>

            <div className="border-2 border-ink p-3 bg-white">
              <div className="flex justify-between items-baseline mb-1">
                <span className="mono text-[11px] font-bold text-ink uppercase">Skill Overlap Weight</span>
                <span className="mono text-xs font-bold text-ledger">{skillPart} / 60 pts</span>
              </div>
              <div className="h-2.5 w-full bg-fold border border-ink overflow-hidden">
                <div className="h-full bg-ledger transition-all" style={{ width: `${(skillPart / 60) * 100}%` }}></div>
              </div>
              <p className="mono text-[10px] text-ink-faint mt-1">60% based on extracted resume & verified candidate skills</p>
            </div>
          </div>

          {/* Skill Breakdown */}
          <div className="border-2 border-ink p-4 bg-white space-y-4">
            <div>
              <span className="mono text-[11px] uppercase font-bold text-ledger flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-4 w-4" /> Matched Skills ({matched.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {matched.length === 0 ? (
                  <span className="text-xs text-ink-faint italic">No matching skills detected in your profile yet.</span>
                ) : (
                  matched.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 border-2 border-ledger bg-ledger/10 px-2.5 py-1 text-xs font-semibold text-ledger">
                      <Check className="h-3.5 w-3.5" /> {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            {missing.length > 0 && (
              <div className="border-t border-ink/15 pt-3">
                <span className="mono text-[11px] uppercase font-bold text-seal flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Recommended Skills to Learn ({missing.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {missing.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 border-2 border-seal/40 bg-seal/5 px-2.5 py-1 text-xs font-semibold text-seal">
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Targeted Interview Readiness Advice */}
          <div className="border-2 border-ink p-4 bg-paper/60 space-y-2">
            <span className="mono text-[11px] uppercase font-bold text-ink flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-overprint" /> Recommended Interview Preparation Focus
            </span>
            <ul className="space-y-1.5 text-xs text-ink-soft">
              {getPrepTips().map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Target className="h-3.5 w-3.5 text-overprint shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-ink bg-paper p-4 text-right">
          <button onClick={onClose} className="btn-ink">
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
