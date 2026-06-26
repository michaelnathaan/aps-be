#!/bin/bash
# Run all k6 load test scenarios for REST and GraphQL — repeated N times
# Usage: ./tests/k6/run-all-repeated.sh [NUM_RUNS]
#
# Results land in:
#   tests/results/rest/<scenario>-run<N>-summary.json
#   tests/results/rest/<scenario>-run<N>-resources.csv
#   (same for graphql/)
#
# After all runs, call:  node scripts/aggregate-results.js

set -e

NUM_RUNS=${1:-5}   # Default: 5 repetition
COOLDOWN_BETWEEN_RUNS=120   # 2 min between full paired runs (seconds)
COOLDOWN_BETWEEN_APIS=30    # 30 s between REST and GraphQL within a run

find_k6() {
  if command -v k6 &>/dev/null; then
    command -v k6
    return
  fi
  for candidate in \
      /usr/local/bin/k6 \
      /usr/bin/k6 \
      "$HOME/.local/bin/k6" \
      "$HOME/go/bin/k6"; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return
    fi
  done
  echo ""
}

K6=$(find_k6)
if [[ -z "$K6" ]]; then
  echo "    k6 not found. Install it from https://k6.io/docs/get-started/installation/"
  echo "    Then re-run this script."
  exit 1
fi
echo "✓  Using k6: $K6  ($(${K6} version 2>&1 | head -1))"
echo ""

echo "=========================================="
echo "  APS Load Testing — Repeated Benchmark"
echo "  Runs per scenario pair: ${NUM_RUNS}"
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

run_once() {
  local scenario=$1
  local api=$2
  local run_index=$3

  local out_prefix="tests/results/${api}/${scenario}-run${run_index}"

  echo "  ▶  [Run ${run_index}/${NUM_RUNS}] ${scenario} (${api})"

  if [[ "$scenario" == "06-booking-creation" ]]; then
    echo "     Wiping bookings ≥ today before run..."
    docker exec -t aps-postgres psql -U apsadmin -d apartment_booking \
      -c "DELETE FROM bookings WHERE booking_date >= CURRENT_DATE;" \
      > /dev/null
  fi

  ./scripts/monitor-resources.sh 300 \
    "${out_prefix}-resources.csv" \
    "aps-${api}-api" &
  MONITOR_PID=$!

  if ! "${K6}" run \
      --out json="${out_prefix}-raw.json" \
      --summary-export="${out_prefix}-summary.json" \
      tests/k6/scenarios/${scenario}-${api}.js; then
    echo "     ✗  k6 exited with an error — killing monitor."
    kill "${MONITOR_PID}" 2>/dev/null
    wait "${MONITOR_PID}" 2>/dev/null
    return 1
  fi

  wait $MONITOR_PID

  echo "     Done — results saved to ${out_prefix}-*"
  echo ""
}

TOTAL_RUNS=$((${#SCENARIOS[@]} * 2 * NUM_RUNS))
RUN_COUNT=0
START_TS=$(date +%s)

for scenario in "${SCENARIOS[@]}"; do
  echo "##########################################"
  echo "  Scenario: ${scenario}"
  echo "##########################################"
  echo ""

  for run in $(seq 1 ${NUM_RUNS}); do
    run_once "${scenario}" "rest" "${run}"
    RUN_COUNT=$((RUN_COUNT + 1))

    echo "     Cooldown ${COOLDOWN_BETWEEN_APIS}s before GraphQL run..."
    sleep ${COOLDOWN_BETWEEN_APIS}

    run_once "${scenario}" "graphql" "${run}"
    RUN_COUNT=$((RUN_COUNT + 1))

    if [ "${run}" -lt "${NUM_RUNS}" ]; then
      echo "     Cooldown ${COOLDOWN_BETWEEN_RUNS}s before next repetition..."
      sleep ${COOLDOWN_BETWEEN_RUNS}
    fi
  done

  echo ""
  echo "  All ${NUM_RUNS} runs complete for: ${scenario}"
  echo "  Cooling down 60s before next scenario..."
  echo ""
  sleep 60
done

END_TS=$(date +%s)
ELAPSED=$(( (END_TS - START_TS) / 60 ))

echo ""
echo "=========================================="
echo "  All Repeated Tests Complete!"
echo "=========================================="
echo ""
echo "  Scenarios    : ${#SCENARIOS[@]}"
echo "  Runs each    : ${NUM_RUNS}"
echo "  Total runs   : ${TOTAL_RUNS}"
echo "  Elapsed      : ~${ELAPSED} minutes"
echo ""
echo "Next steps:"
echo "  node scripts/aggregate-results.js"
echo "  node scripts/compare-results.js   (uses aggregated data)"
echo ""