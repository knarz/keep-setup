const fs = require('fs');
const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")

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

		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, wallet);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, wallet);

		const regMem = await ecdsaKFContract.registerMemberCandidate(tbtcSysContract.address)
		console.log(`registering for app ${tbtcSysContract.address}`)
		await regMem.wait()

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

