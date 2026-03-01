'use strict';

require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const walletSvc   = require('./services/wallet');
const walletRoute = require('./routes/wallet');
const txRoute     = require('./routes/transactions');
const marketRoute = require('./routes/market');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security & middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 60_000,       // 1 minute window
  max: 60,                // 60 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded — slow down.' },
}));

// ── Static frontend ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/wallet', walletRoute);
app.use('/api/tx',     txRoute);
app.use('/api/market', marketRoute);

// Health check (no auth)
app.get('/api/health', (req, res) => {
  res.json({
    status:        'ok',
    network:       process.env.BTC_NETWORK || 'mainnet',
    wallet_ready:  require('./services/wallet').isReady(),
    timestamp:     Date.now(),
  });
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

// Error handler
app.use((err, req, res, _next) => {
  console.error('⛔', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Boot ───────────────────────────────────────────────────────────────────────
walletSvc.load();

app.listen(PORT, () => {
  console.log(`\n🔒 VAULT — Bitcoin Wallet API`);
  console.log(`   Network : ${process.env.BTC_NETWORK || 'mainnet'}`);
  console.log(`   Server  : http://localhost:${PORT}`);
  console.log(`   API     : http://localhost:${PORT}/api\n`);
});

module.exports = app;
