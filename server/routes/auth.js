const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');
const { sendOtpEmail } = require('../config/mailer');
const { generateOtp } = require('../utils/otp');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation } = require('../middleware/validators');
const authenticateToken = require('../middleware/auth');
require('dotenv').config();

// REGISTER
router.post('/register', authLimiter, registerValidation, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const [existing] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      if (existing[0].is_verified) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE users SET name = ?, password_hash = ? WHERE email = ?',
        [name, passwordHash, email]
      );
    } else {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, is_verified) VALUES (?, ?, ?, FALSE)',
        [name, email, passwordHash]
      );
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otpCode, expiresAt]
    );

    await sendOtpEmail(email, otpCode);

    res.status(201).json({ message: 'Registration started. Check your email for the verification code.', email });
  } catch (err) {
    next(err);
  }
});

// VERIFY OTP (registration)
router.post('/verify-otp', authLimiter, async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const otpRecord = rows[0];
    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    await pool.query('UPDATE users SET is_verified = TRUE WHERE email = ?', [email]);
    await pool.query('DELETE FROM otp_verifications WHERE email = ?', [email]);

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

// RESEND OTP (registration)
router.post('/resend-otp', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [users] = await pool.query('SELECT is_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'No registration found for this email' });
    }
    if (users[0].is_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otpCode, expiresAt]
    );

    await sendOtpEmail(email, otpCode);

    res.json({ message: 'A new verification code has been sent.' });
  } catch (err) {
    next(err);
  }
});

// FORGOT PASSWORD — sends an OTP if the account exists (doesn't reveal whether it does or not)
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (users.length > 0) {
      const otpCode = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await pool.query(
        'INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)',
        [email, otpCode, expiresAt]
      );

      await sendOtpEmail(email, otpCode);
    }

    // Always return the same message whether or not the account exists —
    // this prevents attackers from using this endpoint to discover which emails are registered
    res.json({ message: 'If an account exists for this email, a reset code has been sent.' });
  } catch (err) {
    next(err);
  }
});

// RESET PASSWORD — verifies the OTP, then sets a new password
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const otpRecord = rows[0];
    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);
    await pool.query('DELETE FROM otp_verifications WHERE email = ?', [email]);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

// LOGIN
router.post('/login', authLimiter, loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in', needsVerification: true, email: user.email });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// DELETE ACCOUNT
router.delete('/account', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;