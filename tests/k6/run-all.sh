#!/bin/bash
# Run all k6 load test scenarios for REST and GraphQL
# Usage: ./tests/k6/run-all.sh

set -e

echo "=========================================="
echo "  APS Load Testing - All Scenarios"
echo "=========================================="
echo ""

# Create results directories
mkdir -p tests/results/rest
mkdir -p tests/results/graphql

# All test scenarios
SCENARIOS=(
  "01-simple-list"
  "02-list-with-relations"
  "03-filtered-slots"
  "04-nested-dashboard"
  "05-booking-creation"
  "06-mixed-workload"
)

# Function to run scenario
run_scenario() {
  local scenario=$1
  local api=$2
  
  echo "=========================================="
  echo "📊 Scenario: ${scenario} (${api})"
  echo "=========================================="
  echo ""
  
  # Start resource monitoring in background
  ./scripts/monitor-resources.sh 300 "tests/results/${api}/${scenario}-resources.csv" "aps-${api}-api" &
  MONITOR_PID=$!
  
  # Run k6 test
  echo "Running k6 test..."
  k6 run \
    --out json=tests/results/${api}/${scenario}-raw.json \
    --summary-export=tests/results/${api}/${scenario}-summary.json \
    tests/k6/scenarios/${scenario}-${api}.js
  
  # Wait for resource monitoring to finish
  wait $MONITOR_PID
  
  echo ""
  echo "✅ Completed: ${scenario} (${api})"
  echo ""
  
  # Cool down period between tests
  echo "⏳ Cooling down for 30 seconds..."
  sleep 30
  echo ""
}

# Run REST tests
echo "=========================================="
echo "  PHASE 1: Testing REST API"
echo "=========================================="
echo ""

for scenario in "${SCENARIOS[@]}"; do
  run_scenario "${scenario}" "rest"
done

echo ""
echo "=========================================="
echo "  PHASE 2: Testing GraphQL API"
echo "=========================================="
echo ""

for scenario in "${SCENARIOS[@]}"; do
  run_scenario "${scenario}" "graphql"
done

echo ""
echo "=========================================="
echo "  🎉 All Tests Complete!"
echo "=========================================="
echo ""
echo "Results saved to tests/results/"
echo ""
echo "Summary:"
echo "  - Scenarios tested: ${#SCENARIOS[@]}"
echo "  - APIs tested: REST, GraphQL"
echo "  - Total test runs: $((${#SCENARIOS[@]} * 2))"
echo ""
echo "Next steps:"
echo "  1. Analyze results: node scripts/compare-results.js"
echo "  2. View resource usage: cat tests/results/*/01-simple-list-resources.csv"
echo "  3. Generate thesis charts from JSON files"
echo ""