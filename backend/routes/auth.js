const express = require('express');
const router = express.Router();

const authenticatePassword = (req, res, next) => {
  // Support both JSON and form-data
  const password = req.body.password || req.body['password'];
  console.log('Attempted authentication');
  console.log('Entered password:', password);
  if (!password || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  next();
};

// Password verification endpoint
router.post('/verify', authenticatePassword, (req, res) => {
  res.json({ success: true, message: 'Authentication successful' });
});

// Export both the router and the middleware function
module.exports = {
  router,
  authenticatePassword
};
