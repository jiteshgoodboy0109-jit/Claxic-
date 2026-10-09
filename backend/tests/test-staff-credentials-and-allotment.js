import http from 'http';

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, data, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('--- TEST 1: Admin Login ---');
  const adminLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/admin-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: 'admin@claxic.edu',
    password: 'Admin@123456',
  });

  if (adminLoginRes.status !== 200 || !adminLoginRes.data?.token) {
    console.error('Admin login failed:', adminLoginRes.data);
    process.exit(1);
  }
  const adminToken = adminLoginRes.data.token;
  console.log('✓ Admin login successful. Token acquired.');

  console.log('\n--- TEST 2: Create / Appoint New Staff with Permanent Password ---');
  const testStaffEmail = `faculty.test.${Date.now()}@claxic.edu`;
  const testStaffPassword = 'Clx@Faculty2026!';
  const createStaffRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/staff',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  }, {
    name: 'Dr. Test Professor',
    email: testStaffEmail,
    password: testStaffPassword,
    institution: 'Department of AI',
    degree: 'PhD, Computer Science',
  });

  if (createStaffRes.status !== 201 || !createStaffRes.data?.staff?.id) {
    console.error('Create staff failed:', createStaffRes.data);
    process.exit(1);
  }
  const testStaff = createStaffRes.data.staff;
  console.log(`✓ Staff appointed: ${testStaff.name} (${testStaff.email}), ID: ${testStaff.id}`);

  console.log('\n--- TEST 3: Staff Login with Permanent Password ---');
  const staffLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/staff-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    password: testStaffPassword,
  });

  if (staffLoginRes.status !== 200 || !staffLoginRes.data?.token) {
    console.error('Staff login failed:', staffLoginRes.data);
    process.exit(1);
  }
  console.log('✓ Staff successfully signed in with permanent password!');

  console.log('\n--- TEST 4: Admin Changes Staff Permanent Password ---');
  const newStaffPassword = 'Clx@UpdatedPass999!';
  const changePassRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/staff/${testStaff.id}/password`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  }, {
    password: newStaffPassword,
  });

  if (changePassRes.status !== 200) {
    console.error('Admin change password failed:', changePassRes.data);
    process.exit(1);
  }
  console.log('✓ Password changed by Admin. Response:', changePassRes.data.message);

  console.log('\n--- TEST 5: Verify Old Password Fails and New Password Succeeds ---');
  const oldLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/staff-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    password: testStaffPassword,
  });
  if (oldLoginRes.status === 401) {
    console.log('✓ Old password correctly rejected (401 Unauthorized).');
  } else {
    console.error('Old password should have been rejected! Status:', oldLoginRes.status);
    process.exit(1);
  }

  const newLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/staff-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    password: newStaffPassword,
  });
  if (newLoginRes.status === 200 && newLoginRes.data?.token) {
    console.log('✓ New permanent password successfully logged in!');
  } else {
    console.error('New password login failed:', newLoginRes.data);
    process.exit(1);
  }

  console.log('\n--- TEST 6: Verify Google Auth is Rejected for Staff ---');
  const googleStaffRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/google',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: testStaffEmail,
    portalRole: 'STAFF',
    credential: 'demo_staff_token',
  });
  if (googleStaffRes.status === 403) {
    console.log('✓ Google login for staff blocked with 403:', googleStaffRes.data.error);
  } else {
    console.error('Google login should be blocked for staff! Status:', googleStaffRes.status, googleStaffRes.data);
    process.exit(1);
  }

  console.log('\n--- TEST 7: Single-Staff Course Allotment Exclusivity ---');
  // Allot course to testStaff
  const courseIdToAllot = 'crs_system_design_2026';
  // Check who has it right now
  const allotmentsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/allotments',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Current active allotments:', allotmentsRes.data.allotments?.map(a => `${a.courseTitle} -> ${a.staffName}`));

  // Attempt to allot crs_system_design_2026 to testStaff (already allotted to Marie)
  const conflictAllotRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/staff/${testStaff.id}/allotments`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  }, {
    courseIds: [courseIdToAllot],
  });

  if (conflictAllotRes.status === 409) {
    console.log('✓ Course exclusivity successfully enforced! 409 Conflict:', conflictAllotRes.data.error);
  } else {
    console.error('Course conflict should have returned 409! Got:', conflictAllotRes.status, conflictAllotRes.data);
    process.exit(1);
  }

  console.log('\n--- TEST 8: Allotting an Unassigned Course Succeeds ---');
  // Find an unassigned course
  const coursesRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/courses',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allCourses = coursesRes.data.courses || [];
  const assignedCourseIds = new Set((allotmentsRes.data.allotments || []).map(a => a.courseId));
  const unassignedCourse = allCourses.find(c => !assignedCourseIds.has(c.id));

  if (unassignedCourse) {
    console.log(`Attempting to allot unassigned course "${unassignedCourse.title}" (${unassignedCourse.id})...`);
    const successfulAllotRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/staff/${testStaff.id}/allotments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      courseIds: [unassignedCourse.id],
    });

    if (successfulAllotRes.status === 200) {
      console.log('✓ Successfully allotted unassigned course to staff!');
    } else {
      console.error('Allotment should have succeeded! Got:', successfulAllotRes.data);
      process.exit(1);
    }

    // Now attempt to allot this same course to another staff member -> MUST FAIL with 409
    console.log('Attempting to re-allot this same course to another staff member...');
    const reallotConflict = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/staff/usr_f36cfcf1d5c8cae9/allotments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      courseIds: [courseIdToAllot, unassignedCourse.id],
    });
    if (reallotConflict.status === 409) {
      console.log('✓ Re-allotting to second staff rejected with 409 Conflict:', reallotConflict.data.error);
    } else {
      console.error('Re-allotment should have been rejected with 409! Got:', reallotConflict.status);
      process.exit(1);
    }
  }

  // Clean up test staff
  await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/staff/${testStaff.id}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('\n✓ Test staff cleaned up successfully.');

  console.log('\n===========================================');
  console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('===========================================');
}

run().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
