import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting Individual Course Scheduling & Content Protection Test Suite ---');
  let passedCount = 0;

  // Helper for requests
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

  // 1. Staff Login
  console.log('\n[1] Testing Staff Authentication...');
  const staffLoginRes = await request('/api/auth/staff-login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'staff@claxic.edu',
      password: 'Staff@123456',
    }),
  });
  assert.strictEqual(staffLoginRes.status, 200, 'Staff login should succeed');
  assert.ok(staffLoginRes.data.token, 'Staff login should return JWT token');
  const staffToken = staffLoginRes.data.token;
  console.log('✓ Staff authenticated successfully');
  passedCount++;

  // 2. Staff Course Creation
  console.log('\n[2] Testing Staff Course Creation (POST /api/staff/courses)...');
  const createCourseRes = await request('/api/staff/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      title: 'Automated Scheduling Masterclass ' + Date.now(),
      category: 'Engineering',
      duration: '10 Days',
      dailyReleaseTime: '09:00',
      shortDescription: 'Rigorous day-by-day scheduled curriculum release.',
      price: 12000,
      capacity: 35,
      instructor: 'Dr. Sarah Jenkins',
    }),
  });
  assert.strictEqual(createCourseRes.status, 201, 'Course creation should return 201 Created');
  assert.ok(createCourseRes.data.course?.id, 'Created course must have an ID');
  assert.strictEqual(createCourseRes.data.course.dailyReleaseTime, '09:00');
  assert.strictEqual(createCourseRes.data.course.duration, '10 Days');
  const courseId = createCourseRes.data.course.id;
  console.log(`✓ Course created with ID: ${courseId} and daily release time 09:00`);
  passedCount++;

  // 3. Staff Updates Course Settings
  console.log('\n[3] Testing Staff Course Settings Update (PUT /api/staff/courses/:id)...');
  const updateCourseRes = await request(`/api/staff/courses/${courseId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      dailyReleaseTime: '09:30',
      duration: '10 Days (Modular)',
    }),
  });
  assert.strictEqual(updateCourseRes.status, 200, 'Course update should return 200');
  assert.strictEqual(updateCourseRes.data.course.dailyReleaseTime, '09:30');
  console.log('✓ Course settings updated successfully to 09:30 release time');
  passedCount++;

  // 4. Staff Adds Day 2 Class First, then Day 1 Class (Testing Automatic Day Ordering)
  console.log('\n[4] Testing Staff Adding Day-wise Classes and Auto-Sorting...');
  const addDay2Res = await request(`/api/staff/courses/${courseId}/classes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      dayNumber: 2,
      classNumber: 2,
      title: 'Day 2: Distributed Schemas & Transactions',
      duration: '1 hr 30 mins',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      topics: ['Postgres', 'ACID', 'Indexes'],
      summary: 'Deep dive into database integrity.',
      test: {
        title: 'Day 2 Assessment',
        passingScore: 70,
        questions: [{ id: 'q1', question: 'What is ACID?', options: ['A', 'B'], correctIndex: 0 }],
      },
    }),
  });
  assert.strictEqual(addDay2Res.status, 201, 'Day 2 upload should return 201');

  const addDay1Res = await request(`/api/staff/courses/${courseId}/classes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      dayNumber: 1,
      classNumber: 1,
      title: 'Day 1: Architecture Foundations',
      duration: '1 hr 30 mins',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      topics: ['Architecture', 'Setup'],
      summary: 'Architecture kickoff session.',
      test: {
        title: 'Day 1 Assessment',
        passingScore: 70,
        questions: [{ id: 'q1', question: 'What is Docker?', options: ['A', 'B'], correctIndex: 0 }],
      },
    }),
  });
  assert.strictEqual(addDay1Res.status, 201, 'Day 1 upload should return 201');

  // Verify class sequence is sorted Day 1, then Day 2
  const getClassesRes = await request(`/api/staff/courses/${courseId}/classes`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert.strictEqual(getClassesRes.status, 200);
  assert.strictEqual(getClassesRes.data.classes.length, 2);
  assert.strictEqual(getClassesRes.data.classes[0].dayNumber, 1, 'Day 1 must be first');
  assert.strictEqual(getClassesRes.data.classes[1].dayNumber, 2, 'Day 2 must be second');
  const day1ClassId = getClassesRes.data.classes[0].id;
  const day2ClassId = getClassesRes.data.classes[1].id;
  console.log(`✓ Classes auto-sorted correctly: Day 1 (${day1ClassId}) then Day 2 (${day2ClassId})`);
  passedCount++;

  // 5. Register Student A and Student B
  console.log('\n[5] Registering Students A and B...');
  const studentAEmail = `student_a_${Date.now()}@test.claxic.edu`;
  const studentBEmail = `student_b_${Date.now()}@test.claxic.edu`;
  const studentCEmail = `student_c_unenrolled_${Date.now()}@test.claxic.edu`;

  const regA = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Student A (Started Today)',
      email: studentAEmail,
      password: 'Student@123456',
      mobile: '9876543210',
    }),
  });
  assert.strictEqual(regA.status, 201, 'Student A registration should succeed');
  const tokenA = regA.data.token;
  const userIdA = regA.data.user.id;

  const regB = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Student B (Starts in Future)',
      email: studentBEmail,
      password: 'Student@123456',
      mobile: '9876543211',
    }),
  });
  assert.strictEqual(regB.status, 201, 'Student B registration should succeed');
  const tokenB = regB.data.token;
  const userIdB = regB.data.user.id;

  const regC = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Student C (Unenrolled)',
      email: studentCEmail,
      password: 'Student@123456',
      mobile: '9876543212',
    }),
  });
  assert.strictEqual(regC.status, 201, 'Student C registration should succeed');
  const tokenC = regC.data.token;
  console.log('✓ Registered test accounts for Student A, Student B, and Student C');
  passedCount++;

  // 6. Student A applies TODAY (e.g. 2026-09-04)
  console.log('\n[6] Student A submits application with start date TODAY...');
  const todayStr = new Date().toISOString().split('T')[0];
  const appARes = await request('/api/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      courseId,
      formData: {
        startDate: todayStr,
      },
    }),
  });
  assert.strictEqual(appARes.status, 201, 'Student A application should succeed');
  console.log(`✓ Student A enrolled with individual start date: ${todayStr}`);
  passedCount++;

  // 7. Student B applies with future start date (+7 days)
  console.log('\n[7] Student B submits application with start date in FUTURE (+7 days)...');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const appBRes = await request('/api/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      courseId,
      formData: {
        startDate: futureDateStr,
      },
    }),
  });
  assert.strictEqual(appBRes.status, 201, 'Student B application should succeed');
  console.log(`✓ Student B enrolled with individual start date: ${futureDateStr}`);
  passedCount++;

  // 8. Verify Staff Route: GET /api/staff/courses/:courseId/applications
  console.log('\n[8] Testing Staff Course Specific Applications Endpoint...');
  const staffCourseAppsRes = await request(`/api/staff/courses/${courseId}/applications`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert.strictEqual(staffCourseAppsRes.status, 200);
  assert.strictEqual(staffCourseAppsRes.data.applications.length, 2, 'Should return exactly 2 enrolled applicants');
  const applicantEmails = staffCourseAppsRes.data.applications.map((a) => a.studentEmail);
  assert.ok(applicantEmails.includes(studentAEmail), 'Should include Student A');
  assert.ok(applicantEmails.includes(studentBEmail), 'Should include Student B');
  console.log('✓ Staff applications list correctly filters strictly by this course');
  passedCount++;

  // 9. Verify Student A's Course Schedule & Content Protection
  console.log("\n[9] Verifying Student A's Schedule (GET /api/learning/my-courses)...");
  const studentACoursesRes = await request('/api/learning/my-courses', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(studentACoursesRes.status, 200);
  const courseA = studentACoursesRes.data.courses.find((c) => c.courseId === courseId);
  assert.ok(courseA, 'Course should appear for enrolled Student A');
  assert.strictEqual(courseA.schedule.length, 2);

  const day1A = courseA.schedule[0];
  const day2A = courseA.schedule[1];

  // Day 1 for Student A was scheduled for today!
  // Note: if current time is >= 09:30, Day 1 is unlocked.
  console.log(`Student A Day 1: isLocked=${day1A.isLocked}, videoUrl=${day1A.videoUrl ? 'EXPOSED' : 'HIDDEN'}, lockMsg=${day1A.lockMessage}`);
  console.log(`Student A Day 2: isLocked=${day2A.isLocked}, videoUrl=${day2A.videoUrl ? 'EXPOSED' : 'HIDDEN'}, lockMsg=${day2A.lockMessage}`);

  // Day 2 MUST BE LOCKED for Student A!
  assert.strictEqual(day2A.isLocked, true, 'Day 2 must be locked for Student A');
  assert.strictEqual(day2A.videoUrl, null, 'Video URL must be stripped for locked Day 2');
  assert.strictEqual(day2A.test, null, 'Test must be stripped for locked Day 2');
  assert.ok(day2A.lockMessage.includes('Unlocks') || day2A.lockMessage.includes('Available'), 'Must have descriptive lockMessage');
  console.log('✓ Content protection verified: Day 2 is strictly locked and payloads are stripped');
  passedCount++;

  // 10. Student A Attempts to complete locked Day 2 class early -> MUST BE BLOCKED (403)
  console.log('\n[10] Testing Backend Lock Barrier on Completion Endpoint...');
  const completeDay2Res = await request(`/api/learning/courses/${courseId}/classes/${day2ClassId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ watchSeconds: 60 }),
  });
  assert.strictEqual(completeDay2Res.status, 403, 'Must return 403 Forbidden for locked Day 2');
  assert.strictEqual(completeDay2Res.data.isLocked, true);
  console.log(`✓ Early completion blocked with 403: "${completeDay2Res.data.error}"`);
  passedCount++;

  // 11. Student A Attempts to submit quiz for locked Day 2 class early -> MUST BE BLOCKED (403)
  console.log('\n[11] Testing Backend Lock Barrier on Quiz Submission Endpoint...');
  const quizDay2Res = await request(`/api/learning/courses/${courseId}/classes/${day2ClassId}/quiz`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ answers: { q1: 0 } }),
  });
  assert.strictEqual(quizDay2Res.status, 403, 'Must return 403 Forbidden for locked Day 2 quiz');
  assert.strictEqual(quizDay2Res.data.isLocked, true);
  console.log(`✓ Early quiz submission blocked with 403: "${quizDay2Res.data.error}"`);
  passedCount++;

  // 12. Verify Student B (Future Start Date) -> BOTH Day 1 and Day 2 are locked!
  console.log("\n[12] Verifying Student B's Schedule (Starts in +7 days)...");
  const studentBCoursesRes = await request('/api/learning/my-courses', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(studentBCoursesRes.status, 200);
  const courseB = studentBCoursesRes.data.courses.find((c) => c.courseId === courseId);
  assert.ok(courseB, 'Course should appear for enrolled Student B');

  const day1B = courseB.schedule[0];
  const day2B = courseB.schedule[1];

  assert.strictEqual(day1B.isLocked, true, 'Day 1 must be locked for future Student B');
  assert.strictEqual(day1B.videoUrl, null, 'Video URL must be null for future Student B');
  assert.strictEqual(day1B.test, null, 'Test must be null for future Student B');
  assert.ok(day1B.lockMessage.includes('Available on Day 1'), 'Lock message should specify Day 1');

  assert.strictEqual(day2B.isLocked, true, 'Day 2 must be locked for future Student B');
  console.log('✓ Student B schedule confirmed: All future classes locked until their individual start date');
  passedCount++;

  // 13. Student C (Unenrolled) -> Trying to complete or quiz -> MUST BE BLOCKED (403)
  console.log('\n[13] Testing Unenrolled Student C Access Barriers...');
  const unenrolledCompleteRes = await request(`/api/learning/courses/${courseId}/classes/${day1ClassId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenC}` },
    body: JSON.stringify({ watchSeconds: 60 }),
  });
  assert.strictEqual(unenrolledCompleteRes.status, 403, 'Unenrolled student must be rejected with 403');
  assert.strictEqual(unenrolledCompleteRes.data.error, 'You are not enrolled in this course.');

  const unenrolledCoursesRes = await request('/api/learning/my-courses', {
    headers: { Authorization: `Bearer ${tokenC}` },
  });
  assert.strictEqual(unenrolledCoursesRes.status, 200);
  const unrolledCourseFind = unenrolledCoursesRes.data.courses.find((c) => c.courseId === courseId);
  assert.strictEqual(unrolledCourseFind, undefined, 'Course must NOT appear for unenrolled Student C');
  console.log('✓ Unenrolled student strictly denied access and excluded from course listing');
  passedCount++;

  console.log(`\n============================================================`);
  console.log(`🎉 ALL ${passedCount} AUTOMATED TESTS PASSED SUCCESSFULLY!`);
  console.log(`============================================================\n`);
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
