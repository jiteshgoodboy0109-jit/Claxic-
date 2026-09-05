import { db } from '../db/index.js';

async function purgeTestUsers() {
  console.log('Starting cleanup of unwanted test users...');

  await db.transaction((data) => {
    const initialUserCount = data.users.length;
    const initialAppCount = data.applications.length;
    const initialPaymentCount = data.payments.length;
    const initialSessionCount = data.sessions.length;

    // Filter out test users
    const isTestEmail = (email) => {
      if (!email) return false;
      const lower = email.toLowerCase();
      return (
        lower.startsWith('audit_student_') ||
        lower.startsWith('unverified_') ||
        lower.startsWith('short_pass_') ||
        lower.startsWith('test_') ||
        lower.startsWith('student_a_') ||
        lower.startsWith('student_b_') ||
        lower.startsWith('student_c_') ||
        lower === 'google_user@gmail.com'
      );
    };

    const testUsers = data.users.filter((u) => isTestEmail(u.email));
    const testUserIds = new Set(testUsers.map((u) => u.id));

    console.log(`Found ${testUsers.length} test user records to purge.`);

    // Purge users
    data.users = data.users.filter((u) => !testUserIds.has(u.id));

    // Purge related applications
    data.applications = data.applications.filter(
      (a) => !testUserIds.has(a.userId) && !isTestEmail(a.email)
    );

    // Purge related payments
    data.payments = data.payments.filter(
      (p) => !testUserIds.has(p.userId) && !p.paymentId?.startsWith('pay_audit_test_')
    );

    // Purge related sessions (object keyed by token)
    let removedSessions = 0;
    if (data.sessions) {
      for (const [tok, sess] of Object.entries(data.sessions)) {
        if (testUserIds.has(sess.userId)) {
          delete data.sessions[tok];
          removedSessions++;
        }
      }
    }

    // Purge related verification tokens
    data.verificationTokens = data.verificationTokens.filter(
      (v) => !testUserIds.has(v.userId) && !isTestEmail(v.email)
    );

    // Purge related password reset tokens
    data.passwordResetTokens = data.passwordResetTokens.filter(
      (r) => !testUserIds.has(r.userId)
    );

    // Purge related notifications
    data.notifications = (data.notifications || []).filter((n) => !testUserIds.has(n.userId));

    // Purge related project submissions
    data.projectSubmissions = (data.projectSubmissions || []).filter(
      (p) => !testUserIds.has(p.userId) && !isTestEmail(p.userEmail)
    );

    // Purge related student progress
    data.studentProgress = (data.studentProgress || []).filter(
      (sp) => !testUserIds.has(sp.userId)
    );

    console.log(`Users: ${initialUserCount} -> ${data.users.length} (removed ${testUsers.length})`);
    console.log(`Applications: ${initialAppCount} -> ${data.applications.length}`);
    console.log(`Payments: ${initialPaymentCount} -> ${data.payments.length}`);
    console.log(`Sessions: removed ${removedSessions} test sessions`);

    console.log('\nRemaining Active Users:');
    data.users.forEach((u) => {
      console.log(`- [${u.role}] ${u.name} <${u.email}> (ID: ${u.id})`);
    });
  });

  console.log('\nCleanup completed and synchronized with SQLite database and data.json.');
}

purgeTestUsers().catch((err) => {
  console.error('Error during test user purge:', err);
  process.exit(1);
});
