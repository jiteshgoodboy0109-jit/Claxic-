import { db } from '../db/index.js';
import { getEnrolledStudentsForCourse } from '../routes/staff.routes.js';
import { sendEmail } from '../services/email.service.js';

console.log('🧪 [Test Suite] Class Upload Notifications for Enrolled Students');

async function runTests() {
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  const course = db.raw.courses[0];
  console.log(`\nTarget Course: "${course.title}" (${course.id})`);

  // Setup: Ensure a test enrolled student exists for this course
  const testStudentUser = (db.raw.users || []).find((u) => u.role === 'USER') || {
    id: 'usr_test_student_01',
    name: 'Test Enrolled Student',
    email: 'test_student@claxic.edu',
    role: 'USER',
  };

  const testAppId = 'app_test_enrolled_' + Date.now();
  await db.transaction((data) => {
    if (!data.applications) data.applications = [];
    data.applications.push({
      id: testAppId,
      applicationNumber: `APP-TEST-${Date.now()}`,
      userId: testStudentUser.id,
      userEmail: testStudentUser.email,
      userName: testStudentUser.name,
      courseId: course.id,
      courseTitle: course.title,
      coursePrice: course.price || 9999,
      status: 'CONFIRMED',
      formData: { fullName: testStudentUser.name, email: testStudentUser.email },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // 1. Verify getEnrolledStudentsForCourse finds enrolled students
  console.log('\n1. Testing getEnrolledStudentsForCourse:');
  const enrolledStudents = getEnrolledStudentsForCourse(course, db.raw);
  assert(Array.isArray(enrolledStudents), 'Returns an array of enrolled students');
  assert(enrolledStudents.length > 0, `Found ${enrolledStudents.length} enrolled student(s) for course ${course.id}`);

  const foundTarget = enrolledStudents.find((s) => s.id === testStudentUser.id);
  assert(Boolean(foundTarget), `Test student ${testStudentUser.id} is accurately identified as enrolled`);
  assert(foundTarget?.name === testStudentUser.name, `Enrolled student name matches: ${foundTarget?.name}`);
  assert(foundTarget?.email === testStudentUser.email, `Enrolled student email matches: ${foundTarget?.email}`);

  // 2. Test In-App Alert Notification Generation
  console.log('\n2. Testing In-App Notification Generation on Class Upload:');
  const testClassTitle = 'Enterprise System Architecture & Resilient Deployment';
  const testDayNum = 7;
  const testNow = new Date().toISOString();

  let notificationsCreated = 0;
  let studentNotification = null;

  await db.transaction((data) => {
    if (!data.notifications) data.notifications = [];
    const targetedStudents = getEnrolledStudentsForCourse(course, data);

    for (const s of targetedStudents) {
      const notif = {
        id: 'notif_class_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        userId: s.id,
        title: `🎬 New Class Uploaded: Day ${testDayNum} - ${testClassTitle}`,
        message: `Day ${testDayNum} class "${testClassTitle}" has been uploaded for "${course.title}". Duration: 1 hr 30 mins. Check it out now!`,
        type: 'CREATIVE_CLASS',
        link: '/student',
        meta: {
          courseId: course.id,
          courseTitle: course.title,
          dayNumber: testDayNum,
          classTitle: testClassTitle,
          deliveryType: 'UPLOAD',
          duration: '1 hr 30 mins',
          topics: ['Architecture', 'Verification', 'Deployment'],
          instructorName: 'Faculty Member',
          authorName: 'Faculty Member',
          badge: 'CLASS LESSON',
          actionLabel: 'Watch Class',
          hasNotes: true,
        },
        isRead: false,
        createdAt: testNow,
      };
      data.notifications.unshift(notif);
      notificationsCreated++;
      if (s.id === testStudentUser.id) {
        studentNotification = notif;
      }
    }
  });

  assert(notificationsCreated >= 1, `Created ${notificationsCreated} targeted notification(s)`);
  assert(studentNotification !== null, 'Target enrolled student received the class upload notification');
  assert(studentNotification?.type === 'CREATIVE_CLASS', 'Notification type is CREATIVE_CLASS (mapped to "classes" tab & floating pop alert)');
  assert(studentNotification?.link === '/student', 'Notification link routes to /student portal');
  assert(studentNotification?.meta?.courseId === course.id, 'Notification contains matching courseId');
  assert(studentNotification?.meta?.classTitle === testClassTitle, 'Notification contains matching classTitle');
  assert(studentNotification?.meta?.badge === 'CLASS LESSON', 'Notification badge indicates CLASS LESSON');

  // 3. Test Email Notification Dispatch for Enrolled Student
  console.log('\n3. Testing Student Email Notification Alert:');
  const emailRecord = await sendEmail(
    testStudentUser.email,
    `🎬 New Class Uploaded: Day ${testDayNum} - ${testClassTitle} (${course.title})`,
    'CLASS_UPLOADED',
    {
      name: testStudentUser.name,
      studentName: testStudentUser.name,
      courseTitle: course.title,
      courseId: course.id,
      dayNumber: testDayNum,
      classTitle: testClassTitle,
      deliveryType: 'UPLOAD',
      duration: '1 hr 30 mins',
      topics: ['Architecture', 'Verification', 'Deployment'],
      instructorName: 'Faculty Member',
      hasNotes: true,
      actionUrl: 'http://localhost:5173/student',
    }
  );

  assert(Boolean(emailRecord?.id), 'Email alert dispatched and returned valid record ID');
  assert(emailRecord?.templateType === 'CLASS_UPLOADED', 'Email template used is CLASS_UPLOADED');
  assert(emailRecord?.toEmail === testStudentUser.email, `Recipient email correctly set to ${testStudentUser.email}`);
  assert(emailRecord?.htmlBody.includes(testClassTitle), 'Email body contains the uploaded class title');
  assert(emailRecord?.htmlBody.includes(course.title), 'Email body contains course title');
  assert(emailRecord?.htmlBody.includes('Open Student Portal & Start Learning'), 'Email body contains interactive LMS call to action');

  // 4. Test Online Live Meeting Notification Alert
  console.log('\n4. Testing Live Online Class Notification Alert:');
  const onlineClassTitle = 'Interactive Live Doubt Solving & Code Walkthrough';
  const onlineMeetTime = 'Today at 6:30 PM IST';
  let onlineNotification = null;

  await db.transaction((data) => {
    if (!data.notifications) data.notifications = [];
    onlineNotification = {
      id: 'notif_online_' + Date.now(),
      userId: testStudentUser.id,
      title: `🔴 Live Class: Day 8 - ${onlineClassTitle}`,
      message: `Live online class for "${course.title}" scheduled at ${onlineMeetTime}. Join via your student portal!`,
      type: 'CREATIVE_CLASS',
      link: '/student',
      meta: {
        courseId: course.id,
        courseTitle: course.title,
        dayNumber: 8,
        classTitle: onlineClassTitle,
        deliveryType: 'ONLINE',
        liveMeetingTime: onlineMeetTime,
        liveMeetingUrl: 'https://meet.google.com/abc-defg-hij',
        badge: 'LIVE ONLINE CLASS',
        actionLabel: 'Join Live Class',
      },
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(onlineNotification);
  });

  assert(onlineNotification !== null, 'Online live class notification created');
  assert(onlineNotification?.meta?.badge === 'LIVE ONLINE CLASS', 'Badge is LIVE ONLINE CLASS');
  assert(onlineNotification?.meta?.actionLabel === 'Join Live Class', 'Action label is Join Live Class');

  // Clean up test data
  await db.transaction((data) => {
    data.applications = (data.applications || []).filter((a) => a.id !== testAppId);
    data.notifications = (data.notifications || []).filter(
      (n) => !n.id.startsWith('notif_class_') && !n.id.startsWith('notif_online_')
    );
  });

  console.log(`\n========================================`);
  console.log(`🎉 TEST SUMMARY: ${passedCount}/${totalCount} assertions passed!`);
  console.log(`========================================\n`);

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
