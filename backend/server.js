// Claxic Admissions Backend Engine - Port 5000 Active
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db/index.js';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../frontend/dist');

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

// Mount Main API Router FIRST
app.use('/api', apiRouter);

// Serve Frontend SPA ONLY if explicitly configured in production (SERVE_FRONTEND=true)
if (process.env.SERVE_FRONTEND === 'true' && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Backend API Status Page on Port 5000 (Root)
  app.get('/', (req, res) => {
    // If client asks for JSON, return JSON status
    if (req.accepts('json') && !req.accepts('html')) {
      return res.json({
        status: 'ONLINE',
        service: 'Claxic Backend API Engine',
        port: PORT,
        frontendUrl: 'http://localhost:5173',
        endpoints: {
          health: '/api/health',
          courses: '/api/courses',
          apiIndex: '/api',
        },
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Claxic Backend API — Port ${PORT}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0c121e; color: #f8fafc; margin: 0; padding: 40px 20px; }
            .card { max-width: 620px; margin: 40px auto; background: #182234; padding: 32px; border-radius: 20px; border: 1px solid #29384e; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
            h1 { margin-top: 8px; color: #38bdf8; font-size: 24px; font-weight: 700; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .badge { display: inline-block; background: #0369a1; color: #e0f2fe; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
            .port-box { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 20px 0; display: flex; flex-direction: column; gap: 8px; }
            .port-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
            .port-label { color: #94a3b8; }
            .port-value { font-family: monospace; font-weight: 700; color: #38bdf8; }
            .btn { display: inline-block; background: #0284c7; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background 0.15s; }
            .btn:hover { background: #0369a1; }
            .links { margin-top: 20px; display: flex; gap: 14px; flex-wrap: wrap; }
            .links a { color: #38bdf8; text-decoration: none; font-size: 13px; font-weight: 500; }
            .links a:hover { text-decoration: underline; }
            pre { background: #0f172a; padding: 14px; border-radius: 10px; font-size: 12px; color: #a5f3fc; overflow-x: auto; border: 1px solid #1e293b; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Backend API Server Active</span>
            <h1>Claxic Admissions & Learning API</h1>
            <p>This is the <strong>Node.js Express Backend Service</strong> running on <strong>Port ${PORT}</strong>.</p>
            
            <div class="port-box">
              <div class="port-row">
                <span class="port-label">Backend API Server:</span>
                <span class="port-value">http://localhost:${PORT}</span>
              </div>
              <div class="port-row">
                <span class="port-label">Frontend Web App (UI):</span>
                <span class="port-value"><a href="http://localhost:5173" style="color:#38bdf8;">http://localhost:5173</a></span>
              </div>
            </div>

            <div style="margin: 20px 0;">
              <a href="http://localhost:5173" class="btn">🚀 Open Frontend Application (Port 5173)</a>
            </div>

            <div class="links">
              <a href="/api/health">System Health Check</a>
              <a href="/api/courses">Courses API</a>
              <a href="/api">API Directory</a>
            </div>

            <h3 style="margin-top: 24px; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Server Telemetry</h3>
            <pre>{ "status": "ONLINE", "service": "Express API", "port": ${PORT}, "mode": "development" }</pre>
          </div>
        </body>
      </html>
    `);
  });
}

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
