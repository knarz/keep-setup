const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const BondedECDSAKeep = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const Deposit = require("@keep-network/tbtc/artifacts/Deposit.json");

const states = require('./states')

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);

		const keepFactory = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);

		const deposits = (await tbtcSysContract.queryFilter(tbtcSysContract.filters.Created())).map((e) => { return e.args[0] })
		for (let dAddr of deposits) {
			const d = new ethers.Contract(dAddr, Deposit.abi, ip);
			const k = new ethers.Contract(await d.keepAddress(), BondedECDSAKeep.abi, ip);
			const r = await d.collateralizationPercentage()
			const depositState = states[await d.currentState()];
			console.log(`TDT ${dAddr} (${depositState}) (${ethers.utils.formatEther(await d.lotSizeTbtc())} tBTC) of ${k.address} has ratio ${r}`)
		}
	} catch(err) {
		console.error(`Could not get ratios: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})




