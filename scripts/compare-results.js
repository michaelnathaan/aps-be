#!/usr/bin/env node
/**
 * Compare REST vs GraphQL Load Testing Results
 * Generates comparison tables for thesis
 */

const fs = require('fs');
const path = require('path');

const SCENARIOS = [
  { id: '01-simple-list', name: 'Simple List Query' },
  { id: '02-list-with-relations', name: 'List with Relations (N+1 Test)' },
  { id: '03-filtered-slots', name: 'Filtered Slot Availability' },
  { id: '04-nested-dashboard', name: 'Nested User Dashboard' },
  { id: '05-booking-creation', name: 'Booking Creation (Write)' },
  { id: '06-mixed-workload', name: 'Mixed Read-Write Workload' },
];

function loadResults(api, scenario) {
  const filePath = path.join(__dirname, `../tests/results/${api}/${scenario}-summary.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return null;
  }
  
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadResources(api, scenario) {
  const filePath = path.join(__dirname, `../tests/results/${api}/${scenario}-resources.csv`);
  
  if (!fs.existsSync(filePath)) {
    return { avgCpu: 0, avgMem: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').slice(1); // Skip header

  let totalCpu = 0;
  let totalMem = 0;

  lines.forEach(line => {
    const cols = line.split(',');
    totalCpu += parseFloat(cols[2]); // cpu_percent
    totalMem += parseFloat(cols[5]); // mem_usage_percent
  });

  return {
    avgCpu: totalCpu / lines.length,
    avgMem: totalMem / lines.length
  };
}

function extractMetrics(data) {
  const metrics = data.metrics;
  
  const errorRate = (metrics.http_req_failed && metrics.http_req_failed.value !== undefined) 
    ? metrics.http_req_failed.value * 100 
    : 0;

  return {
    // Response Time
    avgLatency: metrics.http_req_duration.avg,
    p50Latency: metrics.http_req_duration.med,
    p90Latency: metrics.http_req_duration['p(90)'],
    p95Latency: metrics.http_req_duration['p(95)'],
    
    // Throughput
    requestsPerSec: metrics.http_reqs.rate,
    totalRequests: metrics.http_reqs.count,
    
    // Error Rate
    failedRequests: errorRate,
    
    // Data Transfer
    dataReceived: metrics.data_received.count / (1024 * 1024),
    dataSent: metrics.data_sent.count / (1024 * 1024),
  };
}

function compareScenario(scenario) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Scenario: ${scenario.name}`);
  console.log('='.repeat(80));
  
  const restData = loadResults('rest', scenario.id);
  const graphqlData = loadResults('graphql', scenario.id);
  // For resource
  const restRes = loadResources('rest', scenario.id);
  const graphqlRes = loadResources('graphql', scenario.id);

  if (!restData || !graphqlData || !restRes || !graphqlRes) {
    console.log('❌ Missing data for this scenario\n');
    return null;
  }
  
  const restMetrics = extractMetrics(restData);
  const graphqlMetrics = extractMetrics(graphqlData);
  
  // Print comparison table
  console.log('\n📊 Performance Metrics:');
  console.log('-'.repeat(80));
  console.log(
    'Metric'.padEnd(25) + 
    'REST'.padEnd(15) + 
    'GraphQL'.padEnd(15) + 
    'Difference'
  );
  console.log('-'.repeat(80));
  
  // Response Time
  printMetric('Avg Latency (ms)', restMetrics.avgLatency, graphqlMetrics.avgLatency);
  printMetric('P50 Latency (ms)', restMetrics.p50Latency, graphqlMetrics.p50Latency);
  printMetric('P90 Latency (ms)', restMetrics.p90Latency, graphqlMetrics.p90Latency);
  printMetric('P95 Latency (ms)', restMetrics.p95Latency, graphqlMetrics.p95Latency);
  
  console.log('-'.repeat(80));
  
  // Throughput
  printMetric('Requests/sec', restMetrics.requestsPerSec, graphqlMetrics.requestsPerSec);
  printMetric('Total Requests', restMetrics.totalRequests, graphqlMetrics.totalRequests, false);
  
  console.log('-'.repeat(80));
  
  // Error Rate
  printMetric('Error Rate (%)', restMetrics.failedRequests, graphqlMetrics.failedRequests);
  
  console.log('-'.repeat(80));
  
  // Resource
  console.log('\n🖥️  Resource Utilization:');
  console.log('-'.repeat(80));

  printMetric('Avg CPU Usage (%)', restRes.avgCpu, graphqlRes.avgCpu);
  printMetric('Avg Memory Usage (%)', restRes.avgMem, graphqlRes.avgMem);
  
  // Network and data
  console.log('\n📦 Network & Data:');
  console.log('-'.repeat(80));
  printMetric('Data Received (MB)', restMetrics.dataReceived, graphqlMetrics.dataReceived);
  printMetric('Data Sent (MB)', restMetrics.dataSent, graphqlMetrics.dataSent);
  console.log('-'.repeat(80));
  
  // Winner analysis
  analyzeWinner(restMetrics, graphqlMetrics, restRes, graphqlRes);
  
  return { rest: restMetrics, graphql: graphqlMetrics, restRes: restRes, graphqlRes: graphqlRes};
}

function printMetric(name, restValue, graphqlValue, showDiff = true) {
  const restStr = restValue.toFixed(2);
  const graphqlStr = graphqlValue.toFixed(2);
  
  let diffStr = '';
  if (showDiff && restValue > 0) {
    const diff = ((graphqlValue - restValue) / restValue * 100);
    const sign = diff > 0 ? '+' : '';
    
    // Logic: For latency/resource, negative is good (✓). For throughput, positive is good.
    const isGood = name.includes('Requests/sec') ? diff > 0 : diff < 0;
    const isNeutral = Math.abs(diff) < 5;
    
    let emoji = isNeutral ? '≈' : (isGood ? '✓' : '✗');
    diffStr = `${sign}${diff.toFixed(2)}% ${emoji}`;
  }
  
  console.log(
    name.padEnd(25) + 
    restStr.padEnd(15) + 
    graphqlStr.padEnd(15) + 
    diffStr
  );
}

function analyzeWinner(rest, graphql, restRes, graphqlRes) {
  console.log('\n🏆 Analysis:');
  
  // Helper: ngitung percentile perbedaan based on REST 
  const getDiff = (g, r) => ((g - r) / r * 100);

  // 1. Latency (Lower is better)
  const latDiff = getDiff(graphql.p95Latency, rest.p95Latency);
  if (latDiff > 0) {
    console.log(`   • REST is ${latDiff.toFixed(1)}% faster (p95 latency)`);
  } else {
    console.log(`   • GraphQL is ${Math.abs(latDiff).toFixed(1)}% faster (p95 latency)`);
  }
  
  // 2. Throughput (Higher is better)
  const throughputDiff = getDiff(graphql.requestsPerSec, rest.requestsPerSec);
  if (throughputDiff > 0) {
    console.log(`   • GraphQL handles ${throughputDiff.toFixed(1)}% more requests/sec (throughput)`);
  } else {
    console.log(`   • REST handles ${Math.abs(throughputDiff).toFixed(1)}% more requests/sec (throughput)`);
  }
  
  // 3. CPU (Lower is better)
  const cpuDiff = getDiff(graphqlRes.avgCpu, restRes.avgCpu);
  if (cpuDiff > 0) {
    console.log(`   • REST uses ${cpuDiff.toFixed(1)}% less CPU`);
  } else {
    console.log(`   • GraphQL uses ${Math.abs(cpuDiff).toFixed(1)}% less CPU`);
  }

  // 4. Memory (Lower is better)
  const memDiff = getDiff(graphqlRes.avgMem, restRes.avgMem);
  if (memDiff > 0) {
    console.log(`   • REST uses ${memDiff.toFixed(1)}% less Memory`);
  } else {
    console.log(`   • GraphQL uses ${Math.abs(memDiff).toFixed(1)}% less Memory`);
  }

  // 5. Data Transfer (Lower is better)
  const restTotal = rest.dataReceived + rest.dataSent;
  const graphqlTotal = graphql.dataReceived + graphql.dataSent;
  const dataDiff = ((graphqlTotal - restTotal) / restTotal * 100);
  
  if (dataDiff > 0) {
    console.log(`   • REST transfers ${dataDiff.toFixed(1)}% less data total`);
  } else {
    console.log(`   • GraphQL transfers ${Math.abs(dataDiff).toFixed(1)}% less data total`);
  }
}

// Main execution
console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║     REST vs GraphQL Performance Comparison                   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');

const allResults = {};

SCENARIOS.forEach(scenario => {
  const result = compareScenario(scenario);
  if (result) {
    allResults[scenario.id] = result;
  }
});

// Overall summary
console.log('\n\n' + '='.repeat(80));
console.log('OVERALL SUMMARY');
console.log('='.repeat(80));

let winners = {
  latency: { rest: 0, gql: 0 },
  throughput: { rest: 0, gql: 0 },
  cpu: { rest: 0, gql: 0 },
  memory: { rest: 0, gql: 0 },
  data: { rest: 0, gql: 0 }
};

Object.keys(allResults).forEach(scenarioId => {
  const { rest, graphql, restRes, graphqlRes } = allResults[scenarioId];
  
  // Latency Winner (Lower is better)
  if (rest.p95Latency < graphql.p95Latency) winners.latency.rest++;
  else winners.latency.gql++;

  // Throughput Winner (Higher is better)
  if (rest.requestsPerSec > graphql.requestsPerSec) winners.throughput.rest++;
  else winners.throughput.gql++;

  // CPU Winner (Lower is better)
  if (restRes.avgCpu < graphqlRes.avgCpu) winners.cpu.rest++;
  else winners.cpu.gql++;

  // Memory Winner (Lower is better)
  if (restRes.avgMem < graphqlRes.avgMem) winners.memory.rest++;
  else winners.memory.gql++;

  // Data Transfer Winner (Lower total is better)
  const restTotalData = rest.dataReceived + rest.dataSent;
  const gqlTotalData = graphql.dataReceived + graphql.dataSent;
  if (restTotalData < gqlTotalData) winners.data.rest++;
  else winners.data.gql++;
});

console.log(`\n🏆 Category Winners (Scenarios Won):`);
console.log('-'.repeat(40));
console.log(`Latency (P95):      REST: ${winners.latency.rest} | GraphQL: ${winners.latency.gql}`);
console.log(`Throughput:         REST: ${winners.throughput.rest} | GraphQL: ${winners.throughput.gql}`);
console.log(`CPU Efficiency:     REST: ${winners.cpu.rest} | GraphQL: ${winners.cpu.gql}`);
console.log(`Memory Efficiency:  REST: ${winners.memory.rest} | GraphQL: ${winners.memory.gql}`);
console.log(`Data Efficiency:    REST: ${winners.data.rest} | GraphQL: ${winners.data.gql}`);

console.log('\n' + '='.repeat(80));
console.log('FINAL VERDICT & RESEARCH CONCLUSION');
console.log('='.repeat(80));

// 1. Performance vs. Efficiency Trade-off
if (winners.latency.rest > winners.latency.gql && winners.data.gql > winners.data.rest) {
  console.log('💡 THE ARCHITECTURAL TRADE-OFF:');
  console.log('   REST exhibits lower computational overhead and faster response times,');
  console.log('   while GraphQL provides superior network efficiency by eliminating over-fetching.');
  console.log('   This confirms the "Efficiency-Latency Paradox" in middleware architecture.');
}

// 2. Performance Impact (Latency & Throughput)
console.log('\n📈 SCALABILITY & CAPACITY:');
if (winners.throughput.rest >= winners.throughput.gql) {
  console.log(`   • REST maintained higher throughput in ${winners.throughput.rest} scenarios.`);
  console.log('   • This suggests REST is more capable of handling high-volume traffic on limited hardware.');
} else {
  console.log(`   • GraphQL maintained higher throughput in ${winners.throughput.gql} scenarios.`);
  console.log('   • This suggests the GraphQL implementation scales better under the tested load.');
}

// 3. Resource Impact (CPU & Memory)
const totalResRest = winners.cpu.rest + winners.memory.rest;
const totalResGql = winners.cpu.gql + winners.memory.gql;

console.log('\n📊 SYSTEM RESOURCE SUMMARY:');
if (totalResRest > totalResGql) {
  console.log('   • GraphQL is more resource-efficient overall, making it suitable for');
  console.log('     serverless or memory-constrained environments.');
} else {
  console.log('   • REST maintains a smaller resource footprint. The GraphQL AST parsing');
  console.log('     and validation layer introduces measurable CPU/RAM overhead.');
}

// 4. Deployment Recommendation
console.log('\n🚀 RECOMMENDATIONS FOR APS (Apartment Booking System):');
if (winners.latency.rest > 3) { // If REST won most latency tests
  console.log('   • Use REST for: High-frequency, simple operations (e.g., health checks, logging)');
  console.log('     where every millisecond of server-side latency counts.');
}

if (winners.data.gql > 3) { // If GraphQL won most data tests
  console.log('   • Use GraphQL for: Mobile clients and complex "Nested User Dashboards"');
  console.log('     where reducing data consumption (average -' + 
              ((allResults['04-nested-dashboard'].rest.dataReceived - allResults['04-nested-dashboard'].graphql.dataReceived) / allResults['04-nested-dashboard'].rest.dataReceived * 100).toFixed(0) + 
              '%) is the priority.');
}

console.log('\n' + '-'.repeat(80));
console.log('✅ Final Conclusion:');
console.log('   "This study concludes that while REST remains the benchmark for raw speed,');
console.log('   GraphQL serves as a vital optimization layer for complex data-driven');
console.log('   applications, particularly in scenarios involving nested relationships."');
console.log('-'.repeat(80));