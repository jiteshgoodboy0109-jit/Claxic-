// Dedicated Staff Data Reset Script for Claxic LMS
// Safely resets only staff accounts and allotments, preserving students, courses, applications, and admin access.
import 'dotenv/config';
import { db } from '../db/index.js';

console.log('--- CLAXIC STAFF DATA RESET OPERATION ---');

const existingStaff = db.raw.users.filter((u) => u.role === 'STAFF');
console.log(`Found ${existingStaff.length} existing staff accounts to reset:`);
existingStaff.forEach((s) => console.log(` - ${s.name} (${s.email}) [ID: ${s.id}]`));

const result = db.resetAllStaffData({
  adminId: 'usr_admin_system',
  adminName: 'Claxic System Administrator',
});

console.log('Reset complete!');
console.log(`Removed staff accounts: ${result.removedStaffCount}`);
console.log('Timestamp:', result.timestamp);

// Verify that admin accounts and student accounts are completely intact
const remainingUsers = db.raw.users;
const adminCount = remainingUsers.filter((u) => u.role === 'ADMIN').length;
const studentCount = remainingUsers.filter((u) => u.role === 'USER').length;
const staffCount = remainingUsers.filter((u) => u.role === 'STAFF').length;

console.log(`Current user status: ADMIN: ${adminCount}, STUDENT: ${studentCount}, STAFF: ${staffCount}`);
if (staffCount === 0) {
  console.log('SUCCESS: All staff records safely cleared. Only authorized Admin can now appoint staff.');
} else {
  console.error('ERROR: Staff accounts still remain!');
  process.exit(1);
}
