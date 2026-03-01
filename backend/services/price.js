'use strict';

const axios = require('axios');

let _cache = { price: null, change24h: null, ts: 0 };
const TTL   = 60_000; // 60s cache

async function getBtcPrice() {
  if (Date.now() - _cache.ts < TTL && _cache.price) return _cache;

  try {
    // Primary: CoinGecko (free, no key)
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      { timeout: 5000 }
    );
    _cache = { price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change, ts: Date.now() };
    return _cache;
  } catch {
    try {
      // Fallback: Coinbase
      const { data } = await axios.get('https://api.coinbase.com/v2/prices/BTC-USD/spot', { timeout: 5000 });
      _cache = { price: parseFloat(data.data.amount), change24h: null, ts: Date.now() };
      return _cache;
    } catch {
      return _cache; // return stale if both fail
    }
  }
}

const usdValue = async (btc) => {
  const p = await getBtcPrice();
  return p.price ? (parseFloat(btc) * p.price).toFixed(2) : null;
};

module.exports = { getBtcPrice, usdValue };
