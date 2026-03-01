const express = require('express');
const cors    = require('cors');
const path    = require('path');

const membersRouter = require('./routes/members');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Serve static frontend ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/members', membersRouter);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Fallback: serve index.html for any non-API route ──────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Gym Membership Manager`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  API base:         http://localhost:${PORT}/api/members`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
