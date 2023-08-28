require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
// require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/9a5f7e46cc504f13a23aebd09ef8888b",
      // accounts: [`0x${process.env.SEPOLIA_PRIVATEKEY}`],
      accounts: [
        `0x3d9e07f5347b7bae3ab0e1c5417ea71fea0a37585d0c52e323b46827dfd2f3bd`,
        `0xc23883e579436ffd834fd740c4f1ce9149360dbe25539194f321ce0f3f4034bc`,
        `0xe4af8e2153bf604dd180351278edc9d9e238a4d1eb0d46d3a635ab56f48a148e`,
        `0x1ab1f44a05a986db3a13f3672cd883a95e91a05ec625a913f18db5bae8f6e326`,
      ],
    },
    goeril: {
      url: "https://goerli.infura.io/v3/9a5f7e46cc504f13a23aebd09ef8888b",
      accounts: [
        `0x997ef27780b8afa1a5c605592faf1849203c7a1296498f73b9e6c34d6995c01c`,
        `0xb5c15b901d616dc407a3804eeabf3b75cbc930c33b9d06d052f5f832bbcf64c1`,
        `0x17d425b23fc6202beb8068ff18f22f5c47b8b44a93f840eeac67057daf6ef7b9`,
        `0x1ab1f44a05a986db3a13f3672cd883a95e91a05ec625a913f18db5bae8f6e326`,
      ],
    },
  },
};
