const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'secret-key', (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired token' });
      req.user = user;
      next();
    });
  } else {
    // For development/testing, you might want to skip this if no token is provided, 
    // but the requirement is to add it to all routes.
    res.status(401).json({ error: 'Authorization header missing' });
  }
};

module.exports = authenticateJWT;
