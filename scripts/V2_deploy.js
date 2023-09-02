const { ethers } = require("hardhat");
const fs = require("fs");
const contractDB = require("../dataBase/controller/contractController");
const erc20ImplV2Artifact = require("../artifacts/contracts/token/bittoTokenV2.sol/ERC20ImplV2.json");
// npx hardhat run scripts/V2_deploy.js --network sepolia
async function main() {
  const erc20ImplV2 = await ethers.deployContract("ERC20ImplV2");
  await erc20ImplV2.waitForDeployment();
  const erc20ImplV2Address = await erc20ImplV2.getAddress();
  console.log("V2 Address : ", erc20ImplV2Address);
  // Save deployed contract addresses to JSON file

  const erc20ImplV2ABI = JSON.stringify(erc20ImplV2Artifact.abi);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "ERC20V2",
    "1.0",
    erc20ImplV2Address,
    erc20ImplV2ABI
  );

  console.log(
    "ERC20ImplV2 Get DB : ",
    await contractDB.contracts.getContractInfo("ERC20V2")
  );

  console.log("== deploy completed ==");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
