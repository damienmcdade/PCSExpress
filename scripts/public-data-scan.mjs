/*
 * Purpose: Public data safety scan for PCS Express source content.
 * Third-party dependencies: Node.js fs/path only.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scanRoots = ['src'];
const allowedWarningFiles = new Set([
  'src/components/SecurityNotice.jsx',
  'src/components/UnitInfoScreen.jsx',
  'src/components/BaseMapModule.jsx',
]);

const blockedPatterns = [
  /\btop secret\b/i,
  /\bsecret\b/i,
  /\bconfidential classified\b/i,
  /\bFOUO\b/i,
  /\bcontrolled unclassified information\b/i,
  /\bCUI\b/i,
  /\bdeployment schedule\b/i,
  /\bwatch bill\b/i,
  /\baccess[- ]control procedure/i,
  /\bfloor plan\b/i,
  /\binternal email\b/i,
  /\broster\b/i,
  /\bpersonal phone\b/i,
  /\bforce protection\b/i,
  /\btactical operations?\b/i,
  /\boperational details\b/i,
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    if (entry.isFile() && /\.(js|jsx|ts|tsx|json|css|md)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const findings = [];
for (const scanRoot of scanRoots) {
  for (const file of walk(path.join(root, scanRoot))) {
    const rel = path.relative(root, file);
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of blockedPatterns) {
        if (!pattern.test(line)) continue;
        const warningOnly = allowedWarningFiles.has(rel) && /do not enter|official public data only|public map only|no restricted|not available|classified|CUI|sensitive/i.test(line);
        if (!warningOnly) findings.push({ file: rel, line: index + 1, pattern: pattern.source, text: line.trim() });
      }
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  standard: 'Public-release safety scan for classified, CUI, operational, and sensitive-data indicators',
  result: findings.length === 0 ? 'PASS' : 'REVIEW_REQUIRED',
  findings,
};

fs.writeFileSync(path.join(root, 'public-data-scan-report.json'), `${JSON.stringify(report, null, 2)}\n`);

if (findings.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`Public data scan PASS. Report written to public-data-scan-report.json`);
