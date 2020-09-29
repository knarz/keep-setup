const ethers = require('ethers');

const KeepRandomBeaconOperator = require("@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

async function main() {
	let wallet
	try {
		const ip = new ethers.providers.InfuraProvider(network, infura);

		const randomOpContract = new ethers.Contract(KeepRandomBeaconOperator.networks["1"].address, KeepRandomBeaconOperator.abi, ip);

		const events = await randomOpContract.queryFilter(randomOpContract.filters.RelayEntryTimeoutReported(null));
		console.log(events.length);

		console.log(await randomOpContract.hasMinimumStake("0x49b73ef45A462bcAf968b3ba34918080584c4191"))

		let slashEvents = new Map();
		for (event of events) {
			let idx = event.args[0];
			console.log(`group index: ${idx}`);
			let pk = await randomOpContract.getGroupPublicKey(idx);
			//console.log(`group pk: ${pk}`);
			let members = await randomOpContract.getGroupMembers(pk);
			let mset = new Set();
			for (member of members) {
				if (slashEvents.has(member)) { slashEvents.set(member, slashEvents.get(member) + 1); }
				else { slashEvents.set(member, 1); }
				mset.add(member);
			}
			console.log(`members.length ${members.length} vs mset.size ${mset.size}`);
		}

		console.log(slashEvents);
		console.log(slashEvents.size);

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})



