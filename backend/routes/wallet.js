'use strict';

const router  = require('express').Router();
const btc     = require('../services/bitcoin');
const wallet  = require('../services/wallet');
const price   = require('../services/price');
const auth    = require('../middleware/auth');

// GET /api/wallet — balance + price of the configured wallet
router.get('/', auth, async (req, res, next) => {
  try {
    if (!wallet.require_wallet(res)) return;
    const { address } = wallet.get();
    const [bal, priceData] = await Promise.all([btc.getBalance(address), price.getBtcPrice()]);
    const usd = priceData.price ? (parseFloat(bal.confirmed_btc) * priceData.price).toFixed(2) : null;
    res.json({
      success: true,
      address,
      balance: {
        ...bal,
        confirmed_usd:   usd,
        btc_price_usd:   priceData.price,
        price_change_24h: priceData.change24h,
      },
    });
  } catch (e) { next(e); }
});

// GET /api/wallet/utxos
router.get('/utxos', auth, async (req, res, next) => {
  try {
    if (!wallet.require_wallet(res)) return;
    const { address } = wallet.get();
    const utxos = await btc.getUTXOs(address);
    const total = utxos.reduce((s, u) => s + u.value, 0);
    res.json({ success: true, address, utxo_count: utxos.length, total_btc: btc.satsToBtc(total), utxos });
  } catch (e) { next(e); }
});

// GET /api/wallet/fees — current network fee estimates
router.get('/fees', auth, async (req, res, next) => {
  try {
    const fees = await btc.getFeeRates();
    res.json({ success: true, sat_per_vbyte: fees });
  } catch (e) { next(e); }
});

// GET /api/wallet/generate — create a brand-new wallet
router.get('/generate', auth, (req, res) => {
  const w = btc.generate();
  res.json({
    success: true,
    warning: 'Save your mnemonic offline. Never share it.',
    wallet: { address: w.address, mnemonic: w.mnemonic, path: w.path },
  });
});

// POST /api/wallet/import — import by WIF or mnemonic (returns address + balance, does NOT change server state)
router.post('/import', auth, async (req, res, next) => {
  try {
    const { wif, mnemonic, account_index = 0, address_index = 0 } = req.body;
    let w;
    if (wif)           w = btc.fromWIF(wif);
    else if (mnemonic) w = btc.fromMnemonic(mnemonic, account_index, address_index);
    else return res.status(400).json({ error: 'Provide wif or mnemonic' });

    const [bal, priceData] = await Promise.all([btc.getBalance(w.address), price.getBtcPrice()]);
    const usd = priceData.price ? (parseFloat(bal.confirmed_btc) * priceData.price).toFixed(2) : null;
    res.json({ success: true, address: w.address, path: w.path || null, balance: { ...bal, confirmed_usd: usd } });
  } catch (e) { next(e); }
});

module.exports = router;
