const fs = require('fs');
const ethers = require('ethers');

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node keystore.js [password]');
	process.exit(1);
}

async function main() {
	const n = ethers.Wallet.createRandom();
	console.log(`Address: ${await n.address}\nWriting wallet to wallet.json.`)

	try {
		fs.writeFileSync(
			'wallet.json',
			await n.encrypt(process.argv[2]),
			{ flag: 'wx+' }
		);
	} catch (err) {
		console.error(`Could not write file: ${err.message}`)
	}
}

main().catch(err => {
	console.error(err);
})
