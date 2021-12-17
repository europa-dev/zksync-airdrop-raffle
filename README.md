# zksync-airdrop

## setup
```bash
nvm use
yarn
```

## set env variables
Copy the template and set the values (private key / [infura](https://infura.io/) api key)
```
cp .env.template .env
```

## snapshot raffle procedure
- get snapshot of Boonji collection tokens and owners on Dec 13th + enrich dataset with opensea listings per tokenId (if any)
- using the `Chainlink VRF` contract deployed on mainnet, get enough events for `RandomnessRequestFulfilled` to get random numbers, from a given block to another given block
- deterministically generate list of winning holders based on algorithm documented in `scripts/snapshotRaffle.js#_determineWeiners`

The whole script can be run using `yarn raffle`. This will write the winning accounts to a local file in `scripts/utils/joa_airdrop_winners.json`
