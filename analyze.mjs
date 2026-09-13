// Regenerate every headline number in the README from the raw study JSON.
//   node analyze.mjs data/study_final_2026-09-13.json
// Node 18+, no dependencies. Consistency = mean pairwise Jaccard overlap of the
// recommended-business sets across the repeated runs, scored only over runs that
// produced a 2+ business shortlist.
import { readFileSync } from "node:fs";

const file = process.argv[2] || "data/study_final_2026-09-13.json";
const d = JSON.parse(readFileSync(file, "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

function jaccard(sets) {
  if (sets.length < 2) return null;
  let pairs = 0, sum = 0;
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
    const a = sets[i], b = sets[j];
    const inter = [...a].filter((x) => b.has(x)).length;
    const uni = new Set([...a, ...b]).size;
    sum += uni ? inter / uni : 1; pairs++;
  }
  return pairs ? sum / pairs : null;
}

const engines = d.engines;
const queries = [...new Set(d.rows.map((r) => r.query))];
const byQE = {};
for (const r of d.rows) (byQE[r.query + "|" + r.engine] ||= []).push(r);

console.log(`\nStudy: ${file.split(/[\\/]/).pop()}`);
console.log(`${queries.length} questions x ${engines.join(" + ")} x ${d.runs} runs = ${d.calls} calls\n`);

const perEngine = {};
for (const eng of engines) {
  const cons = [];
  let totalRuns = 0, groundedRuns = 0, shortlistRuns = 0;
  for (const q of queries) {
    const rs = (byQE[q + "|" + eng] || []);
    totalRuns += rs.length;
    groundedRuns += rs.filter((r) => r.grounded).length;
    shortlistRuns += rs.filter((r) => (r.brands || []).length >= 2).length;
    const sets = rs.filter((r) => r.ok && (r.brands || []).length >= 2).map((r) => new Set(r.brands.map(norm)));
    const c = jaccard(sets);
    if (c != null) cons.push(c);
  }
  const mean = cons.reduce((s, x) => s + x, 0) / cons.length;
  const sd = Math.sqrt(cons.reduce((s, x) => s + (x - mean) ** 2, 0) / cons.length);
  perEngine[eng] = {
    mean, sd, cons,
    searchRate: Math.round((groundedRuns / totalRuns) * 100),
    shortlistRate: Math.round((shortlistRuns / totalRuns) * 100),
  };
}

console.log("CONSISTENCY BY ASSISTANT (mean pairwise Jaccard across 3 runs)");
for (const eng of engines) {
  const p = perEngine[eng];
  const vals = p.cons.map((c) => Math.round(c * 100));
  console.log(`  ${eng.padEnd(8)} ${Math.round(p.mean * 100)}%  (SD ${(p.sd * 100).toFixed(1)}, range ${Math.min(...vals)}-${Math.max(...vals)}%)  searched ${p.searchRate}%  shortlist ${p.shortlistRate}%`);
}

const allCons = engines.flatMap((e) => perEngine[e].cons);
const overall = allCons.reduce((s, x) => s + x, 0) / allCons.length;
console.log(`\n  OVERALL consistency: ${(overall * 100).toFixed(1)}%  (~${Math.round((1 - overall) * 100)}% of the recommended set changes on a repeat ask)`);

// Stable core vs volatile tail
let locked = 0, churn = 0, slots = 0;
for (const q of queries) for (const eng of engines) {
  const rs = (byQE[q + "|" + eng] || []).filter((r) => (r.brands || []).length >= 2);
  if (rs.length < 2) continue;
  const count = {};
  for (const r of rs) for (const b of new Set(r.brands.map(norm))) count[b] = (count[b] || 0) + 1;
  for (const b in count) { slots++; if (count[b] === rs.length) locked++; else if (count[b] === 1) churn++; }
}
console.log(`\nSTABLE CORE vs VOLATILE TAIL: of ${slots} distinct business-slots, ${Math.round(locked / slots * 100)}% (${locked}) named in EVERY run, ${Math.round(churn / slots * 100)}% (${churn}) in only ONE run.`);

// Most-named brands (brands named in a prompt excluded)
const promptText = norm(d.rows.map((r) => r.question).join(" "));
const tally = {};
for (const r of d.rows) for (const b of (r.brands || [])) {
  const k = norm(b);
  if (!k || promptText.includes(k)) continue;
  (tally[k] ||= { name: b, n: 0 }); tally[k].n++;
}
const top = Object.values(tally).sort((a, b) => b.n - a.n).slice(0, 5);
console.log(`\nMOST-RECOMMENDED (times named across all runs; prompt names excluded):`);
for (const t of top) console.log(`  ${String(t.n).padStart(3)}x  ${t.name}`);
console.log("");
