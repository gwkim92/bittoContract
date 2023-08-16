require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");
dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    Ropsten: {
      url: "https://sepolia.infura.io/v3/9a5f7e46cc504f13a23aebd09ef8888b",
      accounts: [SEPOLIA_PRIVATEKEY],
    },
  },
};
