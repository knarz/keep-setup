const fs = require('fs');
const ethers = require('ethers');

const Deposit = require("@keep-network/tbtc/artifacts/Deposit.json");

const states = require('./states.js')

if (process.argv.length < 4 || !process.argv[2]) {
	console.error('node clean_tdt.js tdt password');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const j = fs.readFileSync('wallet.json', 'utf8');
		const w  = await new ethers.Wallet.fromEncryptedJson(j, process.argv[3]);
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);
		wallet = w.connect(ip);

		const dAddr = process.argv[2]
		const d = new ethers.Contract(dAddr, Deposit.abi, wallet);
		const depositState = states[await d.currentState()];
		console.log(`[${dAddr}] in state ${depositState} @ ${ethers.utils.formatEther((await d.lotSizeTbtc()).toString())} tBTC`);
		if (depositState === 'AWAITING_SIGNER_SETUP') { // Check if we can dissolve this.
			try {
				console.log(`try to call notifySignerSetupFailed`);
				const tx = await d.notifySignerSetupFailed();
				await tx.wait();
				console.log(`success`);
			} catch (err) {
				console.log(`failed to call notifySignerSetupFailed: ${err}`);
			}
		} else if (depositState === 'AWAITING_BTC_FUNDING_PROOF') {
			try {
				console.log(`try to call notifyFundingTimedOut`);
				const tx = await d.notifyFundingTimedOut();
				await tx.wait();
				console.log(`success`);
			} catch (err) {
				console.log(`failed to call notifyFundingTimedOut: ${err}`);
			}
		} 

	} catch(err) {
		console.error(`Could not clean: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})




