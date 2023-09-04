const { ethers } = require("hardhat");
const fs = require("fs");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

// npx hardhat run scripts/Upgrade.js --network sepolia
async function main() {
  const ERC20ProxyDB = await contractDB.contracts.getContractInfo("Erc20Proxy");
  const ERC20V2DB = await contractDB.contracts.getContractInfo("ERC20V2");
  const AdminAddressDB = await addressDB.addresss.getAddressInfo("admin");

  let proxyAddress = ERC20ProxyDB.dataValues.address;
  let adminAddress = AdminAddressDB.dataValues.address;
  let V2Adress = ERC20V2DB.dataValues.address;
  let ERC20V2Abi = ERC20V2DB.dataValues.abi;
  console.log(proxyAddress, adminAddress, V2Adress);

  const admin = await ethers.provider.getSigner(adminAddress);

  const transparentUpgradeableInstance = await ethers.getContractAt(
    "ITransparentUpgradeableProxy",
    proxyAddress,
    admin
  );

  await transparentUpgradeableInstance.upgradeTo(V2Adress);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "Erc20Proxy",
    "2.0",
    proxyAddress,
    ERC20V2Abi
  );

  console.log(`=== upgraded ===`);
}

main().then(() => process.exit(0));
