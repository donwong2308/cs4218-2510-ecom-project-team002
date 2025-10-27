# Stress Testing API Analysis - E-Commerce Application
## Endpoint Analysis for Breaking Point Discovery

**Date:** October 27, 2025  
**Purpose:** Identify which endpoints will FAIL FIRST under extreme stress  
**Focus:** Resource-intensive operations that will cause system breakdown

---

## API Endpoint Inventory

### 1. Authentication Routes (`/api/v1/auth`)

| Endpoint | Method | Resource Intensity | Predicted Failure Priority |
|----------|--------|-------------------|---------------------------|
| `/register` | POST | ⚠️ **CRITICAL - HIGHEST** | **#1 - WILL FAIL FIRST** |
| `/login` | POST | ⚠️ **CRITICAL - HIGHEST** | **#1 - WILL FAIL FIRST** |
| `/forgot-password` | POST | ⚠️ **CRITICAL - HIGH** | **#2** |
| `/profile` | PUT | Medium | #4 |
| `/user-auth` | GET | Low (token verification) | #6 |
| `/admin-auth` | GET | Low (token verification) | #6 |
| `/orders` | GET | Medium-High (DB query) | #3 |
| `/all-orders` | GET | High (full table scan) | #3 |

### 2. Product Routes (`/api/v1/product`)

| Endpoint | Method | Resource Intensity | Predicted Failure Priority |
|----------|--------|-------------------|---------------------------|
| `/product-filters` | POST | ⚠️ **CRITICAL - HIGH** | **#2 - COMPLEX QUERIES** |
| `/search/:keyword` | GET | High (DB text search) | #3 |
| `/get-product` | GET | High (fetch all products) | #4 |
| `/product-list/:page` | GET | Medium (pagination) | #5 |
| `/get-product/:slug` | GET | Medium (single query) | #5 |
| `/product-photo/:pid` | GET | Medium-High (binary data) | #4 |
| `/related-product/:pid/:cid` | GET | Medium-High | #4 |
| `/product-category/:slug` | GET | Medium | #5 |
| `/product-count` | GET | Low | #7 |
| `/braintree/token` | GET | Low | #7 |
| `/braintree/payment` | POST | ⚠️ **CRITICAL** (External API) | **#2** |

### 3. Category Routes (`/api/v1/category`)

| Endpoint | Method | Resource Intensity | Predicted Failure Priority |
|----------|--------|-------------------|---------------------------|
| `/get-category` | GET | Low (small dataset) | #7 |
| `/single-category/:slug` | GET | Low | #7 |

---

## Critical Stress Testing Targets

### 🔥 **Priority #1: Authentication Endpoints (WILL FAIL FIRST)**

**Endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`

**Why These Will Fail First:**
1. **bcrypt.hash() with saltRounds = 10** - Extremely CPU-intensive
   - Each password hash takes ~60-100ms on average CPU
   - Under 200+ concurrent requests: CPU will spike to 100%
   - Node.js single-threaded event loop will BLOCK
   - Causes cascade failure of entire application

2. **Database Lookups:**
   - `findOne({ email })` on every login/register
   - Under stress: Database connection pool exhaustion

3. **JWT Token Generation:**
   - Additional CPU overhead per request

**Expected Breaking Point:**
- **150-200 concurrent auth requests** → System starts failing
- **250-300 concurrent auth requests** → Complete failure / timeout
- **Error symptoms:** 500 errors, timeouts, connection refused

**Stress Test Focus:**
```
Progressive Stress: 50 → 100 → 150 → 200 → 250 auth requests
Expected Failure: ~200 concurrent bcrypt operations
```

---

### 🔥 **Priority #2: Product Filter Endpoint (COMPLEX QUERIES)**

**Endpoint:**
- `POST /api/v1/product/product-filters`

**Why This Will Fail Second:**
1. **Complex Database Queries:**
   - Filters by category, price range
   - Potentially unindexed fields
   - Multiple AND/OR conditions

2. **Resource Exhaustion:**
   - Heavy MongoDB aggregation/queries
   - Connection pool depletion
   - Memory usage spike

**Expected Breaking Point:**
- **200-300 concurrent filter requests** → Slow responses (>5s)
- **300+ concurrent filter requests** → Database timeouts

**Stress Test Focus:**
```
Test filter queries with:
- Multiple category filters
- Price range filters
- Pagination
Under 200+ concurrent users
```

---

### 🔥 **Priority #3: Payment Processing (EXTERNAL DEPENDENCY)**

**Endpoint:**
- `POST /api/v1/product/braintree/payment`

**Why This Will Fail:**
1. **External API Dependency:**
   - Braintree API rate limits
   - Network latency
   - Third-party service capacity

2. **Authentication Required:**
   - Depends on auth system (already stressed)

**Expected Breaking Point:**
- Depends on Braintree API limits
- Local system: 200+ concurrent payment attempts

**Stress Test Focus:**
```
NOTE: May need to mock payment gateway
Test payment flow failure under extreme load
```

---

### 🔴 **Priority #4: Product Listing & Search**

**Endpoints:**
- `GET /api/v1/product/get-product` (fetch all products)
- `GET /api/v1/product/search/:keyword`
- `GET /api/v1/product/product-photo/:pid`

**Why These Will Bottleneck:**
1. **Large Data Retrieval:**
   - Fetching all products (no pagination limit)
   - Binary photo data transfer

2. **Search Queries:**
   - Text search on product names/descriptions
   - Potentially slow without proper indexing

**Expected Breaking Point:**
- **300-400 concurrent requests** → Slow responses
- **500+ concurrent requests** → Database query queue buildup

---

## Predicted Failure Sequence

### Under Progressive Stress (100 → 500 users):

**Stage 1: 100-150 Users - System Stable**
- All endpoints functional
- Response times normal (<1s)
- 0% error rate

**Stage 2: 150-200 Users - Auth Starts Failing**
- ⚠️ **Login/Register endpoints show high response times (2-5s)**
- CPU usage spikes (70-90%)
- bcrypt operations queuing up
- Error rate: 1-3%

**Stage 3: 200-250 Users - Auth Critical Failure**
- ⚠️ **Login/Register endpoints failing (>10s or timeouts)**
- CPU at 100%
- Error rate: 5-15%
- Other endpoints start slowing down

**Stage 4: 250-300 Users - Product Filters Failing**
- ⚠️ **Product filter queries timing out**
- Database connection pool exhausted
- Error rate: 15-30%
- Cascade effect on other DB operations

**Stage 5: 300+ Users - System-Wide Failure**
- ⚠️ **Multiple endpoints failing**
- Database unresponsive
- Memory exhaustion
- Error rate: 30-50%
- Possible server crash

**Stage 6: 400+ Users - Complete Breakdown**
- ⚠️ **Connection refused errors**
- Server may crash or hang
- Error rate: 50-100%
- Manual restart may be required

---

## Resource Bottlenecks

### CPU Bottleneck
**Primary Cause:** bcrypt hashing (authentication)
- **Impact:** Blocks Node.js event loop
- **Failure Point:** ~200 concurrent auth requests
- **Symptoms:** High latency, timeouts, 500 errors

### Database Bottleneck
**Primary Cause:** Connection pool exhaustion
- **Default Pool Size:** ~5-10 connections (check MongoDB config)
- **Failure Point:** 200-300 concurrent DB queries
- **Symptoms:** Connection timeouts, query queue buildup

### Memory Bottleneck
**Primary Cause:** Request accumulation, buffering
- **Failure Point:** Sustained 300+ concurrent connections
- **Symptoms:** Gradual memory increase, eventual crash

### Network Bottleneck
**Primary Cause:** Photo transfers, large payloads
- **Failure Point:** 400+ concurrent photo requests
- **Symptoms:** Slow transfers, connection timeouts

---

## Stress Test Endpoint Priority

### For Progressive Stress Test (Breaking Point Discovery):
```
Primary Focus (50% of load):
  - POST /api/v1/auth/login (most critical)
  - POST /api/v1/auth/register

Secondary Focus (30% of load):
  - POST /api/v1/product/product-filters
  - GET /api/v1/product/get-product
  - GET /api/v1/product/search/:keyword

Tertiary Focus (20% of load):
  - GET /api/v1/product/get-product/:slug
  - GET /api/v1/product/product-list/:page
  - GET /api/v1/category/get-category
```

### For Spike Stress Test (Shock Resistance):
```
Instant Load Distribution:
  - 60% Authentication (login)
  - 30% Product filters
  - 10% Product browsing
```

### For Extreme Stress Test (Failure Modes):
```
Maximum Load Distribution:
  - 50% Authentication
  - 30% Database-heavy operations (filters, search)
  - 20% General browsing
```

---

## Expected System Behavior Under Stress

### Normal Operation (< 100 users):
- ✅ Response times: <1s
- ✅ Error rate: 0%
- ✅ CPU: 20-40%
- ✅ Memory: Stable

### Degradation Phase (150-200 users):
- ⚠️ Response times: 2-5s
- ⚠️ Error rate: 1-5%
- ⚠️ CPU: 70-90%
- ⚠️ Memory: Increasing

### Failure Phase (200-300 users):
- 🔴 Response times: 5-15s
- 🔴 Error rate: 5-20%
- 🔴 CPU: 95-100%
- 🔴 Memory: High

### Critical Failure (300+ users):
- 💥 Response times: Timeouts
- 💥 Error rate: 20-100%
- 💥 CPU: 100% (sustained)
- 💥 Memory: Exhausted
- 💥 System: Crash or hang

---

## Key Findings Summary

### Weakest Links (Will Fail First):
1. **Authentication System** - bcrypt CPU bottleneck
2. **Product Filter Queries** - Complex DB operations
3. **Database Connection Pool** - Limited connections

### Expected Breaking Point:
- **First Failures:** 150-200 concurrent users
- **Critical Failures:** 200-300 concurrent users
- **System Crash:** 300-400+ concurrent users

### Primary Root Causes:
1. **Single-threaded Node.js** - Event loop blocking
2. **CPU-intensive bcrypt** - No async optimization
3. **Limited DB connections** - Pool exhaustion
4. **No caching layer** - Every request hits DB
5. **No rate limiting** - Uncontrolled request influx

---

## Next Steps for Stress Testing

1. ✅ **Claim Stress Testing** with team (Task 2)
2. ✅ **Install JMeter** with Stepping Thread Group plugin (Task 3)
3. ✅ **Design JMeter Test Plan** focusing on auth + filters (Task 6-9)
4. ✅ **Execute Progressive Stress** to find exact breaking point (Task 13)
5. ✅ **Document Failure Sequence** with exact user counts (Task 17)

---

**Analysis Complete**  
**Ready for Task 2: Team Coordination**

Next Action: Confirm with team that Stress Testing is available and not taken by other members.
