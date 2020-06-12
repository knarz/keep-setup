const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const TokenGrant = require("@keep-network/keep-core/artifacts/TokenGrant.json")
const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const KeepBonding = require("@keep-network/keep-ecdsa/artifacts/KeepBonding.json")
const RandomBeaconOperator = require("@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json")

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node checkup.js address');
	process.exit(1);
}

async function main() {
	let wallet
	try {
		const ip = new ethers.providers.InfuraProvider('ropsten', process.env.INFURA_API);
		let addr
		try {
			addr = ethers.utils.getAddress(process.argv[2])
		} catch (err) {
			console.error(`Invalid address supplied: ${err}`)
			process.exit(1)
		}

		const stakingContract = new ethers.Contract("0xEb2bA3f065081B6459A6784ba8b34A1DfeCc183A", TokenStaking.abi, ip);
		const grantContract = new ethers.Contract("0xb7bc38e89acde3d34a02f63187f24f08aabdd717", TokenGrant.abi, ip);
		const ecdsaKFContract = new ethers.Contract("0x17cadDF97A1D1123eFb7b233cB16c76C31A96e02", BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract("0x2b70907b5C44897030ea1369591ddcd23C5d85d6", TBTCSystem.abi, ip);
		const keepBondingContract = new ethers.Contract("0x4368F92Db6d4CA6Dc029D5F1F902137D9b91297B", KeepBonding.abi, ip);
		const beaconOpContract = new ethers.Contract("0x440626169759ad6598cd53558F0982b84A28Ad7a", RandomBeaconOperator.abi, ip);

		console.log(`Checking random beacon authorization`)
		const beaconAuth = await stakingContract.isAuthorizedForOperator(addr, beaconOpContract.address)
		console.log(`beacon authorization: ${beaconAuth}`)

		console.log(`Checking ECDSA/tBTC authorizations`)
		const ecdsaAuth = await stakingContract.isAuthorizedForOperator(addr, ecdsaKFContract.address)
		console.log(`bonded ECDSA Keep factory authorization: ${ecdsaAuth}`)

		const sortitionPoolAddress = await ecdsaKFContract.getSortitionPool(tbtcSysContract.address)
		const tbtcAuth = await keepBondingContract.hasSecondaryAuthorization(addr, sortitionPoolAddress)
		console.log(`tBTC system authorization: ${tbtcAuth}`)

		console.log(`\nAll systems authorized: ${beaconAuth && ecdsaAuth && tbtcAuth}`)

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

