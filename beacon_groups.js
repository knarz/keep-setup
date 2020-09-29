const ethers = require('ethers');

const KeepRandomBeaconOperator = require("@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'
if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node beacon_groups.js [opAddr]');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const ip = new ethers.providers.InfuraProvider(network, infura);

		const randomOpContract = new ethers.Contract(KeepRandomBeaconOperator.networks["1"].address, KeepRandomBeaconOperator.abi, ip);

		const events = await randomOpContract.queryFilter(randomOpContract.filters.DkgResultSubmittedEvent());
		const args = events.map((e) => { return e.args })

		let mGroups = new Map();
		for (a of args) {
			const members = await randomOpContract.getGroupMembers(a.groupPubKey)
			const target = process.argv[2];
			const found = members.filter((m) => { return m.toLowerCase() === target.toLowerCase() }).length > 0
			if (found)
				console.log(`${target} is part of this group ${a.groupPubKey}`)
			let mset = new Set();
			for (member of members) {
				if (mGroups.has(member)) { mGroups.set(member, mGroups.get(member) + 1); }
				else { mGroups.set(member, 1); }
				mset.add(member);
			}
			console.log(`members.length ${members.length} vs mset.size ${mset.size}`);
		}

		//console.log(mGroups);
		//console.log(slashEvents.size);

	} catch (err) {
		console.error(`Could not check beacon groups: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

