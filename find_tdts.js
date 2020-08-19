const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const BondedECDSAKeep = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const TBTCDepositToken = require("@keep-network/tbtc/artifacts/TBTCDepositToken.json");
const DepositLog = require("@keep-network/tbtc/artifacts/DepositLog.json");
const Deposit = require("@keep-network/tbtc/artifacts/Deposit.json");

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node find_tdts.js [operator]');
	process.exit(1);
}

const states = [
	"START",
	"AWAITING_SIGNER_SETUP",
	"AWAITING_BTC_FUNDING_PROOF",
	"FAILED_SETUP",
	"ACTIVE",  // includes courtesy call
	"AWAITING_WITHDRAWAL_SIGNATURE",
	"AWAITING_WITHDRAWAL_PROOF",
	"REDEEMED",
	"COURTESY_CALL",
	"FRAUD_LIQUIDATION_IN_PROGRESS",
	"LIQUIDATION_IN_PROGRESS",
	"LIQUIDATED"
];

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('ropsten', process.env.INFURA_API);
		const opAddr = process.argv[2].toLowerCase();

		//const keepFactory = new ethers.Contract(TBTCSystem.networks["3"].address, BondedECDSAKeepFactory.abi, ip);
		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["3"].address, BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["3"].address, TBTCSystem.abi, ip);
		const tdtContract = new ethers.Contract(TBTCDepositToken.networks["3"].address, TBTCDepositToken.abi, ip);
		const depositLogContract = new ethers.Contract(TBTCSystem.networks["3"].address, DepositLog.abi, ip);
		
		const keeps = await ecdsaKFContract.queryFilter(ecdsaKFContract.filters.BondedECDSAKeepCreated());
		const targetKeeps = keeps.filter(ev => { return ev.args[1].filter(ms => { return ms.toLowerCase() === opAddr}).length > 0 }).map(ev => { return ev.args[0]; });

		for (let addr of targetKeeps) {
			const k = new ethers.Contract(addr, BondedECDSAKeep.abi, ip);
			const tdt = await depositLogContract.queryFilter(depositLogContract.filters.Created(null, addr));
			if (tdt.length < 1) { continue; }
			const d = new ethers.Contract(tdt[0].args[0], Deposit.abi, ip);
			const depositState = states[await d.currentState()];
			//const keepActive = (await k.isActive()) ? "active" : "inactive";
			//const depositActive = (await d.inActive()) ? "active" : "inactive";

			console.log(`keep ${addr} manages TDT ${d.address} with state: ${depositState}`);
		}

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

