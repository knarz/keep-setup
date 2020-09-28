const ethers = require('ethers');

const BondedECDSAKeep = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json")
const Deposit = require("@keep-network/tbtc/artifacts/Deposit.json");

const states = require('./states')

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node tdt_status.js [tdt]');
	process.exit(1);
}

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);

		const d = new ethers.Contract(process.argv[2], Deposit.abi, ip);
		const k = new ethers.Contract(await d.keepAddress(), BondedECDSAKeep.abi, ip);
		const r = await d.collateralizationPercentage()
		const depositState = states[await d.currentState()];
		console.log(`TDT ${dAddr} (${depositState}) of ${k.address} has ratio ${r}`)
	} catch(err) {
		console.error(`Could not get ratios: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

