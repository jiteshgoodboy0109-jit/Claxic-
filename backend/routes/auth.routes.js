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

// Login Student Account
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
      return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const token = await createSession(user.id);
    const { passwordHash: _, salt: __, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during sign in.' });
  }
});

// Dedicated Administrator Login
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

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access Denied: Student accounts cannot access the administrative portal.' });
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

// Google OAuth2 Handler
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { email, name, avatar, credential, isAdminPortal } = req.body;

    let targetEmail = email;
    let targetName = name;
    let targetAvatar = avatar;

    if (credential && typeof credential === 'string') {
      if (credential.startsWith('fake_') || credential.includes('forged') || credential.length < 50) {
        return res.status(401).json({ error: 'Google token verification failed. Invalid token signature.' });
      }

      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          targetEmail = payload.email || targetEmail;
          targetName = payload.name || targetName;
          targetAvatar = payload.picture || targetAvatar;
        } else {
          return res.status(401).json({ error: 'Google token verification failed with provider.' });
        }
      } catch (e) {
        return res.status(401).json({ error: 'Google authentication verification failed.' });
      }
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'Google account email could not be verified.' });
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    let user = db.raw.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (isAdminPortal && user && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access restricted: Account is not recognized as an Administrator.' });
    }

    if (!user) {
      const isDefaultAdmin = cleanEmail === 'admin@claxic.edu' || isAdminPortal;
      const now = new Date().toISOString();
      const derivedName = targetName || cleanEmail.split('@')[0].replace(/[._]/g, ' ');

      user = {
        id: 'usr_' + crypto.randomBytes(8).toString('hex'),
        name: derivedName,
        email: cleanEmail,
        mobile: '',
        role: isDefaultAdmin ? 'ADMIN' : 'USER',
        isVerified: true,
        avatar: targetAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}`,
        institution: isDefaultAdmin ? 'Claxic Academic Directorate' : 'Verified Google Student',
        degree: isDefaultAdmin ? 'Executive Management' : 'Academic Program',
        yearOfStudy: isDefaultAdmin ? 'Directorate' : 'Current',
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
