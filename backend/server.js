/* Main Express server for the secure file-transfer app */

require('dotenv').config();          // Load env vars first

const express     = require('express');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const helmet      = require('helmet');
const path        = require('path');

// Initialise database connection (no variable needed)
require('./config/database');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

/* ---------- Global middleware ---------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://cdn.tailwindcss.com"],
      },
    },
  })
);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

/* ---------- Rate limiting ---------- */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false
});

/* ---------- Routes ---------- */
const auth = require('./routes/auth');
app.use('/api/auth', authLimiter, auth.router);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/files', require('./routes/files'));
app.use('/api/delete', require('./routes/delete'));

/* ---------- Test route ---------- */
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

/* ---------- Catch-all (optional) ---------- */
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/* ---------- Server start ---------- */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network accessible via http://0.0.0.0:${PORT}`);
});
