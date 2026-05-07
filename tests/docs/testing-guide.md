# Step-by-Step Testing Guide

This guide explains how to run the REST and GraphQL load tests for the Apartment Booking System backend. It is intended for repeatable thesis or benchmark runs, so the steps emphasize environment consistency, authentication configuration, result collection, and documentation discipline.

## Prerequisites

Before running the tests, confirm that the following are available:

- Docker and Docker Compose are installed.
- The database service is available and seeded with the expected APS test data.
- Node.js dependencies are installed with `npm install`.
- k6 is installed and available from the terminal.
- The backend `.env` file is configured for the test environment.
- `DISABLE_OTP=true` is set before running k6 tests.

The k6 authentication helper logs in with phone number only and expects the login response to contain a JWT token. If `DISABLE_OTP` is not enabled, login returns an OTP session instead, and authenticated test scenarios will fail.

Verify the important environment variables:

```bash
grep -E "DISABLE_OTP|REST_PORT|GRAPHQL_PORT|JWT_SECRET|DB_" .env
```

The expected authentication setting is:

```env
DISABLE_OTP=true
```

## Step 1: Start and Verify the Backend

From the backend repository:

```bash
cd aps-backend
docker-compose up -d --build
docker-compose ps
```

Expected services:

```text
aps-rest-api       Up
aps-graphql-api    Up
```

If the database is managed by the separate `aps-db` project, verify that the database container is also running and reachable by both API containers.

Check the REST API health endpoint:

```bash
curl http://localhost:3001/health
```

Check the GraphQL server health endpoint:

```bash
curl http://localhost:3002/.well-known/apollo/server-health
```

## Step 2: Confirm Login Behavior

The load tests require direct token login. Run these checks before the benchmark.

REST login:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "phoneNumber": "+6281234567892" }'
```

The response must include `token` and `user`.

GraphQL login:

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($phoneNumber: String!) { login(input: { phoneNumber: $phoneNumber }) { token user { id fullName role } } }",
    "variables": { "phoneNumber": "+6281234567892" }
  }'
```

The response must include `data.login.token`. If either API returns `sessionId` instead of `token`, update `.env`, set `DISABLE_OTP=true`, and recreate the API containers:

```bash
docker-compose up -d --force-recreate rest-api graphql-api
```

## Step 3: Verify k6 and Scripts

Confirm k6 is installed:

```bash
k6 version
```

Make the benchmark scripts executable:

```bash
chmod +x tests/k6/run-all.sh
chmod +x scripts/monitor-resources.sh
chmod +x scripts/compare-results.js
```

The default k6 configuration is in:

```text
tests/k6/config/config.js
```

The default endpoints are:

```text
REST:    http://localhost:3001/api
GraphQL: http://localhost:3002/graphql
```

They can be overridden at runtime:

```bash
REST_URL=http://localhost:3001/api \
GRAPHQL_URL=http://localhost:3002/graphql \
k6 run tests/k6/scenarios/01-simple-list-rest.js
```

## Step 4: Run a Smoke Test

Run one public REST scenario:

```bash
k6 run tests/k6/scenarios/01-simple-list-rest.js
```

Run the matching GraphQL scenario:

```bash
k6 run tests/k6/scenarios/01-simple-list-graphql.js
```

A successful smoke test should show:

- `http_req_failed` below the configured threshold.
- `checks` above the configured threshold.
- HTTP status checks passing.
- No authentication errors for scenarios that require tokens.

If Scenario 1 passes but Scenario 2 fails with authentication errors, recheck `DISABLE_OTP=true` and repeat the login verification step.

## Step 5: Run the Full Paired Benchmark

Run all scenarios:

```bash
./tests/k6/run-all.sh
```

The script runs each scenario as a REST and GraphQL pair. It also starts Docker resource monitoring for the API container under test.

Current paired scenarios:

| Scenario | Name | Main comparison |
|----------|------|-----------------|
| 01 | Simple list | Public facility list retrieval |
| 02 | List with relations | REST relational endpoint vs GraphQL nested selection |
| 03 | Filtered slots | Parameterized availability query |
| 04 | Generic nested query | Client-composed REST calls vs GraphQL composed query |
| 05 | Optimized nested query | Dedicated dashboard endpoint/resolver |
| 06 | Booking creation | Write operation and conflict handling |

The full run usually takes more than one hour because each scenario runs for approximately five minutes per API, with cooldown periods between pairs.

During the benchmark:

- Keep the machine workload stable.
- Do not restart containers.
- Do not modify code, database seed data, or Docker resource limits.
- Keep the terminal open until the script finishes.
- Record the date, machine specifications, Docker limits, and git revision.

## Step 6: Monitor Resources Manually, If Needed

The full runner starts resource monitoring automatically. For manual observation in another terminal:

```bash
docker stats aps-rest-api aps-graphql-api
```

For a separate CSV capture:

```bash
./scripts/monitor-resources.sh 300 tests/results/manual-resources.csv all
```

The monitor records CPU, memory, and network statistics every five seconds.

## Step 7: Analyze Results

After the full run completes:

```bash
node scripts/compare-results.js
```

The comparison script reads:

```text
tests/results/rest/*-summary.json
tests/results/graphql/*-summary.json
tests/results/rest/*-resources.csv
tests/results/graphql/*-resources.csv
```

Important metrics to extract:

- Average, median, p90, and p95 latency.
- Requests per second.
- Total requests.
- Error rate.
- CPU usage.
- Memory usage.
- Data received and sent.

Example direct extraction:

```bash
jq '.metrics.http_req_duration.values["p(95)"]' tests/results/rest/01-simple-list-summary.json
jq '.metrics.http_reqs.rate' tests/results/rest/01-simple-list-summary.json
jq '.metrics.http_req_failed.rate' tests/results/rest/01-simple-list-summary.json
```

## Step 8: Organize Result Files

After a successful full run, the expected structure is:

```text
tests/results/
  rest/
    01-simple-list-raw.json
    01-simple-list-summary.json
    01-simple-list-resources.csv
    ...
  graphql/
    01-simple-list-raw.json
    01-simple-list-summary.json
    01-simple-list-resources.csv
    ...
```

Keep the raw JSON and CSV files. They provide the evidence needed to reproduce tables, charts, and statistical analysis.

For formal reporting, create a run log with:

- Date and time of the run.
- Host CPU, memory, and operating system.
- Docker resource limits.
- Backend git commit.
- Database seed version or dataset description.
- Value of `DISABLE_OTP`.
- k6 version.
- Notes about unexpected errors or interruptions.

## Troubleshooting

### k6 is not found

Install k6 and verify the installation:

```bash
k6 version
```

### Login returns `sessionId` instead of `token`

The OTP flow is still enabled. Set:

```env
DISABLE_OTP=true
```

Then recreate both API containers:

```bash
docker-compose up -d --force-recreate rest-api graphql-api
```

Repeat the REST and GraphQL login checks before rerunning k6.

### Authenticated scenarios fail with 401

Possible causes:

- `DISABLE_OTP` is not enabled in the running container.
- `JWT_SECRET` differs between token creation and token verification.
- The test phone numbers do not exist in the seeded database.
- The API containers were not recreated after `.env` changes.

Check the effective container environment:

```bash
docker exec aps-rest-api printenv DISABLE_OTP
docker exec aps-graphql-api printenv DISABLE_OTP
```

### Services are not healthy

Review container status and logs:

```bash
docker-compose ps
docker-compose logs rest-api
docker-compose logs graphql-api
```

Restart the services if needed:

```bash
docker-compose restart rest-api graphql-api
```

### Booking creation has conflicts

Some booking conflicts are expected in Scenario 06 because concurrent users may attempt to create bookings for overlapping facilities and times. Treat conflict rates as part of the write workload analysis, but investigate them if they exceed the configured threshold or are accompanied by system failures.

### Results vary between runs

Benchmark variation is normal. For thesis reporting:

- Run each scenario set multiple times.
- Use the median result or report all runs transparently.
- Avoid heavy background applications.
- Keep Docker resource limits unchanged.
- Allow cooldown time between runs.

## Research Reporting Checklist

Before using the results in a thesis or report, confirm that:

- The same backend commit was used for both APIs.
- REST and GraphQL used the same database and seed data.
- `DISABLE_OTP=true` was enabled for both API containers.
- Both APIs used equivalent Docker resource limits.
- The full scenario set completed without interruption.
- Raw result files were preserved.
- Any excluded run is documented with a reason.

The final report should include tables for latency, throughput, error rate, and resource utilization, followed by a short interpretation of the observed differences for each scenario.
