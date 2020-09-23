const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

async function main() {
	let wallet
	try {
		const ip = new ethers.providers.InfuraProvider(network, infura);

		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);

		const weight = await ecdsaKFContract.getSortitionPoolWeight(tbtcSysContract.address)
		console.log(`pool weight ${weight}`)

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})


