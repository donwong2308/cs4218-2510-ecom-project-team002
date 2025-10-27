# JMeter Test Plan Build Guide

**Purpose:** Step-by-step instructions to build the E-Commerce Stress Test Plan in JMeter GUI

---

## Overview

We'll build ONE test plan with 4 thread groups (one per scenario). Only enable ONE thread group at a time during execution.

**Test Plan Structure:**
```
E-Commerce Stress Testing
├── User Defined Variables
├── HTTP Cookie Manager
├── HTTP Header Manager
├── CSV Data Sets (users, products, filters)
├── Thread Group 1: Progressive Stress [ENABLED by default]
├── Thread Group 2: Spike Stress [DISABLED]
├── Thread Group 3: Extreme Stress [DISABLED]
├── Thread Group 4: Recovery Stress [DISABLED]
└── Listeners (shared across all thread groups)
```

---

## Step 1: Create New Test Plan

1. **Launch JMeter:**
   ```powershell
   cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin
   ./jmeter.bat
   ```

2. **Rename Test Plan:**
   - Click on "Test Plan" in the tree
   - Change name to: `E-Commerce Stress Testing`
   - Check ✅ "Run Thread Groups consecutively"
   - Uncheck ❌ "Run tearDown Thread Groups after shutdown"

---

## Step 2: Add User Defined Variables

**Purpose:** Store configuration values that can be easily changed

**Add:** Right-click Test Plan → Add → Config Element → User Defined Variables

**Variables to add:**

| Name | Value | Description |
|------|-------|-------------|
| `BASE_URL` | `localhost` | Server hostname |
| `PORT` | `8080` | Server port |
| `PROTOCOL` | `http` | http or https |
| `API_VERSION` | `v1` | API version |
| `THINK_TIME_MIN` | `0` | Min think time (ms) - minimal for stress |
| `THINK_TIME_MAX` | `1000` | Max think time (ms) - 0-1s for stress |
| `TIMEOUT` | `30000` | Request timeout (ms) - 30s |

---

## Step 3: Add HTTP Request Defaults

**Purpose:** Set default values for all HTTP requests

**Add:** Right-click Test Plan → Add → Config Element → HTTP Request Defaults

**Configuration:**
- **Protocol:** `${PROTOCOL}`
- **Server Name:** `${BASE_URL}`
- **Port Number:** `${PORT}`
- **Connect Timeout:** `${TIMEOUT}`
- **Response Timeout:** `${TIMEOUT}`
- **Implementation:** Java (or HttpClient4)

---

## Step 4: Add HTTP Cookie Manager

**Purpose:** Handle session cookies (JWT tokens stored as cookies if used)

**Add:** Right-click Test Plan → Add → Config Element → HTTP Cookie Manager

**Configuration:**
- **Clear cookies each iteration:** ❌ Uncheck (keep cookies across iterations)
- **Cookie Policy:** `compatibility`

---

## Step 5: Add HTTP Header Manager

**Purpose:** Set default headers for all requests

**Add:** Right-click Test Plan → Add → Config Element → HTTP Header Manager

**Headers to add:**

| Name | Value |
|------|-------|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

---

## Step 6: Add CSV Data Set Configs

**Purpose:** Load test data from CSV files

### 6.1 Users CSV

**Add:** Right-click Test Plan → Add → Config Element → CSV Data Set Config

**Configuration:**
- **Name:** `CSV - Users`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\data\users.csv`
- **Variable Names:** `USER_EMAIL,USER_PASSWORD`
- **Delimiter:** `,`
- **Recycle on EOF:** ✅ True (reuse users when reaching end)
- **Stop thread on EOF:** ❌ False
- **Sharing mode:** `All threads`

### 6.2 Products CSV

**Add:** Right-click Test Plan → Add → Config Element → CSV Data Set Config

**Configuration:**
- **Name:** `CSV - Products`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\data\products.csv`
- **Variable Names:** `PRODUCT_ID,PRODUCT_NAME,PRODUCT_CATEGORY,PRODUCT_PRICE`
- **Delimiter:** `,`
- **Recycle on EOF:** ✅ True
- **Stop thread on EOF:** ❌ False
- **Sharing mode:** `All threads`

### 6.3 Filters CSV

**Add:** Right-click Test Plan → Add → Config Element → CSV Data Set Config

**Configuration:**
- **Name:** `CSV - Filters`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\data\filters.csv`
- **Variable Names:** `FILTER_CATEGORY,FILTER_PRICE_MIN,FILTER_PRICE_MAX`
- **Delimiter:** `,`
- **Recycle on EOF:** ✅ True
- **Stop thread on EOF:** ❌ False
- **Sharing mode:** `All threads`

---

## Step 7: Create Thread Group 1 - Progressive Stress

**Add:** Right-click Test Plan → Add → Threads (Users) → Stepping Thread Group

**Configuration:**
- **Name:** `Thread Group 1 - Progressive Stress (100→500 users)`
- **This group will start:** `1` threads
- **First, start:** `100` threads
- **Then, start:** `50` threads every `120` seconds (2 minutes)
- **Using ramp-up:** `30` seconds
- **Then, hold load for:** `90` seconds
- **Finally, stop:** `50` threads every `1` seconds

**Thread Schedule:**
```
Time      | Action
----------|------------------------------------------
0-0:30    | Ramp 0→100 users (30s ramp-up)
0:30-2:00 | Hold 100 users (90s hold)
2:00-2:30 | Ramp 100→150 users (30s ramp-up)
2:30-4:00 | Hold 150 users (90s hold)
4:00-4:30 | Ramp 150→200 users (expected auth failure)
... continues to 500 or until failure
```

---

## Step 8: Build User Flow (Inside Thread Group 1)

### 8.1 HTTP Request: Login

**Add:** Right-click Thread Group 1 → Add → Sampler → HTTP Request

**Configuration:**
- **Name:** `POST - Login (Auth - Will Fail First)`
- **Method:** `POST`
- **Path:** `/api/${API_VERSION}/auth/login`
- **Body Data:**
  ```json
  {
    "email": "${USER_EMAIL}",
    "password": "${USER_PASSWORD}"
  }
  ```

**Add:** Right-click Login → Add → Post Processors → JSON Extractor

**JSON Extractor Configuration:**
- **Name:** `Extract Token`
- **Names of created variables:** `AUTH_TOKEN`
- **JSON Path expressions:** `$.token`
- **Match No.:** `1`
- **Default Values:** `TOKEN_NOT_FOUND`

**Add:** Right-click Login → Add → Assertions → Response Assertion

**Response Assertion Configuration:**
- **Name:** `Assert Login Success`
- **Apply to:** Main sample only
- **Response Field:** Response Code
- **Pattern Matching Rules:** Equals
- **Patterns to Test:** `200`

---

### 8.2 HTTP Request: Get Products

**Add:** Right-click Thread Group 1 → Add → Sampler → HTTP Request

**Configuration:**
- **Name:** `GET - All Products`
- **Method:** `GET`
- **Path:** `/api/${API_VERSION}/product/get-product`

**Add:** Right-click Get Products → Add → Assertions → Response Assertion

**Configuration:**
- **Name:** `Assert Products Retrieved`
- **Response Code:** `200`

---

### 8.3 HTTP Request: Apply Filters

**Add:** Right-click Thread Group 1 → Add → Sampler → HTTP Request

**Configuration:**
- **Name:** `POST - Product Filters (DB Query - Will Fail Second)`
- **Method:** `POST`
- **Path:** `/api/${API_VERSION}/product/product-filters`
- **Body Data:**
  ```json
  {
    "checked": ["${FILTER_CATEGORY}"],
    "radio": [${FILTER_PRICE_MIN}, ${FILTER_PRICE_MAX}]
  }
  ```

**Add:** Right-click Apply Filters → Add → Assertions → Response Assertion

**Configuration:**
- **Name:** `Assert Filters Applied`
- **Response Code:** `200`

---

### 8.4 HTTP Request: Get Product Details

**Add:** Right-click Thread Group 1 → Add → Sampler → HTTP Request

**Configuration:**
- **Name:** `GET - Product Details`
- **Method:** `GET`
- **Path:** `/api/${API_VERSION}/product/get-product/${PRODUCT_ID}`

---

### 8.5 Add Think Time (Minimal for Stress)

**Add:** Right-click Thread Group 1 → Add → Timer → Uniform Random Timer

**Configuration:**
- **Name:** `Think Time (0-1s for stress)`
- **Random Delay Maximum:** `${THINK_TIME_MAX}` (1000ms)
- **Constant Delay Offset:** `${THINK_TIME_MIN}` (0ms)

---

## Step 9: Create Thread Group 2 - Spike Stress

**Add:** Right-click Test Plan → Add → Threads (Users) → Ultimate Thread Group

**Configuration:**
- **Name:** `Thread Group 2 - Spike Stress (50→500 INSTANT)`
- **Enable:** ❌ DISABLED (only enable when running spike test)
- **Thread Schedule:**
  | Start Threads | Initial Delay | Startup Time | Hold Load | Shutdown Time |
  |---------------|---------------|--------------|-----------|---------------|
  | 50 | 0 | 60 | 60 | 5 |
  | 450 | 120 | 0 | 300 | 60 |

**Explanation:**
- 0-60s: Ramp to 50 users
- 60-120s: Hold at 50 users (baseline)
- **120s: INSTANT spike to 500 users (0 second ramp!)**
- 120-420s: Hold at 500 users (observe crash)
- 420-480s: Ramp down to 0

**User Flow:** Copy all samplers from Thread Group 1 (Login → Products → Filters → Details)

---

## Step 10: Create Thread Group 3 - Extreme Stress

**Add:** Right-click Test Plan → Add → Threads (Users) → Thread Group

**Configuration:**
- **Name:** `Thread Group 3 - Extreme Stress (400 sustained)`
- **Enable:** ❌ DISABLED
- **Number of Threads:** `400`
- **Ramp-up period:** `120` (2 minutes)
- **Loop Count:** Forever (or large number like 1000)
- **Duration:** `420` seconds (7 minutes total)

**User Flow:** Copy all samplers from Thread Group 1

---

## Step 11: Create Thread Group 4 - Recovery Stress

**Add:** Right-click Test Plan → Add → Threads (Users) → Ultimate Thread Group

**Configuration:**
- **Name:** `Thread Group 4 - Recovery Stress (400→50 recovery test)`
- **Enable:** ❌ DISABLED
- **Thread Schedule:**
  | Start Threads | Initial Delay | Startup Time | Hold Load | Shutdown Time |
  |---------------|---------------|--------------|-----------|---------------|
  | 400 | 0 | 120 | 180 | 30 |
  | 50 | 300 | 30 | 300 | 30 |

**Explanation:**
- 0-120s: Ramp to 400 users (stress to failure)
- 120-300s: Hold at 400 users (system fails)
- **300-330s: Drop to 50 users (recovery begins)**
- 330-630s: Hold at 50 users (observe recovery)

**User Flow:** Copy all samplers from Thread Group 1

---

## Step 12: Add Listeners (Shared for All Thread Groups)

**Add these at Test Plan level** so they apply to all thread groups:

### 12.1 Summary Report

**Add:** Right-click Test Plan → Add → Listener → Summary Report

**Configuration:**
- **Name:** `Summary Report - Overall Statistics`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\summary-${__time(yyyy-MM-dd-HHmmss)}.csv`
- ✅ Save results to file

### 12.2 Aggregate Report

**Add:** Right-click Test Plan → Add → Listener → Aggregate Report

**Configuration:**
- **Name:** `Aggregate Report - Error Analysis`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\aggregate-${__time(yyyy-MM-dd-HHmmss)}.csv`

### 12.3 View Results Tree

**Add:** Right-click Test Plan → Add → Listener → View Results Tree

**Configuration:**
- **Name:** `View Results Tree - Failure Details`
- **Log/Display Only:** Errors
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\errors-${__time(yyyy-MM-dd-HHmmss)}.jtl`

### 12.4 Backend Listener (HTML Dashboard)

**Add:** Right-click Test Plan → Add → Listener → Backend Listener

**Configuration:**
- **Name:** `Backend Listener - HTML Dashboard`
- **Backend Listener implementation:** `org.apache.jmeter.visualizers.backend.graphite.GraphiteBackendListenerClient`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\results-${__time(yyyy-MM-dd-HHmmss)}.jtl`

**Generate HTML Report (after test):**
```powershell
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin
.\jmeter.bat -g C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\results-[timestamp].jtl -o C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\html-report-[timestamp]
```

### 12.5 Active Threads Over Time

**Add:** Right-click Test Plan → Add → Listener → jp@gc - Active Threads Over Time

**Configuration:**
- **Name:** `Active Threads Over Time - Load Pattern`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\threads-${__time(yyyy-MM-dd-HHmmss)}.csv`

### 12.6 Response Times Over Time

**Add:** Right-click Test Plan → Add → Listener → jp@gc - Response Times Over Time

**Configuration:**
- **Name:** `Response Times Over Time - Performance Degradation`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\response-times-${__time(yyyy-MM-dd-HHmmss)}.csv`

### 12.7 Transactions Per Second

**Add:** Right-click Test Plan → Add → Listener → jp@gc - Transactions per Second

**Configuration:**
- **Name:** `Transactions Per Second - Throughput Collapse`
- **Filename:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\tps-${__time(yyyy-MM-dd-HHmmss)}.csv`

---

## Step 13: Save Test Plan

**File → Save Test Plan As:**
- **Location:** `C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\jmeter\E-Commerce-Stress-Testing.jmx`

---

## Test Plan Checklist

Before running:

- ✅ Test Plan name: "E-Commerce Stress Testing"
- ✅ User Defined Variables configured
- ✅ HTTP Request Defaults set (localhost:8080)
- ✅ HTTP Cookie Manager added
- ✅ HTTP Header Manager added (Content-Type: application/json)
- ✅ 3 CSV Data Set Configs (users, products, filters)
- ✅ Thread Group 1 (Progressive) - ENABLED
- ✅ Thread Groups 2-4 (Spike, Extreme, Recovery) - DISABLED
- ✅ User flow: Login → Products → Filters → Details
- ✅ JSON Extractor on Login (extract token)
- ✅ Think time 0-1s (minimal for stress)
- ✅ 7 Listeners configured with file output
- ✅ Test plan saved to stress_test/jmeter/

---

## Running the Test

### Option 1: GUI Mode (For debugging only)
```powershell
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin
./jmeter.bat
# File → Open → E-Commerce-Stress-Testing.jmx
# Click green "Start" button
```

### Option 2: Non-GUI Mode (For actual stress testing)
```powershell
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin
.\jmeter.bat -n -t C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\jmeter\E-Commerce-Stress-Testing.jmx -l C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\results-progressive-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').jtl
```

**⚠️ IMPORTANT:** Always run stress tests in **NON-GUI mode** for accurate results. GUI mode consumes resources and affects test accuracy.

---

## Next Steps

After building the test plan:
1. Register test users: `node stress_test/data/register-test-users.js`
2. Extract product IDs: `node stress_test/data/extract-product-ids.js`
3. Run baseline test (10 users, 2 min) to verify functionality
4. Run Progressive Stress test to find breaking point
5. Analyze results and generate HTML dashboard
