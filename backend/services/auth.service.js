import crypto from 'crypto';
import { db, hashPassword, verifyPassword } from '../db/index.js';

export { hashPassword, verifyPassword };

export async function createSession(userId) {
  const token = 'stk_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await db.transaction((data) => {
    if (!data.sessions) data.sessions = {};
    data.sessions[token] = { userId, expiresAt };
  });

  return token;
}

export async function destroySession(token) {
  if (!token) return;
  await db.transaction((data) => {
    if (data.sessions && data.sessions[token]) {
      delete data.sessions[token];
    }
  });
}

export async function destroyAllUserSessions(userId) {
  if (!userId) return;
  await db.transaction((data) => {
    if (data.sessions) {
      for (const [token, sess] of Object.entries(data.sessions)) {
        if (sess.userId === userId) {
          delete data.sessions[token];
        }
      }
    }
  });
}
