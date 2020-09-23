const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const TokenGrant = require("@keep-network/keep-core/artifacts/TokenGrant.json")
const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const KeepBonding = require("@keep-network/keep-ecdsa/artifacts/KeepBonding.json")
const RandomBeaconOperator = require("@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node auths.js address');
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
		const grantContract = new ethers.Contract(TokenGrant.networks["1"].address, TokenGrant.abi, ip);
		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);
		const keepBondingContract = new ethers.Contract(KeepBonding.networks["1"].address, KeepBonding.abi, ip);
		const beaconOpContract = new ethers.Contract(RandomBeaconOperator.networks["1"].address, RandomBeaconOperator.abi, ip);

		console.log(`Is operator in sortition pool up to date?`)
		try {
			const sortUpToDate = await ecdsaKFContract.isOperatorUpToDate(addr, tbtcSysContract.address)
			console.log(`${sortUpToDate}`)
		} catch (err) {
			console.log(err.message)
		}

		console.log(`Checking random beacon authorization`)
		const beaconAuth = await stakingContract.isAuthorizedForOperator(addr, beaconOpContract.address)
		console.log(`beacon authorization: ${beaconAuth}`)

		console.log(`Checking ECDSA/tBTC authorizations`)
		const ecdsaAuth = await stakingContract.isAuthorizedForOperator(addr, ecdsaKFContract.address)
		console.log(`bonded ECDSA Keep factory authorization: ${ecdsaAuth}`)

		const opEg = await ecdsaKFContract.isOperatorEligible(addr, tbtcSysContract.address)
		console.log(`operator eligible for tbtc sys contract: ${opEg}`)

		const sortitionPoolAddress = await ecdsaKFContract.getSortitionPool(tbtcSysContract.address)
		const tbtcAuth = await keepBondingContract.hasSecondaryAuthorization(addr, sortitionPoolAddress)
		console.log(`tBTC system authorization: ${tbtcAuth}`)

		console.log(`\nAll systems authorized: ${beaconAuth && ecdsaAuth && tbtcAuth}`)

	} catch(err) {
		console.error(`Could not check authorization: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})
