import assert from 'assert';
import { db, hashPassword, verifyPassword } from '../db/index.js';

console.log('--- RUNNING STAFF APPOINTMENT INTEGRATION TEST ---');

// 1. Appoint a test faculty staff member
const testStaffEmail = `test_faculty_${Date.now()}@claxic.edu`;
const testStaffPassword = 'SuperSecretStaff@2026';
const salt = 'salt_' + Math.random().toString(36).substring(2, 9);
const { hash } = hashPassword(testStaffPassword, salt);

const newStaffUser = {
  id: 'stf_test_' + Date.now(),
  name: 'Professor Ada Lovelace',
  email: testStaffEmail,
  mobile: '+91 9876543210',
  role: 'STAFF',
  isVerified: true,
  isActive: true,
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ada',
  institution: 'Department of Advanced Computing',
  degree: 'Chair Professor',
  yearOfStudy: '',
  passwordHash: hash,
  salt,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await db.transaction((data) => {
  data.users.unshift(newStaffUser);
});

// 2. Verify record in database
const retrieved = db.raw.users.find((u) => u.email === testStaffEmail);
assert.ok(retrieved, 'Staff member must exist in SQLite database');
assert.strictEqual(retrieved.role, 'STAFF', 'Role must be STAFF');
assert.strictEqual(retrieved.isVerified, true, 'Staff member must be pre-verified');
assert.strictEqual(retrieved.isActive, true, 'Staff member must be active');
assert.strictEqual(retrieved.institution, 'Department of Advanced Computing');

// 3. Verify password validation
const isValidPass = verifyPassword(testStaffPassword, retrieved.passwordHash, retrieved.salt);
assert.strictEqual(isValidPass, true, 'Staff password verification must succeed');

// 4. Clean up test record
await db.transaction((data) => {
  data.users = data.users.filter((u) => u.email !== testStaffEmail);
});

console.log('✓ Staff appointment database persistence: 100% SUCCESS');
console.log('--- ALL STAFF APPOINTMENT TESTS PASSED CLEANLY ---');
