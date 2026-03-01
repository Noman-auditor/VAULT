'use strict';

const router = require('express').Router();
const btc    = require('../services/bitcoin');
const wallet = require('../services/wallet');
const auth   = require('../middleware/auth');

// POST /api/tx/build — preview TX without broadcasting
router.post('/build', auth, async (req, res, next) => {
  try {
    if (!wallet.require_wallet(res)) return;
    const { to_address, amount_btc, fee_rate = 'medium' } = req.body;
    if (!to_address)  return res.status(400).json({ error: 'to_address required' });
    if (!amount_btc)  return res.status(400).json({ error: 'amount_btc required' });

    const { address, keyPair } = wallet.get();
    const tx = await btc.buildTx(keyPair, address, to_address, amount_btc, fee_rate);

    res.json({
      success: true,
      preview: {
        from:          address,
        to:            to_address,
        amount_btc:    tx.amountBtc,
        amount_sat:    tx.amountSat,
        fee_btc:       tx.feeBtc,
        fee_sat:       tx.feeSat,
        change_btc:    tx.changeBtc,
        inputs_used:   tx.inputCount,
        vsize:         tx.vsize,
        sat_per_vbyte: tx.satPerVbyte,
      },
      tx_hex: tx.txHex,
      tx_id:  tx.txId,
    });
  } catch (e) { next(e); }
});

// POST /api/tx/send — sign + broadcast  ⚡ REAL BTC
router.post('/send', auth, async (req, res, next) => {
  try {
    if (!wallet.require_wallet(res)) return;
    const { to_address, amount_btc, fee_rate = 'medium' } = req.body;

    if (!to_address)             return res.status(400).json({ error: 'to_address required' });
    if (!amount_btc || parseFloat(amount_btc) <= 0)
                                 return res.status(400).json({ error: 'amount_btc must be > 0' });

    const { address, keyPair } = wallet.get();
    if (address === to_address)  return res.status(400).json({ error: 'Cannot send to self' });

    const tx   = await btc.buildTx(keyPair, address, to_address, amount_btc, fee_rate);
    const txid = await btc.broadcast(tx.txHex);

    res.json({
      success:      true,
      txid,
      explorer_url: btc.explorerBase() + txid,
      details: {
        from:          address,
        to:            to_address,
        amount_btc:    tx.amountBtc,
        fee_btc:       tx.feeBtc,
        fee_sat:       tx.feeSat,
        change_btc:    tx.changeBtc,
        vsize:         tx.vsize,
        sat_per_vbyte: tx.satPerVbyte,
      },
    });
  } catch (e) { next(e); }
});

// POST /api/tx/broadcast — broadcast a pre-signed raw hex
router.post('/broadcast', auth, async (req, res, next) => {
  try {
    const { tx_hex } = req.body;
    if (!tx_hex) return res.status(400).json({ error: 'tx_hex required' });
    const txid = await btc.broadcast(tx_hex);
    res.json({ success: true, txid, explorer_url: btc.explorerBase() + txid });
  } catch (e) { next(e); }
});

// GET /api/tx/history[?limit=N]
router.get('/history', auth, async (req, res, next) => {
  try {
    if (!wallet.require_wallet(res)) return;
    const { address } = wallet.get();
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const history = await btc.getTxHistory(address, limit);
    res.json({ success: true, address, count: history.length, transactions: history });
  } catch (e) { next(e); }
});

// GET /api/tx/status/:txid
router.get('/status/:txid', auth, async (req, res, next) => {
  try {
    const info = await btc.getTxStatus(req.params.txid);
    res.json({ success: true, ...info });
  } catch (e) { next(e); }
});

module.exports = router;
