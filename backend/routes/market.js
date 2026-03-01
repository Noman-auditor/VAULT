'use strict';

const router = require('express').Router();
const price  = require('../services/price');

// GET /api/market — BTC price + 24h change (public, no auth)
router.get('/', async (req, res, next) => {
  try {
    const data = await price.getBtcPrice();
    res.json({ success: true, btc_usd: data.price, change_24h: data.change24h, cached_at: data.ts });
  } catch (e) { next(e); }
});

module.exports = router;
