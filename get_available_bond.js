const ethers = require('ethers');

const KeepBonding = require("@keep-network/keep-ecdsa/artifacts/KeepBonding.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node get_available_bond.js [address]');
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

		const keepBondingContract = new ethers.Contract(KeepBonding.networks["1"].address, KeepBonding.abi, ip);

		const available = await keepBondingContract.unbondedValue(addr)
		console.log(`available for bonding: ${ethers.utils.formatEther(available)}`)

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})


