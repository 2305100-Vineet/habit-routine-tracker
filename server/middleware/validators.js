const { body, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
}

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const habitValidation = [
  body('name').trim().notEmpty().withMessage('Habit name is required')
    .isLength({ max: 150 }).withMessage('Habit name must be under 150 characters'),
  body('frequency').optional().isIn(['daily', 'weekly']).withMessage('Frequency must be daily or weekly'),
  handleValidationErrors,
];

const logValidation = [
  body('date').isISO8601().withMessage('Date must be in YYYY-MM-DD format'),
  body('status').isIn(['complete', 'incomplete']).withMessage('Status must be complete or incomplete'),
  handleValidationErrors,
];

module.exports = { registerValidation, loginValidation, habitValidation, logValidation };