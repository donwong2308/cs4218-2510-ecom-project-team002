# Stress Test Documentation

**Project:** E-Commerce Application (CS4218-2510-ECOM-PROJECT-TEAM002)  
**Test Type:** Performance Testing - Stress Testing (Breaking Point Discovery)  
**Tool:** Apache JMeter 5.6.3  
**Date:** November 2, 2025

---

## 📚 Documentation Structure

This folder contains all documentation related to stress testing the e-commerce application. The documentation is organized into **3 core documents** that cover test strategy, results analysis, and user guide.

### **Core Documentation** (Required Reading)

1. **[STRESS_TEST_STRATEGY.md](STRESS_TEST_STRATEGY.md)** - Test Strategy & Design
   - Test objectives and approach
   - Test identification methodology
   - Thread group configurations
   - Endpoint selection rationale
   - Test data design
   - Graph and metrics selection
   - JMeter optimization decisions

2. **[STRESS_TEST_RESULTS_ANALYSIS.md](STRESS_TEST_RESULTS_ANALYSIS.md)** - Results & Performance Analysis
   - Executive summary
   - Test execution statistics
   - Performance metrics (response time, throughput, error rate)
   - Defect density analysis
   - Availability and capacity metrics
   - Root cause analysis (bcrypt, regex, photos)
   - Optimization recommendations
   - Production deployment checklist

3. **[STRESS_TEST_USER_GUIDE.md](STRESS_TEST_USER_GUIDE.md)** - How to Use JMeter
   - Quick start guide
   - Installation and setup
   - Test plan overview
   - Running tests (GUI and non-GUI modes)
   - Viewing results (HTML dashboard, CSV, console)
   - Troubleshooting common issues

### **Supporting Documentation** (Reference)

4. **[CONFIGURATION_FIX_RESULTS.md](CONFIGURATION_FIX_RESULTS.md)** - Phase 0 Configuration Fixes
   - Before/after comparison of configuration issues
   - CSV header fixes, endpoint URL corrections
   - Error rate improvement (49.75% → 0%)

5. **[STRESS_TEST_BREAKING_POINT_ANALYSIS.md](STRESS_TEST_BREAKING_POINT_ANALYSIS.md)** - Additional Analysis
   - Detailed breaking point timeline
   - System behavior under extreme load

---

## 🎯 Quick Navigation by Purpose

### I want to understand the test strategy and design decisions
→ Read: **[STRESS_TEST_STRATEGY.md](STRESS_TEST_STRATEGY.md)**

**Key Sections:**
- Section 1: Test Strategy Overview
- Section 2: Test Plan Design
- Section 3: Endpoint Selection & Rationale
- Section 4: Graph & Metrics Selection

### I want to see the test results and performance metrics
→ Read: **[STRESS_TEST_RESULTS_ANALYSIS.md](STRESS_TEST_RESULTS_ANALYSIS.md)**

**Key Sections:**
- Section 1: Test Execution Statistics
- Section 2: Performance Metrics Analysis
- Section 4: Performance Test Metrics Summary
- Section 5: Optimization Recommendations

### I want to run the stress tests myself
→ Read: **[STRESS_TEST_USER_GUIDE.md](STRESS_TEST_USER_GUIDE.md)**

**Key Sections:**
- Section 1: Quick Start (3 commands to run test)
- Section 4: Running Tests
- Section 5: Viewing Results
- Section 6: Troubleshooting

---

## 📊 Test Results Summary

### Breaking Point Identified ✅

| Metric | Value |
|--------|-------|
| **Breaking Point** | 1,800-2,000 concurrent users |
| **Error Rate at Peak** | 50.59% (system collapse) |
| **Safe Capacity** | 1,500 concurrent users (0% errors) |
| **Production Recommendation** | 1,200 concurrent users (with 20% safety margin) |
| **Primary Bottleneck** | bcrypt CPU saturation (POST /register) |
| **Total Requests Tested** | 47,855 |
| **Total Errors** | 2,329 (4.87%) |
| **Test Duration** | 7 minutes 31 seconds |

### Performance Metrics

| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
| **Response Time** | <2s | 12.2s avg | ❌ Failed at 1800+ users |
| **Throughput** | Maximize | 124.2 req/s peak | ✅ Achieved at 1750 users |
| **Error Rate** | <1% | 0% (0-1750 users) | ✅ Met below 1800 users |
| **Availability** | 99.9% | 95.13% overall | ❌ Failed at peak load |
| **Concurrent Users** | Support peak | 1,500 safe capacity | ✅ Breaking point found |

---

## 🔍 Test Strategy Highlights

### Approach to Test Identification

**Phase 0: Initial Assessment**
- Tested read-heavy operations (login, get-products, filters)
- Result: 0% error rate at 2000 users - too easy!

**Phase 1: Targeted Stress Test** ✅
- Analyzed all 29 backend endpoints for resource consumption
- Selected 7 endpoints (24.1% coverage) based on CPU/memory/database intensity
- Added 3 high-impact endpoints:
  1. **POST /register** - bcrypt hashing (60-100ms CPU per request)
  2. **GET /search/:keyword** - regex search (no indexes)
  3. **GET /product-photo/:pid** - 1MB binary transfers
- Result: **Breaking point found at 1,800-2,000 users**

### Why These Endpoints?

**Selection Criteria:**
1. **CPU-Intensive Operations:** bcrypt hashing, regex searches
2. **Memory-Intensive Operations:** Large binary transfers (1MB images)
3. **No Caching Possible:** Unique data per request
4. **Real-World Usage:** Critical user flows (registration, search)

### Thread Group Configuration

**Progressive Stress (500→2000 users)** - Enabled
- Gradual increase: 500 → 2000 users over 6 minutes
- Step size: +250 users every 30 seconds
- Purpose: Find exact breaking point

---

## 📈 Metrics & Statistics

### Class-Based Metrics

From CS4218 - Software Testing course:

1. **Response Time** - Time from request to response
   - Target: <2s
   - Result: 12.2s average (6x slower than target at peak)

2. **Throughput** - Requests processed per second
   - Peak: 124.2 req/s at 1750 users
   - Collapse: 65.3 req/s (47% drop)

3. **Error Rate** - Percentage of failed requests
   - Healthy: 0% (0-1750 users)
   - Breaking: 32.54% (1800-2000 users)
   - Collapse: 50.59% (system failure)

4. **Concurrent Users** - Simultaneous active users
   - Safe: 1,500 concurrent users
   - Breaking: 1,800-2,000 concurrent users

### Additional Metrics

5. **Defect Density** - Errors per request
   - Overall: 0.0487 defects/request (4.87%)
   - Register endpoint: 0.265 (26.5%) - Critical
   - Search endpoint: 0.059 (5.9%) - High

6. **Availability** - System uptime percentage
   - Overall: 95.13%
   - Healthy stage: 99.74% (0-1750 users)
   - Collapse stage: 49.41% (2000 users sustained)

7. **Mean Time Between Failures (MTBF)**
   - Result: 351 seconds (5.85 minutes)
   - Interpretation: System reliable for ~6 minutes before first critical failure

8. **Capacity Utilization**
   - Safe capacity: 1,500 users (100% utilization at 0% errors)
   - Breaking point: 1,800 users (120% utilization)
   - Collapse: 2,000 users (133% utilization)

---

## 🛠️ Test Infrastructure

### JMeter Configuration

- **Version:** Apache JMeter 5.6.3
- **Heap Size:** 4GB (increased from 1GB to support 2000+ threads)
- **Location:** `stress_test/apache-jmeter-5.6.3/`
- **Test Plan:** `stress_test/jmeter/E-Commerce-Stress-Testing.jmx`

### Test Data Files

Located in `stress_test/data/`:

| File | Records | Purpose |
|------|---------|---------|
| `unique_users.csv` | 100 | Registration testing (unique emails, no bcrypt caching) |
| `search_keywords.csv` | 88 | Search testing (diverse keywords, no query caching) |
| `products.csv` | 5 | Product queries (real MongoDB ObjectIds) |
| `filters.csv` | 5 | Filter testing (real category ObjectIds) |

### Graphs & Visualizations

1. **Response Times Over Time** - Performance degradation tracking
2. **Transactions Per Second** - Throughput analysis
3. **Errors Per Second** - Failure rate visualization (NEW)

All results saved to `stress_test/reports/`

---

## 🚀 Quick Start

### Prerequisites

1. Backend server running on `localhost:6060`
2. JMeter installed in `stress_test/apache-jmeter-5.6.3/`
3. Test data files in `stress_test/data/`

### Run Stress Test (3 Commands)

```powershell
# 1. Navigate to JMeter bin
cd stress_test\apache-jmeter-5.6.3\bin

# 2. Run test (non-GUI mode)
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\results-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').jtl"

# 3. Generate HTML dashboard
$latest = Get-ChildItem "..\..\reports\results-*.jtl" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
.\jmeter.bat -g $latest.FullName -o "..\..\reports\dashboard-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
```

**Expected Duration:** 7-8 minutes  
**Expected Breaking Point:** 1,800-2,000 concurrent users  
**Expected Error Rate:** 4-5% overall, 50%+ at collapse

For detailed instructions, see **[STRESS_TEST_USER_GUIDE.md](STRESS_TEST_USER_GUIDE.md)**

---

## 🔧 Root Cause Analysis

### Primary Bottleneck: bcrypt CPU Saturation

**Endpoint:** `POST /api/v1/auth/register`

**Why it broke the system:**
```javascript
// authController.js - line 41
const hashedPassword = await hashPassword(password);
// bcrypt.hash() with 10 rounds = 60-100ms CPU blocking per request
```

**CPU Math:**
- 2000 registrations/minute = 33.3 registrations/second
- 33.3 registrations × 80ms each = 2,664ms CPU time per second
- Node.js single thread = 1,000ms CPU time per second available
- **Result: 2.66x CPU oversubscription → system breakdown**

### Secondary Bottleneck: Regex Search CPU

**Endpoint:** `GET /api/v1/product/search/:keyword`

**Impact:**
- Case-insensitive regex on multiple fields (name, description)
- No index usage (regex queries can't leverage indexes effectively)
- Full collection scan (all documents examined)
- CPU-intensive string matching

### Tertiary Bottleneck: Memory/Bandwidth (Photos)

**Endpoint:** `GET /api/v1/product/product-photo/:pid`

**Impact:**
- Loads 1MB image per request from MongoDB
- 2000 concurrent users × 1MB = 2GB simultaneous memory usage
- Network bandwidth exhaustion (2GB/s exceeds capacity)
- BSON storage inefficiency

---

## ✅ Optimization Recommendations

### Priority 1: Critical (Immediate Impact)

1. **Reduce bcrypt rounds (10 → 8)** - 40% faster hashing
2. **Add database text index** - 70-80% faster search queries
3. **Move photos to CDN/S3** - 90% memory reduction
4. **Implement rate limiting** - Prevent overload beyond 1,200 safe capacity

**Expected Improvement:** Breaking point increases from 1,800 → 3,000-4,000 users

### Priority 2: Important (Significant Impact)

5. **Add database indexes** (category, price, slug) - 50-90% faster queries
6. **Implement caching layer (Redis)** - 80-95% faster for cached queries

**Expected Improvement:** Breaking point increases to 5,000-6,000 users

### Priority 3: Recommended (Long-term)

7. **Horizontal scaling** (load balancer + 3 servers) - 3x capacity
8. **Implement queue system** (Bull/RabbitMQ) - Offload background jobs
9. **Database replication** (MongoDB replica set) - Improved read performance

**Expected Improvement:** Breaking point increases to 10,000+ users

For complete recommendations with code examples, see **[STRESS_TEST_RESULTS_ANALYSIS.md](STRESS_TEST_RESULTS_ANALYSIS.md)** Section 5.

---

## 📝 Requirements Fulfilled

### Test Strategy for Performance Testing ✅

**Approach to Test Identification:**
- Code review of all 29 backend endpoints
- Complexity analysis (O(n) regex, bcrypt rounds, unindexed queries)
- Resource profiling (CPU/memory/IO impact per endpoint)
- Prioritization (ranked by expected breaking point)

**Documentation:** See **[STRESS_TEST_STRATEGY.md](STRESS_TEST_STRATEGY.md)** Section 1-3

### Test Statistics ✅

**Metrics Used (From Class):**
1. Response Time - 12,170ms average (Target: <2s)
2. Throughput - 124.2 req/s peak (Target: Maximize)
3. Error Rate - 4.87% overall (Target: <1%)
4. Concurrent Users - 1,800-2,000 breaking point

**Additional Metrics:**
5. Defect Density - 0.0487 defects/request
6. Availability - 95.13% overall
7. MTBF - 351 seconds (5.85 minutes)
8. Capacity Utilization - 133% at collapse

**Statistics Generated:**
- 47,855 total requests tested
- 2,329 errors analyzed by type
- 7 endpoints measured for performance
- 16 data points (30-second intervals) collected
- Response time percentiles (50th, 90th, 95th, 99th)
- Throughput per user calculations
- Error rate progression timeline

**Documentation:** See **[STRESS_TEST_RESULTS_ANALYSIS.md](STRESS_TEST_RESULTS_ANALYSIS.md)** Section 2 & 4

---

## 📁 Folder Structure

```
stress_test/
├── README.md                                    (This file - Overview)
├── STRESS_TEST_STRATEGY.md                      (Test strategy & design)
├── STRESS_TEST_RESULTS_ANALYSIS.md              (Results & performance analysis)
├── STRESS_TEST_USER_GUIDE.md                    (How to use JMeter)
├── CONFIGURATION_FIX_RESULTS.md                 (Phase 0 configuration fixes)
├── STRESS_TEST_BREAKING_POINT_ANALYSIS.md       (Additional analysis notes)
├── generate-html-report.ps1                     (PowerShell helper script)
│
├── apache-jmeter-5.6.3/                         (JMeter installation)
│   ├── bin/
│   │   ├── jmeter.bat                          (JMeter executable)
│   │   └── setenv.bat                          (Heap size configuration)
│   └── ...
│
├── jmeter/
│   └── E-Commerce-Stress-Testing.jmx            (Test plan file)
│
├── data/
│   ├── unique_users.csv                         (100 unique user records)
│   ├── search_keywords.csv                      (88 search terms)
│   ├── products.csv                             (5 real MongoDB product IDs)
│   └── filters.csv                              (5 category filters)
│
├── reports/                                      (Generated test results)
│   ├── results-[timestamp].jtl                  (Full test data)
│   ├── dashboard-[timestamp]/                   (HTML dashboard)
│   ├── response-times-[timestamp].csv           (Timeseries data)
│   ├── tps-[timestamp].csv                      (Throughput data)
│   └── errors-per-second-[timestamp].csv        (Error rate data)
│
└── results/                                      (Archived results)
```

---

## 🎓 Learning Outcomes

### Technical Learnings

1. **bcrypt is expensive** - 60-100ms CPU per hash, breaks system at low user counts
2. **Regex without indexes** - Causes CPU spikes, full collection scans
3. **Binary data in MongoDB** - Not optimized for large files (1MB+ images)
4. **Read-heavy operations don't stress test effectively** - Need write-heavy endpoints
5. **System shows 0% errors until sudden collapse** - No gradual degradation warning

### Performance Testing Learnings

6. **Progressive thread groups provide best insight** - Observe degradation stages
7. **Error rate alone insufficient** - Need response time + throughput analysis
8. **Think time matters** - 0-1s realistic yet aggressive for stress testing
9. **JVM heap size critical** - 4GB needed for 2000+ threads
10. **Non-GUI mode recommended** - GUI consumes significant overhead

### Capacity Planning Learnings

11. **Safe capacity: 1,500 users** - 0% errors, good response times
12. **Breaking point: 1,800-2,000 users** - 32-51% error rate
13. **Production recommendation: 1,200 users** - 20% safety margin
14. **Burst handling: 2000 users for <3 minutes** - System can handle spikes but not sustained load

---

## 📞 Support

For questions or issues:
- See **[STRESS_TEST_USER_GUIDE.md](STRESS_TEST_USER_GUIDE.md)** Section 6 (Troubleshooting)
- Check existing test results in `stress_test/reports/`
- Review configuration in `stress_test/jmeter/E-Commerce-Stress-Testing.jmx`

---

**Documentation Version:** 1.0  
**Last Updated:** November 2, 2025  
**Maintained By:** CS4218 Team 002
