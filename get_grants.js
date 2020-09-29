const ethers = require('ethers');

const TokenGrant = require("@keep-network/keep-core/artifacts/TokenGrant.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node get_grants.js [address]');
	process.exit(1);
}

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider(network, infura);
		let addr
		try {
			addr = ethers.utils.getAddress(process.argv[2])
		} catch (err) {
			console.error(`Invalid address supplied: ${err}`)
			process.exit(1)
		}

		const grantContract = new ethers.Contract(TokenGrant.networks["1"].address, TokenGrant.abi, ip);
		const grants = await grantContract.getGrants(addr);

		let amount;
		for (let i in grants) { // Just use the first grant with enough tokens
			amount = await grantContract.availableToStake(grants[i]);
			console.log(`Grant id ${grants[i]} has ${amount} tokens available to stake`);
		}

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error("error:", err);
})

