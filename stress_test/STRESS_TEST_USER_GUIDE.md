# JMeter Stress Testing - User Guide

**Project:** E-Commerce Application (CS4218-2510-ECOM-PROJECT-TEAM002)  
**Test Type:** Performance Testing - Stress Testing  
**Tool:** Apache JMeter 5.6.3  
**Date:** November 2, 2025

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Installation & Setup](#2-installation--setup)
3. [Test Plan Overview](#3-test-plan-overview)
4. [Running Tests](#4-running-tests)
5. [Viewing Results](#5-viewing-results)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Quick Start

### Prerequisites Check

```powershell
# 1. Verify backend server is running
Test-NetConnection -ComputerName localhost -Port 6060

# Expected Output: TcpTestSucceeded : True
```

### Run Stress Test (3 Commands)

```powershell
# 1. Navigate to JMeter bin directory
cd C:\Users\User\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\apache-jmeter-5.6.3\bin

# 2. Run test (non-GUI mode recommended)
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\results-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').jtl"

# 3. Generate HTML dashboard
$latestReport = Get-ChildItem "..\..\reports\results-*.jtl" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
.\jmeter.bat -g $latestReport.FullName -o "..\..\reports\dashboard-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"

# 4. Open dashboard in browser
$latestDashboard = Get-ChildItem "..\..\reports\dashboard-*" -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Start-Process "$($latestDashboard.FullName)\index.html"
```

**Expected Duration:** 7-8 minutes  
**Expected Breaking Point:** 1,800-2,000 concurrent users  
**Expected Error Rate:** 4-5% overall, 50%+ at collapse

---

## 2. Installation & Setup

### 2.1 JMeter Installation (Already Installed)

**Location:** `stress_test/apache-jmeter-5.6.3/`  
**Version:** 5.6.3  
**Download URL:** https://jmeter.apache.org/download_jmeter.cgi

**Required Plugins (Already Installed):**
- Stepping Thread Group
- Ultimate Thread Group
- Response Times Over Time
- Transactions Per Second
- Errors Per Second

### 2.2 Heap Size Configuration (Already Configured)

**File:** `stress_test/apache-jmeter-5.6.3/bin/setenv.bat`

```bat
rem JMeter Environment Configuration
rem Increase heap size for extreme stress testing (2000+ concurrent users)
set HEAP=-Xms2g -Xmx4g -XX:MaxMetaspaceSize=512m
```

**Why 4GB?**
- 2000 concurrent threads require significant memory
- Previous 1GB heap caused OutOfMemoryError at 1824 users
- 4GB provides safety margin for 2000+ threads

### 2.3 Test Data Files (Already Created)

**Location:** `stress_test/data/`

| File | Records | Purpose |
|------|---------|---------|
| `unique_users.csv` | 100 | Registration testing (unique emails) |
| `search_keywords.csv` | 88 | Search testing (diverse keywords) |
| `products.csv` | 5 | Product queries (real MongoDB IDs) |
| `filters.csv` | 5 | Filter testing (real category IDs) |

**Data Format Examples:**

**unique_users.csv:**
```csv
reguser00001@stress.test,RegUser 1,StressPass123!,5551234567,123 Stress Ave Apt 1,SecurityAnswer1
reguser00002@stress.test,RegUser 2,StressPass123!,5551234568,123 Stress Ave Apt 2,SecurityAnswer2
```

**search_keywords.csv:**
```csv
laptop
smartphone
book
clothing
```

**products.csv:**
```csv
66db427fdb0119d9234b27f9,Novel,66db427fdb0119d9234b27ef,14.99
67a2171ea6d9e00ef2ac0229,The Law of Contract,66db427fdb0119d9234b27ef,54.99
```

**filters.csv:**
```csv
66db427fdb0119d9234b27ed,0,2000
66db427fdb0119d9234b27ef,0,100
```

---

## 3. Test Plan Overview

### 3.1 Test Configuration

**File:** `stress_test/jmeter/E-Commerce-Stress-Testing.jmx`

**Global Variables:**
```
BASE_URL: localhost
PORT: 6060
PROTOCOL: http
API_VERSION: v1
THINK_TIME_MIN: 0
THINK_TIME_MAX: 1000 (1 second)
TIMEOUT: 30000 (30 seconds)
```

### 3.2 Thread Groups (Test Scenarios)

#### **Thread Group 1: Progressive Stress (500→2000 users)** ✅ ENABLED (DEFAULT)

**Purpose:** Find exact breaking point through gradual load increase

**Configuration:**
```
Type: Stepping Thread Group
Starting Users: 500 (burst)
Step Size: 250 users
Step Duration: 30 seconds
Flight Time: 120 seconds (sustained load per step)
Ramp-Up: 15 seconds per step
Peak Users: 2000
Total Duration: ~7 minutes
```

**User Load Timeline:**
```
0:00  → 500 users  (instant burst)
0:30  → 750 users  (+250)
1:00  → 1000 users (+250)
1:30  → 1250 users (+250)
2:00  → 1500 users (+250)
2:30  → 1750 users (+250)
3:00  → 2000 users (+250) ← PEAK
3:00-5:00 → Sustained at 2000 users
5:00-7:30 → Ramp down and cleanup
```

**Why This Design:**
- Progressive increase allows observation of degradation stages
- 30-second steps provide enough data for each load level
- 2000 user peak ensures breaking point is reached
- Sustained peak tests long-term stability

---

#### **Thread Group 2: Spike Stress (200→1500 INSTANT)** ⚠️ DISABLED

**Purpose:** Test shock resistance (Black Friday scenario)

**Configuration:**
```
Type: Ultimate Thread Group
Baseline: 200 users (60 seconds)
Spike: +1300 users INSTANTLY at 60 seconds
Peak: 1500 users
Hold: 240 seconds at peak
Total Duration: ~5.5 minutes
```

**To Enable:**
1. Open JMeter GUI: `cd stress_test\apache-jmeter-5.6.3\bin; .\jmeter.bat`
2. Open test plan: File → Open → `stress_test\jmeter\E-Commerce-Stress-Testing.jmx`
3. Right-click "Thread Group 2 - Spike Stress" → Enable
4. Save test plan
5. Run test (see Section 4)

---

#### **Thread Group 3: Extreme Stress (2500 sustained)** 🔥 DISABLED

**Purpose:** Sustained overload to test failure modes

**Configuration:**
```
Type: Standard Thread Group
Users: 2500 concurrent
Ramp-Up: 60 seconds (aggressive)
Duration: 600 seconds (10 minutes sustained)
Total Duration: 11 minutes
```

**⚠️ WARNING:** This test will likely crash your server. Only run when:
- You have monitoring in place
- You're prepared for downtime
- You can restart services quickly

**To Enable:** Same steps as Thread Group 2

---

#### **Thread Group 4: Recovery Stress (2000→100)** 🔄 DISABLED

**Purpose:** Test self-healing capability after extreme load

**Configuration:**
```
Type: Ultimate Thread Group
Ramp to Peak: 30 seconds to 2000 users
Hold at Peak: 240 seconds (4 minutes)
Ramp Down: 60 seconds to 100 users
Recovery Phase: 300 seconds at 100 users
Total Duration: 10 minutes
```

**To Enable:** Same steps as Thread Group 2

---

### 3.3 User Flow (Request Sequence)

Each virtual user executes this loop continuously:

```
1. POST /api/v1/auth/register
   └─ Body: { name, email, password, phone, address, answer }
   └─ Data: unique_users.csv
   └─ Assert: Status 200

2. GET /api/v1/product/search/${keyword}
   └─ Data: search_keywords.csv
   └─ Assert: Status 200

3. GET /api/v1/product/product-photo/${productId}
   └─ Data: products.csv
   └─ Assert: Status 200

4. POST /api/v1/auth/login
   └─ Body: { email, password }
   └─ Extract: JWT token
   └─ Assert: Status 200

5. GET /api/v1/product/get-product
   └─ Assert: Status 200

6. POST /api/v1/product/product-filters
   └─ Body: { checked: [categoryId], radio: [minPrice, maxPrice] }
   └─ Data: filters.csv
   └─ Assert: Status 200

7. GET /api/v1/product/related-product/${productId}/${categoryId}
   └─ Data: products.csv
   └─ Assert: Status 200

8. Think Time: Random 0-1 second

9. Loop back to step 1
```

**Total Requests Per User Per Iteration:** 7 requests  
**Estimated Iteration Time:** 5-30 seconds (depending on server load)

---

### 3.4 Listeners & Graphs (Results Collection)

All results saved to `stress_test/reports/`:

| Listener | Output File | Purpose |
|----------|------------|---------|
| Summary Report | `summary-[timestamp].csv` | Overall statistics |
| Aggregate Report | `aggregate-[timestamp].csv` | Per-endpoint breakdown |
| View Results Tree | `errors-[timestamp].jtl` | Error details only |
| Response Times Over Time | `response-times-[timestamp].csv` | Performance degradation |
| Transactions Per Second | `tps-[timestamp].csv` | Throughput analysis |
| Errors Per Second | `errors-per-second-[timestamp].csv` | Failure rate tracking |
| Simple Data Writer | `results-[timestamp].jtl` | Full test data (for HTML dashboard) |

---

## 4. Running Tests

### 4.1 GUI Mode (For Test Development)

**Use Case:** Modifying test plan, debugging, viewing live results

```powershell
# Navigate to JMeter bin
cd stress_test\apache-jmeter-5.6.3\bin

# Launch JMeter GUI
.\jmeter.bat

# Open test plan
# File → Open → C:\Users\User\...\stress_test\jmeter\E-Commerce-Stress-Testing.jmx

# Run test
# Click green "Start" button (play icon)
# Or: Run → Start (Ctrl+R)

# View results
# Click any listener (Summary Report, Response Times Over Time, etc.)

# Stop test
# Click red "Stop" button (stop icon)
# Or: Run → Stop (Ctrl+.)
```

**⚠️ Warning:** GUI mode consumes more memory and CPU. For high load tests (1000+ users), use Non-GUI mode instead.

---

### 4.2 Non-GUI Mode (For Production Tests) ✅ RECOMMENDED

**Use Case:** Running actual stress tests, automated testing, CI/CD

```powershell
# Navigate to JMeter bin
cd C:\Users\User\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\apache-jmeter-5.6.3\bin

# Run test
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\results-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').jtl"

# Command breakdown:
# -n              = Non-GUI mode
# -t [file]       = Test plan file
# -l [file]       = Results log file (JTL format)
# $(Get-Date...)  = PowerShell timestamp (yyyy-MM-dd-HHmmss)
```

**Expected Console Output:**
```
Creating summariser <summary>
Created the tree successfully using ...\E-Commerce-Stress-Testing.jmx
Starting standalone test @ 2025-11-02 02:17:04 SGT (1730491024000)
Waiting for possible Shutdown/StopTestNow/HeapDump/ThreadDump message on port 4445

summary +   1079 in 00:00:21 =   51.4/s Avg:  2421 Min:   510 Max:  5680 Err:   101 (9.36%) Active: 500
summary +   2924 in 00:00:30 =   97.5/s Avg:  4621 Min:  2921 Max:  9508 Err:     0 (0.00%) Active: 517
summary +   3407 in 00:00:30 =  113.6/s Avg:  5124 Min:  3234 Max:  8901 Err:     0 (0.00%) Active: 750
...
summary =  47855 in 00:07:31 =  106.2/s Avg: 12170 Min:   510 Max: 30019 Err:  2329 (4.87%)
Tidying up ...    @ 2025-11-02 02:24:35 SGT (1730491475000)
... end of run
```

**Key Metrics to Watch:**
- **Active:** Number of active threads (should reach 2000)
- **Avg:** Average response time (watch for spikes)
- **Err:** Error count and percentage (watch for >10%)
- **Summary:** Final totals at end of test

---

### 4.3 Running Specific Thread Groups

**Run Only Thread Group 2 (Spike Test):**
```powershell
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\spike-test-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').jtl" -JthreadGroup="Thread Group 2"
```

**Run Multiple Thread Groups:**
```powershell
# Enable Thread Groups 1 and 2 in GUI first, then:
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\multi-test-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').jtl"
```

---

### 4.4 Overriding Variables (Command Line)

**Change User Counts:**
```powershell
# Test with 3000 peak users instead of 2000
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\test.jtl" -JmaxUsers=3000
```

**Change Think Time:**
```powershell
# No delays between requests (maximum stress)
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\test.jtl" -JTHINK_TIME_MIN=0 -JTHINK_TIME_MAX=0
```

**Change Base URL:**
```powershell
# Test against different server
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\test.jtl" -JBASE_URL=staging.example.com -JPORT=443 -JPROTOCOL=https
```

---

### 4.5 Using PowerShell Helper Script (Simplified)

**File:** `stress_test/generate-html-report.ps1` (Already created)

```powershell
# Run from stress_test directory
cd stress_test

# Generate HTML report from latest JTL file
.\generate-html-report.ps1

# Or specify specific JTL file
.\generate-html-report.ps1 -JtlFile "reports\results-2025-11-02-021704.jtl"
```

**Script Contents:**
```powershell
param(
    [string]$JtlFile = ""
)

# Navigate to JMeter bin
Set-Location "apache-jmeter-5.6.3\bin"

# Find latest JTL if not specified
if ($JtlFile -eq "") {
    $JtlFile = Get-ChildItem "..\..\reports\*.jtl" | 
               Sort-Object LastWriteTime -Descending | 
               Select-Object -First 1 -ExpandProperty FullName
}

# Generate HTML dashboard
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$outputDir = "..\..\reports\dashboard-$timestamp"

Write-Host "Generating HTML report from: $JtlFile"
.\jmeter.bat -g $JtlFile -o $outputDir

# Open in browser
Start-Process "$outputDir\index.html"
```

---

## 5. Viewing Results

### 5.1 HTML Dashboard (Best for Comprehensive Analysis)

**Generate Dashboard:**
```powershell
cd stress_test\apache-jmeter-5.6.3\bin

# Find latest test results
$latestJtl = Get-ChildItem "..\..\reports\results-*.jtl" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# Generate dashboard
.\jmeter.bat -g $latestJtl.FullName -o "..\..\reports\dashboard-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"

# Open in browser
$latestDashboard = Get-ChildItem "..\..\reports\dashboard-*" -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Start-Process "$($latestDashboard.FullName)\index.html"
```

**Dashboard Contents:**
- **Test and Report Information:** Test metadata, duration, timestamps
- **APDEX (Application Performance Index):** User satisfaction score
- **Summary Report:** Total requests, errors, response times, throughput
- **Errors:** Error types and counts
- **Top 5 Errors by Sampler:** Which endpoints failed most
- **Over Time Graphs:**
  - Response Time Over Time
  - Bytes Throughput Over Time
  - Latency Over Time
  - Hits Per Second
  - Response Codes Over Time
  - Transactions Per Second
  - **Errors Per Second** (NEW)
- **Throughput:** Requests and bytes per second
- **Response Times:**
  - Distribution
  - Percentiles (50th, 90th, 95th, 99th)
  - Per Endpoint
- **Active Threads Over Time:** Thread lifecycle visualization

---

### 5.2 Console Summary (Quick Analysis)

**During Test:** Summary printed every 30 seconds

**After Test:** Final summary shows:
```
summary =  47855 in 00:07:31 =  106.2/s Avg: 12170 Min: 510 Max: 30019 Err: 2329 (4.87%)
```

**Interpretation:**
- **47855:** Total requests executed
- **00:07:31:** Test duration (7 minutes 31 seconds)
- **106.2/s:** Average throughput (requests per second)
- **Avg: 12170:** Average response time (12.17 seconds)
- **Min: 510:** Fastest response (510ms)
- **Max: 30019:** Slowest response (30.019 seconds)
- **Err: 2329 (4.87%):** 2,329 errors out of 47,855 requests

---

### 5.3 CSV Results (For Custom Analysis)

**Files Generated:**
```
stress_test/reports/
├── results-2025-11-02-021704.jtl        (Full test data - 50MB+)
├── summary-2025-11-02-021704.csv        (Summary statistics)
├── aggregate-2025-11-02-021704.csv      (Per-endpoint breakdown)
├── response-times-2025-11-02-021704.csv (Timeseries data)
├── tps-2025-11-02-021704.csv            (Throughput timeseries)
└── errors-per-second-2025-11-02-021704.csv (Error rate timeseries)
```

**Analyze with PowerShell:**
```powershell
# Import CSV
$results = Import-Csv "stress_test\reports\summary-2025-11-02-021704.csv"

# View top 5 slowest endpoints
$results | Sort-Object { [int]$_.Average } -Descending | Select-Object -First 5 Label,Average,Samples,Error

# Calculate overall stats
$totalSamples = ($results | Measure-Object -Property Samples -Sum).Sum
$totalErrors = ($results | Measure-Object -Property Error -Sum).Sum
$errorRate = ($totalErrors / $totalSamples) * 100
Write-Host "Error Rate: $([math]::Round($errorRate, 2))%"
```

**Analyze with Excel:**
1. Open Excel
2. Data → From Text/CSV
3. Select JTL or CSV file
4. Create pivot tables and charts

---

### 5.4 Error Analysis

**View Error Details:**
```powershell
# Errors are logged in errors-[timestamp].jtl
cd stress_test\reports

# Count error types
Get-Content errors-2025-11-02-021704.jtl | Select-String "responseCode" | Group-Object | Sort-Object Count -Descending

# View specific error
Get-Content errors-2025-11-02-021704.jtl | Select-String "500 Internal Server Error" | Select-Object -First 1
```

**Common Error Types:**

| Error Code | Meaning | Likely Cause |
|-----------|---------|--------------|
| 500 Internal Server Error | Server crash/exception | CPU saturation, bcrypt overload |
| 503 Service Unavailable | Server refusing connections | Max connections exceeded |
| Connection refused | Can't connect to server | Server crashed or port blocked |
| Connection timeout | Connection attempt timed out | Server overloaded |
| Socket timeout | Request timed out (30s) | Event loop blocked |

---

## 6. Troubleshooting

### 6.1 Common Issues

#### **Issue 1: JMeter OutOfMemoryError**

**Symptom:**
```
java.lang.OutOfMemoryError: Java heap space
Test stopped due to OutOfMemoryError
```

**Solution:**
```bat
rem Edit: stress_test\apache-jmeter-5.6.3\bin\setenv.bat
set HEAP=-Xms2g -Xmx4g -XX:MaxMetaspaceSize=512m

rem Then restart JMeter
```

**Why:** 2000 concurrent threads require 4GB heap. Default is 1GB.

---

#### **Issue 2: Backend Server Not Running**

**Symptom:**
```
Connection refused
java.net.ConnectException: Connection refused: connect
```

**Solution:**
```powershell
# Check if server is running
Test-NetConnection -ComputerName localhost -Port 6060

# If not running, start server
cd C:\Users\User\Documents\GitHub\cs4218-2510-ecom-project-team002
npm run server

# Verify server started
# Look for: "Server is running on port 6060"
```

---

#### **Issue 3: CSV File Not Found**

**Symptom:**
```
Error in NonGUIDriver java.lang.IllegalArgumentException: Problem reading CSV file 'users.csv'
```

**Solution:**
```powershell
# Check CSV files exist
cd stress_test\data
dir *.csv

# If missing, verify path in JMX file
# Open JMeter GUI → CSV Data Set Config → Filename
# Should be absolute path: C:\Users\User\...\stress_test\data\users.csv
```

---

#### **Issue 4: High Error Rate (50%+) from Test Start**

**Symptom:**
```
summary + 1079 in 00:00:21 = 51.4/s Avg: 245 Err: 540 (50.05%) Active: 100
```

**Solution:**
This indicates configuration issue, NOT stress failure.

```powershell
# Test endpoints manually
curl -Method POST -Uri "http://localhost:6060/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}'

# If manual test fails → Server issue
# If manual test works → JMeter config issue (check CSV data, endpoint URLs)
```

---

#### **Issue 5: JMeter Hangs/Freezes**

**Symptom:** JMeter stops responding, no new summary lines printed

**Solution:**
```powershell
# Force stop JMeter
Get-Process | Where-Object { $_.Name -eq "java" } | Stop-Process -Force

# Reduce user count for next test
# Edit JMX: Starting users 500 → 100
```

---

#### **Issue 6: Dashboard Generation Fails**

**Symptom:**
```
An error occurred: File 'results.jtl' does not contain valid results
```

**Solution:**
```powershell
# Check JTL file is not empty
Get-Content "stress_test\reports\results-2025-11-02-021704.jtl" | Select-Object -First 5

# If empty → Test didn't run or crashed immediately
# If has data → Check format (should be CSV with headers)

# Regenerate with correct JTL file
cd stress_test\apache-jmeter-5.6.3\bin
.\jmeter.bat -g "..\..\reports\results-2025-11-02-021704.jtl" -o "..\..\reports\dashboard-new"
```

---

### 6.2 Performance Tips

**Tip 1: Disable GUI Listeners During Test**
```
# In JMeter GUI, right-click listeners:
# - View Results Tree → Disable (only enable for debugging)
# - Response Times Graph → Disable (use HTML dashboard instead)
# - Keep only: Simple Data Writer (for JTL file)
```

**Tip 2: Use Non-GUI Mode for High Load**
```powershell
# GUI mode max capacity: ~500 users
# Non-GUI mode max capacity: 2000+ users
.\jmeter.bat -n -t test.jmx -l results.jtl  # Non-GUI
```

**Tip 3: Increase JMeter Heap for 3000+ Users**
```bat
rem Edit setenv.bat for very high load:
set HEAP=-Xms4g -Xmx8g -XX:MaxMetaspaceSize=512m
```

**Tip 4: Disable Assertions for Baseline Tests**
```
# In JMeter GUI:
# Right-click each assertion → Disable
# This reduces overhead for pure throughput testing
```

---

### 6.3 Test Validation

**Before Running Full Test:**

1. **Baseline Test (10 users, 1 minute):**
```powershell
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\baseline.jtl" -JmaxUsers=10 -Jduration=60
```
- **Expected:** 0% errors
- **If errors:** Fix configuration before full test

2. **Smoke Test (100 users, 2 minutes):**
```powershell
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\smoke.jtl" -JmaxUsers=100 -Jduration=120
```
- **Expected:** 0-5% errors
- **If >10% errors:** System not ready for stress test

3. **Full Stress Test (2000 users, 7 minutes):**
```powershell
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\results-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').jtl"
```
- **Expected:** Breaking point at 1800-2000 users
- **Expected:** 4-5% overall error rate, 50%+ at collapse

---

## 7. Advanced Usage

### 7.1 Distributed Testing (Multiple JMeter Instances)

**Use Case:** Testing beyond single machine capacity (5000+ users)

**Setup:**
```powershell
# On master machine
cd stress_test\apache-jmeter-5.6.3\bin

# Edit jmeter.properties
# remote_hosts=192.168.1.100,192.168.1.101

# Run distributed test
.\jmeter.bat -n -t test.jmx -r -l results.jtl

# -r flag runs test on remote JMeter servers
```

### 7.2 Integration with CI/CD

**GitHub Actions Example:**
```yaml
name: Stress Test

on:
  schedule:
    - cron: '0 2 * * 0' # Weekly Sunday 2 AM

jobs:
  stress-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Backend
        run: |
          npm install
          npm run server &
          
      - name: Run JMeter Test
        run: |
          cd stress_test/apache-jmeter-5.6.3/bin
          ./jmeter -n -t ../../jmeter/E-Commerce-Stress-Testing.jmx -l ../../reports/results.jtl
          
      - name: Generate Dashboard
        run: |
          cd stress_test/apache-jmeter-5.6.3/bin
          ./jmeter -g ../../reports/results.jtl -o ../../reports/dashboard
          
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: stress-test-results
          path: stress_test/reports/
```

---

## 8. Summary

### Quick Command Reference

```powershell
# 1. Navigate to JMeter
cd C:\Users\User\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\apache-jmeter-5.6.3\bin

# 2. Run stress test
.\jmeter.bat -n -t "..\..\jmeter\E-Commerce-Stress-Testing.jmx" -l "..\..\reports\results-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').jtl"

# 3. Generate dashboard
$latest = Get-ChildItem "..\..\reports\results-*.jtl" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
.\jmeter.bat -g $latest.FullName -o "..\..\reports\dashboard-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"

# 4. Open dashboard
$dashboard = Get-ChildItem "..\..\reports\dashboard-*" -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Start-Process "$($dashboard.FullName)\index.html"
```

### Expected Results

| Metric | Value |
|--------|-------|
| Test Duration | 7-8 minutes |
| Total Requests | 45,000-50,000 |
| Breaking Point | 1,800-2,000 users |
| Error Rate (Overall) | 4-5% |
| Error Rate (Collapse) | 50%+ |
| Avg Response Time | 10-13 seconds |
| Max Response Time | 30 seconds (timeout) |
| Peak Throughput | 120-125 req/s |

### Files Generated

```
stress_test/reports/
├── results-[timestamp].jtl                 (Full test data - 50MB+)
├── summary-[timestamp].csv                 (Summary statistics)
├── aggregate-[timestamp].csv               (Per-endpoint breakdown)
├── response-times-[timestamp].csv          (Timeseries data)
├── tps-[timestamp].csv                     (Throughput timeseries)
├── errors-per-second-[timestamp].csv       (Error rate timeseries)
└── dashboard-[timestamp]/
    ├── index.html                          (Main dashboard)
    ├── content/                            (Charts and graphs)
    └── sbadmin2-1.0.7/                     (Dashboard assets)
```

---

**Guide Version:** 1.0  
**Last Updated:** November 2, 2025  
**Maintained By:** CS4218 Team 002
