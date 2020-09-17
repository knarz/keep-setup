const ethers = require('ethers');

const TokenStaking = require("@keep-network/keep-core/artifacts/TokenStaking.json")

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);

		const stakingContract = new ethers.Contract(TokenStaking.networks["1"].address, TokenStaking.abi, ip)

		const stakeEvs = await stakingContract.queryFilter(stakingContract.filters.OperatorStaked());
		const operators = stakeEvs.map((e) => { return [e.args['operator'], e.args['value']] })
		console.log(`We have ${operators.length} staking events`)

		const threshold = ethers.utils.parseEther('1000000.0').div(ethers.utils.parseEther('2.0')) // At least 2 ETH per 1M KEEP staked.
		const two = ethers.utils.parseEther('2.0')

		let numLTT = numBT = 0
		let staked = ethers.constants.Zero
		for (let op of operators) {
			const ebal = await ip.getBalance(op[0])
			const kbal = op[1]
			const ratio = ebal.eq(0) ? ethers.BigNumber.from(0) : kbal.div(ebal)
			console.log(`${op[0]} stakes ${ethers.utils.formatEther(kbal)} KEEP and has ${ethers.utils.formatEther(ebal)} ETH`)
			if (ratio < threshold) {
				numBT++
			}
			if (ebal.lt(two)) {
				numLTT++
			}
			staked = staked.add(kbal)
		}
		console.log(`total staked: ${ethers.utils.formatEther(staked)}`)
		console.log(`Of ${operators.length} operators ${numLTT} have less than 2 ETH and ${numBT} are below the 2 ETH per 1M KEEP threshold`)

	} catch(err) {
		console.error(`Something went wrong: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})

