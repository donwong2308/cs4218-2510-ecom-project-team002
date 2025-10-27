/**
 * Product ID Extraction Script for Stress Testing
 * 
 * This script extracts product IDs from the database and saves them to products.csv
 * for use in JMeter stress tests.
 * 
 * Usage:
 *   node stress_test/data/extract-product-ids.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../../config/db.js';
import productModel from '../../models/productModel.js';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Extract all product IDs from database
 */
async function extractProductIds() {
  try {
    console.log('🚀 Extracting product IDs for stress testing...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all products (only _id field needed)
    const products = await productModel.find({}).select('_id name category price').lean();
    
    console.log(`📦 Found ${products.length} products in database\n`);

    if (products.length === 0) {
      console.log('⚠️  WARNING: No products found in database!');
      console.log('   Please add products before running stress tests.');
      process.exit(1);
    }

    // Create CSV content
    let csvContent = 'productId,name,category,price\n';
    products.forEach(product => {
      // Escape commas in name by wrapping in quotes
      const safeName = product.name.includes(',') ? `"${product.name}"` : product.name;
      csvContent += `${product._id},${safeName},${product.category},${product.price}\n`;
    });

    // Write to products.csv
    const csvPath = path.join(__dirname, 'products.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    console.log(`✅ Exported ${products.length} product IDs to: ${csvPath}`);
    console.log('\n📊 Product Distribution:');
    
    // Show distribution by category
    const categoryCount = {};
    products.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });

    console.log('\n✅ SUCCESS: Product IDs ready for stress testing!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
extractProductIds();
