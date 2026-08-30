const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const { calculateStreaks } = require('../utils/streakCalculator');
const { logValidation } = require('../middleware/validators');

router.use(authenticateToken);

async function verifyHabitOwnership(habitId, userId) {
  const [rows] = await pool.query(
    'SELECT id FROM habits WHERE id = ? AND user_id = ?',
    [habitId, userId]
  );
  return rows.length > 0;
}

// --- Summary routes MUST come before /:habitId routes ---

router.get('/summary/weekly', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT completion_date,
              SUM(status = 'complete') AS completed_count,
              COUNT(*) AS total_logged
       FROM completion_logs
       WHERE user_id = ?
         AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY completion_date
       ORDER BY completion_date ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/summary/monthly', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT completion_date,
              SUM(status = 'complete') AS completed_count,
              COUNT(*) AS total_logged
       FROM completion_logs
       WHERE user_id = ?
         AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       GROUP BY completion_date
       ORDER BY completion_date ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// MARK a habit complete/incomplete for a given date
router.post('/:habitId', logValidation, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const habitId = req.params.habitId;
    const { date, status } = req.body;

    const [habitRows] = await pool.query(
      'SELECT created_at FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );
    if (habitRows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habitCreatedDate = habitRows[0].created_at.split(' ')[0];
    if (date < habitCreatedDate) {
      return res.status(400).json({ error: `Cannot log a date before the habit was created (${habitCreatedDate})` });
    }

    await pool.query(
      `INSERT INTO completion_logs (habit_id, user_id, completion_date, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = ?`,
      [habitId, userId, date, status, status]
    );

    res.json({ message: 'Log saved', habitId, date, status });
  } catch (err) {
    next(err);
  }
});

// LIST all logs for a specific habit
router.get('/:habitId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const habitId = req.params.habitId;

    const owns = await verifyHabitOwnership(habitId, userId);
    if (!owns) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const [logs] = await pool.query(
      'SELECT completion_date, status FROM completion_logs WHERE habit_id = ? ORDER BY completion_date ASC',
      [habitId]
    );

    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// GET /api/logs/:habitId/stats — streak + completion % for one habit
router.get('/:habitId/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const habitId = req.params.habitId;

    const [habitRows] = await pool.query(
      'SELECT created_at FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );
    if (habitRows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const [logs] = await pool.query(
      'SELECT completion_date, status FROM completion_logs WHERE habit_id = ?',
      [habitId]
    );

    const habitCreatedDate = habitRows[0].created_at.split(' ')[0];
    const stats = calculateStreaks(logs, habitCreatedDate);

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;