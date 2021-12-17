require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

const settings = {
  optimizer: {
    enabled: true,
    runs: 200
  }
};

const INFURA_URL_MAINNET = `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
const INFURA_URL_RINKEBY = `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.0',
        settings
      }
    ],
  },
  paths: {
    artifacts: './build'
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  networks: {
    localhost: {
      live: false,
      saveDeployments: true,
      tags: ['local']
    },
    rinkeby: {
      url: INFURA_URL_RINKEBY,
      accounts: [process.env.ADMIN_PRIVATE_KEY]
    },
    mainnet: {
      url: INFURA_URL_MAINNET,
      accounts: [process.env.ADMIN_PRIVATE_KEY],
      gas: 2100000,
    }
  },
};
