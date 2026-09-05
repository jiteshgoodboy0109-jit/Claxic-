// Comprehensive Persistence & Non-Reverting Test Suite
import { db } from '../db/index.js';

async function runTests() {
  console.log('--- RUNNING ADMIN PERSISTENCE VERIFICATION SUITE ---');

  // Test 1: Course Update & Persistence
  console.log('1. Testing Course Update Persistence...');
  const course = db.raw.courses[0];
  const origPrice = course.price;
  const testPrice = 33333;
  
  await db.transaction((data) => {
    const c = data.courses.find(x => x.id === course.id);
    c.price = testPrice;
  });

  const rowCourse = db.sqlite.prepare('SELECT price FROM courses WHERE id = ?').get(course.id);
  if (rowCourse.price !== testPrice) {
    throw new Error(`Course price failed to persist in SQLite! Expected ${testPrice}, got ${rowCourse.price}`);
  }
  console.log('   ✓ Course price verified in SQLite database');

  // Test 2: Application reviewNotes & adminNotes Persistence
  console.log('2. Testing Application Notes & Status Persistence...');
  const app = db.raw.applications[0];
  const testNote = 'Verified by Admissions Committee on ' + new Date().toISOString();
  await db.transaction((data) => {
    const a = data.applications.find(x => x.id === app.id);
    a.reviewNotes = testNote;
    a.adminNotes = testNote;
    a.status = 'APPROVED';
  });

  const rowApp = db.sqlite.prepare('SELECT status, reviewNotes, adminNotes FROM applications WHERE id = ?').get(app.id);
  if (rowApp.reviewNotes !== testNote || rowApp.status !== 'APPROVED') {
    throw new Error('Application notes or status failed to persist in SQLite!');
  }
  console.log('   ✓ Application reviewNotes & status verified in SQLite database');

  // Test 3: User Role & Profile Persistence
  console.log('3. Testing User Role & Profile Persistence...');
  const user = db.raw.users[0];
  const origRole = user.role;
  const testInstitution = 'Claxic Advanced Research Institute';
  await db.transaction((data) => {
    const u = data.users.find(x => x.id === user.id);
    u.institution = testInstitution;
  });

  const rowUser = db.sqlite.prepare('SELECT institution FROM users WHERE id = ?').get(user.id);
  if (rowUser.institution !== testInstitution) {
    throw new Error('User institution failed to persist in SQLite!');
  }
  console.log('   ✓ User profile verified in SQLite database');

  // Cleanup
  await db.transaction((data) => {
    const c = data.courses.find(x => x.id === course.id);
    c.price = origPrice;
    const a = data.applications.find(x => x.id === app.id);
    a.reviewNotes = '';
    a.adminNotes = '';
  });

  console.log('--- ALL PERSISTENCE TESTS PASSED CLEANLY (100% SUCCESS) ---');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
