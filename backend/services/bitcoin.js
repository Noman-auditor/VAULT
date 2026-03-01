'use strict';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  VAULT — Bitcoin Core Service                           ║
 * ║  Handles: wallet import, UTXO selection, TX build/sign  ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const bitcoin = require('bitcoinjs-lib');
const { BIP32Factory } = require('bip32');
const { ECPairFactory } = require('ecpair');
const ecc   = require('tiny-secp256k1');
const bip39 = require('bip39');
const axios = require('axios');

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const bip32  = BIP32Factory(ecc);

// ── Network helpers ────────────────────────────────────────────────────────────

const network   = () => process.env.BTC_NETWORK === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
const apiBase   = () => process.env.BTC_NETWORK === 'testnet' ? 'https://blockstream.info/testnet/api' : 'https://blockstream.info/api';
const explorerBase = () => process.env.BTC_NETWORK === 'testnet' ? 'https://blockstream.info/testnet/tx/' : 'https://blockstream.info/tx/';

const http = axios.create({ timeout: 15000 });

// ── Wallet import / generation ─────────────────────────────────────────────────

function fromWIF(wif) {
  const net = network();
  const kp  = ECPair.fromWIF(wif, net);
  const { address } = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(kp.publicKey), network: net });
  return { address, keyPair: kp, type: 'wif' };
}

function fromMnemonic(mnemonic, accountIdx = 0, addrIdx = 0) {
  if (!bip39.validateMnemonic(mnemonic)) throw new Error('Invalid mnemonic phrase');
  const net       = network();
  const seed      = bip39.mnemonicToSeedSync(mnemonic);
  const root      = bip32.fromSeed(seed, net);
  const coinType  = net === bitcoin.networks.testnet ? 1 : 0;
  const path      = `m/84'/${coinType}'/${accountIdx}'/0/${addrIdx}`;
  const child     = root.derivePath(path);
  const { address } = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(child.publicKey), network: net });
  return { address, keyPair: child, path, type: 'mnemonic' };
}

function generate() {
  const mnemonic = bip39.generateMnemonic(256);
  const w = fromMnemonic(mnemonic);
  return { mnemonic, address: w.address, path: w.path };
}

// ── Blockchain queries ─────────────────────────────────────────────────────────

async function getBalance(address) {
  const { data } = await http.get(`${apiBase()}/address/${address}`);
  const confirmed   = data.chain_stats.funded_txo_sum   - data.chain_stats.spent_txo_sum;
  const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
  return {
    address,
    confirmed_sat:   confirmed,
    unconfirmed_sat: unconfirmed,
    total_sat:       confirmed + unconfirmed,
    confirmed_btc:   satsToBtc(confirmed),
    unconfirmed_btc: satsToBtc(unconfirmed),
    total_btc:       satsToBtc(confirmed + unconfirmed),
  };
}

async function getUTXOs(address) {
  const { data } = await http.get(`${apiBase()}/address/${address}/utxo`);
  return data;
}

async function getFeeRates() {
  const { data } = await http.get(`${apiBase()}/fee-estimates`);
  return {
    fast:   Math.ceil(data['1']   || 20),
    medium: Math.ceil(data['6']   || 10),
    slow:   Math.ceil(data['144'] || 5),
  };
}

async function getTxHistory(address, limit = 30) {
  const { data } = await http.get(`${apiBase()}/address/${address}/txs`);
  return data.slice(0, limit).map(tx => {
    const recv = tx.vout.filter(o => o.scriptpubkey_address === address).reduce((s, o) => s + o.value, 0);
    const sent = tx.vin.filter(i  => i.prevout?.scriptpubkey_address === address).reduce((s, i) => s + i.prevout.value, 0);
    const net  = recv - sent;
    return {
      txid:         tx.txid,
      type:         net >= 0 ? 'received' : 'sent',
      amount_btc:   satsToBtc(Math.abs(net)),
      amount_sat:   Math.abs(net),
      fee_sat:      tx.fee || 0,
      confirmed:    tx.status?.confirmed || false,
      block_height: tx.status?.block_height || null,
      timestamp:    tx.status?.block_time ? tx.status.block_time * 1000 : null,
      explorer_url: explorerBase() + tx.txid,
    };
  });
}

async function getTxStatus(txid) {
  const { data } = await http.get(`${apiBase()}/tx/${txid}`);
  return {
    txid:         data.txid,
    confirmed:    data.status?.confirmed || false,
    block_height: data.status?.block_height || null,
    block_time:   data.status?.block_time ? data.status.block_time * 1000 : null,
    fee_sat:      data.fee,
    size:         data.size,
    vsize:        data.vsize,
    explorer_url: explorerBase() + data.txid,
  };
}

// ── TX builder ────────────────────────────────────────────────────────────────

async function buildTx(keyPairOrWIF, fromAddress, toAddress, amountBtc, feeSpeed = 'medium') {
  const net = network();
  const kp  = typeof keyPairOrWIF === 'string' ? ECPair.fromWIF(keyPairOrWIF, net) : keyPairOrWIF;

  // Validate recipient
  try { bitcoin.address.toOutputScript(toAddress, net); }
  catch { throw new Error(`Invalid recipient address: ${toAddress}`); }

  const amountSat = btcToSats(amountBtc);
  if (amountSat < 546) throw new Error('Amount is below the dust limit (546 sats)');

  // Fetch UTXOs + fee rate
  const [utxos, feeRates] = await Promise.all([getUTXOs(fromAddress), getFeeRates()]);
  if (!utxos.length) throw new Error('No confirmed UTXOs found — wallet may have zero balance');

  const satPerVbyte = typeof feeSpeed === 'number' ? feeSpeed : (feeRates[feeSpeed] ?? feeRates.medium);

  // Greedy UTXO selection (largest-first)
  const confirmed = utxos.filter(u => u.status?.confirmed).sort((a, b) => b.value - a.value);
  let selected = [], totalIn = 0, fee = 0;

  for (const utxo of confirmed) {
    selected.push(utxo);
    totalIn += utxo.value;
    fee = txSize(selected.length, 2) * satPerVbyte;   // 2 outputs: dest + change
    if (totalIn >= amountSat + fee) break;
  }

  if (totalIn < amountSat + fee) {
    throw new Error(
      `Insufficient funds.\n  Available: ${satsToBtc(totalIn)} BTC\n  Required:  ${satsToBtc(amountSat + fee)} BTC (incl. fee)`
    );
  }

  const changeSat = totalIn - amountSat - fee;
  const p2wpkh    = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(kp.publicKey), network: net });

  // Build PSBT
  const psbt = new bitcoin.Psbt({ network: net });

  for (const utxo of selected) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: { script: p2wpkh.output, value: utxo.value },
    });
  }

  psbt.addOutput({ address: toAddress, value: amountSat });
  if (changeSat > 546) psbt.addOutput({ address: fromAddress, value: changeSat });

  for (let i = 0; i < selected.length; i++) psbt.signInput(i, kp);
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  return {
    txHex:       tx.toHex(),
    txId:        tx.getId(),
    amountBtc,
    amountSat,
    feeSat:      fee,
    feeBtc:      satsToBtc(fee),
    changeSat:   changeSat > 546 ? changeSat : 0,
    changeBtc:   changeSat > 546 ? satsToBtc(changeSat) : '0.00000000',
    inputCount:  selected.length,
    vsize:       tx.virtualSize(),
    satPerVbyte,
  };
}

async function broadcast(txHex) {
  const { data } = await http.post(`${apiBase()}/tx`, txHex, { headers: { 'Content-Type': 'text/plain' } });
  return data;  // txid string on success
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const satsToBtc = (sats) => (sats / 1e8).toFixed(8);
const btcToSats = (btc)  => Math.round(parseFloat(btc) * 1e8);
const txSize    = (inputs, outputs) => 10 + inputs * 68 + outputs * 31; // P2WPKH estimate

module.exports = {
  fromWIF, fromMnemonic, generate,
  getBalance, getUTXOs, getFeeRates, getTxHistory, getTxStatus,
  buildTx, broadcast,
  satsToBtc, btcToSats, network, explorerBase,
};
