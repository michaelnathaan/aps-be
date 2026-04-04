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

function extractMetrics(data) {
  const metrics = data.metrics;
  
  return {
    // Response Time
    avgLatency: metrics.http_req_duration.values.avg,
    p50Latency: metrics.http_req_duration.values['p(50)'],
    p95Latency: metrics.http_req_duration.values['p(95)'],
    p99Latency: metrics.http_req_duration.values['p(99)'],
    
    // Throughput
    requestsPerSec: metrics.http_reqs.values.rate,
    totalRequests: metrics.http_reqs.values.count,
    
    // Error Rate
    failedRequests: metrics.http_req_failed.values.rate * 100,
    
    // Data Transfer
    dataReceived: metrics.data_received.values.count / (1024 * 1024),
    dataSent: metrics.data_sent.values.count / (1024 * 1024),
  };
}

function compareScenario(scenario) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Scenario: ${scenario.name}`);
  console.log('='.repeat(80));
  
  const restData = loadResults('rest', scenario.id);
  const graphqlData = loadResults('graphql', scenario.id);
  
  if (!restData || !graphqlData) {
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
  printMetric('P95 Latency (ms)', restMetrics.p95Latency, graphqlMetrics.p95Latency);
  printMetric('P99 Latency (ms)', restMetrics.p99Latency, graphqlMetrics.p99Latency);
  
  console.log('-'.repeat(80));
  
  // Throughput
  printMetric('Requests/sec', restMetrics.requestsPerSec, graphqlMetrics.requestsPerSec);
  printMetric('Total Requests', restMetrics.totalRequests, graphqlMetrics.totalRequests, false);
  
  console.log('-'.repeat(80));
  
  // Error Rate
  printMetric('Error Rate (%)', restMetrics.failedRequests, graphqlMetrics.failedRequests);
  
  console.log('-'.repeat(80));
  
  // Network
  printMetric('Data Received (MB)', restMetrics.dataReceived, graphqlMetrics.dataReceived);
  printMetric('Data Sent (MB)', restMetrics.dataSent, graphqlMetrics.dataSent);
  
  console.log('-'.repeat(80));
  
  // Winner analysis
  analyzeWinner(restMetrics, graphqlMetrics);
  
  return { rest: restMetrics, graphql: graphqlMetrics };
}

function printMetric(name, restValue, graphqlValue, showDiff = true) {
  const restStr = restValue.toFixed(2);
  const graphqlStr = graphqlValue.toFixed(2);
  
  let diffStr = '';
  if (showDiff) {
    const diff = ((graphqlValue - restValue) / restValue * 100);
    const sign = diff > 0 ? '+' : '';
    diffStr = `${sign}${diff.toFixed(2)}%`;
    
    // Add emoji indicator
    if (Math.abs(diff) < 5) {
      diffStr += ' ≈'; // Similar
    } else if (diff < 0) {
      diffStr += ' ✓'; // GraphQL faster
    } else {
      diffStr += ' ✗'; // REST faster
    }
  }
  
  console.log(
    name.padEnd(25) + 
    restStr.padEnd(15) + 
    graphqlStr.padEnd(15) + 
    diffStr
  );
}

function analyzeWinner(rest, graphql) {
  console.log('\n🏆 Analysis:');
  
  // Latency winner (lower is better)
  if (rest.p95Latency < graphql.p95Latency) {
    const diff = ((graphql.p95Latency - rest.p95Latency) / rest.p95Latency * 100);
    console.log(`   • REST is ${diff.toFixed(1)}% faster (p95 latency)`);
  } else {
    const diff = ((rest.p95Latency - graphql.p95Latency) / graphql.p95Latency * 100);
    console.log(`   • GraphQL is ${diff.toFixed(1)}% faster (p95 latency)`);
  }
  
  // Throughput winner (higher is better)
  if (rest.requestsPerSec > graphql.requestsPerSec) {
    const diff = ((rest.requestsPerSec - graphql.requestsPerSec) / graphql.requestsPerSec * 100);
    console.log(`   • REST handles ${diff.toFixed(1)}% more requests/sec`);
  } else {
    const diff = ((graphql.requestsPerSec - rest.requestsPerSec) / rest.requestsPerSec * 100);
    console.log(`   • GraphQL handles ${diff.toFixed(1)}% more requests/sec`);
  }
  
  // Data transfer
  const restTotal = rest.dataReceived + rest.dataSent;
  const graphqlTotal = graphql.dataReceived + graphql.dataSent;
  if (restTotal > graphqlTotal) {
    const diff = ((restTotal - graphqlTotal) / graphqlTotal * 100);
    console.log(`   • REST transfers ${diff.toFixed(1)}% more data`);
  } else {
    const diff = ((graphqlTotal - restTotal) / restTotal * 100);
    console.log(`   • GraphQL transfers ${diff.toFixed(1)}% more data`);
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

let restWins = 0;
let graphqlWins = 0;

Object.keys(allResults).forEach(scenarioId => {
  const { rest, graphql } = allResults[scenarioId];
  if (rest.p95Latency < graphql.p95Latency) {
    restWins++;
  } else {
    graphqlWins++;
  }
});

console.log(`\nLatency Winner (P95):`);
console.log(`  REST wins: ${restWins} scenarios`);
console.log(`  GraphQL wins: ${graphqlWins} scenarios`);

console.log('\n✅ Comparison complete!');
console.log('\nNext: Use these results in your thesis Chapter 4 (Results)');
console.log('');