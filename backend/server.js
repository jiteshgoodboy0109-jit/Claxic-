// Claxic Admissions Backend Engine - Modular Architecture
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from './db/index.js';
import apiRouter from './routes/index.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Handle invalid JSON body syntax
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }
  next();
});

// HTML Landing Page for Root
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Claxic Backend API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f8fafc; margin: 0; padding: 40px 20px; }
          .card { max-width: 600px; margin: 40px auto; background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { margin-top: 0; color: #38bdf8; font-size: 24px; font-weight: 700; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .badge { display: inline-block; background: #0369a1; color: #e0f2fe; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
          .links a { display: inline-block; color: #38bdf8; text-decoration: none; margin-right: 16px; font-size: 14px; font-weight: 500; }
          .links a:hover { text-decoration: underline; }
          pre { background: #0f172a; padding: 16px; border-radius: 8px; font-size: 13px; color: #a5f3fc; overflow-x: auto; border: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">SQLite 3 Server Active</div>
          <h1>Claxic Admissions Engine</h1>
          <p>The backend services for Claxic are running with persistent SQLite 3 WAL storage and Razorpay payment integration.</p>
          <div class="links">
            <a href="/api/health">Health Check</a>
            <a href="/api/courses">Course Catalog</a>
            <a href="/api">API Index</a>
          </div>
          <h3>System Status</h3>
          <pre>{ "status": "ONLINE", "database": "SQLite 3", "port": ${PORT} }</pre>
        </div>
      </body>
    </html>
  `);
});

// Mount Main API Router
app.use('/api', apiRouter);

// Global 404 Not Found Catch-All Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    path: req.originalUrl,
    message: `The endpoint '${req.originalUrl}' does not exist on this server.`,
    availableEndpoints: '/api',
    healthCheck: '/api/health',
  });
});

// Global 500 Internal Server Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred.' : err.message,
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Claxic Node.js Express Backend running on http://localhost:${PORT}`);
});
