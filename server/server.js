const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const logRoutes = require('./routes/logs');
const authenticateToken = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/test-protected', authenticateToken, (req, res) => {
  res.json({ message: 'You accessed a protected route', user: req.user });
});

// Must be registered AFTER all routes — Express calls this only when a route
// calls next(err), or when an async route throws and something forwards it here.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});