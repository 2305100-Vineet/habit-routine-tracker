const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const { habitValidation } = require('../middleware/validators');

router.use(authenticateToken);

// CREATE a habit
router.post('/', habitValidation, async (req, res, next) => {
  try {
    const { name, description, frequency } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      'INSERT INTO habits (user_id, name, description, frequency) VALUES (?, ?, ?, ?)',
      [userId, name, description || null, frequency || 'daily']
    );

    res.status(201).json({ message: 'Habit created', habitId: result.insertId });
  } catch (err) {
    next(err);
  }
});

// LIST all habits for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [habits] = await pool.query(
      'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(habits);
  } catch (err) {
    next(err);
  }
});

// UPDATE a habit
router.put('/:id', habitValidation, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const habitId = req.params.id;
    const { name, description, frequency } = req.body;

    const [result] = await pool.query(
      'UPDATE habits SET name = ?, description = ?, frequency = ? WHERE id = ? AND user_id = ?',
      [name, description || null, frequency || 'daily', habitId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ message: 'Habit updated' });
  } catch (err) {
    next(err);
  }
});

// DELETE a habit
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const habitId = req.params.id;

    const [result] = await pool.query(
      'DELETE FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;