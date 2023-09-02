const { ethers } = require("hardhat");
const fs = require("fs");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
// // Load the contract artifact
const erc20ImplArtifact = require("../artifacts/contracts/token/bittoToken.impl.sol/ERC20Impl.json");
const erc20ProxyArtifact = require("../artifacts/contracts/token/bittoToken.sol/ERC20Proxy.json");

// npx hardhat run scripts/V1_proxy_deploy.js --network sepolia

async function main() {
  const [admin, minter] = await ethers.getSigners();

  await addressDB.addresss.saveAddressInfo("eth", "admin", admin.address);
  await addressDB.addresss.saveAddressInfo("eth", "minter", admin.address);
  console.log("v1 deploy start");

  const erc20Impl = await ethers.deployContract("ERC20Impl");
  const erc20ImplReceipt = await erc20Impl.waitForDeployment();
  console.log("deploy receipt erc20V1 : ", erc20ImplReceipt);
  const erc20V1Address = await erc20Impl.getAddress();
  console.log("v1 deployed");
  const initialSupply = ethers.parseUnits("10000", 18); // 1,000,000 토큰

  //initialize setting minter_role = minter,
  const encodedInitializeData = erc20Impl.interface.encodeFunctionData(
    "initialize",
    ["BittoToken", "BITTO", initialSupply, minter.address]
  );
  console.log("proxy deploy start");
  const erc20Proxy = await ethers.deployContract("ERC20Proxy", [
    erc20V1Address,
    admin.address,
    encodedInitializeData,
  ]);
  await erc20Proxy.waitForDeployment();
  console.log("proxy deployed");
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

  // Extract the ABIs
  const erc20ImplABI = JSON.stringify(erc20ImplArtifact.abi);
  const erc2Ov1ABI = JSON.stringify(erc20ProxyArtifact.abi);

  // Save to a file
  fs.writeFileSync("erc2Ov1ABI.json", erc20ImplABI);
  fs.writeFileSync("erc2Ov1ABI.json", erc2Ov1ABI);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "Erc20V1",
    "1.0",
    erc20V1Address,
    erc20ImplABI
  );
  await contractDB.contracts.saveContractInfo(
    "eth",
    "Erc20Proxy",
    "1.0",
    proxyAddress,
    erc2Ov1ABI
  );

  ///////////// get data Test ///////////
  console.log("///////////// get data Test ///////////");
  console.log(
    "Admin Address",
    await addressDB.addresss.getAddressInfo("admin")
  );
  console.log(
    "Minter Address",
    await addressDB.addresss.getAddressInfo("minter")
  );
  console.log(
    "Erc20V1 Get DB : ",
    await contractDB.contracts.getContractInfo("Erc20V1")
  );
  console.log(
    "Erc20Proxy Get DB : ",
    await contractDB.contracts.getContractInfo("Erc20Proxy")
  );
  console.log("== deploy completed ==");
}
//TODO
// V1 fs 제거 및 데이터베이스 데이터 가져오기 세팅
// database save 시 name 이름 중복 => 제일 최근 데이터로 업데이트
//  완
//V2 database 작업
//backend database data 끌어오기, transaction 처리
//wallet 함수 폴더정리
//노션 정리. 블로깅
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
