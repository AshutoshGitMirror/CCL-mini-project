// Resume parser abstraction.
//  RESUME_PARSER=local    -> unpdf (dev, zero AWS cost, no credentials)
//  RESUME_PARSER=textract -> Amazon Textract DetectDocumentText (real AWS)
// Call sites pass the PDF bytes straight from S3 (or disk) as a Buffer:
// OCR text is read ONCE and cached in RDS — never billed again.
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { extractText as unpdfExtract, getDocumentProxy } from 'unpdf';

// ~200 common tech & domain skills; matched case-insensitively on the OCR text.
const SKILL_DICTIONARY = [
  // languages / runtime
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'c', 'golang', 'go', 'rust',
  'kotlin', 'swift', 'php', 'ruby', 'scala', 'bash', 'r', 'matlab', 'sql', 'html', 'css',
  // web frameworks
  'react', 'next.js', 'angular', 'vue', 'node.js', 'node', 'express', 'django', 'flask',
  'fastapi', 'spring', 'spring boot', 'laravel', 'tailwind', 'bootstrap', 'rest api', 'graphql',
  'redux', 'webpack', 'vite', 'jquery', 'asp.net',
  // data / ml
  'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'cassandra', 'dynamodb',
  'pandas', 'numpy', 'scikit-learn', 'sklearn', 'tensorflow', 'pytorch', 'keras', 'opencv',
  'nlp', 'computer vision', 'machine learning', 'deep learning', 'data analysis',
  'data science', 'statistics', 'power bi', 'tableau', 'excel', 'spark', 'hadoop', 'kafka',
  'airflow', 'dbt', 'etl',
  // cloud / devops
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'linux',
  'git', 'github actions', 'ansible', 'nginx', 'lambda', 's3', 'ec2', 'sns', 'cloudwatch',
  'microservices', 'serverless', 'vpc', 'cloudformation', 'devops',
  // cs fundamentals / other
  'dsa', 'data structures', 'algorithms', 'oop', 'operating systems', 'dbms', 'networking',
  'operating system', 'compiler design', 'android', 'flutter', 'react native', 'unity',
  'solidity', 'blockchain', 'cybersecurity', 'penetration testing', 'ar_tools', 'erp',
  'sap', 'salesforce', 'qa', 'testing', 'selenium', 'jira', 'agile', 'scrum', 'leadership',
  'communication', 'teamwork', 'problem solving', 'public speaking',
].filter((s) => s !== 'ar_tools'); // dropped placeholder token

export async function extractBuf(bytes) {
  // unpdf: modern pdf.js without native deps; pdf-parse's bundled pdf.js 1.x
  // intermittently fails on pdf-lib output with "Invalid PDF structure".
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await unpdfExtract(pdf, { mergePages: true });
  return text;
}

export function extractSkills(text) {
  if (!text) return [];
  const haystack = text.toLowerCase();
  // whole-word gate so 'c'/'go'/'r' don't match inside 'class'/'django'/'react'
  const hasWord = (s) =>
    new RegExp(`(?<![a-z0-9])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`).test(haystack);
  const hits = SKILL_DICTIONARY.filter(hasWord);
  // de-dupe near-identical pairs (node vs node.js, postgresql vs postgres)
  const canonical = {
    node: 'node.js', postgres: 'postgresql', sql: 'sql', 'sklearn': 'scikit-learn',
    'spring boot': 'spring boot', 'rest api': 'rest api',
  };
  const seen = new Set();
  const out = [];
  for (const hit of hits) {
    const key = canonical[hit] || hit;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out.slice(0, 30);
}

async function textractText(bytes) {
  const client = new TextractClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const res = await client.send(new DetectDocumentTextCommand({ Document: { Bytes: bytes } }));
  return (res.Blocks || [])
    .filter((b) => b.BlockType === 'LINE' && b.Text)
    .map((b) => b.Text)
    .join('\n');
}

export function extractAcademicHistory(text) {
  if (!text) return { cgpa: null, branch: null, graduationYear: null };

  let cgpa = null;
  // Patterns like CGPA: 8.7, GPA 9.2, 8.5/10, 8.9 CGPA
  const cgpaMatch1 = text.match(/(?:cgpa|gpa|grade\s*point\s*(?:average)?|aggregate)[\s:=]*([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*10)?/i);
  const cgpaMatch2 = text.match(/\b([5-9]\.[0-9]{1,2}|10(?:\.0{1,2})?)\s*(?:\/\s*10|\s*cgpa|\s*gpa)\b/i);
  if (cgpaMatch1 && cgpaMatch1[1]) {
    const val = parseFloat(cgpaMatch1[1]);
    if (!isNaN(val) && val >= 0 && val <= 10) cgpa = val;
  } else if (cgpaMatch2 && cgpaMatch2[1]) {
    const val = parseFloat(cgpaMatch2[1]);
    if (!isNaN(val) && val >= 0 && val <= 10) cgpa = val;
  }

  let branch = null;
  if (/computer\s*science|(?<![a-z0-9])cse(?![a-z0-9])/i.test(text)) branch = 'CSE';
  else if (/artificial\s*intelligence|machine\s*learning|aiml|ai\s*(?:&|\/|\+)\s*ml/i.test(text)) branch = 'AIML';
  else if (/information\s*technology|(?<![a-z0-9])it(?![a-z0-9])/i.test(text)) branch = 'IT';
  else if (/electronics\s*(?:and|&)\s*communication|(?<![a-z0-9])ece(?![a-z0-9])/i.test(text)) branch = 'ECE';
  else if (/electrical\s*(?:and|&)\s*electronics|(?<![a-z0-9])eee(?![a-z0-9])/i.test(text)) branch = 'EEE';
  else if (/mechanical|(?<![a-z0-9])mech(?![a-z0-9])/i.test(text)) branch = 'MECH';
  else if (/civil(?:\s*engineering)?/i.test(text)) branch = 'CIVIL';

  let graduationYear = null;
  const gradMatch = text.match(/(?:batch\s*(?:of)?|class\s*of|graduat(?:ed|ion|ing)?(?:\s*year)?|pass\s*out)[\s:=]*([2][0][2-3][0-9])/i)
    || text.match(/\b(202[4-9]|203[0-2])\b/);
  if (gradMatch && gradMatch[1]) {
    const yr = parseInt(gradMatch[1], 10);
    if (yr >= 2020 && yr <= 2035) graduationYear = yr;
  }

  return { cgpa, branch, graduationYear };
}

export { textractText };

