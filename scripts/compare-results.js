#!/usr/bin/env node
/**
 * Compare REST vs GraphQL Load Testing Results
 * Reads *-aggregated.json produced by aggregate-results.js
 *
 * Reports:
 *   • mean ± 95% CI for every metric
 *   • whether the difference is statistically significant
 *     (non-overlapping 95% CIs → flagged as significant)
 *   • winner per scenario per category
 *   • overall winner tally
 *
 * Throughput (requests/sec) is intentionally excluded: under a fixed VU
 * workload the k6 scheduler caps concurrency, so req/sec reflects the test
 * configuration rather than architectural efficiency.
 *
 * Usage: node scripts/compare-results.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const SCENARIOS = [
  { id: '01-simple-list',            name: 'Simple List Query' },
  { id: '02-list-with-relations',    name: 'List with Relations' },
  { id: '03-filtered-slots',         name: 'Filtered Slot Availability' },
  { id: '04-generic-nested-query',   name: 'Generic Nested User Dashboard' },
  { id: '05-optimized-nested-query', name: 'Optimized Nested User Dashboard' },
  { id: '06-booking-creation',       name: 'Booking Creation (Write)' },
];

function loadAggregated(api, scenarioId) {
  const p = path.join(
    __dirname, `../tests/results/${api}/${scenarioId}-aggregated.json`
  );
  if (!fs.existsSync(p)) {
    console.error(`  File not found: ${p}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function isSignificant(a, b) {
  return a.ci95_hi < b.ci95_lo || b.ci95_hi < a.ci95_lo;
}

function fmtStat(s) {
  return `${s.mean.toFixed(2)} ± ${s.ci95.toFixed(2)}`;
}

function pctDiff(gMean, rMean) {
  if (rMean === 0) return 0;
  return ((gMean - rMean) / rMean) * 100;
}

function sigTag(sig) {
  return sig ? ' [*]' : '    ';
}

function row(label, rest, graphql, lowerIsBetter = true) {
  if (!rest || !graphql) {
    console.log(
      label.padEnd(26) + '(metric not available)'.padEnd(22) + ''
    );
    return null;
  }

  const sig  = isSignificant(rest, graphql);
  const diff = pctDiff(graphql.mean, rest.mean);

  const graphqlWins = lowerIsBetter ? (diff < 0) : (diff > 0);
  const neutral     = Math.abs(diff) < 5;

  const symbol = neutral ? '≈' : (graphqlWins ? '✓ GQL' : '✓ REST');
  const sign   = diff > 0 ? '+' : '';

  console.log(
    label.padEnd(26) +
    fmtStat(rest).padEnd(22) +
    fmtStat(graphql).padEnd(22) +
    `${sign}${diff.toFixed(1)}%`.padEnd(10) +
    sigTag(sig) +
    symbol
  );

  return { graphqlWins: !neutral && graphqlWins, sig, diff };
}

const allResults = {};

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════════════╗');
console.log('║     REST vs GraphQL — Statistical Performance Comparison                 ║');
console.log('║     Values shown as  mean ± 95% CI  (across repeated runs)               ║');
console.log('║     [*] = statistically significant (non-overlapping 95% CIs)            ║');
console.log('╚══════════════════════════════════════════════════════════════════════════╝');

const header = () => {
  console.log(
    'Metric'.padEnd(26) +
    'REST (mean ± CI95)'.padEnd(22) +
    'GraphQL (mean ± CI95)'.padEnd(22) +
    'Δ%'.padEnd(10) +
    'Sig'.padEnd(7) +
    'Better'
  );
  console.log('─'.repeat(92));
};

for (const sc of SCENARIOS) {
  console.log(`\n${'═'.repeat(92)}`);
  console.log(`Scenario: ${sc.name}`);
  console.log(`${'═'.repeat(92)}`);

  const rd = loadAggregated('rest',    sc.id);
  const gd = loadAggregated('graphql', sc.id);

  if (!rd || !gd) {
    console.log('  ⚠  Missing aggregated data — run aggregate-results.js first.\n');
    continue;
  }

  const rp = rd.performance;
  const gp = gd.performance;
  const rr = rd.resources;
  const gr = gd.resources;

  console.log(`\n  Runs: REST=${rd.meta.num_runs_successful}  GraphQL=${gd.meta.num_runs_successful}`);

  console.log('\n  Response Time (ms)');
  header();
  const r_avg = row('Avg Latency (ms)',  rp.avg_latency_ms,  gp.avg_latency_ms);
  const r_p50 = row('P50 Latency (ms)',  rp.p50_latency_ms,  gp.p50_latency_ms);
  const r_p90 = row('P90 Latency (ms)',  rp.p90_latency_ms,  gp.p90_latency_ms);
  const r_p95 = row('P95 Latency (ms)',  rp.p95_latency_ms,  gp.p95_latency_ms);
  const r_p99 = row('P99 Latency (ms)',  rp.p99_latency_ms,  gp.p99_latency_ms);

  console.log('\n  Reliability');
  header();
  const r_err = row('Error Rate (%)',    rp.error_rate_pct,  gp.error_rate_pct);

  console.log('\n  Resource Utilization');
  header();
  const r_cpu = (rr?.avg_cpu_pct && gr?.avg_cpu_pct)
    ? row('Avg CPU (%)',      rr.avg_cpu_pct, gr.avg_cpu_pct)
    : null;
  const r_mem = (rr?.avg_mem_pct && gr?.avg_mem_pct)
    ? row('Avg Memory (%)',   rr.avg_mem_pct, gr.avg_mem_pct)
    : null;

  console.log('\n  Network & Data');
  header();
  const r_drx = row('Data Received (MB)', rp.data_received_mb, gp.data_received_mb);
  const r_dtx = row('Data Sent (MB)',     rp.data_sent_mb,     gp.data_sent_mb);

  if (r_p95) {
    console.log('\n  Key Findings:');
    const latDir = r_p95.diff < 0 ? 'GraphQL' : 'REST';
    console.log(
      `     • P95 latency: ${Math.abs(r_p95.diff).toFixed(1)}% faster for ${latDir}` +
      (r_p95.sig ? ' — statistically significant' : ' — NOT significant (overlapping CIs)')
    );
  }

  allResults[sc.id] = { rp, gp, rr, gr, r_p95, r_cpu, r_mem, r_drx };
}

console.log('\n\n' + '═'.repeat(92));
console.log('OVERALL SUMMARY');
console.log('═'.repeat(92));

const tally = {
  latency: { rest: 0, gql: 0, sig: 0 },
  cpu:     { rest: 0, gql: 0, sig: 0 },
  memory:  { rest: 0, gql: 0, sig: 0 },
  data:    { rest: 0, gql: 0, sig: 0 },
};

for (const [, r] of Object.entries(allResults)) {
  if (r.r_p95) {
    if (r.rp.p95_latency_ms.mean < r.gp.p95_latency_ms.mean) tally.latency.rest++;
    else                                                        tally.latency.gql++;
    if (r.r_p95.sig) tally.latency.sig++;
  }

  if (r.r_cpu) {
    if (r.rr.avg_cpu_pct.mean < r.gr.avg_cpu_pct.mean) tally.cpu.rest++;
    else                                                  tally.cpu.gql++;
    if (r.r_cpu.sig) tally.cpu.sig++;
  }

  if (r.r_mem) {
    if (r.rr.avg_mem_pct.mean < r.gr.avg_mem_pct.mean) tally.memory.rest++;
    else                                                  tally.memory.gql++;
    if (r.r_mem.sig) tally.memory.sig++;
  }

  if (r.r_drx) {
    const rTot = r.rp.data_received_mb.mean + r.rp.data_sent_mb.mean;
    const gTot = r.gp.data_received_mb.mean + r.gp.data_sent_mb.mean;
    if (rTot < gTot) tally.data.rest++;
    else              tally.data.gql++;
    if (r.r_drx.sig) tally.data.sig++;
  }
}

const N = SCENARIOS.length;
console.log(`\n  Category          REST wins   GraphQL wins   Sig. differences / ${N} scenarios`);
console.log('  ' + '─'.repeat(70));

function tallyRow(label, t) {
  console.log(
    `  ${label.padEnd(18)}` +
    `${String(t.rest).padEnd(12)}` +
    `${String(t.gql).padEnd(15)}` +
    `${t.sig} of ${N} statistically significant`
  );
}

tallyRow('P95 Latency',    tally.latency);
tallyRow('CPU Efficiency', tally.cpu);
tallyRow('Mem Efficiency', tally.memory);
tallyRow('Data Transfer',  tally.data);

console.log('\n  [*] A difference is marked significant when the 95% CIs do not overlap.');
console.log('      Non-significant differences should not be over-interpreted.\n');