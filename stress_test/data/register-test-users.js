/**
 * Test User Registration Script for Stress Testing
 * 
 * This script registers 100 test users in the database for JMeter stress tests.
 * Run this BEFORE executing stress tests to ensure all users exist.
 * 
 * Usage:
 *   node stress_test/data/register-test-users.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../../config/db.js';
import userModel from '../../models/userModel.js';
import { hashPassword } from '../../helpers/authHelper.js';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Parse CSV file and return array of user objects
 */
function parseUsersCSV(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  // Skip header line
  const users = lines.slice(1).map(line => {
    const [email, password] = line.split(',').map(field => field.trim());
    return { email, password };
  });
  
  return users;
}

/**
 * Register a single user in the database
 */
async function registerUser(email, password) {
  try {
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log(`⚠️  User ${email} already exists - skipping`);
      return { success: true, existed: true };
    }

    // Hash password using the same method as the app
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await new userModel({
      name: `Stress Test User ${email.split('@')[0]}`,
      email,
      password: hashedPassword,
      phone: '1234567890',
      address: 'Test Address for Stress Testing',
      role: 0 // Regular user
    }).save();

    console.log(`✅ Registered user: ${email}`);
    return { success: true, existed: false, userId: user._id };
  } catch (error) {
    console.error(`❌ Failed to register ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main registration function
 */
async function registerAllTestUsers() {
  try {
    console.log('🚀 Starting test user registration for stress testing...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Parse CSV file
    const csvPath = path.join(__dirname, 'users.csv');
    const users = parseUsersCSV(csvPath);
    console.log(`📄 Found ${users.length} users in CSV file\n`);

    // Register users
    let registered = 0;
    let existed = 0;
    let failed = 0;

    for (const { email, password } of users) {
      const result = await registerUser(email, password);
      
      if (result.success) {
        if (result.existed) {
          existed++;
        } else {
          registered++;
        }
      } else {
        failed++;
      }
    }

    // Summary
    console.log('\n📊 Registration Summary:');
    console.log(`   ✅ Newly registered: ${registered}`);
    console.log(`   ⚠️  Already existed: ${existed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Total users ready: ${registered + existed}`);

    if (registered + existed >= 100) {
      console.log('\n✅ SUCCESS: All test users are ready for stress testing!');
    } else {
      console.log('\n⚠️  WARNING: Less than 100 users available. Some stress tests may fail.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
registerAllTestUsers();
