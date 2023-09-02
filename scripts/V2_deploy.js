const { ethers } = require("hardhat");
const fs = require("fs");

// npx hardhat run scripts/V2_deploy.js --network sepolia
async function main() {
  const erc20ImplV2 = await ethers.deployContract("ERC20ImplV2");
  await erc20ImplV2.waitForDeployment();
  const erc20ImplV2Address = await erc20ImplV2.getAddress();
  console.log("V2 Address : ", erc20ImplV2Address);
  // Save deployed contract addresses to JSON file
  let addresses = {
    erc2Ov2: erc20ImplV2Address,
  };

  fs.writeFileSync("deployedAddressesV2.json", JSON.stringify(addresses));

  console.log("== deploy completed ==");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
