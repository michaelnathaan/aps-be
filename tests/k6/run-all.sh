#!/bin/bash
# Run all k6 load test scenarios for REST and GraphQL
# Usage: ./tests/k6/run-all.sh
# DEPRECATED: Use run-all-repeated.sh for multiple runs and better resource monitoring.

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
  "04-generic-nested-query"
  "05-optimized-nested-query"
  "06-booking-creation"
)

run_scenario() {
  local scenario=$1
  local api=$2
  
  echo "=========================================="
  echo "Scenario: ${scenario} (${api})"
  echo "=========================================="
  echo ""

  if [[ "$scenario" == "06-booking-creation" ]]; then
    echo "Pre-test Cleanup: Wiping test data..."
    # Use TRUNCATE for Condition 1, or the DELETE query for Condition 2
    docker exec -t aps-postgres psql -U apsadmin -d apartment_booking -c "DELETE FROM bookings WHERE booking_date >= CURRENT_DATE;"
    # docker exec -t aps-postgres psql -U apsadmin -d apartment_booking -c "TRUNCATE bookings RESTART IDENTITY;"
  fi
  
  ./scripts/monitor-resources.sh 300 "tests/results/${api}/${scenario}-resources.csv" "aps-${api}-api" &
  MONITOR_PID=$!
  
  echo "Running k6 test..."
  k6 run \
    --out json=tests/results/${api}/${scenario}-raw.json \
    --summary-export=tests/results/${api}/${scenario}-summary.json \
    tests/k6/scenarios/${scenario}-${api}.js
  
  wait $MONITOR_PID
  
  echo ""
  echo "Completed: ${scenario} (${api})"
  echo ""
}

# Paired execution
for scenario in "${SCENARIOS[@]}"; do
  echo "##########################################"
  echo "Running Scenario Pair: ${scenario}"
  echo "##########################################"
  echo ""

  # Run REST first
  run_scenario "${scenario}" "rest"

  echo "Short cooldown (15s)..."
  sleep 30

  # Run GraphQL immediately after
  run_scenario "${scenario}" "graphql"

  echo ""
  echo "Cooling down between scenario pairs (30s)..."
  sleep 60
  echo ""
done

echo ""
echo "=========================================="
echo "  All Paired Tests Complete!"
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