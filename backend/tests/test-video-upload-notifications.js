import { db } from '../db/index.js';
import { getEnrolledStudentsForCourse } from '../routes/staff.routes.js';
import { sendEmail } from '../services/email.service.js';

async function testVideoUploadNotifications() {
  console.log('🧪 Testing Video Upload Notifications for Enrolled Students');

  const course = (db.raw.courses || [])[0];
  if (!course) {
    console.log('No courses found in database.');
    return;
  }

  console.log(`Course: "${course.title}" (${course.id})`);

  // 1. Check enrolled students detection
  const enrolledStudents = getEnrolledStudentsForCourse(course, db.raw);
  console.log(`Enrolled students found: ${enrolledStudents.length}`);
  if (enrolledStudents.length === 0) {
    console.log('⚠️ No enrolled students currently found for this course.');
  } else {
    console.log(`First student: ${enrolledStudents[0].name} (${enrolledStudents[0].email})`);
  }

  // 2. Test email dispatch with VIDEO_UPLOADED template
  const targetEmail = enrolledStudents[0]?.email || 'student@claxic.edu';
  const emailResult = await sendEmail(
    targetEmail,
    `🎬 New Video Lecture Available: Day 1 - Introduction to Course (${course.title})`,
    'VIDEO_UPLOADED',
    {
      name: enrolledStudents[0]?.name || 'Student',
      studentName: enrolledStudents[0]?.name || 'Student',
      courseTitle: course.title,
      courseId: course.id,
      dayNumber: 1,
      classTitle: 'Introduction to Course',
      instructorName: 'Faculty Lead',
      actionUrl: 'http://localhost:5173/student',
    }
  );

  if (emailResult && emailResult.id && emailResult.htmlBody.includes('Video Lecture Ready')) {
    console.log('✅ PASS: Video upload email dispatched and verified successfully!');
  } else {
    console.error('❌ FAIL: Video upload email failed');
  }
}

testVideoUploadNotifications().then(() => {
  console.log('Done testing video upload.');
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
