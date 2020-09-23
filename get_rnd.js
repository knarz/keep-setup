const fs = require('fs');
const ethers = require('ethers');

const RandomBeaconImpl = require("@keep-network/keep-core/artifacts/KeepRandomBeaconServiceImplV1.json")
const RandomBeaconService = require("@keep-network/keep-core/artifacts/KeepRandomBeaconService.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node get_rnd.js [password]');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const j = fs.readFileSync('wallet.json', 'utf8');
		const w  = await new ethers.Wallet.fromEncryptedJson(j, process.argv[2]);
		const ip = new ethers.providers.InfuraProvider(network, infura);
		wallet = w.connect(ip);

		const serviceContract = new ethers.Contract(RandomBeaconService.networks["1"].address, RandomBeaconImpl.abi, wallet);
		const relayReqIdEv = serviceContract.filters.RelayEntryRequested();

		const ret = new Promise((res, rej) => {
			serviceContract.on("*", function (ev) {
				if (ev.event === 'RelayEntryGenerated') {
					console.log(`[https://homestead.etherscan.io/tx/${ev.transactionHash}] generated ${ev.args[0]}`);
					serviceContract.removeAllListeners();
					res({txHash: ev.transactionHash, num: ev.args[1]});
				}
			});
		});

		let entryFee = ethers.utils.parseEther("0.1");
		try { // currently broken?
			entryFee = await serviceContract.entryFeeEstimate(0);
		} catch (err) {
			console.log(`could not get estimate ${err}`)
		}

		console.log(`estimated entry fee ${entryFee}`);
		const relayEntry = await serviceContract['requestRelayEntry()']({value: entryFee});
		console.log('waiting for entry')
		const r = await relayEntry.wait();
		console.log(`entry submitted`);

		return ret;
	} catch(err) {
		console.error(`Could not get randomness: ${err.message}`)
		process.exit(1)
	}
}

main().then(({txHash, num}) => {
	console.log(txHash);
	console.log(num);
	//console.log(rid.toString(), num.toString());
}).catch(err => {
	console.error(err);
})


