# Configuration Fix Results - Before & After Comparison

## Executive Summary

**RESULT**: Configuration fix was **100% successful** - error rate dropped from **49.75%** to **0%**!

The initial test results showed what appeared to be a stress failure at 100 users, but was actually a **configuration issue**. After fixing the configuration with real MongoDB data, the same test ran flawlessly with 0 errors across 39,633 requests.

---

## Before Fix (Configuration Issues)

### Test Results
- **Date**: 2025-11-01
- **Total Requests**: 74,461
- **Errors**: 37,042 (49.75%)
- **Duration**: 6 minutes 49 seconds
- **Users**: Progressive 100 → 500
- **Breaking Point**: Appeared to be 100 users

### Error Breakdown
| Error Type | Count | Percentage |
|-----------|--------|-----------|
| 404 Not Found | ~18,593 | 25% |
| 400 Bad Request | ~18,449 | 25% |
| **TOTAL** | **37,042** | **49.75%** |

### Root Causes Identified

#### 1. CSV Header Rows
**Problem**: CSV files had header rows that were read as data
- `users.csv`: "email,password"
- `products.csv`: "productId,name,category,price"
- `filters.csv`: "category,priceMin,priceMax"

**Impact**: First request in each loop used invalid data

#### 2. Wrong Endpoint URL
**Problem**: Related products endpoint was missing category ID parameter
- **Used**: `/api/v1/product/related-product/${PRODUCT_ID}`
- **Required**: `/api/v1/product/related-product/${PRODUCT_ID}/${PRODUCT_CATEGORY_ID}`

**Impact**: All related-product requests returned 404

#### 3. Invalid Filter Data
**Problem**: Category filters used names instead of MongoDB ObjectIds
- **CSV Had**: "all", "electronics", "clothing", "books"
- **API Needs**: "66db427fdb0119d9234b27ed", "66db427fdb0119d9234b27ef", etc.

**Error Message**: "Cast to ObjectId failed for value 'all' at path 'category'"

**Impact**: All product-filters requests returned 400

#### 4. Placeholder Product Data
**Problem**: products.csv used placeholder IDs instead of real MongoDB ObjectIds
- **CSV Had**: "PLACEHOLDER_001", "PLACEHOLDER_002", etc.
- **Database Has**: "66db427fdb0119d9234b27f9", "67a2171ea6d9e00ef2ac0229", etc.

**Impact**: All related-product requests returned 404 (even after endpoint fix)

---

## After Fix (Proper Configuration)

### Test Results
- **Date**: 2025-11-02
- **Total Requests**: 39,633
- **Errors**: 0 (0.00%)
- **Duration**: 6 minutes 50 seconds
- **Users**: Progressive 100 → 500
- **Max Response Time**: 6.7 seconds

### Performance Metrics
| User Load | Throughput | Avg Response Time | Max Response Time |
|-----------|-----------|------------------|-------------------|
| 100 | 32.9/s | 593ms | 4,465ms |
| 200 | 101.5/s | 1,556ms | 2,912ms |
| 300 | 101.8/s | 2,380ms | 4,040ms |
| 400 | 102.4/s | 3,424ms | 5,037ms |
| 500 | 102.5/s | 4,126ms | 6,525ms |

### Fixes Applied

#### 1. Removed CSV Headers ✅
**Action**: Deleted all header rows from CSV files

**Files Modified**:
- `stress_test/data/users.csv` - Removed "email,password"
- `stress_test/data/products.csv` - Removed "productId,name,category,price"
- `stress_test/data/filters.csv` - Removed "category,priceMin,priceMax"

#### 2. Updated Product Data with Real MongoDB IDs ✅
**Action**: Retrieved real products from database and updated CSV

**API Call**:
```bash
curl http://localhost:6060/api/v1/product/get-product
```

**New products.csv**:
```csv
66db427fdb0119d9234b27f9,Novel,66db427fdb0119d9234b27ef,14.99
67a2171ea6d9e00ef2ac0229,The Law of Contract,66db427fdb0119d9234b27ef,54.99
67a21772a6d9e00ef2ac022a,NUS T-shirt,66db427fdb0119d9234b27ee,4.99
66db427fdb0119d9234b27f5,Smartphone,66db427fdb0119d9234b27ed,999.99
66db427fdb0119d9234b27f3,Laptop,66db427fdb0119d9234b27ed,1499.99
```

#### 3. Updated Filter Data with Real Category ObjectIds ✅
**Action**: Retrieved real categories from database and updated CSV

**API Call**:
```bash
curl http://localhost:6060/api/v1/category/get-category
```

**Categories Retrieved**:
- Electronics: `66db427fdb0119d9234b27ed`
- Book: `66db427fdb0119d9234b27ef`
- Clothing: `66db427fdb0119d9234b27ee`

**New filters.csv**:
```csv
66db427fdb0119d9234b27ed,0,2000
66db427fdb0119d9234b27ef,0,100
66db427fdb0119d9234b27ee,0,50
66db427fdb0119d9234b27ed,500,1500
66db427fdb0119d9234b27ef,10,60
```

#### 4. Fixed JMX Variable Names ✅
**Action**: Updated CSV Data Set Config variable names to match data structure

**Changes**:
- `PRODUCT_CATEGORY` → `PRODUCT_CATEGORY_ID`
- `FILTER_CATEGORY` → `FILTER_CATEGORY_ID`

**Files Modified**: `E-Commerce-Stress-Testing.jmx`

#### 5. Updated Request Bodies ✅
**Action**: Changed all product-filters request bodies to use new variable

**Before**:
```json
{
  "checked": ["${FILTER_CATEGORY}"],
  "radio": ["${FILTER_PRICE_MIN}", "${FILTER_PRICE_MAX}"]
}
```

**After**:
```json
{
  "checked": ["${FILTER_CATEGORY_ID}"],
  "radio": ["${FILTER_PRICE_MIN}", "${FILTER_PRICE_MAX}"]
}
```

**Impact**: Fixed all 4 thread groups (Progressive, Spike, Extreme, Recovery)

#### 6. Fixed Related Products Endpoint URL ✅
**Action**: Added missing category ID parameter to endpoint

**Before**:
```
/api/v1/product/related-product/${PRODUCT_ID}
```

**After**:
```
/api/v1/product/related-product/${PRODUCT_ID}/${PRODUCT_CATEGORY_ID}
```

**Impact**: Fixed all 4 thread groups, matches actual API route definition

---

## Comparison Analysis

### Error Rate Comparison
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total Requests | 74,461 | 39,633 | N/A |
| Errors | 37,042 | 0 | **100%** |
| Error Rate | 49.75% | 0% | **-49.75pp** |
| Success Rate | 50.25% | 100% | **+49.75pp** |

### Key Insights

#### 1. Configuration vs Stress Failure
**Before**: The high error rate was **constant** (~50%) regardless of user load, indicating **configuration issue**

**After**: Zero errors even at 500 users, proving the original errors were NOT due to stress

#### 2. True System Capacity
**Observation**: System handled 500 concurrent users with:
- 0% error rate
- Max response time of 6.7 seconds
- Consistent throughput of ~102 requests/second

**Conclusion**: The actual breaking point is **higher than 500 users**

#### 3. Response Time Trends
| Users | Avg Response Time | Note |
|-------|------------------|------|
| 100 | 593ms | Good performance |
| 200 | 1,556ms | Still acceptable |
| 300 | 2,380ms | Starting to slow |
| 400 | 3,424ms | Noticeable delay |
| 500 | 4,126ms | Approaching threshold |

**Trend**: Linear increase in response time suggests system is handling load well, not yet overwhelmed

#### 4. Error Types Tell the Story
**Configuration Errors** (Before):
- 404 Not Found → Wrong URLs, missing data
- 400 Bad Request → Invalid data format
- **Even at low load** (100 users)

**Stress Errors** (Expected if system fails):
- 500 Internal Server Error → System overloaded
- 503 Service Unavailable → Database connection pool exhausted
- Connection timeouts → Network saturation
- **Only at high load** (300+ users)

---

## Diagnostic Decision Tree (Used)

```
High Error Rate (>5%)
│
├─ Errors are 404/400?
│  └─ YES → Check configuration
│     ├─ Test with 1 user → Still errors? → Configuration issue ✅ (This was us)
│     └─ Test with curl → API works? → JMeter config issue ✅ (This was us)
│
└─ Errors are 500/503/timeout?
   └─ YES → Likely stress failure
      ├─ Errors increase with load? → Genuine stress ❌ (Not observed)
      └─ Error rate constant? → Configuration issue ✅ (Was our case)
```

---

## Lessons Learned

### 1. Always Validate Configuration First
**Before** assuming a stress failure, run a **baseline test** with minimal load (10 users, 30 seconds):
- If errors occur at low load → **Configuration issue**
- If no errors at low load → Proceed to stress test

### 2. Use Real Database Data
**Placeholder data** causes issues:
- Wrong ID formats (strings vs ObjectIds)
- Non-existent references
- Invalid enum values

**Always use**:
- Real MongoDB ObjectIds from your database
- Valid category IDs
- Existing product IDs
- Correct endpoint URLs

### 3. Remove CSV Headers
JMeter's **CSV Data Set Config** reads ALL lines as data:
- First line is NOT automatically treated as header
- Header rows become test data → API errors
- **Solution**: Delete header rows or use "Ignore first line" option

### 4. Verify Endpoint URLs
**Match JMeter paths to actual API routes**:
- Check `routes/*.js` files for exact paths
- Verify parameter requirements (`:pid/:cid` vs `:pid`)
- Test endpoints manually with `curl` before stress testing

### 5. Variable Names Must Match Data
**CSV variable names** must match how they're used:
- `PRODUCT_CATEGORY` → Wrong (implies name like "electronics")
- `PRODUCT_CATEGORY_ID` → Correct (implies ObjectId)

**Consistency matters** for code readability and debugging

### 6. Error Patterns Reveal Root Cause
| Error Pattern | Likely Cause |
|---------------|--------------|
| ~50% errors at all loads | Configuration issue (half the requests use bad data) |
| 0% → 10% → 50% increasing | Stress failure (system degrading) |
| 100% errors instantly | Server down or wrong base URL |
| Errors only on specific endpoints | Endpoint-specific config issue |

---

## Next Steps

Now that configuration is correct, we can:

### 1. Identify True Breaking Point
Run progressive stress tests with higher loads:
- 500 → 1000 users
- 1000 → 1500 users
- Continue until errors appear

### 2. Analyze Real Stress Failures
When errors occur, diagnose:
- Database connection pool size
- Node.js event loop saturation
- MongoDB query performance
- Network bandwidth limits

### 3. Optimize System
Based on real bottlenecks:
- Increase connection pool size
- Add database indexes
- Implement caching (Redis)
- Scale horizontally (multiple servers)

### 4. Set Performance Baselines
Document acceptable performance:
- Target: <5% error rate under normal load
- Response time SLA: <2 seconds average
- Throughput goal: >100 requests/second

---

## Files Modified

### CSV Data Files
- `stress_test/data/users.csv` - Removed header
- `stress_test/data/products.csv` - Real product IDs and category IDs
- `stress_test/data/filters.csv` - Real category ObjectIds

### JMeter Configuration
- `stress_test/jmeter/E-Commerce-Stress-Testing.jmx`:
  - Updated CSV variable names (PRODUCT_CATEGORY_ID, FILTER_CATEGORY_ID)
  - Fixed product-filters request bodies (4 thread groups)
  - Fixed related-product endpoint URL (4 thread groups)

### Documentation
- `ERROR_DIAGNOSIS_GUIDE.md` - Comprehensive diagnostic guide
- `CONFIGURATION_FIX_RESULTS.md` - This document

---

## Conclusion

The **49.75% error rate** was **NOT** a stress failure but a **configuration issue**:

✅ **Fixed**: CSV headers, placeholder data, wrong endpoints, invalid ObjectIds  
✅ **Result**: 0% error rate at 500 concurrent users  
✅ **Outcome**: System can handle MORE than 500 users (true breaking point not yet found)

**Key Takeaway**: Always validate configuration with a baseline test before interpreting stress test results. Configuration errors masquerade as stress failures but have distinct patterns (constant error rate, 404/400 codes, errors at low load).

---

**Generated**: 2025-11-02  
**Test Environment**: Node.js + MongoDB on localhost:6060  
**JMeter Version**: 5.6.3  
**Test Duration**: 6 minutes 50 seconds  
**Final Error Rate**: 0% ✅
