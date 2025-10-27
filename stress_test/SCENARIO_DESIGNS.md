# Stress Testing Scenario Designs

**Date:** October 27, 2025  
**Purpose:** Detailed specifications for 4 stress test scenarios designed to find breaking points and failure modes

---

## Breaking Point Criteria

System is considered to have reached breaking point when ANY of the following occurs:

1. **Error Rate > 5%** - More than 5% of requests fail
2. **Response Time > 5 seconds** (95th percentile) - System becomes unusably slow
3. **HTTP 500 Errors** - Server internal errors indicating failure
4. **Connection Refused** - System stops accepting connections
5. **Timeouts** - Requests time out (>30 seconds)
6. **System Crash** - Application becomes unresponsive

---

## Scenario 1: Progressive Stress Test (Breaking Point Discovery)

### Objective
Find the **EXACT** breaking point by gradually increasing load until system fails.

### Configuration
- **Thread Group Type:** Stepping Thread Group
- **Initial Users:** 100 concurrent users
- **Increment:** +50 users every 2 minutes
- **Maximum Users:** 500 concurrent users (or until failure)
- **Total Duration:** 20 minutes (if reaches 500 users)
- **Ramp-up per Step:** 30 seconds
- **Hold Time per Step:** 90 seconds

### Load Pattern
```
Time    | Users | Action
--------|-------|------------------------------------------
0-0:30  | 0→100 | Ramp up to 100 users
0:30-2:00| 100  | Hold at 100 users (measure baseline)
2:00-2:30| 100→150| Ramp up to 150 users
2:30-4:00| 150  | Hold at 150 users
4:00-4:30| 150→200| Ramp up to 200 users (expected auth failure)
4:30-6:00| 200  | Hold at 200 users (observe failure)
6:00-6:30| 200→250| Ramp up to 250 users
6:30-8:00| 250  | Hold at 250 users (critical failure likely)
8:00+    | Continue until system crashes
```

### User Behavior (Per User, Per Iteration)
1. **Login** (POST /api/v1/auth/login) - Think time: 0-1s
   - Expected to fail first at 150-200 users
2. **Get Products** (GET /api/v1/product/get-product) - Think time: 0-1s
3. **Apply Filters** (POST /api/v1/product/product-filters) - Think time: 0-1s
   - Expected to fail second at 200-300 users
4. **View Product Details** (GET /api/v1/product/get-product/:id) - Think time: 0-1s
5. **Repeat** - No delay between iterations (maximum stress)

### Expected Results
- **100-150 users:** System stable, 0-1% errors
- **150-200 users:** Auth endpoints start failing (CPU 70-90%, 2-5% errors)
- **200-250 users:** Auth critical (CPU 100%, 5-15% errors), filters start failing
- **250-300 users:** System-wide failures (15-30% errors)
- **300+ users:** Crash likely (30-50% errors or system hang)

### Metrics to Capture
- **Breaking Point User Count** (exact number when errors > 5%)
- **First Endpoint to Fail** (auth, product, or filter)
- **Error Rate Growth** (0% → 5% → 20% → crash)
- **Response Time at Failure** (when 95th percentile > 5s)
- **CPU/Memory at Failure** (expect CPU 100%, memory exhaustion)

---

## Scenario 2: Spike Stress Test (Shock Resistance)

### Objective
Test system's ability to handle **sudden extreme load spike**. Simulate flash sale or viral event.

### Configuration
- **Thread Group Type:** Ultimate Thread Group
- **Initial Users:** 50 concurrent users (baseline)
- **Spike to:** 500 concurrent users **INSTANTLY**
- **Hold Time:** 5 minutes at 500 users
- **Ramp Down:** 1 minute to 0 users

### Load Pattern
```
Time    | Users | Action
--------|-------|------------------------------------------
0-1:00  | 0→50  | Ramp up to 50 users (baseline)
1:00-2:00| 50   | Hold at 50 users (stable baseline)
2:00    | 50→500| INSTANT spike to 500 users (0 seconds!)
2:00-7:00| 500  | Hold at 500 users (observe crash behavior)
7:00-8:00| 500→0| Ramp down to 0 users
```

### User Behavior (Same as Progressive)
1. Login → Get Products → Apply Filters → View Product → Repeat

### Expected Results
- **0-2:00 (50 users):** Stable, 0% errors
- **2:00 (500 instant):** **Immediate crash likely**
  - Connection refused
  - Timeout errors
  - 500 errors
  - System may hang completely
- **Goal:** Measure time to failure (seconds or minutes?)

### Metrics to Capture
- **Time to First Error** (how fast does it fail?)
- **Time to Complete Failure** (when does it crash?)
- **Error Types** (connection refused, timeout, 500)
- **Recovery Time** (if system recovers, how long?)
- **Requests Lost** (how many requests fail during spike?)

---

## Scenario 3: Extreme Stress Test (Maximum Sustained Load)

### Objective
Observe **failure modes** under extreme sustained load. How does system behave when pushed to absolute limits?

### Configuration
- **Thread Group Type:** Standard Thread Group
- **Target Users:** 400 concurrent users (beyond expected capacity)
- **Ramp-up:** 2 minutes to 400 users
- **Hold Time:** 5 minutes at 400 users
- **Total Duration:** 7 minutes

### Load Pattern
```
Time    | Users | Action
--------|-------|------------------------------------------
0-2:00  | 0→400 | Aggressive ramp to 400 users
2:00-7:00| 400  | Hold at 400 users (sustained stress)
```

### User Behavior (Same as Progressive)
1. Login → Get Products → Apply Filters → View Product → Repeat
2. **No think time** - Maximum pressure

### Expected Results
- **0-2:00 (ramp):** System degrading rapidly
- **2:00-7:00 (400 users):** Severe failures
  - CPU 100% sustained
  - Memory exhaustion
  - Database connection pool exhausted
  - **Failure cascade** - one service fails, triggers others
  - Error rate 30-70%

### Metrics to Capture
- **Failure Cascade Pattern** (which services fail in sequence?)
- **Resource Exhaustion** (CPU, memory, DB connections)
- **Error Rate Trend** (does it stabilize or keep climbing?)
- **System Behavior** (crash, hang, or degraded mode?)
- **Throughput Collapse** (requests/sec drop to 0?)

---

## Scenario 4: Recovery Stress Test (Self-Healing)

### Objective
Test system's ability to **recover after failure** and handle graceful degradation.

### Configuration
- **Thread Group Type:** Ultimate Thread Group
- **Phase 1 (Stress to Failure):** 0→400 users in 2 minutes, hold 3 minutes
- **Phase 2 (Recovery):** Drop to 50 users, hold 5 minutes
- **Total Duration:** 10 minutes

### Load Pattern
```
Time    | Users | Action
--------|-------|------------------------------------------
0-2:00  | 0→400 | Ramp up to 400 users (stress to failure)
2:00-5:00| 400  | Hold at 400 users (system fails)
5:00-5:30| 400→50| Drop to 50 users (allow recovery)
5:30-10:00| 50  | Hold at 50 users (test recovery)
```

### User Behavior
**Phase 1 (Stress):** Same as extreme stress
**Phase 2 (Recovery):**
1. Same requests but monitor: Do they succeed now?
2. Track error rates over time

### Expected Results
**Phase 1 (0-5:00):**
- System fails (30-70% errors)
- CPU 100%, memory exhausted
- Services crashing

**Phase 2 (5:00-10:00):**
- **Option A (Good):** System self-heals
  - Error rate drops from 50% → 5% → 0%
  - Response times normalize
  - No restart needed
- **Option B (Bad):** System requires restart
  - Errors persist at 50 users
  - Lingering failures
  - Manual restart needed

### Metrics to Capture
- **Recovery Time** (how long to reach 0% errors?)
- **Self-Healing Capability** (auto-recovery or needs restart?)
- **Lingering Errors** (do errors persist after load drops?)
- **Graceful Degradation** (does system degrade gracefully or crash hard?)
- **Error Rate Recovery Curve** (50% → 20% → 5% → 0%)

---

## Test Data Requirements

### Users CSV (`stress_test/data/users.csv`)
```csv
email,password
stressuser001@test.com,StressTest123!
stressuser002@test.com,StressTest123!
...
stressuser100@test.com,StressTest123!
```
- **100+ unique users** to avoid auth conflicts
- Same password for simplicity
- Users must be pre-registered in database

### Products CSV (`stress_test/data/products.csv`)
```csv
productId
67123abc456def789012
67123abc456def789013
...
```
- **200+ product IDs** for varied filtering
- IDs extracted from actual database

### Filters CSV (`stress_test/data/filters.csv`)
```csv
category,priceMin,priceMax
electronics,0,1000
clothing,0,500
books,0,100
```
- **Multiple filter combinations** to stress DB queries

---

## JMeter Test Plan Structure

```
Test Plan: E-Commerce Stress Testing
├── Thread Group 1: Progressive Stress (Scenario 1)
│   ├── CSV Data: users.csv
│   ├── CSV Data: products.csv
│   ├── CSV Data: filters.csv
│   ├── HTTP Defaults: localhost:8080
│   ├── HTTP Cookie Manager
│   ├── HTTP Header Manager (Content-Type: application/json)
│   ├── User Flow:
│   │   ├── POST Login (extract token)
│   │   ├── GET Products
│   │   ├── POST Filters
│   │   ├── GET Product Details
│   └── Listeners:
│       ├── Summary Report
│       ├── Aggregate Report
│       ├── Active Threads Over Time
│       ├── Response Times Over Time
│       ├── Errors Per Second
│       └── Backend Listener (HTML Dashboard)
│
├── Thread Group 2: Spike Stress (Scenario 2) [DISABLED by default]
├── Thread Group 3: Extreme Stress (Scenario 3) [DISABLED by default]
└── Thread Group 4: Recovery Stress (Scenario 4) [DISABLED by default]
```

**Note:** Only enable ONE thread group at a time to avoid interference.

---

## Success Criteria for Scenario Design

✅ **Progressive:** Successfully identifies exact breaking point user count  
✅ **Spike:** Measures shock resistance and time to failure  
✅ **Extreme:** Documents failure cascade and behavior at maximum stress  
✅ **Recovery:** Tests self-healing capability after failure  

All scenarios designed to **find failures, NOT optimize performance** (pure stress testing scope).

---

## Next Steps

1. ✅ Scenario designs complete
2. ⏭️ Create test data (users.csv, products.csv, filters.csv)
3. ⏭️ Build JMeter test plan with all 4 scenarios
4. ⏭️ Execute stress tests and capture breaking points
