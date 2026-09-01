const express = require('express');
const cors = require('cors');
const dns = require('dns');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const logRoutes = require('./routes/logs');
const authenticateToken = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/test-protected', authenticateToken, (req, res) => {
  res.json({ message: 'You accessed a protected route', user: req.user });
});
app.get('/api/debug-db-env', (req, res) => {
  const hostRaw = process.env.DB_HOST;
  dns.lookup(hostRaw, (err, address) => {
    res.json({
      host_raw: JSON.stringify(hostRaw),
      host_length: hostRaw ? hostRaw.length : null,
      dns_error: err ? err.message : null,
      resolved_address: address || null,
    });
  });
});
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
