const fs = require('fs');
const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const TokenGrant = require("@keep-network/keep-core/artifacts/TokenGrant.json")
const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const KeepBonding = require("@keep-network/keep-ecdsa/artifacts/KeepBonding.json")

const minStake = ethers.BigNumber.from("100000000000000000000000");

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node access.js [password]');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const j = fs.readFileSync('wallet.json', 'utf8');
		const w  = await new ethers.Wallet.fromEncryptedJson(j, process.argv[2]);
		const ip = new ethers.providers.InfuraProvider(network, infura);
		wallet = w.connect(ip);

		const stakingContract = new ethers.Contract(TokenStaking.networks["1"].address, TokenStaking.abi, wallet);
		const grantContract = new ethers.Contract(TokenGrant.networks["1"].address, TokenGrant.abi, wallet);
		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, wallet);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, wallet);
		const keepBondingContract = new ethers.Contract(KeepBonding.networks["1"].address, KeepBonding.abi, wallet);
		const grants = await grantContract.getGrants(wallet.address);

		let idx = -1;
		let amount;
		for (let i in grants) { // Just use the first grant with enough tokens
			amount = await grantContract.availableToStake(grants[i]);
			console.log(`Grant id ${grants[i]} has ${amount} tokens available to stake`);
			if (amount.gte(minStake)) {
				console.log(`Using grant ${grants[i]}`);
				idx = i;
				break;
			}
		}

		if (idx === -1) { throw new Error('could not find suitable grant'); }

		let authAddrs = '0x' + Buffer.concat([
      Buffer.from(w.address.substr(2), "hex"),
      Buffer.from(w.address.substr(2), "hex"),
      Buffer.from(w.address.substr(2), "hex"),
		]).toString('hex')

		console.log(`stake(${grants[idx]}, ${stakingContract.address}, ${amount}, ${authAddrs})`)
		const stakeTx = await grantContract.stake(grants[idx], stakingContract.address, amount, authAddrs)
		console.log('waiting for stake transaction')
		await stakeTx.wait()

		const authOp = await stakingContract.authorizeOperatorContract(w.address, ecdsaKFContract.address)
		console.log('waiting for operator authorization')
		await authOp.wait()

		const sortitionPoolAddr = await ecdsaKFContract.getSortitionPool(tbtcSysContract.address)
		const authTBTC = await keepBondingContract.authorizeSortitionPoolContract(w.address, sortitionPoolAddr)
		console.log(`authorizing sortition pool at ${sortitionPoolAddr}`)
		await authTBTC.wait()

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})
