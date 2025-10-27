# Stress Testing Plan - E-Commerce Application
## Milestone 3: Non-Functional Testing

**Test Type:** Stress Testing  
**Tester:** Donavon  
**Date:** October 23, 2025  
**Application:** E-Commerce Platform (MERN Stack)

---

## 1. Objective

**Primary Goal:** Determine the breaking point of the e-commerce application by progressively increasing load beyond normal operational capacity until system failure occurs.

**Key Questions to Answer:**
- At what concurrent user count does the system start to fail?
- Which component fails first (API, database, authentication)?
- How does the system behave when overloaded?
- What is the failure recovery pattern?
- Can the system recover gracefully after stress is removed?

---

## 2. Stress Testing Approach

### 2.1 Strategy - PURE STRESS TESTING ONLY
**Focus:** Push system BEYOND normal operational capacity to find breaking points and failure modes.

**NOT Testing:**
- ❌ Load Testing (normal capacity performance)
- ❌ Performance Testing (response time benchmarking at normal load)
- ❌ Endurance Testing (long-duration stability at normal load)
- ❌ Capacity Testing (maximum sustainable capacity)

**ARE Testing:**
- ✅ Breaking Point Discovery (when does it fail?)
- ✅ Failure Behavior (how does it fail?)
- ✅ System Limits (what's the absolute maximum?)
- ✅ Stress Recovery (can it recover after failure?)

### 2.2 Stress Scenarios (All BEYOND Normal Capacity)

#### Scenario 1: Progressive Stress (Breaking Point Discovery)
- Start: 100 concurrent users (ABOVE normal capacity)
- Increment: +50 users every 2 minutes
- Continue until: **System FAILURE** or 500+ users
- Purpose: Find **exact breaking point** where system fails
- **Stress Focus:** Push past normal limits incrementally

#### Scenario 2: Spike Stress (Shock Test)
- Normal: 50 users for 1 minute
- Spike: Jump to **500 users INSTANTLY** (0s ramp-up)
- Duration: 3 minutes at extreme peak
- Purpose: Test system **shock resistance** - does it crash immediately?
- **Stress Focus:** Sudden extreme overload (simulates DDoS or viral traffic spike)

#### Scenario 3: Extreme Stress (Maximum Load Test)
- Load: **400 concurrent users** (well beyond capacity)
- Duration: 5 minutes continuous extreme stress
- Purpose: Observe **failure modes** at extreme load
- **Stress Focus:** Sustained extreme overload, not normal capacity

#### Scenario 4: Recovery Test (Post-Failure Resilience)
- Stress: 400 users for 3 minutes (force failure)
- Recovery: Drop to 50 users for 5 minutes
- Purpose: Test **recovery capability** after system failure
- **Stress Focus:** Can system self-heal after being stressed to failure?

---

## 3. Critical User Flows to Stress Test

### High Priority (Test First)
1. **Authentication Flow**
   - POST `/api/v1/auth/login`
   - POST `/api/v1/auth/register`
   - Stress Point: JWT token generation, bcrypt hashing

2. **Product Search & Filter**
   - POST `/api/v1/product/product-filters`
   - GET `/api/v1/product/search/:keyword`
   - Stress Point: Database queries, filtering logic

3. **Checkout & Payment**
   - POST `/api/v1/product/braintree/payment`
   - POST `/api/v1/product/braintree/token`
   - Stress Point: Payment gateway, transaction handling

### Medium Priority
4. **Product Browsing**
   - GET `/api/v1/product/get-product`
   - GET `/api/v1/product/product-list/:page`
   - Stress Point: Database reads, pagination

5. **Category Navigation**
   - GET `/api/v1/category/get-category`
   - Stress Point: Database lookups

---

## 4. JMeter Configuration

### 4.1 Thread Group Settings

#### Progressive Stress Configuration (Breaking Point Discovery)
```
Thread Group: Stepping Thread Group (Progressive Stress)
├── Initial Users: 100 (start ABOVE normal capacity)
├── Ramp-up Strategy: Step increases until FAILURE
│   ├── Step 1: 100 users (0-120s)
│   ├── Step 2: 150 users (120-240s) 
│   ├── Step 3: 200 users (240-360s) ← Expect errors to start
│   ├── Step 4: 250 users (360-480s) ← Expect degradation
│   ├── Step 5: 300 users (480-600s) ← Expect critical failures
│   ├── Step 6: 350 users (600-720s) ← Expect possible crash
│   ├── Step 7: 400 users (720-840s) ← Expect system failure
│   └── Step 8: 450+ users (until complete failure)
└── Loop: Continuous until system breaks
└── Goal: FIND EXACT BREAKING POINT
```

#### Spike Stress Configuration (Shock Test)
```
Thread Group: Spike Stress (Shock Resistance Test)
├── Normal Load: 50 users (1 minute warm-up)
├── Spike To: 500 users (0 second ramp-up = INSTANT)
├── Spike Duration: 180s at extreme load
├── Observation: Does system crash immediately?
└── Goal: TEST SHOCK RESISTANCE, not gradual capacity
```

#### Extreme Stress Configuration (Maximum Load)
```
Thread Group: Extreme Sustained Stress
├── Load: 400 users (well beyond capacity)
├── Ramp-up: 60s (rapid but not instant)
├── Duration: 300s at extreme load
├── Observation: Failure modes at maximum stress
└── Goal: OBSERVE FAILURE BEHAVIOR, not performance
```

### 4.2 Key JMeter Components

**Samplers:**
- HTTP Request Samplers for each API endpoint
- Constant Timer: 0-1s (minimal think time for stress)
- Gaussian Random Timer: Add variability

**Extractors:**
- JSON Extractor: Capture auth tokens
- Regular Expression Extractor: Extract dynamic IDs

**Assertions:**
- Response Assertion: Check status codes
- JSON Assertion: Validate response structure
- Duration Assertion: Flag slow responses (>3s = warning)

**Listeners:**
- Backend Listener: HTML Dashboard Report
- Summary Report: Quick overview
- Aggregate Report: Statistical analysis
- Response Time Graph: Visual timeline
- Active Threads Over Time: Thread visualization
- Transactions per Second: Throughput tracking

---

## 5. Metrics to Measure (STRESS TESTING SPECIFIC)

### 5.1 Stress Testing Metrics (NOT Performance Metrics)

**Focus on FAILURE, not performance optimization:**

**Breaking Point Metrics:**
- **User Count at First Failure** - Exact number when errors start
- **User Count at System Crash** - When system completely fails
- **Time to Failure** - How long until system breaks under stress
- **Failure Rate Progression** - How quickly errors increase
- **Recovery Time** - How long to stabilize after stress removed

**Failure Behavior Metrics:**
- **Error Types at Failure** (500 errors, timeouts, connection refused)
- **Which Endpoint Fails First** - Weakest link identification
- **Failure Cascade Pattern** - Does one failure trigger others?
- **System State at Failure** (CPU %, memory %, connections)

**Extreme Load Metrics (Beyond Normal Capacity):**
- Response Time at Breaking Point (will be degraded, not optimized)
- Throughput Degradation Rate (how fast it drops)
- Error Rate Growth (from 0% to 5%+ to crash)
- Resource Exhaustion (CPU 100%, memory 100%, connections maxed)

**NOT Measuring (Other team members' scope):**
- ❌ Optimal performance at normal load
- ❌ Response time benchmarks at reasonable load
- ❌ Throughput optimization
- ❌ Long-term stability at sustainable load

### 5.2 Breaking Point Indicators (Stress Test Success Criteria)

**System Failure Criteria:**
1. **Error Rate > 5%** - System entering failure state
2. **Error Rate > 20%** - System in critical failure
3. **Response Time > 10s** (95th percentile) - Extreme degradation
4. **HTTP 500 Errors** - Server crashes/exceptions
5. **Connection Timeouts** - Server not responding
6. **Connection Refused** - Server shutting down connections
7. **Database Connection Errors** - DB pool exhausted
8. **Memory Exhaustion** - Out of memory errors
9. **CPU 100%** sustained - Processing bottleneck

**Document for Each Failure:**
- **Exact concurrent user count** at failure
- **Which endpoint failed first** and why
- **Error type and message**
- **System behavior during failure** (crash, hang, slow death)
- **Recovery time** after load removal
- **Did it self-recover or need restart?**

---

## 6. Test Environment

**Application Server:**
- OS: Windows 11
- Node.js Version: [Record version]
- RAM: [Record available RAM]
- CPU: [Record CPU specs]

**Database:**
- MongoDB Version: [Record version]
- Connection Pool Size: [Record setting]
- Max Connections: [Record limit]

**Network:**
- Test Location: Localhost
- Network: Local loopback (no latency)

**JMeter:**
- Version: Apache JMeter 5.6+
- Java Version: [Record version]
- Heap Size: 2GB (for large tests)

---

## 7. Test Execution Plan

### Phase 1: Preparation (Day 1)
1. Set up test environment
2. Create test data (100+ users, 200+ products)
3. Build JMeter stress test plan (extreme load scenarios)
4. Run sanity test (5 users) to ensure endpoints work

### Phase 2: Quick Baseline - ONLY for comparison (Day 2)
**NOTE:** This is NOT performance testing, just establishing normal state
1. Run minimal test (10 users, 2 minutes)
2. Verify 0% errors at normal load
3. Record: "System works fine at 10 users" (baseline for stress comparison)
4. **Do NOT analyze performance** - only confirm system is functional

### Phase 3: Progressive Stress - Find Breaking Point (Day 2-3)
1. Execute progressive stress test (100→500 users)
2. **Monitor for FAILURE:** When do errors start? When does it crash?
3. **Document breaking point:** User count at first failure
4. **Document failure behavior:** How did it fail?
5. Test system recovery after stress

### Phase 4: Spike Stress - Shock Test (Day 3)
1. Execute spike stress test (50→500 instant)
2. **Observe crash behavior:** Does it crash immediately?
3. Measure time to failure
4. Document if/how system recovers

### Phase 5: Extreme Stress - Maximum Load (Day 4)
1. Execute extreme sustained stress (400 users, 5 min)
2. **Observe failure modes:** What fails first?
3. Monitor resource exhaustion (CPU, memory, connections)
4. Record failure cascade patterns

### Phase 6: Recovery Test (Day 4)
1. Stress to failure (400 users)
2. Remove stress (drop to 50 users)
3. **Measure recovery:** Does it self-heal? How long?
4. Test if system needs restart or recovers automatically

### Phase 7: Analysis - ONLY Stress/Failure Analysis (Day 5)
1. Analyze **breaking points** (not performance optimization)
2. Identify **weakest components**
3. Document **failure patterns**
4. Create **failure progression visualizations**
5. Write findings on **system limits and failure behavior**

---

## 8. Expected Results & Hypothesis (STRESS TESTING FOCUS)

**Hypothesis on Breaking Points:**
- System will **start showing errors** around 200-250 concurrent users
- System will **fail critically** around 300-400 concurrent users
- Authentication endpoint will **fail first** (bcrypt is CPU-intensive under stress)
- Product filter endpoint will **bottleneck second** (complex database queries)
- Complete system crash estimated at **400-500 concurrent users**

**Expected Failure Modes:**
1. **Authentication API** - CPU exhaustion from bcrypt hashing (first to fail)
2. **Database connection pool exhaustion** - Too many concurrent queries
3. **Node.js event loop blocking** - Single-threaded bottleneck
4. **Memory exhaustion** - Accumulating request objects
5. **Complete system crash** - Out of memory or connection refused

**Expected Stress Test Outcomes:**
- ✅ Successfully **crash the system** and identify breaking point
- ✅ Document **exact user count** at first failure
- ✅ Identify **weakest component** that fails first
- ✅ Observe **failure cascade** (one failure triggering others)
- ✅ Measure **recovery capability** after stress removal

**NOT Testing For (Other team members' scope):**
- ❌ Performance optimization recommendations
- ❌ Response time improvements at normal load
- ❌ Throughput maximization
- ❌ Long-term stability at sustainable load

---

## 9. Reporting Structure (STRESS TESTING SPECIFIC)

### 9.1 Visual Reports - Focus on FAILURE

**Required Graphs (All showing failure progression):**
1. **Error Rate vs Load** - Show when failures start (5%, 20%, crash)
2. **User Count at Breaking Point** - Highlight exact failure threshold
3. **Failure Timeline** - When did each component fail?
4. **Response Time Degradation Curve** - Show extreme degradation under stress
5. **Throughput Collapse** - Show capacity dropping to zero at failure
6. **Active Threads at Crash Point** - Thread count when system crashed
7. **Resource Exhaustion Graph** - CPU/Memory at 100%
8. **Recovery Timeline** - Time to stabilize after stress removal

**NOT Creating (Other testing types):**
- ❌ Performance optimization charts
- ❌ Response time benchmarks at normal load
- ❌ Throughput optimization graphs

### 9.2 Report Sections (STRESS TESTING FOCUS)

**Executive Summary:**
- **Breaking point discovered:** System fails at X concurrent users
- **Critical failures identified:** Which components crashed first
- **Failure behavior:** How system failed (crash, hang, errors)
- **Recovery capability:** Can it self-heal or needs restart?
- **Key recommendations:** How to prevent catastrophic failure

**Detailed Findings (Stress/Failure Focused):**
- **Progressive stress results:** Breaking point discovery
- **Spike stress results:** Shock resistance findings
- **Extreme stress results:** Maximum load failure modes
- **Recovery test results:** Self-healing capability
- **Failure sequence:** Which endpoints failed in what order
- **Failure root causes:** Why each component failed

**Recommendations (Failure Prevention):**
- **Prevent authentication overload:** Optimize bcrypt, add rate limiting
- **Prevent database exhaustion:** Increase connection pool, add indexes
- **Prevent system crashes:** Add circuit breakers, graceful degradation
- **Enable auto-recovery:** Health checks, auto-restart mechanisms
- **Set up monitoring:** Alert before hitting breaking point
- **Configure auto-scaling:** Scale up before failure threshold

**Appendices:**
- Raw failure data
- JMeter stress test configuration screenshots
- System logs during failure
- Environment specifications

---

## 10. Success Criteria

**Test Execution Success:**
- ✅ Successfully identify breaking point
- ✅ Document at least 3 bottleneck endpoints
- ✅ Generate comprehensive HTML dashboard
- ✅ Test all 4 stress scenarios
- ✅ Capture system behavior during failure

**Report Quality Success:**
- ✅ 10-15 pages comprehensive report
- ✅ Minimum 8 visualizations/graphs
- ✅ Actionable recommendations (minimum 5)
- ✅ Professional formatting
- ✅ Reproducible test plan

---

## 11. Risks & Mitigations

**Risk 1: System Crash During Test**
- Mitigation: Save results frequently, use -j flag for CLI mode

**Risk 2: JMeter Crashes (Too Many Threads)**
- Mitigation: Increase JMeter heap size, use distributed testing if needed

**Risk 3: Database Data Corruption**
- Mitigation: Use test database, backup before tests

**Risk 4: Can't Reach Breaking Point**
- Mitigation: Keep increasing load incrementally, use multiple JMeter instances

---

## 12. Next Steps

1. ✅ Coordinate with team (ensure no one else doing stress testing)
2. ✅ Install JMeter and plugins
3. ✅ Create test data
4. ✅ Build JMeter test plan
5. ✅ Execute baseline test
6. ✅ Execute progressive stress test
7. ✅ Execute spike stress test
8. ✅ Execute sustained stress test
9. ✅ Analyze results and create visualizations
10. ✅ Write final report
11. ✅ Package deliverables
12. ✅ Submit

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Status:** Planning Phase
