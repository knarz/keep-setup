const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const BondedECDSAKeep = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const TBTCDepositToken = require("@keep-network/tbtc/artifacts/TBTCDepositToken.json");
const DepositLog = require("@keep-network/tbtc/artifacts/DepositLog.json");
const Deposit = require("@keep-network/tbtc/artifacts/Deposit.json");

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node ret_pk.js [deposit]');
	process.exit(1);
}

const states = require('./states.js')

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);
		const dAddr = process.argv[2].toLowerCase();

		const d = new ethers.Contract(dAddr, Deposit.abi, ip);
		const depositState = states[await d.currentState()];
		console.log(`TDT ${d.address} with state: ${depositState}; calling retrieveSignerPubkey() to advance into AWAITING_BTC_FUNDING_PROOF`);
		const retTx = await d.retrieveSignerPubkey()
		await retTx.wait()

	} catch(err) {
		console.error(`Could not retrieve pk: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})


