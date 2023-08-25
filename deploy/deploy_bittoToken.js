const { ethers, upgrades } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const bittoTokenLogic = await deploy("bittoTokenLogic", {
    from: deployer,
    log: true,
  });

  const tokenInitData = ethers.utils.defaultAbiCoder.encode(
    ["string", "string", "uint256"],
    ["Bitto Token", "BITTO", 1000000] // 원하는 이름, 심볼, 공급량을 지정하세요.
  );

  const transparentUpgradeableProxy = await deploy("bittoToken", {
    contract: "TransparentUpgradeableProxy",
    from: deployer,
    log: true,
    args: [bittoTokenLogic.address, deployer, tokenInitData],
  });

  console.log("bittoToken deployed to:", transparentUpgradeableProxy.address);
};

module.exports.tags = ["BittoToken"];
