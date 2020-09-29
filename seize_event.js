const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json");
const KeepRandomBeaconOperator = require("@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json");

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node seize_event.js [address]');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const ip = new ethers.providers.InfuraProvider(network, infura);
		let addr
		try {
			addr = ethers.utils.getAddress(process.argv[2])
		} catch (err) {
			console.error(`Invalid address supplied: ${err}`)
			process.exit(1)
		}

		const stakingContract = new ethers.Contract(TokenStaking.networks["1"].address, TokenStaking.abi, ip);
		const randomOpContract = new ethers.Contract(KeepRandomBeaconOperator.networks["1"].address, KeepRandomBeaconOperator.abi, ip);

		console.log(ethers.utils.parseUnits('1000').toString());
		const seizeEvents = await stakingContract.queryFilter(stakingContract.filters.TokensSeized(addr));
		const timeoutEvents = await randomOpContract.queryFilter(randomOpContract.filters.RelayEntryTimeoutReported(null));
		const seizeEventBlocks = seizeEvents.map(x => x.blockNumber);
		const timeoutEventBlocks = new Set(timeoutEvents.map(x => x.blockNumber));
		//const seizeEventSizes = seizeEvents.filter(x => !x.args[1].eq(ethers.utils.parseUnits('1000')));
		console.log(seizeEventBlocks);
		console.log(timeoutEventBlocks);

		let events = new Map();
		for (event of timeoutEvents) {
			let idx = event.args[0];
			//console.log(`group index: ${idx}`);
			let pk = await randomOpContract.getGroupPublicKey(idx);
			////console.log(`group pk: ${pk}`);
			let members = await randomOpContract.getGroupMembers(pk);
			let occurences = members.filter(x => x.toLowerCase() === addr.toLowerCase())
			console.log(`[#${event.blockNumber}] ${addr} is in this group ${occurences} times`);
			let mset = new Set(members);
			if (!seizeEventBlocks.includes(event.blockNumber) && occurences > 0) {
				console.log(`timeout event but no seize event`);
				console.log(`tx hash: ${event.transactionHash}`);
			}
			for (member of mset) {
				if (events.has(member)) { events.set(member, events.get(member) + 1); }
				else { events.set(member, 1); }
			}
			//console.log(`members.length ${members.length} vs mset.size ${mset.size}`);
		}

		//console.log(events);
		//console.log(slashEvents.size);

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})




