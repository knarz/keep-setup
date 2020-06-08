const fs = require('fs');
const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const RandomBeaconOperator = require("@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json")

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node access.js [password]');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const j = fs.readFileSync('wallet.json', 'utf8');
		const w  = await new ethers.Wallet.fromEncryptedJson(j, process.argv[2]);
		const ip = new ethers.providers.InfuraProvider('ropsten', process.env.INFURA_API);
		wallet = w.connect(ip);

		const stakingContract = new ethers.Contract("0xEb2bA3f065081B6459A6784ba8b34A1DfeCc183A", TokenStaking.abi, wallet);
		const beaconOpContract = new ethers.Contract("0x440626169759ad6598cd53558F0982b84A28Ad7a", RandomBeaconOperator.abi, wallet);

		const authOp = await stakingContract.authorizeOperatorContract(w.address, beaconOpContract.address)
		console.log('waiting for operator authorization of random beacon')
		await authOp.wait()

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

