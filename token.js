const ethers = require('ethers');

const TBTCToken = require("@keep-network/tbtc/artifacts/TBTCToken.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

async function main() {
	let wallet
	try {
		const ip = new ethers.providers.InfuraProvider(network, infura);

		const tbtcTokenContract = new ethers.Contract(TBTCToken.networks["1"].address, TBTCToken.abi, ip);

		const ts = await tbtcTokenContract.name()
		console.log(`ts ${ts}`)

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

