#!/bin/bash
# Run all k6 load test scenarios for REST and GraphQL
# Usage: ./tests/k6/run-all.sh

set -e

echo "=========================================="
echo "  APS Load Testing - Paired Benchmark"
echo "=========================================="
echo ""

mkdir -p tests/results/rest
mkdir -p tests/results/graphql

SCENARIOS=(
  "01-simple-list"
  "02-list-with-relations"
  "03-filtered-slots"
  "04-nested-dashboard"
  "05-booking-creation"
  "06-mixed-workload"
)

run_scenario() {
  local scenario=$1
  local api=$2
  
  echo "=========================================="
  echo "📊 Scenario: ${scenario} (${api})"
  echo "=========================================="
  echo ""
  
  ./scripts/monitor-resources.sh 300 "tests/results/${api}/${scenario}-resources.csv" "aps-${api}-api" &
  MONITOR_PID=$!
  
  echo "Running k6 test..."
  k6 run \
    --out json=tests/results/${api}/${scenario}-raw.json \
    --summary-export=tests/results/${api}/${scenario}-summary.json \
    tests/k6/scenarios/${scenario}-${api}.js
  
  wait $MONITOR_PID
  
  echo ""
  echo "✅ Completed: ${scenario} (${api})"
  echo ""
}

# 🔥 Paired execution
for scenario in "${SCENARIOS[@]}"; do
  echo "##########################################"
  echo "🚀 Running Scenario Pair: ${scenario}"
  echo "##########################################"
  echo ""

  # Run REST first
  run_scenario "${scenario}" "rest"

  echo "⏳ Short cooldown (15s)..."
  sleep 15

  # Run GraphQL immediately after
  run_scenario "${scenario}" "graphql"

  echo ""
  echo "🧊 Cooling down between scenario pairs (30s)..."
  sleep 30
  echo ""
done

echo ""
echo "=========================================="
echo "  🎉 All Paired Tests Complete!"
echo "=========================================="
echo ""

echo "Summary:"
echo "  - Scenarios tested: ${#SCENARIOS[@]}"
echo "  - Mode: REST vs GraphQL (paired)"
echo "  - Total test runs: $((${#SCENARIOS[@]} * 2))"
echo ""
echo "Next steps:"
echo "  1. Analyze results: node scripts/compare-results.js"
echo "  2. View resource usage: cat tests/results/*/01-simple-list-resources.csv"
echo "  3. Generate thesis charts from JSON files"
echo ""