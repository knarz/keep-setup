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

		const events = await randomOpContract.queryFilter(randomOpContract.filters.DkgResultSubmittedEvent());
		const args = events.map((e) => { return e.args })
		//console.log(args)
		//console.log(KeepRandomBeaconOperator.networks["1"].address)
		//console.log(await randomOpContract.submittedTickets())
		//console.log(await randomOpContract.selectedParticipants())

		let mGroups = new Map();
		for (a of args) {
			//console.log(`isGroupRegistered() = ${await randomOpContract.isGroupRegistered(a.groupPubKey)}`)
			//console.log(`isStaleGroup() = ${await randomOpContract.isStaleGroup(a.groupPubKey)}`)
			const members = await randomOpContract.getGroupMembers(a.groupPubKey)
			const target = "0x49b73ef45A462bcAf968b3ba34918080584c4191"
			//const target = "0xea76c3bc8c659391464c68547255cfa955b19ea4"
			const found = members.filter((m) => { return m.toLowerCase() === target.toLowerCase()}).length > 0
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

		console.log(mGroups);
		//console.log(slashEvents.size);

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})




