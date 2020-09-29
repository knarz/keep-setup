const fs = require('fs');
const https = require('https');
const ethers = require('ethers');

let w
try {
  w = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
} catch (err) {
  console.error(`Could open wallet: ${err.message}`)
}

const data = JSON.stringify({
  address: `0x${w.address}`,
  amount: 1000000000000000000
})

const h = 'api.bitaps.com';
const p = '/eth/testnet/v1/faucet/send/payment';

console.log(`Getting testnet eth via ${h}${p}`);

const r = https.request({
  hostname: h,
  port: 443,
  path: p,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const ret = JSON.parse(data);
    console.log(`waiting for ${ret.tx_hash}`);
    ip.once(ret.tx_hash, (receipt) => {
      console.log('tx confirmed')
    })
  });
})

r.on('error', (error) => {
  console.error(error)
})

r.write(data)
r.end()
