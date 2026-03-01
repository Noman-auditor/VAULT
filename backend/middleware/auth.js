'use strict';

/**
 * API Key authentication middleware.
 * Clients must send:  X-API-Key: <API_SECRET_KEY from .env>
 * Or as query param:  ?key=<API_SECRET_KEY>
 */
module.exports = function auth(req, res, next) {
  // Skip auth in development if no key is set
  const secret = process.env.API_SECRET_KEY;
  if (!secret || secret === 'change_this_to_a_long_random_secret_key_min_32_chars') {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'API_SECRET_KEY not configured on server' });
    }
    return next(); // allow in dev without key
  }

  const provided = req.headers['x-api-key'] || req.query.key;
  if (!provided)      return res.status(401).json({ error: 'Missing X-API-Key header' });
  if (provided !== secret) return res.status(403).json({ error: 'Invalid API key' });

  next();
};
