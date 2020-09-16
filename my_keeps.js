const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const BondedECDSAKeep = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node my_keeps.js [operator]');
	process.exit(1);
}

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);
		const opAddr = process.argv[2].toLowerCase();

		//const keepFactory = new ethers.Contract(TBTCSystem.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);
		
		const keeps = await ecdsaKFContract.queryFilter(ecdsaKFContract.filters.BondedECDSAKeepCreated());
		const targetKeeps = keeps.filter(ev => { return ev.args[1].filter(ms => { return ms.toLowerCase() === opAddr}).length > 0 }).map(ev => { return ev.args[0]; });

		for (let addr of targetKeeps) {
			const k = new ethers.Contract(await addr, BondedECDSAKeep.abi, ip);
			const active = (await k.isActive()) ? "active" : "inactive";
			console.log(`part of keep at ${addr}. Keep is: ${active}`);
		}

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})
