const fs = require('fs');
const https = require('https');

let w
try {
	w = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
} catch(err) {
	console.error(`Could open wallet: ${err.message}`)
}

https.get(`https://us-central1-keep-test-f3e0.cloudfunctions.net/keep-faucet-ropsten?account=0x${w.address}`, (r) => {
  let data = '';

  r.on('data', (chunk) => {
    data += chunk;
  });

  r.on('end', () => {
    console.log(data);
  });
})
