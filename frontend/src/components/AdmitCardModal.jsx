import { Printer, X, QrCode, ShieldCheck } from 'lucide-react';
import Avatar from './Avatar.jsx';

export default function AdmitCardModal({ open, onClose, application, profile, studentUser }) {
  if (!open || !application) return null;

  const drive = application.drive || {};
  const company = drive.companyRef?.name || 'Recruiter Partner';
  const roundNum = application.currentRound || 1;
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
          <span className="mono text-[11px] font-semibold text-ink">
            Official Admit Card / Hall Ticket
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-ink !px-3 !py-1 !text-xs inline-flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print Admit Card
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

        {/* The Hall Ticket Paper Body */}
        <div className="p-6 sm:p-8 space-y-6 bg-white font-sans">
          {/* Header */}
          <div className="border-b-2 border-ink pb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-overprint"></span>
              <p className="mono text-[11px] tracking-wider uppercase text-ink-faint">
                Central Training & Placement Cell · University Campus 2026
              </p>
              <span className="h-2 w-2 rounded-full bg-overprint"></span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-tight">
              Placement Hall Ticket & Gate Pass
            </h1>
            <p className="mono text-xs text-ink-soft mt-1">
              Document Ref: PH-ADMIT-{application.id?.slice(-8).toUpperCase()} · Status: <span className="text-ledger font-bold">VERIFIED</span>
            </p>
          </div>

          {/* Candidate Identification Section */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-start border-2 border-ink p-4 bg-paper/40">
            <div className="flex flex-col items-center">
              <Avatar
                src={p.avatarUrl}
                name={user.name}
                size="xl"
                className="shadow-[3px_3px_0_0_#17233B]"
              />
              <span className="mono text-[9px] uppercase tracking-wider text-ink-faint mt-1.5">
                Candidate Photo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Candidate Name</span>
                <span className="font-bold text-ink text-base">{user.name || 'Aditi Sharma'}</span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">University Seat No (USN)</span>
                <span className="mono font-bold text-overprint text-sm">{p.usn || '1BM22CS001'}</span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">College / Institute</span>
                <span className="font-semibold text-ink text-xs">{p.college || 'Engineering & Technology Campus'}</span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Branch & CGPA</span>
                <span className="font-semibold text-ink text-xs">
                  {p.branch || 'CSE'} — CGPA {p.cgpa ?? '8.5'}
                </span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Email Address</span>
                <span className="mono text-xs text-ink-soft truncate block">{user.email}</span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Contact Number</span>
                <span className="mono text-xs text-ink-soft">{p.phone || '+91 98450 12345'}</span>
              </div>
            </div>
          </div>

          {/* Drive & Schedule Details */}
          <div className="border-2 border-ink p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between border-b border-ink/20 pb-2">
              <span className="mono text-[11px] font-bold text-ink uppercase">
                Recruitment Drive Particulars
              </span>
              <span className="stamp stamp-round">
                Round {roundNum} of {drive.roundsTotal || 3}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Hiring Company</span>
                <span className="font-extrabold text-ink text-lg">{company}</span>
                <p className="text-xs text-ink-soft">{drive.title}</p>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Designation / CTC</span>
                <span className="font-bold text-ledger text-base">{drive.role || 'Software Engineer'}</span>
                <p className="mono text-xs font-semibold text-ink">{drive.package || 'Competitive CTC'}</p>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Reporting Venue</span>
                <span className="font-semibold text-ink text-xs block">
                  APJ Abdul Kalam Tech Block, Seminar Lab 3
                </span>
                <span className="text-[11px] text-ink-soft">Campus South Wing</span>
              </div>
              <div>
                <span className="mono text-[10px] uppercase text-ink-faint block">Reporting Time & Date</span>
                <span className="font-bold text-overprint text-xs block">
                  09:00 AM IST (Sharp)
                </span>
                <span className="text-[11px] text-ink-soft">Please report 15 mins prior</span>
              </div>
            </div>
          </div>

          {/* Instructions and Security Stamp */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center border-t-2 border-dashed border-ink/30 pt-4">
            <div className="space-y-1 text-xs text-ink-soft">
              <p className="font-bold text-ink text-[11px] uppercase mono">Mandatory Instructions:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Carry this Hall Ticket along with physical College Photo ID Card.</li>
                <li>Bring 2 updated hard copies of resume and college marks cards.</li>
                <li>Dress code: Formal business attire is strictly required.</li>
                <li>Possession of mobile phones inside interview halls is prohibited.</li>
              </ul>
            </div>

            {/* Official Seal / Stamp */}
            <div className="flex flex-col items-center justify-center p-3 border-2 border-ledger text-ledger bg-ledger/5 text-center min-w-[150px]">
              <ShieldCheck className="h-7 w-7 mb-1 text-ledger" />
              <span className="mono text-[9px] font-black uppercase tracking-wider">
                TPO VERIFIED
              </span>
              <span className="mono text-[8px] text-ink-faint">
                Placement Cell 2026
              </span>
              <span className="mono text-[8px] text-ledger font-bold mt-0.5">
                DIGITALLY STAMPED
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center border-t border-ink/20 pt-2">
            <p className="mono text-[10px] text-ink-faint">
              PlacementHub AWS Cloud Ecosystem · Generated via RDS Ledger · Valid across all placement rounds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
