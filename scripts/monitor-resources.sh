#!/bin/bash
# Monitor Docker container resources during load testing
# Usage: ./scripts/monitor-resources.sh <duration_seconds> <output_file> <container_name>

DURATION=${1:-300}  # Default 5 minutes
OUTPUT=${2:-"results/resources.csv"}
CONTAINER=${3:-"all"}  # all, rest-api, graphql-api

echo "Monitoring resources for ${DURATION} seconds..."
echo "Output: ${OUTPUT}"
echo "Container: ${CONTAINER}"
echo ""

# Create output directory
mkdir -p $(dirname ${OUTPUT})

# Write CSV header
echo "timestamp,container,cpu_percent,mem_usage_mb,mem_limit_mb,mem_percent,net_input_mb,net_output_mb" > ${OUTPUT}

# Monitor function
monitor_container() {
  local container_name=$1
  
  docker stats ${container_name} --no-stream --format \
    "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}}" | \
  while IFS=',' read -r name cpu mem_usage mem_perc netio; do
    # Parse memory usage (e.g., "123.4MiB / 512MiB" -> "123.4")
    mem_used=$(echo ${mem_usage} | awk '{print $1}' | sed 's/MiB//')
    mem_limit=$(echo ${mem_usage} | awk '{print $3}' | sed 's/MiB//')
    
    # Parse network I/O (e.g., "1.2MB / 3.4MB" -> "1.2" and "3.4")
    net_in=$(echo ${netio} | awk '{print $1}' | sed 's/MB//')
    net_out=$(echo ${netio} | awk '{print $3}' | sed 's/MB//')
    
    # Remove % sign from percentages
    cpu=$(echo ${cpu} | sed 's/%//')
    mem_p=$(echo ${mem_perc} | sed 's/%//')
    
    # Get timestamp
    timestamp=$(date +%s)
    
    # Write to CSV
    echo "${timestamp},${name},${cpu},${mem_used},${mem_limit},${mem_p},${net_in},${net_out}"
  done
}

# Start time
START_TIME=$(date +%s)
END_TIME=$((START_TIME + DURATION))

echo "Started monitoring at $(date)"
echo "Will stop at $(date -d @${END_TIME})"
echo ""

# Monitor loop
while [ $(date +%s) -lt ${END_TIME} ]; do
  if [ "${CONTAINER}" == "all" ]; then
    monitor_container "aps-rest-api" >> ${OUTPUT}
    monitor_container "aps-graphql-api" >> ${OUTPUT}
    monitor_container "aps-postgres" >> ${OUTPUT}
  else
    monitor_container "${CONTAINER}" >> ${OUTPUT}
  fi
  
  sleep 5  # Sample every 5 seconds
done

echo ""
echo "Monitoring complete!"
echo "Results saved to: ${OUTPUT}"
echo ""
echo "Summary:"
echo "--------"

# Calculate averages
awk -F',' 'NR>1 {
  container[$2]++
  cpu[$2]+=$3
  mem[$2]+=$4
}
END {
  for (c in container) {
    printf "%s: Avg CPU: %.2f%%, Avg Memory: %.2f MB\n", 
      c, cpu[c]/container[c], mem[c]/container[c]
  }
}' ${OUTPUT}