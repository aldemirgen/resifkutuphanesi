'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const speciesRoutes = require('./routes/species');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/species', speciesRoutes);

// Stats route (delegated to species router but accessible here)
const { getDb } = require('./db');
app.get('/api/stats', (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM species').get();
  const byCategory = db.prepare(
    'SELECT category, COUNT(*) as count FROM species GROUP BY category'
  ).all();

  const stats = { total: total.count, byCategory: {} };
  byCategory.forEach((r) => {
    stats.byCategory[r.category] = r.count;
  });

  res.json(stats);
});

// Serve React app (production build)
const DIST_PATH = path.join(__dirname, '..', 'site', 'dist');
app.use(express.static(DIST_PATH));

// Catch-all: serve React index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Resif Kütüphanesi server çalışıyor: http://localhost:${PORT}`);
  console.log(`Admin paneli: http://localhost:${PORT}/admin/login`);
});

module.exports = app;
