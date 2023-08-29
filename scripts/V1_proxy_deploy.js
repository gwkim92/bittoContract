const { ethers } = require("hardhat");
const fs = require("fs");

// npx hardhat run scripts/V1_proxy_deploy.js --network sepolia

async function main() {
  const [admin, minter] = await ethers.getSigners();

  const erc20Impl = await ethers.deployContract("ERC20Impl");
  await erc20Impl.waitForDeployment();
  const erc20V1Address = await erc20Impl.getAddress();

  const initialSupply = ethers.parseUnits("10000", 18); // 1,000,000 토큰

  //initialize setting minter_role = minter,
  const encodedInitializeData = erc20Impl.interface.encodeFunctionData(
    "initialize",
    ["BittoToken", "BITTO", initialSupply, minter.address]
  );
  const erc20Proxy = await ethers.deployContract("ERC20Proxy", [
    erc20V1Address,
    admin.address,
    encodedInitializeData,
  ]);
  await erc20Proxy.waitForDeployment();

  const proxyAddress = await erc20Proxy.getAddress();

  console.log("V1 Address : ", erc20V1Address);
  console.log("proxy Address : ", proxyAddress);

  // Save deployed contract addresses to JSON file
  let addresses = {
    erc2Ov1: erc20V1Address,
    proxy: proxyAddress,
    admin: admin.address,
    minter: minter.address,
  };

  fs.writeFileSync("deployedAddresses.json", JSON.stringify(addresses));

  console.log("== deploy completed ==");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
