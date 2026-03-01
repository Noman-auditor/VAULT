'use strict';

/**
 * ╔═══════════════════════════════════════════════════╗
 * ║  VAULT — Wallet State                            ║
 * ║  Loads credentials from env; holds keyPair/addr  ║
 * ╚═══════════════════════════════════════════════════╝
 */

const btc = require('./bitcoin');

let _wallet = null; // { address, keyPair, type }

function load() {
  const wif      = process.env.WALLET_WIF?.trim();
  const mnemonic = process.env.WALLET_MNEMONIC?.trim();
  const accIdx   = parseInt(process.env.WALLET_ACCOUNT_INDEX || '0', 10);
  const addrIdx  = parseInt(process.env.WALLET_ADDRESS_INDEX || '0', 10);

  if (wif) {
    _wallet = btc.fromWIF(wif);
    console.log(`✅ Wallet loaded (WIF)  → ${_wallet.address}`);
    return _wallet;
  }

  if (mnemonic) {
    _wallet = btc.fromMnemonic(mnemonic, accIdx, addrIdx);
    console.log(`✅ Wallet loaded (mnemonic, path ${_wallet.path}) → ${_wallet.address}`);
    return _wallet;
  }

  console.warn('⚠️  No wallet credentials in .env — endpoints requiring signing will return 503');
  return null;
}

const get     = ()  => _wallet;
const isReady = ()  => _wallet !== null;

const require_wallet = (res) => {
  if (!_wallet) {
    res.status(503).json({ error: 'Wallet not configured. Set WALLET_WIF or WALLET_MNEMONIC in .env' });
    return false;
  }
  return true;
};

module.exports = { load, get, isReady, require_wallet };
