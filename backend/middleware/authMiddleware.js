// User authentication middleware.

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-google-docs-key-2026';

// Verifies JSON Web Token.
const verifyToken = (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name, role }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
};

// Performs optional token verification.
const optionalAuth = (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore invalid token in optional mode, allow guest execution
  }
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  JWT_SECRET
};

