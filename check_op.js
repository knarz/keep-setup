const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const TokenGrant = require("@keep-network/keep-core/artifacts/TokenGrant.json")
const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const KeepBonding = require("@keep-network/keep-ecdsa/artifacts/KeepBonding.json")
const RandomBeaconOperator = require("@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json")

async function auths(ip, addr) {
	return (await auths_ecdsa(ip, addr)) && (await auths_beacon(ip, addr))
}

async function auths_ecdsa(ip, addr) {
	const stakingContract = new ethers.Contract(TokenStaking.networks["1"].address, TokenStaking.abi, ip);
	const grantContract = new ethers.Contract(TokenGrant.networks["1"].address, TokenGrant.abi, ip);
	const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
	const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);
	const keepBondingContract = new ethers.Contract(KeepBonding.networks["1"].address, KeepBonding.abi, ip);

	const ecdsaAuth = await stakingContract.isAuthorizedForOperator(addr, ecdsaKFContract.address)
	const opEg = await ecdsaKFContract.isOperatorEligible(addr, tbtcSysContract.address)
	const sortitionPoolAddress = await ecdsaKFContract.getSortitionPool(tbtcSysContract.address)
	const tbtcAuth = await keepBondingContract.hasSecondaryAuthorization(addr, sortitionPoolAddress)

	return ecdsaAuth && opEg && tbtcAuth
}

async function auths_beacon(ip, addr) {
	const stakingContract = new ethers.Contract(TokenStaking.networks["1"].address, TokenStaking.abi, ip);
	const beaconOpContract = new ethers.Contract(RandomBeaconOperator.networks["1"].address, RandomBeaconOperator.abi, ip);
	const beaconAuth = await stakingContract.isAuthorizedForOperator(addr, beaconOpContract.address)

	return beaconAuth
}

module.exports = {
	auths: auths,
	auths_beacon: auths_beacon,
	auths_ecdsa: auths_ecdsa
}
