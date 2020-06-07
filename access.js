const fs = require('fs');
const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const TokenGrant = require("@keep-network/keep-core/artifacts/TokenGrant.json")
const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const KeepBonding = require("@keep-network/keep-ecdsa/artifacts/KeepBonding.json")

const minStake = ethers.utils.bigNumberify("100000000000000000000000");

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node access.js [password]');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const j = fs.readFileSync('wallet.json', 'utf8');
		const w  = await new ethers.Wallet.fromEncryptedJson(j, process.argv[2]);
		const ip = new ethers.providers.InfuraProvider('ropsten', process.env.INFURA_API);
		wallet = w.connect(ip);

		const stakingContract = new ethers.Contract("0xEb2bA3f065081B6459A6784ba8b34A1DfeCc183A", TokenStaking.abi, wallet);
		const grantContract = new ethers.Contract("0xb7bc38e89acde3d34a02f63187f24f08aabdd717", TokenGrant.abi, wallet);
		const ecdsaKFContract = new ethers.Contract("0x17cadDF97A1D1123eFb7b233cB16c76C31A96e02", BondedECDSAKeepFactory.abi, wallet);
		const tbtcSysContract = new ethers.Contract("0x2b70907b5C44897030ea1369591ddcd23C5d85d6", TBTCSystem.abi, wallet);
		const keepBondingContract = new ethers.Contract("0x4368F92Db6d4CA6Dc029D5F1F902137D9b91297B", KeepBonding.abi, wallet);
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
