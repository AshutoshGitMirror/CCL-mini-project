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

  if (drive.branches?.length && (!student.branch || !drive.branches.includes(student.branch))) {
    passed = false;
    reasons.push(`Branch ${student.branch || '—'} not eligible (${drive.branches.join(', ')})`);
  }

  const listed = (drive.skills || []).map((s) => s.toLowerCase());
  const mine = (extractedSkills || []).map((s) => s.toLowerCase());
  const matchedRaw = listed.filter((s) => mine.includes(s));
  const missingRaw = listed.filter((s) => !mine.includes(s));

  if (listed.length && matchedRaw.length < (drive.minSkills || 1)) {
    passed = false;
    reasons.push(
      `Skills matched ${matchedRaw.length}/${drive.minSkills || 1} (needs: ${listed.join(', ')})`
    );
  }

  const skillRatio = listed.length ? matchedRaw.length / listed.length : 1;
  const cgpaPart = student.cgpa != null ? Math.round(Math.min(1, student.cgpa / 10) * 40) : 0;
  const skillPart = Math.round(skillRatio * 60);
  const score = Math.round(cgpaPart + skillPart);

  // Preserve original casing from drive definition
  const matched = matchedRaw.map((m) => drive.skills[listed.indexOf(m)] || m);
  const missing = missingRaw.map((m) => drive.skills[listed.indexOf(m)] || m);

  return {
    passed,
    score,
    cgpaScore: cgpaPart,
    skillScore: skillPart,
    matched,
    missing,
    reasons,
  };
}
