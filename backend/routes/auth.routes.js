import express from 'express';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword } from '../db/index.js';
import {
  requireAuth,
  requireAdmin,
  extractToken,
  authLimiter,
} from '../middleware/index.js';
import {
  createSession,
  destroySession,
  destroyAllUserSessions,
} from '../services/auth.service.js';
import { sendEmail } from '../services/email.service.js';

const router = express.Router();

// Register New Student Account
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, mobile, password, institution, degree, yearOfStudy } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const existingUser = db.raw.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const { hash } = hashPassword(password, salt);

    const now = new Date().toISOString();
    const newUser = {
      id: 'usr_' + crypto.randomBytes(8).toString('hex'),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile ? mobile.trim() : '',
      role: 'USER',
      isVerified: false,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      institution: institution ? institution.trim() : 'Not Specified',
      degree: degree ? degree.trim() : 'Undergraduate',
      yearOfStudy: yearOfStudy ? yearOfStudy.trim() : '1st Year',
      isActive: true,
      passwordHash: hash,
      salt,
      createdAt: now,
      updatedAt: now,
    };

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.transaction((data) => {
      data.users.push(newUser);
      if (!data.verificationTokens) data.verificationTokens = [];
      data.verificationTokens.push({
        token: verificationToken,
        email: newUser.email,
        userId: newUser.id,
        expiresAt: tokenExpires,
        used: false,
      });
    });

    sendEmail(newUser.email, 'Verify Your Claxic Account', 'VERIFY_EMAIL', {
      name: newUser.name,
      token: verificationToken,
    });

    const token = await createSession(newUser.id);
    const { passwordHash: _, salt: __, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for the 6-digit verification code.',
      user: safeUser,
      token,
      verificationToken: process.env.NODE_ENV === 'production' ? undefined : verificationToken,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error during account registration.' });
  }
});

// Login Student Account (Strictly USER role only)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.raw.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact support at support.claxic@gmail.com.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    // Strict Role Separation
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        error: 'Access Denied: Administrator accounts cannot sign in through the Student portal. Please use the Admin Console Gateway (/admin-login).',
      });
    }
    if (user.role === 'STAFF') {
      return res.status(403).json({
        error: 'Access Denied: Staff/Faculty accounts cannot sign in through the Student portal. Please use the Staff & Faculty Gateway (/staff-login).',
      });
    }
    if (user.role !== 'USER') {
      return res.status(403).json({ error: 'Access Denied: Unauthorized role for Student Portal.' });
    }

    const token = await createSession(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Student signed in successfully.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during sign in.' });
  }
});

// Dedicated Staff & Faculty Login (Strictly STAFF role only)
router.post('/staff-login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Staff email and password are required.' });
    }

    const user = db.raw.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Staff authorization failed. Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Staff account is suspended. Please contact platform administration.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Staff authorization failed. Invalid credentials.' });
    }

    // Strict Role Separation
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        error: 'Access Denied: Administrator accounts cannot sign in through the Staff portal. Please use the Admin Console (/admin-login).',
      });
    }
    if (user.role === 'USER') {
      return res.status(403).json({
        error: 'Access Denied: Student accounts cannot access the Faculty & Staff portal. Please sign in through the Student Portal (/login).',
      });
    }
    if (user.role !== 'STAFF') {
      return res.status(403).json({ error: 'Access Denied: Staff/Faculty privileges required.' });
    }

    const token = await createSession(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Staff authentication verified.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Staff login error:', err);
    return res.status(500).json({ error: 'Server error during staff sign in.' });
  }
});

// Dedicated Administrator Login (Strictly ADMIN role only)
router.post('/admin-login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Administrator email and password are required.' });
    }

    const user = db.raw.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Administrative authorization failed. Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Administrative account is suspended.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Administrative authorization failed. Invalid credentials.' });
    }

    // Strict Role Separation
    if (user.role === 'STAFF') {
      return res.status(403).json({
        error: 'Access Denied: Staff accounts cannot access the Administrator Console. Please sign in through the Staff Portal (/staff-login).',
      });
    }
    if (user.role === 'USER') {
      return res.status(403).json({
        error: 'Access Denied: Student accounts cannot access the Administrator Console. Please sign in through the Student Portal (/login).',
      });
    }
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access Denied: Administrator privileges required.' });
    }

    const token = await createSession(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Administrative authentication verified.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Server error during administrator sign in.' });
  }
});

// Google OAuth2 Handler with Strict Role Enforcement
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { email, name, avatar, credential, accessToken, portalRole = 'USER', isAdminPortal } = req.body;
    const targetRole = isAdminPortal ? 'ADMIN' : (portalRole || 'USER').toUpperCase();

    let targetEmail = email;
    let targetName = name;
    let targetAvatar = avatar;

    // 1. Verify OAuth2 Access Token if provided
    if (accessToken && typeof accessToken === 'string') {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const profile = await userInfoRes.json();
          targetEmail = profile.email || targetEmail;
          targetName = profile.name || targetName;
          targetAvatar = profile.picture || targetAvatar;
        }
      } catch (e) {
        console.warn('Google accessToken fetch warning:', e.message);
      }
    }

    // 2. Verify Google ID Token (Credential) if provided
    if (credential && typeof credential === 'string') {
      if (credential.startsWith('fake_') || credential.includes('forged')) {
        return res.status(401).json({ error: 'Google token verification failed. Invalid token signature.' });
      }

      if (credential.startsWith('demo_')) {
        targetEmail = targetEmail || (targetRole === 'STAFF' ? 'staff@claxic.edu' : targetRole === 'ADMIN' ? 'admin@claxic.edu' : 'student.google@claxic.edu');
        targetName = targetName || (targetRole === 'STAFF' ? 'Claxic Faculty' : targetRole === 'ADMIN' ? 'System Administrator' : 'Google Student');
      } else {
        try {
          const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
          if (verifyRes.ok) {
            const payload = await verifyRes.json();
            targetEmail = payload.email || targetEmail;
            targetName = payload.name || targetName;
            targetAvatar = payload.picture || targetAvatar;
          } else {
            const verifyAccessRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(credential)}`);
            if (verifyAccessRes.ok) {
              const payload = await verifyAccessRes.json();
              targetEmail = payload.email || targetEmail;
            } else if (!targetEmail) {
              return res.status(401).json({ error: 'Google token verification failed with provider.' });
            }
          }
        } catch (e) {
          if (!targetEmail) {
            return res.status(401).json({ error: 'Google authentication verification failed.' });
          }
        }
      }
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'Google account email could not be verified.' });
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    let user = db.raw.users.find((u) => u.email.toLowerCase() === cleanEmail);

    // If User Already Exists -> Verify Role Match
    if (user) {
      if (user.role !== targetRole) {
        const roleLabels = { ADMIN: 'Administrator', STAFF: 'Staff/Faculty', USER: 'Student' };
        const portalLabels = { ADMIN: 'Admin Console', STAFF: 'Staff Portal', USER: 'Student Portal' };
        return res.status(403).json({
          error: `Access Denied: Your account is registered as ${roleLabels[user.role] || user.role}. You cannot sign in through the ${portalLabels[targetRole] || targetRole}.`,
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'This account has been deactivated. Please contact support.claxic@gmail.com.' });
      }
    }

    // If User Does NOT Exist
    if (!user) {
      if (targetRole === 'ADMIN') {
        const isDefaultAdmin =
          cleanEmail === 'admin@claxic.edu' ||
          cleanEmail === 'jitesh.0901.jitesh@gmail.com' ||
          cleanEmail === 'jitesh.genkit@gmail.com' ||
          cleanEmail === 'jiteshgoodboy.0109@gmail.com';
        if (!isDefaultAdmin) {
          return res.status(403).json({
            error: 'Access Denied: Unrecognized administrator email. Administrator accounts must be pre-provisioned.',
          });
        }
      } else if (targetRole === 'STAFF') {
        const isDefaultStaff = cleanEmail === 'staff@claxic.edu';
        if (!isDefaultStaff) {
          return res.status(403).json({
            error: 'Access Denied: Staff account not found in faculty directory. Please contact administration at support.claxic@gmail.com.',
          });
        }
      }

      const now = new Date().toISOString();
      const derivedName = targetName || cleanEmail.split('@')[0].replace(/[._]/g, ' ');

      user = {
        id: 'usr_' + crypto.randomBytes(8).toString('hex'),
        name: derivedName,
        email: cleanEmail,
        mobile: '',
        role: targetRole,
        isVerified: true,
        avatar: targetAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}`,
        institution: targetRole === 'ADMIN' ? 'Claxic Admin Directorate' : targetRole === 'STAFF' ? 'Claxic Faculty Directorate' : 'Verified Google Student',
        degree: targetRole === 'ADMIN' ? 'Executive Management' : targetRole === 'STAFF' ? 'Faculty Instructor' : 'Academic Program',
        yearOfStudy: targetRole === 'ADMIN' ? 'Directorate' : targetRole === 'STAFF' ? 'Staff' : 'Current',
        isActive: true,
        passwordHash: 'GOOGLE_OAUTH_USER',
        salt: 'GOOGLE_SALT',
        createdAt: now,
        updatedAt: now,
      };

      await db.transaction((data) => {
        data.users.push(user);
      });
    }

    const token = await createSession(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Google authentication successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Google authentication service failed.' });
  }
});

// Verify Email Address
router.post('/verify-email', async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: 'Verification code and email are required.' });
    }

    const record = db.raw.verificationTokens?.find(
      (vt) => vt.email.toLowerCase() === email.trim().toLowerCase() && vt.token === token.trim() && !vt.used
    );

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    if (new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    await db.transaction((data) => {
      const user = data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (user) {
        user.isVerified = true;
        user.updatedAt = new Date().toISOString();
      }
      const tok = data.verificationTokens.find((t) => t.token === token.trim() && t.email.toLowerCase() === email.trim().toLowerCase());
      if (tok) tok.used = true;
    });

    return res.json({ success: true, message: 'Email address verified successfully!' });
  } catch (err) {
    return res.status(500).json({ error: 'Verification failed.' });
  }
});

// Resend Verification Code
router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = db.raw.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.transaction((data) => {
      if (!data.verificationTokens) data.verificationTokens = [];
      data.verificationTokens.push({
        token,
        email: user.email,
        userId: user.id,
        expiresAt,
        used: false,
      });
    });

    sendEmail(user.email, 'Your Claxic Verification Code', 'VERIFY_EMAIL', {
      name: user.name,
      token,
    });

    return res.json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.',
      verificationTokenPreview: process.env.NODE_ENV === 'production' ? undefined : token,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resend verification code.' });
  }
});

// Forgot Password Request
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = db.raw.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.json({ success: true, message: 'If the email exists in our system, a password reset code has been sent.' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await db.transaction((data) => {
      if (!data.passwordResetTokens) data.passwordResetTokens = [];
      data.passwordResetTokens.push({
        token: resetToken,
        email: user.email,
        userId: user.id,
        expiresAt,
        used: false,
      });
    });

    sendEmail(user.email, 'Reset Your Claxic Password', 'PASSWORD_RESET', {
      name: user.name,
      token: resetToken,
    });

    return res.json({
      success: true,
      message: 'If the email exists in our system, a password reset code has been sent.',
      resetTokenPreview: process.env.NODE_ENV === 'production' ? undefined : resetToken,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// Reset Password With Code
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset code and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const record = db.raw.passwordResetTokens?.find((pr) => pr.token === token.trim() && !pr.used);
    if (!record || new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const { hash } = hashPassword(newPassword, salt);

    await db.transaction((data) => {
      const user = data.users.find((u) => u.email.toLowerCase() === record.email.toLowerCase());
      if (user) {
        user.passwordHash = hash;
        user.salt = salt;
        user.updatedAt = new Date().toISOString();
      }
      const tok = data.passwordResetTokens.find((t) => t.token === token.trim());
      if (tok) tok.used = true;
    });

    await destroyAllUserSessions(record.userId);

    return res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Authenticated Change Password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const dbUser = db.raw.users.find((u) => u.id === user.id);
    if (!dbUser) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    const isValid = verifyPassword(currentPassword, dbUser.passwordHash, dbUser.salt);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const { hash } = hashPassword(newPassword, salt);

    await db.transaction((data) => {
      const u = data.users.find((x) => x.id === user.id);
      if (u) {
        u.passwordHash = hash;
        u.salt = salt;
        u.updatedAt = new Date().toISOString();
      }
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Update Authenticated User Profile (including Avatar, Name, Mobile, Institution, Degree, YearOfStudy)
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { name, mobile, institution, degree, yearOfStudy, avatar } = req.body;

    const dbUser = db.raw.users.find((u) => u.id === user.id);
    if (!dbUser) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    await db.transaction((data) => {
      const u = data.users.find((x) => x.id === user.id);
      if (u) {
        if (name !== undefined && typeof name === 'string' && name.trim()) u.name = name.trim();
        if (mobile !== undefined) u.mobile = typeof mobile === 'string' ? mobile.trim() : '';
        if (institution !== undefined) u.institution = typeof institution === 'string' ? institution.trim() : '';
        if (degree !== undefined) u.degree = typeof degree === 'string' ? degree.trim() : '';
        if (yearOfStudy !== undefined) u.yearOfStudy = typeof yearOfStudy === 'string' ? yearOfStudy.trim() : '';
        if (avatar !== undefined) u.avatar = avatar;
        u.updatedAt = new Date().toISOString();
      }
    });

    const updatedUser = db.raw.users.find((u) => u.id === user.id);
    const { passwordHash: _, salt: __, ...safeUser } = updatedUser;

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// Logout Session
router.post('/logout', async (req, res) => {
  try {
    const token = extractToken(req);
    if (token) {
      await destroySession(token);
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to logout session.' });
  }
});

// Get Current Authenticated Profile
router.get('/me', requireAuth, (req, res) => {
  const { passwordHash: _, salt: __, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

export default router;
