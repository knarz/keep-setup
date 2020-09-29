const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const BondedECDSAKeep = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")

const states = require('./states.js')

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);

		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);

		const keeps = (await ecdsaKFContract.queryFilter(ecdsaKFContract.filters.BondedECDSAKeepCreated())).map(ev => { return ev.args[0] });

		let total = ethers.BigNumber.from(0);
		for (let addr of keeps) {
			const k = new ethers.Contract(addr, BondedECDSAKeep.abi, ip);
			const keepActive = await k.isActive();
			if (keepActive) {
				total = total.add(await k.checkBondAmount())
				console.log(`total: ${ethers.utils.formatEther(total)}`)
			}
		}
	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

