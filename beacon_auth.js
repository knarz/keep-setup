const fs = require('fs');
const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const RandomBeaconOperator = require("@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node access.js [password]');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const j = fs.readFileSync('wallet.json', 'utf8');
		const w  = await new ethers.Wallet.fromEncryptedJson(j, process.argv[2]);
		const ip = new ethers.providers.InfuraProvider(network, infura);
		wallet = w.connect(ip);

		const stakingContract = new ethers.Contract(TokenStaking.networks["1"].address, TokenStaking.abi, wallet);
		const beaconOpContract = new ethers.Contract(RandomBeaconOperator.networks["1"].address, RandomBeaconOperator.abi, ip);

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

