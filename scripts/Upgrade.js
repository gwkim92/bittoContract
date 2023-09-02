const { ethers } = require("hardhat");
const fs = require("fs");

// npx hardhat run scripts/Upgrade.js --network sepolia
async function main() {
  const addressesJson = JSON.parse(fs.readFileSync("deployedAddresses.json"));
  const V2addressesJson = JSON.parse(
    fs.readFileSync("deployedAddressesV2.json")
  );
  let proxyAddress = addressesJson.proxy;
  let adminAddress = addressesJson.admin;
  let V2Adress = V2addressesJson.erc2Ov2;
  console.log(proxyAddress, adminAddress, V2Adress);

  const admin = await ethers.provider.getSigner(adminAddress);

  const transparentUpgradeableInstance = await ethers.getContractAt(
    "ITransparentUpgradeableProxy",
    proxyAddress,
    admin
  );

  await transparentUpgradeableInstance.upgradeTo(V2Adress);

  console.log(`=== upgraded ===`);
}

main().then(() => process.exit(0));
