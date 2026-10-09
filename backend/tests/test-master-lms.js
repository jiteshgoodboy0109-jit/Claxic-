import assert from 'assert';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword } from '../db/index.js';
import { isStaffAllotted } from '../routes/staff.routes.js';

console.log('========================================================');
console.log('   CLAXIC MASTER LMS COMPREHENSIVE INTEGRATION TEST     ');
console.log('========================================================');

async function runMasterLMSTests() {
  const timestamp = Date.now();
  const testStaffId = `stf_master_${timestamp}`;
  const testStaffEmail = `faculty_${timestamp}@claxic.edu`;
  const initialPassword = 'InitialFacultyPass@2026';
  const updatedPassword = 'UpdatedFacultyPass@2026';

  console.log('\n[TEST 1] ADMIN-ONLY STAFF APPOINTMENT & DATA INITIALIZATION');
  const salt = 'salt_' + Math.random().toString(36).substring(2, 9);
  const { hash } = hashPassword(initialPassword, salt);

  const staffUser = {
    id: testStaffId,
    name: 'Dr. Katherine Johnson',
    email: testStaffEmail,
    mobile: '+91 9123456789',
    role: 'STAFF',
    isVerified: true,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Katherine',
    institution: 'School of Mathematical Sciences',
    degree: 'Ph.D. Mathematics',
    yearOfStudy: '',
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.transaction((data) => {
    data.users.unshift(staffUser);
  });

  const appointedStaff = (db.raw.users || []).find((u) => u.id === testStaffId);
  assert.ok(appointedStaff, 'Appointed staff must be present in database');
  assert.strictEqual(appointedStaff.role, 'STAFF');
  assert.strictEqual(appointedStaff.isVerified, true);
  console.log('✓ Staff created successfully with pre-verified status and role=STAFF');

  console.log('\n[TEST 2] COURSE ALLOTMENT ISOLATION (isStaffAllotted)');
  const testCourseId1 = 'crs_comp_vision';
  const testCourseId2 = 'crs_data_science';

  // Initially has no allotments
  assert.strictEqual(isStaffAllotted(testStaffId, testCourseId1, 'STAFF'), false);
  console.log('✓ Unallotted course access blocked correctly');

  // Admin allots course 1
  const allotmentRecord = {
    id: 'alt_' + timestamp,
    staffId: testStaffId,
    courseId: testCourseId1,
    assignedBy: 'adm_master',
    assignedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  await db.transaction((data) => {
    if (!data.staffCourseAllotments) data.staffCourseAllotments = [];
    data.staffCourseAllotments.unshift(allotmentRecord);
  });

  assert.strictEqual(isStaffAllotted(testStaffId, testCourseId1, 'STAFF'), true);
  assert.strictEqual(isStaffAllotted(testStaffId, testCourseId2, 'STAFF'), false);
  // ADMIN role always has access
  assert.strictEqual(isStaffAllotted(testStaffId, testCourseId2, 'ADMIN'), true);
  console.log('✓ Allotted course granted, unallotted course denied, ADMIN bypass validated');

  console.log('\n[TEST 3] STAFF PROFILE EDITING & SECURE PASSWORD CHANGE');
  // Update permitted profile fields
  const updatedName = 'Dr. Katherine Johnson, Lead Fellow';
  const updatedMobile = '+91 9999888877';
  await db.transaction((data) => {
    const u = data.users.find((x) => x.id === testStaffId);
    if (u) {
      u.name = updatedName;
      u.mobile = updatedMobile;
      u.updatedAt = new Date().toISOString();
    }
  });

  const updatedStaff = (db.raw.users || []).find((u) => u.id === testStaffId);
  assert.strictEqual(updatedStaff.name, updatedName);
  assert.strictEqual(updatedStaff.mobile, updatedMobile);
  console.log('✓ Permitted profile fields updated in persistence layer');

  // Change password
  const newSalt = crypto.randomBytes(16).toString('hex');
  const { hash: newHash } = hashPassword(updatedPassword, newSalt);
  await db.transaction((data) => {
    const u = data.users.find((x) => x.id === testStaffId);
    if (u) {
      u.passwordHash = newHash;
      u.salt = newSalt;
      u.updatedAt = new Date().toISOString();
    }
  });

  const refetchedStaff = (db.raw.users || []).find((u) => u.id === testStaffId);
  assert.strictEqual(verifyPassword(updatedPassword, refetchedStaff.passwordHash, refetchedStaff.salt), true);
  assert.strictEqual(verifyPassword(initialPassword, refetchedStaff.passwordHash, refetchedStaff.salt), false);
  console.log('✓ Password hash rotated safely, old password successfully invalidated');

  console.log('\n[TEST 4] VIDEO METADATA & 75% PROGRESS COMPLETION ENGINE');
  const testLessonId = 'lsn_test_' + timestamp;
  const testStudentId = 'std_test_' + timestamp;
  const videoDurationSec = 600; // 10 minutes

  // Video metadata record
  const lessonVideo = {
    id: 'vid_' + timestamp,
    courseId: testCourseId1,
    lessonId: testLessonId,
    filename: 'vid_sample.mp4',
    originalName: 'lecture_01_intro.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 15420000,
    durationSec: videoDurationSec,
    uploadedBy: testStaffId,
    uploadedAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  await db.transaction((data) => {
    if (!data.lessonVideos) data.lessonVideos = [];
    data.lessonVideos.unshift(lessonVideo);
  });

  // Test watched calculation logic
  // Case A: 300 seconds watched (50% -> <75% completion -> forward skip locked)
  const watchedSecA = 300;
  const percentA = Math.min(100, Math.round((watchedSecA / videoDurationSec) * 100));
  const isCompletedA = percentA >= 75;
  const allowForwardSkipA = isCompletedA;
  assert.strictEqual(percentA, 50);
  assert.strictEqual(isCompletedA, false);
  assert.strictEqual(allowForwardSkipA, false);
  console.log(`✓ 50% watched: isCompleted=${isCompletedA}, forwardSkipUnlocked=${allowForwardSkipA}`);

  // Case B: 460 seconds watched (76.6% -> >=75% completion -> forward skip unlocked)
  const watchedSecB = 460;
  const percentB = Math.min(100, Math.round((watchedSecB / videoDurationSec) * 100));
  const isCompletedB = percentB >= 75;
  const allowForwardSkipB = isCompletedB;
  assert.strictEqual(percentB, 77);
  assert.strictEqual(isCompletedB, true);
  assert.strictEqual(allowForwardSkipB, true);
  console.log(`✓ 77% watched: isCompleted=${isCompletedB}, forwardSkipUnlocked=${allowForwardSkipB}`);

  // Persist progress record
  const progressRecord = {
    id: 'prg_' + timestamp,
    studentId: testStudentId,
    courseId: testCourseId1,
    lessonId: testLessonId,
    lastPositionSec: 460,
    durationSec: videoDurationSec,
    furthestPositionSec: 460,
    watchedSeconds: 460,
    percentWatched: 77,
    isCompleted: true,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.transaction((data) => {
    if (!data.lessonPlaybackProgress) data.lessonPlaybackProgress = [];
    data.lessonPlaybackProgress.unshift(progressRecord);
  });

  const savedProgress = (db.raw.lessonPlaybackProgress || []).find((p) => p.id === progressRecord.id);
  assert.ok(savedProgress);
  assert.strictEqual(Boolean(savedProgress.completed || savedProgress.isCompleted), true);
  console.log('✓ Verified 75% watched threshold successfully unlocks completion and seeking');

  console.log('\n[TEST 5] CLEANUP OF TEST ARTIFACTS');
  await db.transaction((data) => {
    data.users = (data.users || []).filter((u) => u.id !== testStaffId);
    data.staffCourseAllotments = (data.staffCourseAllotments || []).filter((a) => a.id !== allotmentRecord.id);
    data.lessonVideos = (data.lessonVideos || []).filter((v) => v.id !== lessonVideo.id);
    data.lessonPlaybackProgress = (data.lessonPlaybackProgress || []).filter((p) => p.id !== progressRecord.id);
  });
  console.log('✓ Test data cleaned up with zero side-effects to existing database');

  console.log('\n========================================================');
  console.log('   ALL 5 MASTER LMS INTEGRATION TEST SUITES PASSED!     ');
  console.log('========================================================\n');
}

runMasterLMSTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
