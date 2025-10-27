# Test Data Generator for Stress Testing

This directory contains CSV files with test data for JMeter stress tests.

## Files

### `users.csv`
- **Purpose:** User credentials for authentication stress testing
- **Format:** `email,password`
- **Count:** 100 unique users
- **Note:** These users must be pre-registered in the database before running stress tests

### `products.csv`
- **Purpose:** Product IDs for product browsing and filtering
- **Format:** `productId`
- **Count:** 200+ products
- **Note:** IDs should be extracted from actual database

### `filters.csv`
- **Purpose:** Filter combinations to stress database queries
- **Format:** `category,priceMin,priceMax`
- **Count:** Multiple filter combinations

## Usage in JMeter

```
CSV Data Set Config
├── users.csv → Used in Login requests
├── products.csv → Used in Product Details requests  
└── filters.csv → Used in Product Filter requests
```

## Generating Test Data

### Option 1: Manual Registration
1. Start the e-commerce application
2. Register 100 users via the UI or API
3. Export product IDs from MongoDB

### Option 2: Direct Database Insert (Faster)
1. Use the provided scripts to insert test users directly
2. Hash passwords with bcrypt (saltRounds=10)
3. Export product IDs

## Important Notes

⚠️ **Password Consistency:** All test users use the same password for simplicity during stress testing
⚠️ **Unique Emails:** Each user must have a unique email to avoid conflicts
⚠️ **Pre-Registration Required:** Users must exist in database before stress test execution
