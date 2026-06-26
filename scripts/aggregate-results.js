#!/usr/bin/env node
/**
 * Aggregate repeated k6 runs into a single statistics file per scenario/api.
 *
 * For each metric across N runs it computes:
 *   • mean
 *   • standard deviation  (sample SD, n-1)
 *   • 95% confidence interval  (t-distribution, df = n-1)
 *   • min / max
 *
 * Input  : tests/results/{api}/{scenario}-run{1..N}-summary.json
 *          tests/results/{api}/{scenario}-run{1..N}-resources.csv
 *
 * Output : tests/results/{api}/{scenario}-aggregated.json
 *
 * Usage  : node scripts/aggregate-results.js [NUM_RUNS]
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const T_95 = { 1:12.706, 2:4.303, 3:3.182, 4:2.776, 5:2.571,
               6:2.447,  7:2.365, 8:2.306, 9:2.262, 10:2.228 };
function tCritical(df) { return T_95[df] ?? 1.96; }

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

function sampleSD(arr, avg) {
  if (arr.length < 2) return 0;
  return Math.sqrt(arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length - 1));
}

function stats(arr) {
  const n   = arr.length;
  const avg = mean(arr);
  const sd  = sampleSD(arr, avg);
  const se  = n > 1 ? sd / Math.sqrt(n) : 0;
  const ci  = tCritical(n - 1) * se;
  return {
    n,
    mean:    +avg.toFixed(4),
    sd:      +sd.toFixed(4),
    ci95:    +ci.toFixed(4),
    ci95_lo: +(avg - ci).toFixed(4),
    ci95_hi: +(avg + ci).toFixed(4),
    min:     +Math.min(...arr).toFixed(4),
    max:     +Math.max(...arr).toFixed(4),
  };
}

function toMB(raw) {
  if (raw === undefined || raw === null) return 0;
  const s = String(raw).trim();
  const m = s.match(/^([0-9]+\.?[0-9]*)([a-zA-Z]*)$/);
  if (!m) return 0;
  const num  = parseFloat(m[1]);
  const unit = m[2].toLowerCase().replace('ib', 'b'); // MiB→mb, GiB→gb
  switch (unit) {
    case 'gb': return num * 1024;
    case 'mb': return num;
    case 'kb': return num / 1024;
    case 'b':  return num / 1048576;
    case '':   return num;   
    default:   return 0;
  }
}

function loadSummary(api, scenario, run) {
  const p = path.join(__dirname,
    `../tests/results/${api}/${scenario}-run${run}-summary.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadResourceCSV(api, scenario, run) {
  const p = path.join(__dirname,
    `../tests/results/${api}/${scenario}-run${run}-resources.csv`);
  if (!fs.existsSync(p)) return null;

  const lines = fs.readFileSync(p, 'utf8').trim().split('\n').slice(1);
  let totalCpu = 0, totalMem = 0, count = 0;

  for (const line of lines) {
    const cols = line.split(',');
    const cpu  = parseFloat(cols[2]);
    const mem  = toMB(cols[3]);
    if (!isNaN(cpu) && !isNaN(mem) && mem > 0) {
      totalCpu += cpu;
      totalMem += mem;
      count++;
    }
  }

  if (count === 0) return null;
  return { avgCpu: totalCpu / count, avgMem: totalMem / count };
}

function extractMetrics(data) {
  const m = data.metrics;
  const errorRate = m.http_req_failed?.value != null
    ? m.http_req_failed.value * 100 : 0;
  return {
    avg_latency_ms:   m.http_req_duration.avg,
    p50_latency_ms:   m.http_req_duration.med,
    p90_latency_ms:   m.http_req_duration['p(90)'],
    p95_latency_ms:   m.http_req_duration['p(95)'],
    p99_latency_ms:   m.http_req_duration['p(99)'],
    error_rate_pct:   errorRate,
    data_received_mb: m.data_received.count / (1024 * 1024),
    data_sent_mb:     m.data_sent.count     / (1024 * 1024),
  };
}

const NUM_RUNS = parseInt(process.argv[2] ?? '5', 10);

const SCENARIOS = [
  '01-simple-list',
  '02-list-with-relations',
  '03-filtered-slots',
  '04-generic-nested-query',
  '05-optimized-nested-query',
  '06-booking-creation',
];

const APIS = ['rest', 'graphql'];
let anyMissing = false;

for (const api of APIS) {
  for (const scenario of SCENARIOS) {
    const metricArrays = {};
    const cpuArr = [], memArr = [];
    const validRuns = [];

    for (let run = 1; run <= NUM_RUNS; run++) {
      const summary   = loadSummary(api, scenario, run);
      const resources = loadResourceCSV(api, scenario, run);

      if (!summary) {
        console.warn(`⚠  Missing: ${api}/${scenario}-run${run}-summary.json`);
        anyMissing = true;
        continue;
      }

      validRuns.push(run);
      for (const [key, value] of Object.entries(extractMetrics(summary))) {
        if (value == null || (typeof value === 'number' && isNaN(value))) continue;
        (metricArrays[key] ??= []).push(value);
      }
      if (resources) {
        cpuArr.push(resources.avgCpu);
        memArr.push(resources.avgMem);
      }
    }

    if (validRuns.length === 0) {
      console.warn(`⚠  No valid runs for ${api}/${scenario} — skipping.`);
      continue;
    }

    const aggregated = {
      meta: {
        api, scenario,
        num_runs_attempted:  NUM_RUNS,
        num_runs_successful: validRuns.length,
        runs_included: validRuns,
        generated_at: new Date().toISOString(),
        note: [
          'SD   = sample standard deviation (n-1 denominator)',
          'CI95 = 95% confidence interval half-width (t-distribution)',
          'ci95_lo / ci95_hi = lower / upper bounds',
        ],
      },
      performance: {},
      resources:   {},
    };

    for (const [key, values] of Object.entries(metricArrays)) {
      aggregated.performance[key] = stats(values);
    }
    if (cpuArr.length > 0) aggregated.resources.avg_cpu_pct = stats(cpuArr);
    if (memArr.length > 0) aggregated.resources.avg_mem_pct = stats(memArr);

    const outPath = path.join(__dirname,
      `../tests/results/${api}/${scenario}-aggregated.json`);
    fs.writeFileSync(outPath, JSON.stringify(aggregated, null, 2));
    console.log(`✓  ${api}/${scenario}  (${validRuns.length} runs) → ${outPath}`);
  }
}

if (anyMissing) {
  console.warn('\n⚠  Some run files were missing — check the list above.\n');
} else {
  console.log('\nAll aggregation complete.\n');
}
console.log('Next: node scripts/compare-results.js');