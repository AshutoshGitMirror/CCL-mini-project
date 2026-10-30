// Auto-shortlisting engine.
//
// A candidate passes a drive's criteria when:
//   1. CGPA >= drive.minCgpa
//   2. branch is in drive.branches (empty drive.branches = any branch)
//   3. at least drive.minSkills of the resume's extracted skills are in
//      drive.skills (empty drive.skills = no skill gate)
//
// Score (0-100): 40 * cgpa/10 + 60 * skillOverlap (capped), used for ranking.
export function evaluateDrive(drive, student, extractedSkills) {
  const reasons = [];
  let passed = true;

  if (student.cgpa == null) {
    passed = false;
    reasons.push('Profile missing CGPA');
  } else if (drive.minCgpa != null && student.cgpa < drive.minCgpa) {
    passed = false;
    reasons.push(`CGPA ${student.cgpa} < required ${drive.minCgpa}`);
  }

  if (drive.branches?.length && !drive.branches.includes(student.branch)) {
    passed = false;
    reasons.push(`Branch ${student.branch || '—'} not eligible (${drive.branches.join(', ')})`);
  }

  const listed = (drive.skills || []).map((s) => s.toLowerCase());
  const mine = (extractedSkills || []).map((s) => s.toLowerCase());
  const matched = listed.filter((s) => mine.includes(s));
  if (listed.length && matched.length < (drive.minSkills || 1)) {
    passed = false;
    reasons.push(
      `Skills matched ${matched.length}/${drive.minSkills || 1} (needs: ${listed.join(', ')})`
    );
  }

  const skillRatio = listed.length ? matched.length / listed.length : 1;
  const cgpaPart = student.cgpa != null ? Math.min(1, student.cgpa / 10) * 40 : 0;
  const score = Math.round(cgpaPart + skillRatio * 60);

  return { passed, score, matched: matched.map((m) => drive.skills[listed.indexOf(m)]) || matched, reasons };
}
