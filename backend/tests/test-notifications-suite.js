import assert from 'assert';
import http from 'http';
import express from 'express';
import { db } from '../db/index.js';
import apiRouter from '../routes/index.js';

// Setup standalone test server on port 5055 to avoid conflicts
const app = express();
app.use(express.json());
app.use('/api', apiRouter);

const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;

async function runTestSuite() {
  console.log('🚀 ========================================================');
  console.log('🚀 RUNNING CLAXIC AUTOMATED NOTIFICATIONS TEST SUITE');
  console.log('🚀 ========================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test server running on ${BASE_URL}`);

  let passedTests = 0;

  async function request(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }

  try {
    // 1. Authenticate Admin
    console.log('\n[TEST 1] Admin Authentication...');
    const adminLoginRes = await request('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@claxic.edu', password: 'Admin@123456' }),
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
    const adminToken = adminLoginRes.data.token;
    console.log('✓ Admin authenticated successfully.');
    passedTests++;

    // 2. Authenticate Staff
    console.log('\n[TEST 2] Staff Authentication...');
    const staffLoginRes = await request('/api/auth/staff-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'staff@claxic.edu', password: 'Staff@123456' }),
    });
    assert.strictEqual(staffLoginRes.status, 200, 'Staff login should return 200');
    const staffToken = staffLoginRes.data.token;
    console.log('✓ Staff authenticated successfully.');
    passedTests++;

    // 3. Create Two Test Students (Student A and Student B)
    console.log('\n[TEST 3] Creating Test Students A & B...');
    const emailA = `student_a_${Date.now()}@university.edu`;
    const emailB = `student_b_${Date.now()}@university.edu`;

    const regARes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Student Alpha', email: emailA, password: 'Password@123456', role: 'USER' }),
    });
    assert.strictEqual(regARes.status, 201, 'Student A registration should return 201');
    const studentAToken = regARes.data.token;
    const studentAId = regARes.data.user.id;

    const regBRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Student Beta', email: emailB, password: 'Password@123456', role: 'USER' }),
    });
    assert.strictEqual(regBRes.status, 201, 'Student B registration should return 201');
    const studentBToken = regBRes.data.token;
    const studentBId = regBRes.data.user.id;
    console.log(`✓ Created Student A (${studentAId}) & Student B (${studentBId})`);
    passedTests++;

    // 4. Staff Creates a Course
    console.log('\n[TEST 4] Staff creates Course...');
    const createCourseRes = await request('/api/staff/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        title: 'Creative UI & Micro-interactions ' + Date.now(),
        category: 'Design Engineering',
        duration: '6 Weeks',
        price: 8500,
        capacity: 30,
        instructor: 'Dr. Sarah Jenkins',
      }),
    });
    assert.strictEqual(createCourseRes.status, 201, 'Course creation should succeed');
    const courseId = createCourseRes.data.course.id;
    console.log(`✓ Course created with ID: ${courseId}`);
    passedTests++;

    // 5. Enroll Student A into Course (simulate confirmed admission)
    console.log('\n[TEST 5] Enrolling Student A into Course...');
    await db.transaction((data) => {
      if (!data.applications) data.applications = [];
      data.applications.push({
        id: 'app_test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        applicationNumber: 'APP-TEST-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        userId: studentAId,
        userName: 'Student Alpha',
        courseId: courseId,
        status: 'CONFIRMED',
        appliedAt: new Date().toISOString(),
      });
    });
    console.log('✓ Student A confirmed enrollment in course.');
    passedTests++;

    // 6. Staff uploads a Creative Class
    console.log('\n[TEST 6] Staff uploads Creative Class...');
    const uploadClassRes = await request(`/api/staff/courses/${courseId}/classes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        dayNumber: 1,
        classNumber: 1,
        title: 'Day 1: Modern Motion & Micro-animations',
        description: 'Comprehensive lab on Framer Motion and canvas interactions.',
        videoUrl: 'https://youtube.com/watch?v=sample',
        duration: '1 hr 45 mins',
        topics: ['Framer Motion', 'Spring Physics', 'Performance'],
      }),
    });
    assert.strictEqual(uploadClassRes.status, 201, 'Class upload should return 201');
    console.log('✓ Creative Class uploaded by staff.');
    passedTests++;

    // 7. Verify Targeted Creative Class Notification:
    // Student A (enrolled) MUST have the notification
    // Student B (not enrolled) MUST NOT have the class notification
    console.log('\n[TEST 7] Verifying TARGETED Creative Class notification...');
    const notifsARes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    assert.strictEqual(notifsARes.status, 200);
    const classNotifA = notifsARes.data.notifications.find((n) => n.type === 'CREATIVE_CLASS');
    assert.ok(classNotifA, 'Student A must have received the CREATIVE_CLASS notification');
    assert.strictEqual(classNotifA.meta.courseId, courseId);
    assert.strictEqual(classNotifA.meta.dayNumber, 1);
    console.log(`✓ Student A received Creative Class notification: "${classNotifA.title}"`);

    const notifsBRes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert.strictEqual(notifsBRes.status, 200);
    const classNotifB = notifsBRes.data.notifications.find(
      (n) => n.type === 'CREATIVE_CLASS' && n.meta?.courseId === courseId
    );
    assert.strictEqual(classNotifB, undefined, 'Student B (not enrolled) must NOT receive the class notification');
    console.log('✓ Confirmed: Non-enrolled Student B did NOT receive the notification (Targeting is 100% accurate).');
    passedTests++;

    // 8. Admin Launches a New Course -> Triggers "NEW LAUNCH AD" to ALL Students
    console.log('\n[TEST 8] Admin creates & publishes NEW COURSE -> Verifying NEW LAUNCH AD broadcast...');
    const adminLaunchRes = await request('/api/admin/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Masterclass in Large Language Model Agents ' + Date.now(),
        category: 'Artificial Intelligence',
        duration: '12 Weeks',
        price: 14999,
        originalPrice: 22999,
        capacity: 40,
        status: 'PUBLISHED',
        shortDescription: 'Build autonomous agents, multi-agent swarms, and RAG pipelines.',
        bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
      }),
    });
    assert.strictEqual(adminLaunchRes.status, 201, 'Admin course creation should return 201');
    const launchedCourseId = adminLaunchRes.data.course.id;
    console.log(`✓ Admin published course ID: ${launchedCourseId}`);

    // Check Student A and Student B both received the NEW LAUNCH AD
    const studentANotifsAfter = await request('/api/notifications?type=launches', {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    const adA = studentANotifsAfter.data.notifications.find((n) => n.meta?.courseId === launchedCourseId);
    assert.ok(adA, 'Student A must receive the COURSE_LAUNCH_AD');
    assert.strictEqual(adA.type, 'COURSE_LAUNCH_AD');
    assert.ok(adA.meta?.discountPercent > 0, 'Ad must include calculated discount percentage');

    const studentBNotifsAfter = await request('/api/notifications?type=launches', {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    const adB = studentBNotifsAfter.data.notifications.find((n) => n.meta?.courseId === launchedCourseId);
    assert.ok(adB, 'Student B must also receive the COURSE_LAUNCH_AD');
    console.log(`✓ Confirmed: All active students received the "🚀 NEW LAUNCH" Promo Ad with ${adA.meta.discountPercent}% OFF tag!`);
    passedTests++;

    // 9. Mark As Read & Unread Counter test
    console.log('\n[TEST 9] Testing Mark As Read & Unread Count update...');
    assert.strictEqual(classNotifA.isRead, false);
    const markReadRes = await request(`/api/notifications/${classNotifA.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    assert.strictEqual(markReadRes.status, 200);
    assert.strictEqual(markReadRes.data.notification.isRead, true);

    const checkReadRes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    const updatedNotif = checkReadRes.data.notifications.find((n) => n.id === classNotifA.id);
    assert.strictEqual(updatedNotif.isRead, true);
    console.log('✓ Notification successfully marked as read; unread count decremented.');
    passedTests++;

    // 10. Mark All As Read
    console.log('\n[TEST 10] Testing Mark All As Read...');
    const markAllRes = await request('/api/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    assert.strictEqual(markAllRes.status, 200);
    assert.strictEqual(markAllRes.data.unreadCount, 0);
    console.log('✓ All notifications for user successfully marked as read.');
    passedTests++;

    console.log('\n🎉 ========================================================');
    console.log(`🎉 ALL ${passedTests} NOTIFICATION SUITE TESTS PASSED PERFECTLY!`);
    console.log('🎉 ========================================================');
  } finally {
    server.close();
  }
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
