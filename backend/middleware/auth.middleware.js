import { db } from '../db/index.js';

export function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return authHeader.replace('Bearer ', '').trim();
  }
  if (req.query && req.query.token) {
    return String(req.query.token).trim();
  }
  return null;
}

export function getUserByToken(token) {
  if (!token) return null;
  const cleanToken = token.replace('Bearer ', '').trim();
  let session = db.raw.sessions ? db.raw.sessions[cleanToken] : null;

  if (!session && db.sqlite) {
    try {
      const row = db.sqlite.prepare('SELECT * FROM sessions WHERE token = ?').get(cleanToken);
      if (row) {
        session = { userId: row.userId, expiresAt: row.expiresAt };
        if (!db.raw.sessions) db.raw.sessions = {};
        db.raw.sessions[cleanToken] = session;
      }
    } catch (e) {}
  }

  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    return null;
  }

  const user = db.raw.users.find((u) => u.id === session.userId);
  if (!user || !user.isActive) return null;

  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Missing bearer token.' });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid, revoked, or expired session token.' });
  }

  req.user = user;
  req.token = token;
  next();
}

export function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Administrative authorization token required.' });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired administrative session token.' });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access forbidden. Administrator privileges required.' });
  }

  req.user = user;
  req.token = token;
  next();
}

export function requireStaff(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Staff authorization token required.' });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired staff session token.' });
  }

  if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access forbidden. Staff/Faculty privileges required.' });
  }

  req.user = user;
  req.token = token;
  next();
}

export function requireStudent(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Student authentication token required.' });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  if (user.role !== 'USER') {
    return res.status(403).json({ error: 'Access forbidden. Student account privileges required.' });
  }

  req.user = user;
  req.token = token;
  next();
}

export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const user = getUserByToken(token);
    if (user) {
      req.user = user;
      req.token = token;
    }
  }
  next();
}
