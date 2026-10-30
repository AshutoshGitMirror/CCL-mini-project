const MAP = {
  APPLIED: ['stamp stamp-ink', 'applied'],
  SHORTLISTED: ['stamp stamp-open', 'shortlisted'],
  REJECTED: ['stamp stamp-no', 'not eligible'],
  ROUND_IN_PROGRESS: ['stamp stamp-round', 'in interview'],
  OFFERED: ['stamp stamp-offer', 'offered'],
  OPEN: ['stamp stamp-open', 'open'],
  CLOSED: ['stamp stamp-gone', 'closed'],
  SENT: ['stamp stamp-open', 'sent'],
};

export default function StatusBadge({ status }) {
  const [cls, label] = MAP[status] || ['stamp stamp-gone', String(status || '—').toLowerCase()];
  return <span className={cls}>{label}</span>;
}
