const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const BondedECDSAKeep = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const TBTCDepositToken = require("@keep-network/tbtc/artifacts/TBTCDepositToken.json");
const DepositLog = require("@keep-network/tbtc/artifacts/DepositLog.json");
const Deposit = require("@keep-network/tbtc/artifacts/Deposit.json");

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

const states = require('./states.js')

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node find_tdts.js [operator]');
	process.exit(1);
}

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider(network, infura);
		const opAddr = process.argv[2].toLowerCase();

		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);
		const tdtContract = new ethers.Contract(TBTCDepositToken.networks["1"].address, TBTCDepositToken.abi, ip);
		const depositLogContract = new ethers.Contract(TBTCSystem.networks["1"].address, DepositLog.abi, ip);

		const keeps = await ecdsaKFContract.queryFilter(ecdsaKFContract.filters.BondedECDSAKeepCreated());
		const targetKeeps = keeps.filter(ev => { return ev.args[1].filter(ms => { return ms.toLowerCase() === opAddr}).length > 0 }).map(ev => { return ev.args[0]; });

		for (let addr of targetKeeps) {
			const k = new ethers.Contract(addr, BondedECDSAKeep.abi, ip);
			const tdt = await depositLogContract.queryFilter(depositLogContract.filters.Created(null, addr));
			if (tdt.length < 1) { continue; }
			const d = new ethers.Contract(tdt[0].args[0], Deposit.abi, ip);
			const r = await d.collateralizationPercentage()
			const depositState = states[await d.currentState()];

			console.log(`keep ${addr} manages TDT ${d.address} (${ethers.utils.formatEther(await d.lotSizeTbtc())} tBTC) | has ratio ${r} with state: ${depositState}`);
		}

	} catch(err) {
		console.error(`Could not find TDTs: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})
