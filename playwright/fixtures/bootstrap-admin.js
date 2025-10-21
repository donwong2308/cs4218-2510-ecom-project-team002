// Load environment variables from .env so MONGO_URL and others are available when running tests locally/CI
import 'dotenv/config';

// Helper to ensure test accounts exist and the admin has role=1 before specs run
// - Registers regular user and admin via API (idempotent)
// - Promotes admin to role=1 via MongoDB if necessary (optional: MONGO_URL + MONGO_DB_NAME)

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:6060';

// Regular user config
const USER_EMAIL = process.env.E2E_USER_EMAIL ?? 'test@test.com';
const USER_PASS = process.env.E2E_USER_PASS ?? 'test';
const USER_NAME = process.env.E2E_USER_NAME ?? 'E2E User';

// Admin config
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'testhw2@gmail.com';
const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? '123456';
const ADMIN_NAME = process.env.E2E_ADMIN_NAME ?? 'E2E Admin';
const ADMIN_PHONE = process.env.E2E_ADMIN_PHONE ?? '0000000000';
const ADMIN_ADDRESS = process.env.E2E_ADMIN_ADDRESS ?? 'Playwright HQ';
const ADMIN_ANSWER = process.env.E2E_ADMIN_SECURITY_ANSWER ?? 'test';

// Mongo promotion config (optional)
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.DATABASE_URL || '';
// Try to infer DB name from connection string; default to 'test' if absent
function inferDbNameFromUri(uri) {
  try {
    // mongodb+srv://user:pass@host/dbname?params  OR mongodb://...
    const afterSlash = uri.split('://')[1] ?? '';
    const pathPart = afterSlash.split('/')[1] ?? '';
    const dbName = (pathPart || '').split('?')[0];
    return dbName || 'test';
  } catch {
    return 'test';
  }
}
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || process.env.DB_NAME || process.env.MONGO_DB || (MONGO_URL ? inferDbNameFromUri(MONGO_URL) : 'test');
const USERS_COLLECTION = process.env.MONGO_USERS_COLLECTION || 'users';

async function safeRegister(request, payload) {
  const r = await request.post(`${API_BASE}/api/v1/auth/register`, {
    data: payload,
    timeout: 20000,
  });
  // treat 2xx as ok, 400/409 as "already exists"; note: this API may return 200 with success=false if already registered
  if (r.ok() || [400, 409].includes(r.status())) return true;
  // if 200 but body says already exists, it's fine too
  try {
    const body = await r.json();
    if (body && body.success === false && /already/i.test(body.message || '')) return true;
  } catch {}
  const t = await r.text().catch(() => '');
  throw new Error(`Register failed: ${r.status()} ${t}`);
}

async function tryLogin(request, email, password) {
  const r = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email, password },
    timeout: 15000,
  });
  if (!r.ok()) return null;
  return r.json().catch(() => null);
}

async function promoteViaMongo(email) {
  if (!MONGO_URL || !MONGO_DB_NAME) return false;
  let mongodb;
  try {
    mongodb = await import('mongodb');
  } catch {
    return false;
  }
  const client = new mongodb.MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
    const res = await db.collection(USERS_COLLECTION).updateOne({ email }, { $set: { role: 1 } });
    return res.matchedCount > 0;
  } catch {
    return false;
  } finally {
    try { await client.close(); } catch {}
  }
}

export async function ensureAdminAndUserReady(request) {
  // Ensure regular user exists
  await safeRegister(request, {
    name: USER_NAME,
    email: USER_EMAIL,
    password: USER_PASS,
    phone: '1234567890',
    address: 'E2E Street',
    answer: 'blue',
  }).catch(() => {});

  // Ensure admin exists
  await safeRegister(request, {
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    phone: ADMIN_PHONE,
    address: ADMIN_ADDRESS,
    answer: ADMIN_ANSWER,
  }).catch(() => {});

  // Ensure admin has role=1
  const login = await tryLogin(request, ADMIN_EMAIL, ADMIN_PASS);
  if (login?.user?.role === 1) return;

  const promoted = await promoteViaMongo(ADMIN_EMAIL);
  if (!promoted) {
    throw new Error(
      `Admin ${ADMIN_EMAIL} exists but is not role=1. ` +
      `Set MONGO_URL and MONGO_DB_NAME (current inferred='${MONGO_DB_NAME}') to allow DB promotion, ` +
      `or seed an admin in your DB before running these specs.`
    );
  }

  const verify = await tryLogin(request, ADMIN_EMAIL, ADMIN_PASS);
  if (verify?.user?.role !== 1) {
    throw new Error('Admin promotion attempted but role is still not 1.');
  }
}
