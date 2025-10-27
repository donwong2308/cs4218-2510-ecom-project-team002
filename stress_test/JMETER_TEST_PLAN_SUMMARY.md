# JMeter Test Plan Summary

## Test Plan: E-Commerce Stress Testing

**Status:** Ready to build in JMeter GUI  
**Build Guide:** See `JMETER_BUILD_GUIDE.md` for detailed step-by-step instructions

---

## Quick Reference

### Configuration Elements (Test Plan Level)

1. **User Defined Variables**
   - `BASE_URL`: localhost
   - `PORT`: 8080
   - `PROTOCOL`: http
   - `TIMEOUT`: 30000

2. **HTTP Request Defaults**
   - Server: ${BASE_URL}:${PORT}
   - Protocol: ${PROTOCOL}

3. **HTTP Cookie Manager** (session handling)

4. **HTTP Header Manager**
   - Content-Type: application/json

5. **CSV Data Set Configs**
   - users.csv → USER_EMAIL, USER_PASSWORD
   - products.csv → PRODUCT_ID, PRODUCT_NAME, PRODUCT_CATEGORY, PRODUCT_PRICE
   - filters.csv → FILTER_CATEGORY, FILTER_PRICE_MIN, FILTER_PRICE_MAX

---

## Thread Groups

### 1. Progressive Stress (100→500 users) [ENABLED]
- **Type:** Stepping Thread Group
- **Pattern:** Start 100, then +50 every 2min
- **Ramp-up per step:** 30s
- **Hold per step:** 90s
- **Goal:** Find EXACT breaking point

### 2. Spike Stress (50→500 INSTANT) [DISABLED]
- **Type:** Ultimate Thread Group
- **Pattern:** 50 users baseline, then 500 INSTANT at 2min
- **Goal:** Test shock resistance

### 3. Extreme Stress (400 sustained) [DISABLED]
- **Type:** Standard Thread Group
- **Pattern:** 400 users for 5 minutes
- **Goal:** Observe failure modes

### 4. Recovery Stress (400→50) [DISABLED]
- **Type:** Ultimate Thread Group
- **Pattern:** 400 users (fail), drop to 50 (recovery)
- **Goal:** Test self-healing

---

## User Flow (All Thread Groups)

```
1. POST /api/v1/auth/login
   ├─ Body: { email: ${USER_EMAIL}, password: ${USER_PASSWORD} }
   ├─ Extract: token → ${AUTH_TOKEN}
   └─ Assert: Status 200

2. GET /api/v1/product/get-product
   └─ Assert: Status 200

3. POST /api/v1/product/product-filters
   ├─ Body: { checked: ["${FILTER_CATEGORY}"], radio: [min, max] }
   └─ Assert: Status 200

4. GET /api/v1/product/get-product/${PRODUCT_ID}
   └─ Assert: Status 200

5. Think Time: 0-1s (Uniform Random Timer)

6. Loop (repeat flow until test ends)
```

---

## Listeners (Failure Detection Focus)

1. **Summary Report** → summary-[timestamp].csv
2. **Aggregate Report** → aggregate-[timestamp].csv
3. **View Results Tree** (errors only) → errors-[timestamp].jtl
4. **Backend Listener** → results-[timestamp].jtl (for HTML dashboard)
5. **Active Threads Over Time** → threads-[timestamp].csv
6. **Response Times Over Time** → response-times-[timestamp].csv
7. **Transactions Per Second** → tps-[timestamp].csv

---

## File Locations

- **Test Plan:** `stress_test/jmeter/E-Commerce-Stress-Testing.jmx`
- **Test Data:** `stress_test/data/*.csv`
- **Results:** `stress_test/results/*`

---

## Build Status

### Completed in Guide
- ✅ Test plan structure defined
- ✅ All configuration elements specified
- ✅ 4 thread groups designed
- ✅ User flow detailed
- ✅ Listeners configured
- ✅ CSV data paths set
- ✅ Step-by-step build guide created

### To Do (Manual in JMeter GUI)
- ⏳ Build test plan following JMETER_BUILD_GUIDE.md
- ⏳ Verify all samplers configured correctly
- ⏳ Test with 10 users (baseline verification)
- ⏳ Save final .jmx file

---

## Running Tests

### Preparation
```bash
# 1. Register test users
node stress_test/data/register-test-users.js

# 2. Extract product IDs
node stress_test/data/extract-product-ids.js

# 3. Start application server
npm start
```

### Execute (Non-GUI Mode)
```powershell
cd C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin

# Progressive Stress Test
.\jmeter.bat -n -t ..\..\..\..\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\jmeter\E-Commerce-Stress-Testing.jmx -l ..\..\..\..\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\progressive.jtl

# Generate HTML Report
.\jmeter.bat -g ..\..\..\..\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\progressive.jtl -o ..\..\..\..\Documents\GitHub\cs4218-2510-ecom-project-team002\stress_test\results\html-progressive
```

---

## Expected Breaking Points

Based on API analysis:
- **150-200 users:** Auth endpoints fail (bcrypt CPU bottleneck)
- **200-300 users:** Product filters fail (DB query bottleneck)
- **300+ users:** System-wide failure
- **400+ users:** Complete crash likely

---

## Success Criteria

✅ Test plan builds successfully in JMeter  
✅ All 4 thread groups configured correctly  
✅ User flow executes without errors at 10 users (baseline)  
✅ CSV data loads correctly  
✅ Listeners save results to files  
✅ Ready for stress test execution  
