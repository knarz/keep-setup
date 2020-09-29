const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const KeepBonding = require("@keep-network/keep-ecdsa/artifacts/KeepBonding.json")

const { auths, auths_beacon, auths_ecdsa } = require("./check_op.js")

const config = require('./config')
const infura = config.infura_secret || process.env.INFURA_API;
const network = config.network || 'homestead'

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider(network, infura);

		const stakingContract = new ethers.Contract(TokenStaking.networks["1"].address, TokenStaking.abi, ip)
		const keepBondingContract = new ethers.Contract(KeepBonding.networks["1"].address, KeepBonding.abi, ip);

		const stakeEvs = await stakingContract.queryFilter(stakingContract.filters.OperatorStaked());
		const operators = stakeEvs.map((e) => { return [e.args['operator'], e.args['value']] })
		console.log(`We have ${operators.length} staking events`)

		const threshold = ethers.utils.parseEther('1000000.0').div(ethers.utils.parseEther('2.0')) // At least 2 ETH per 1M KEEP staked.
		const two = ethers.utils.parseEther('2.0')

		let numLTT = numBT = 0
		const allGood = new Set()
		const beaconGood = new Set()
		const ecdsaGood = new Set()
		let totalBond = ethers.constants.Zero
		let staked = ethers.constants.Zero
		for (let op of operators) {
			const ebal = await ip.getBalance(op[0])
			const kbal = op[1]
			const ratio = ebal.eq(0) ? ethers.BigNumber.from(0) : kbal.div(ebal)
			//console.log(`${op[0]} stakes ${ethers.utils.formatEther(kbal)} KEEP and has ${ethers.utils.formatEther(ebal)} ETH`)
			if (ratio < threshold) {
				numBT++
			}
			if (ebal.lt(two)) {
				numLTT++
			}
			staked = staked.add(kbal)

			try {
				const bg = await auths_beacon(ip, op[0])
				const eg = await auths_ecdsa(ip, op[0])

				if (bg) { beaconGood.add(op[0]) }
				if (eg) {
					ecdsaGood.add(op[0])
					const available = await keepBondingContract.unbondedValue(op[0])
					totalBond = totalBond.add(available)
					console.log(`${op[0]} (${ethers.utils.formatEther(ebal)} ETH) stakes ${ethers.utils.formatEther(kbal)} KEEP and ${ethers.utils.formatEther(available)} ETH for bonding`)
				}
				if (bg && eg) { allGood.add(op[0]) }
			} catch (err) {
				console.log(err)
			}
		}
		console.log(`total staked: ${ethers.utils.formatEther(staked)}`)
		console.log(`Of ${operators.length} operators ${numLTT} have less than 2 ETH and ${numBT} are below the 2 ETH per 1M KEEP threshold`)
		console.log(`Of ${operators.length} operators ${allGood.size} have done all the required on-chain setup for both beacon and ecdsa`)
		console.log(`Of ${operators.length} operators ${beaconGood.size} have done all the required on-chain setup for beacon`)
		console.log(`Of ${operators.length} operators ${ecdsaGood.size} have done all the required on-chain setup for ecdsa`)
		console.log(`available for bonding: ${ethers.utils.formatEther(totalBond)}`)

	} catch(err) {
		console.error(`Something went wrong: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

