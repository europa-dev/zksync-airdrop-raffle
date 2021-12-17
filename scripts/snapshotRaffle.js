const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

// https://etherscan.io/address/0xf0d54349aDdcf704F77AE15b96510dEA15cb7952#code
const { abi } = require('./utils/chainlink_vrf_abi.json');
const snapshot = require('./utils/boonji_snapshot_2021_12_13.json');

const { INFURA_PROJECT_ID } = process.env; // @TODO: pocket

// https://docs.chain.link/docs/vrf-contracts/#ethereum-mainnet
const CHAINLINK_VRF_MAINNET = '0xf0d54349aDdcf704F77AE15b96510dEA15cb7952';

const FROM_BLOCK = 13803800; // https://etherscan.io @ Dec-14-2021 02:35:23 PM +UTC
const TO_BLOCK = 13804464; // https://etherscan.io @ Dec-14-2021 04:47:54 PM +UTC

const TOTAL_LUCKY_WEINERS = 33; // boonji x joa airdrop

// returns a read-only instance of the chainlink vrf contract deployed to mainnet
const _getChainlinkVRFContract = async () => {
  const ethersProvider = hre.ethers.getDefaultProvider('mainnet', { infura: INFURA_PROJECT_ID });
  const ChainlinkVRF = await new hre.ethers.Contract(CHAINLINK_VRF_MAINNET, abi, ethersProvider);

  console.log(`using ChainlinkVRF deployed at: ${ChainlinkVRF.address}`);

  return ChainlinkVRF;
};

// returns an array of random numbers derived from vrf contract events for `RandomnessRequestFulfilled`
const _getRandomNumbersFromBlock = async (vrf, fromBlock = FROM_BLOCK, toBlock = TO_BLOCK, limitNumber) => {
  const eventFilter = vrf.filters.RandomnessRequestFulfilled();
  const events = await vrf.queryFilter(eventFilter, fromBlock, toBlock);
  console.log(`total events: ${events.length}`);

  // guarantee the same random numbers each time by doing rand % limitNumber
  const modVal = hre.ethers.BigNumber.from(limitNumber.toString());

  let res = events.map(({ args }) => {
    const b = hre.ethers.utils.formatEther(args.output); // actually just a BigNumber
    const [massiveInteger] = b.split('.');
    return parseInt(hre.ethers.BigNumber.from(massiveInteger).mod(modVal).toNumber());
  });

  return res.slice(0, TOTAL_LUCKY_WEINERS); // don't need all of them
};

// for each number in `randomNumbers`:
//  1. retrieve the owner at index in `tokenOwners`
//   - if owner has listed the token for less than 3.3 ETH => retrieve the next owner (idx+1) until false
//  2. flag owner as a weiner
//  3. remove the account from the array of `tokenOwners` for the next draw not to include
const _determineWeiners = (randomNumbers, tokenOwners) => {
  const MINIMUM_LISTING_PRICE_ETH = 3.3;
  const weiners = [];
  const tokens = [...tokenOwners]; // since we'll be mutating

  randomNumbers.forEach((number) => {
    let idx = number;
    let token = tokens[idx - 1]; // 0-based upon transforming to array
    while (token.eth_price !== 0 && parseFloat(token.eth_price) < MINIMUM_LISTING_PRICE_ETH) {
      console.log(`whoops... ${token.owner} listed their token (${token.tokenId}) under MINIMUM_LISTING_PRICE_ETH (${token.eth_price}). let's try again`);
      token = tokens[++idx];
    }

    weiners.push(token.owner);
    tokens.splice(idx, 1);
  });

  return weiners;
};

async function main() {
  const vrf = await _getChainlinkVRFContract();

  const tokenOwners = Object.keys(snapshot).sort().reduce((memo, tokenId) => {
    memo.push({ ...snapshot[tokenId], tokenId });
    return memo;
  }, []);
  console.log(`total tokens: ${tokenOwners.length}`);

  const vrfRandomNumbers = await _getRandomNumbersFromBlock(vrf, undefined, undefined, tokenOwners.length);

  console.log(`total random numbers: ${vrfRandomNumbers.length}`);
  console.log(vrfRandomNumbers);

  const accounts = _determineWeiners(vrfRandomNumbers, tokenOwners);
  console.log('we have weiners!', accounts.length);
  console.log(accounts);

  fs.writeFileSync(path.join(__dirname, './utils/joa_airdrop_winners.json'), JSON.stringify({ accounts }, null, 2));
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
