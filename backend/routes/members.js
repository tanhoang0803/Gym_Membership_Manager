const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// ── GET /api/members/stats ─────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      COUNT(*)                              AS total,
      SUM(status = 'Delivered')             AS delivered,
      SUM(status = 'Shipped')               AS shipped,
      SUM(status = 'Pending')               AS pending,
      SUM(status = 'Cancelled')             AS cancelled,
      ROUND(SUM(CASE WHEN status != 'Cancelled' THEN amount ELSE 0 END), 2) AS totalRevenue
    FROM members
  `).get();
  res.json(stats);
});

// ── GET /api/members ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDb();
  const { search, status, sort = 'id', order = 'asc' } = req.query;

  const allowedSort  = ['id', 'name', 'location', 'date', 'status', 'amount'];
  const allowedOrder = ['asc', 'desc'];
  const safeSort  = allowedSort.includes(sort)   ? sort  : 'id';
  const safeOrder = allowedOrder.includes(order) ? order : 'asc';

  let where  = [];
  let params = [];

  if (search) {
    where.push('(name LIKE ? OR location LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT * FROM members ${whereClause} ORDER BY ${safeSort} ${safeOrder}`;

  const members = db.prepare(sql).all(...params);
  res.json(members);
});

// ── GET /api/members/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const db = getDb();
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

// ── POST /api/members ──────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const db = getDb();
  const { name, location = '', date, status = 'Pending', amount = 0, avatar = '' } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const validStatuses = ['Delivered', 'Shipped', 'Pending', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const result = db.prepare(`
    INSERT INTO members (name, location, date, status, amount, avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    location.trim(),
    date || new Date().toISOString().split('T')[0],
    status,
    parseFloat(amount) || 0,
    avatar.trim()
  );

  const newMember = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newMember);
});

// ── PUT /api/members/:id ───────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  const { name, location, date, status, amount, avatar } = req.body;

  const validStatuses = ['Delivered', 'Shipped', 'Pending', 'Cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  db.prepare(`
    UPDATE members
    SET name     = COALESCE(?, name),
        location = COALESCE(?, location),
        date     = COALESCE(?, date),
        status   = COALESCE(?, status),
        amount   = COALESCE(?, amount),
        avatar   = COALESCE(?, avatar)
    WHERE id = ?
  `).run(
    name   != null ? name.trim()     : null,
    location != null ? location.trim() : null,
    date   != null ? date            : null,
    status != null ? status          : null,
    amount != null ? parseFloat(amount) : null,
    avatar != null ? avatar.trim()   : null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ── DELETE /api/members/:id ────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  res.json({ message: 'Member deleted successfully', id: parseInt(req.params.id) });
});

module.exports = router;
