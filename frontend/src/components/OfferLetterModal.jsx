import { Printer, X, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import Avatar from './Avatar.jsx';

export default function OfferLetterModal({ open, onClose, application, profile, studentUser }) {
  if (!open || !application) return null;

  const drive = application.drive || {};
  const company = drive.companyRef?.name || 'Partner Company';
  const user = studentUser || application.user || {};
  const p = profile || user.profile || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm print:p-0 print:bg-white"
    >
      <div className="relative w-full max-w-2xl bg-white border-4 border-ink shadow-[8px_8px_0_0_#17233B] print:border-2 print:shadow-none max-h-[92vh] overflow-y-auto">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-2.5 print:hidden">
          <span className="mono text-[11px] font-semibold text-ink flex items-center gap-1.5">
            <Award className="h-4 w-4 text-ledger" /> Campus Placement Letter of Intent (LOI)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-ink !px-3 !py-1 !text-xs inline-flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Download / Print Letter
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-fold text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Certificate / Letter Body */}
        <div className="p-8 sm:p-10 space-y-6 bg-white font-sans border-8 border-fold m-2 print:border-none print:m-0">
          {/* Header */}
          <div className="border-b-2 border-ink pb-4 text-center">
            <div className="inline-flex items-center gap-1.5 border border-ledger bg-ledger/10 px-3 py-1 text-ledger mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="mono text-[10px] font-bold uppercase tracking-wider">
                Official Placement Selection & Offer of Intent
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink uppercase tracking-tight">
              Letter of Selection
            </h1>
            <p className="mono text-xs text-ink-soft mt-1">
              Ref: PH-LOI-{application.id?.slice(-8).toUpperCase()} · Academic Batch 2026
            </p>
          </div>

          {/* Recipient Details */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/20 pb-4">
            <div className="flex items-center gap-4">
              <Avatar src={p.avatarUrl} name={user.name} size="lg" />
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint">Candidate</span>
                <h3 className="font-display font-extrabold text-ink text-xl">{user.name}</h3>
                <p className="mono text-xs text-ink-soft">
                  USN: <span className="font-bold text-ink">{p.usn || 'N/A'}</span> · {p.branch || 'Engineering'} · {p.college || 'Campus'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="mono text-[10px] uppercase text-ink-faint">Issued on</span>
              <p className="mono text-xs font-semibold text-ink">
                {new Date(application.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Offer Particulars */}
          <div className="space-y-4 text-sm text-ink leading-relaxed">
            <p>
              Dear <strong className="font-semibold">{user.name}</strong>,
            </p>
            <p>
              On behalf of <strong className="font-extrabold text-overprint">{company}</strong> in collaboration with the Central Training and Placement Cell, we take immense pleasure in informing you that you have been selected in the Campus Recruitment Drive 2026.
            </p>

            <div className="grid grid-cols-2 gap-4 border-2 border-ink p-4 bg-paper/60 my-4">
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Designation / Role</span>
                <span className="font-display font-bold text-ink text-lg">{drive.role || 'Software Development Engineer'}</span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Annual Compensation (CTC)</span>
                <span className="font-display font-black text-ledger text-2xl">{drive.package || 'Competitive CTC'}</span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Job Type & Cadre</span>
                <span className="font-semibold text-ink text-xs">{drive.jobType || 'Full-time Graduate Hire'}</span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Work Location</span>
                <span className="font-semibold text-ink text-xs">{drive.location || 'India (Hybrid)'}</span>
              </div>
            </div>

            <p className="text-xs text-ink-soft">
              This Letter of Intent serves as formal confirmation of your selection. A formal offer letter with compensation break-up, joining formalities, and pre-onboarding technical modules will be dispatched to your registered email address ({user.email}).
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="flex flex-wrap items-end justify-between border-t-2 border-ink pt-6 gap-6">
            <div className="space-y-1">
              <div className="h-10 border-b border-ink/40 w-44 flex items-end">
                <span className="font-serif italic text-ink font-bold text-lg">Rekha Menon</span>
              </div>
              <p className="font-bold text-xs text-ink">Dr. Rekha Menon</p>
              <p className="mono text-[10px] text-ink-faint">Head, Training & Placement Office</p>
            </div>

            <div className="flex items-center gap-2 border-2 border-ledger px-4 py-2 bg-ledger/5">
              <ShieldCheck className="h-6 w-6 text-ledger" />
              <div className="text-left">
                <p className="mono text-[9px] font-black uppercase text-ledger">TPO PLACEMENT VERIFIED</p>
                <p className="mono text-[8px] text-ink-faint">ACADEMIC YEAR 2025-2026</p>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div className="h-10 border-b border-ink/40 w-44 flex items-end justify-end">
                <span className="font-serif italic text-ink font-bold text-lg">{company} HR</span>
              </div>
              <p className="font-bold text-xs text-ink">{company} Talent Acquisition</p>
              <p className="mono text-[10px] text-ink-faint">University Relations Group</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
