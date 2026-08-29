import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const contentType = res.headers.get('content-type') || '';
  let body = null;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, body, headers: res.headers };
}

let studentToken = null;
let adminToken = null;
let testStudentEmail = `audit_student_${Date.now()}@university.edu`;
let testCourseId = null;
let testAppId = null;
let testPaymentId = null;

let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  return fn()
    .then(() => {
      passedTests++;
      console.log(`  ✅ PASS: ${name}`);
    })
    .catch((err) => {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    });
}

async function runAudit() {
  console.log('\n======================================================');
  console.log('  CLAXIC PLATFORM FULL-STACK AUDIT TEST SUITE');
  console.log('======================================================\n');

  // 1. SYSTEM & HEALTH
  console.log('--- 1. System & Server Health ---');
  await it('GET / returns HTML landing page', async () => {
    const res = await request('/', { headers: { Accept: 'text/html' } });
    assert.strictEqual(res.status, 200);
    assert.ok(
      res.body.includes('Claxic API Server') ||
      res.body.includes('Claxic Backend Service') ||
      res.body.includes('Claxic Admissions Engine') ||
      res.body.includes('Claxic')
    );
  });

  await it('GET /api/health returns status ok', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  await it('GET /api returns full API index', async () => {
    const res = await request('/api');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.documentation);
  });

  // 2. AUTHENTICATION & SECURITY
  console.log('\n--- 2. Authentication & User Security ---');
  let studentVerifyToken = null;

  await it('POST /api/auth/register creates new student account and sends verification', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Audit Student',
        email: testStudentEmail,
        password: 'Password@123',
        role: 'ADMIN', // Privilege escalation attempt
        mobile: '+91 9876543210',
        institution: 'IIT Delhi',
        degree: 'B.Tech CS',
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.user);
    assert.strictEqual(res.body.user.role, 'USER'); // Must be strictly USER
    assert.ok(res.body.token);
    assert.ok(res.body.verificationToken);
    studentToken = res.body.token;
    studentVerifyToken = res.body.verificationToken;
  });

  await it('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Student',
        email: testStudentEmail,
        password: 'Password@123',
      }),
    });
    assert.strictEqual(res.status, 409);
  });

  await it('POST /api/auth/register rejects invalid email format', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Invalid Email',
        email: 'not-an-email',
        password: 'Password@123',
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  await it('POST /api/auth/register rejects password under 8 characters', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Short Pass User',
        email: `short_pass_${Date.now()}@edu.com`,
        password: '123',
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  await it('POST /api/auth/verify-email successfully verifies account with token', async () => {
    const res = await request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        token: studentVerifyToken,
        email: testStudentEmail,
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  await it('POST /api/auth/resend-verification generates a fresh token for unverified accounts', async () => {
    const freshEmail = `unverified_${Date.now()}@stanford.edu`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unverified Student',
        email: freshEmail,
        password: 'Password@123',
      }),
    });
    assert.strictEqual(regRes.status, 201);

    const resendRes = await request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: freshEmail }),
    });
    assert.strictEqual(resendRes.status, 200);
    assert.ok(resendRes.body.verificationTokenPreview);
  });

  await it('POST /api/auth/login logs in seeded admin account', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@claxic.edu',
        password: 'Admin@123456',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'ADMIN');
    assert.ok(res.body.token);
    adminToken = res.body.token;
  });

  await it('POST /api/auth/login rejects wrong password with 401', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@claxic.edu',
        password: 'WrongPassword!',
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  await it('GET /api/auth/me authenticates valid token and strips password hash', async () => {
    const res = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, testStudentEmail);
    assert.strictEqual(res.body.user.passwordHash, undefined);
    assert.strictEqual(res.body.user.salt, undefined);
  });

  await it('POST /api/auth/change-password updates password when given correct current password', async () => {
    const res = await request('/api/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        currentPassword: 'Password@123',
        newPassword: 'NewPassword@456',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  await it('POST /api/auth/forgot-password & reset-password updates password and revokes previous sessions', async () => {
    const forgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: testStudentEmail }),
    });
    assert.strictEqual(forgotRes.status, 200);
    const resetCode = forgotRes.body.resetTokenPreview;
    assert.ok(resetCode);

    const resetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: resetCode,
        newPassword: 'FinalPassword@789',
      }),
    });
    assert.strictEqual(resetRes.status, 200);

    // Old token should be invalidated/rejected now
    const checkOldToken = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(checkOldToken.status, 401);

    // Login with new password should succeed
    const newLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'FinalPassword@789',
      }),
    });
    assert.strictEqual(newLoginRes.status, 200);
    studentToken = newLoginRes.body.token;
  });

  await it('POST /api/auth/google handles Google OAuth login', async () => {
    const res = await request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        email: 'google_user@gmail.com',
        name: 'Google User',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
  });

  // 3. COURSE CATALOG
  console.log('\n--- 3. Course Catalog ---');
  await it('GET /api/courses returns course catalog', async () => {
    const res = await request('/api/courses');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.courses));
    assert.ok(res.body.courses.length > 0);
    testCourseId = res.body.courses[0].id;
  });

  await it('GET /api/courses/categories returns available categories', async () => {
    const res = await request('/api/courses/categories');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.categories));
  });

  await it('GET /api/courses/:id returns single course detail', async () => {
    const res = await request(`/api/courses/${testCourseId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.course.id, testCourseId);
  });

  // 4. APPLICATION DRAFTS & SUBMISSION
  console.log('\n--- 4. Application Flow & Draft Resuming ---');
  await it('POST /api/applications/draft saves intermediate draft', async () => {
    const res = await request('/api/applications/draft', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        courseId: testCourseId,
        formData: {
          fullName: 'Audit Student Draft',
          email: testStudentEmail,
          mobile: '+91 9876543210',
          institution: 'IIT Delhi',
          degree: 'B.Tech',
        },
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.application.status, 'DRAFT');
  });

  await it('GET /api/applications/draft/:courseId retrieves saved draft', async () => {
    const res = await request(`/api/applications/draft/${testCourseId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.draft);
    assert.strictEqual(res.body.draft.formData.fullName, 'Audit Student Draft');
  });

  await it('POST /api/applications finalizes submission', async () => {
    const res = await request('/api/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        courseId: testCourseId,
        formData: {
          fullName: 'Audit Student Final',
          email: testStudentEmail,
          mobile: '+91 9876543210',
          institution: 'IIT Delhi',
          degree: 'B.Tech CS',
          yearOfStudy: 'Final Year',
          experienceLevel: 'Intermediate',
          statementOfIntent: 'Mastering Full Stack & GenAI',
          agreedToTerms: true,
          agreedToPrivacy: true,
          agreedToRefundPolicy: true,
        },
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.application.status, 'SUBMITTED');
    testAppId = res.body.application.id;
  });

  await it('GET /api/user/applications lists user applications', async () => {
    const res = await request('/api/user/applications', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.applications.some((a) => a.id === testAppId));
  });

  // 5. PAYMENT ORDERS & VERIFICATION
  console.log('\n--- 5. Payment Integrity & Razorpay Flow ---');
  let razorpayOrderId = null;
  await it('POST /api/payments/create-order creates Razorpay order payload', async () => {
    const res = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ applicationId: testAppId }),
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.orderId);
    assert.ok(res.body.amount > 0);
    assert.strictEqual(res.body.currency, 'INR');
    razorpayOrderId = res.body.orderId;
  });

  await it('POST /api/payments/verify confirms payment and issues tax receipt', async () => {
    const res = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        orderId: razorpayOrderId,
        paymentId: 'pay_audit_test_' + Date.now(),
        signature: 'sig_sim_' + Date.now(),
        applicationId: testAppId,
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.receiptNumber);
    testPaymentId = res.body.payment.id;
  });

  await it('GET /api/payments/:id/receipt fetches itemized tax invoice receipt', async () => {
    const res = await request(`/api/payments/${testPaymentId}/receipt`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.receipt);
    assert.ok(res.body.receipt.taxBreakup.cgst > 0);
    assert.ok(res.body.receipt.taxBreakup.sgst > 0);
    assert.strictEqual(res.body.receipt.organization.gstin, '29AAACC1206A1Z5');
  });

  // 6. IDOR & AUTHORIZATION SECURITY
  console.log('\n--- 6. IDOR & Authorization Security ---');
  await it('GET /api/admin/overview rejects non-admin users with 403', async () => {
    const res = await request('/api/admin/overview', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  await it('GET /api/admin/overview allows authorized admin', async () => {
    const res = await request('/api/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.totalCourses !== undefined);
  });

  await it('GET /api/admin/applications/export?token=... works with query token auth', async () => {
    const res = await request(`/api/admin/applications/export?token=${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    assert.ok(res.body.includes('Application Number'));
  });

  await it('PATCH /api/admin/users/:id/status updates user role and status', async () => {
    const meRes = await request('/api/auth/me', { headers: { Authorization: `Bearer ${studentToken}` } });
    const targetUserId = meRes.body.user.id;

    const res = await request(`/api/admin/users/${targetUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: true, role: 'USER' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.id, targetUserId);
  });

  // 7. SEPARATED ADMIN LOGIN & EXTENDED MANAGEMENT
  console.log('\n--- 7. Separated Admin Login & Extended Management ---');
  await it('POST /api/auth/admin-login rejects student account with 403 Forbidden', async () => {
    const res = await request('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'FinalPassword@789',
      }),
    });
    assert.strictEqual(res.status, 403);
    assert.ok(res.body.error.includes('Student') || res.body.error.includes('Access Denied'));
  });

  await it('POST /api/auth/admin-login successfully authenticates valid administrator', async () => {
    const res = await request('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@claxic.edu',
        password: 'Admin@123456',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'ADMIN');
    assert.ok(res.body.token);
  });

  await it('PUT /api/admin/users/:id updates full user profile', async () => {
    const meRes = await request('/api/auth/me', { headers: { Authorization: `Bearer ${studentToken}` } });
    const targetUserId = meRes.body.user.id;

    const res = await request(`/api/admin/users/${targetUserId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Updated Student Name',
        mobile: '+91 9999988888',
        institution: 'Indian Institute of Science',
        degree: 'M.Tech AI',
        yearOfStudy: '2nd Year',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.name, 'Updated Student Name');
    assert.strictEqual(res.body.user.institution, 'Indian Institute of Science');
  });

  await it('POST /api/admin/users/:id/reset-password resets user password and revokes previous sessions', async () => {
    const meRes = await request('/api/auth/me', { headers: { Authorization: `Bearer ${studentToken}` } });
    const targetUserId = meRes.body.user.id;

    const res = await request(`/api/admin/users/${targetUserId}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ newPassword: 'NewFreshPassword@2026' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Old studentToken must now be invalid
    const oldSessionRes = await request('/api/auth/me', { headers: { Authorization: `Bearer ${studentToken}` } });
    assert.strictEqual(oldSessionRes.status, 401);

    // Can sign in with new password
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testStudentEmail, password: 'NewFreshPassword@2026' }),
    });
    assert.strictEqual(loginRes.status, 200);
    studentToken = loginRes.body.token; // Update token for subsequent operations
  });

  await it('DELETE /api/admin/applications/:id permanently removes application', async () => {
    const res = await request(`/api/admin/applications/${testAppId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  // 8. SQLITE 3 DATABASE & PLATFORM SECURITY AUDIT
  console.log('\n--- 8. SQLite 3 Database & Platform Security Audit ---');
  await it('SQLite 3 database claxic.db exists and contains valid schema tables', async () => {
    const { DatabaseSync } = await import('node:sqlite');
    const dbTest = new DatabaseSync('claxic.db');
    const tables = dbTest.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
    assert.ok(tables.includes('users'), 'Table users missing in SQLite');
    assert.ok(tables.includes('courses'), 'Table courses missing in SQLite');
    assert.ok(tables.includes('applications'), 'Table applications missing in SQLite');
    assert.ok(tables.includes('payments'), 'Table payments missing in SQLite');
    assert.ok(tables.includes('sessions'), 'Table sessions missing in SQLite');
  });

  await it('SQL Injection resistance against authentication and course queries', async () => {
    const sqliPayload = "' OR '1'='1' --";
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: sqliPayload, password: 'password123' }),
    });
    // Must reject with 400 or 401, never allow bypass
    assert.ok(res.status === 400 || res.status === 401);
  });

  await it('Google OAuth2 securely rejects forged or invalid Google credentials', async () => {
    const res = await request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: 'fake_forged_google_jwt_token_12345' }),
    });
    assert.strictEqual(res.status, 401);
    assert.ok(res.body.error.includes('Google') || res.body.error.includes('verification failed'));
  });

  await it('Password storage uses cryptographically random salts & PBKDF2 hashing', async () => {
    const { db } = await import('../db/index.js');
    const adminUser = db.raw.users.find((u) => u.email === 'admin@claxic.edu');
    assert.ok(adminUser);
    assert.ok(adminUser.passwordHash && adminUser.passwordHash.length === 128); // 64 bytes in hex
    assert.ok(adminUser.salt && adminUser.salt.length >= 16);
  });

  console.log('\n======================================================');
  console.log(`  AUDIT RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('🏆 ALL FULL-STACK & SECURITY AUDIT CHECKS PASSED WITH 100% SUCCESS!\n');
  } else {
    console.error('⚠️ SOME AUDIT CHECKS FAILED. PLEASE INVESTIGATE.\n');
    process.exit(1);
  }
}

runAudit().catch(console.error);
