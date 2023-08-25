const { expect } = require("chai");
const { ethers } = require("hardhat");
// const { utils } = ethers;
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function deployFixture() {
  function convertToBytes(str) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(str);
    return new Uint8Array(encodedData);
  }

  const [owner, minter, recipient, admin] = await ethers.getSigners();
  console.log(owner, minter, recipient, admin);

  const ERC20Impl = await ethers.getContractFactory("ERC20Impl");
  const erc20Impl = await ERC20Impl.deploy();

  await erc20Impl.waitForDeployment();
  console.log("contract : ", erc20Impl.address);
  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 토큰
  console.log(admin.address);
  await erc20Impl.initialize(
    "BittoToken",
    "BITTO",
    initialSupply,
    admin.address
  );

  const ERC20ImplV2 = await ethers.getContractFactory("ERC20ImplV2");

  const ERC20Proxy = await ethers.getContractFactory("ERC20Proxy");

  //   const deployData = utils.defaultAbiCoder.encode(
  //     ["string", "string", "uint256", "address"],
  //     ["BittoToken", "BITTO", utils.parseUnits("1000000", 18), admin.address]
  //   );

  const encodedInitializeData = erc20Impl.interface.encodeFunctionData(
    "initialize",
    ["BittoToken", "BITTO", initialSupply, admin.address]
  );
  console.log(typeof encodedInitializeData);

  const byteData = convertToBytes(encodedInitializeData);
  console.log(byteData);
  console.log(typeof byteData);
  //   const byte = ethers.toUtf8Bytes(byteData);
  //   console.log(byte);
  //   console.log(typeof byte);

  const erc20Proxy = await ERC20Proxy.deploy(
    erc20Impl.address,
    admin.address,
    byteData
  );

  const erc20ImplInstance = ERC20Impl.attach(erc20Proxy.address);

  return {
    erc20Impl,
    erc20ImplInstance,
    erc20Proxy,
    ERC20ImplV2,
    owner,
    minter,
    recipient,
    admin,
  };
}

describe("ERC20Impl Upgrade Test using ERC20Proxy", function () {
  let erc20Impl,
    erc20ImplInstance,
    erc20Proxy,
    erc20ImplV2Instance,
    ERC20ImplV2,
    owner,
    minter,
    recipient,
    admin;

  beforeEach(async () => {
    ({
      erc20Impl,
      erc20ImplInstance,
      erc20Proxy,
      ERC20ImplV2,
      owner,
      minter,
      recipient,
      admin,
    } = await loadFixture(deployFixture));
  });

  // 이전 테스트 코드를 사용하거나 여기에 새로운 테스트 코드를 추가
  it("should set the token details after deployment", async function () {
    expect(await erc20ImplInstance.name()).to.equal("BittoToken");
    expect(await erc20ImplInstance.symbol()).to.equal("BITTO");
    expect((await erc20ImplInstance.totalSupply()).toString()).to.equal(
      "1000000"
    );
  });

  it("Upgrade should not affect balance and state", async function () {
    // 1. 기존 버전에서의 토큰 전송
    await erc20ImplInstance.connect(admin).mint(owner.address, 1000);
    await erc20ImplInstance.transfer(recipient.address, 500);

    // 2. 업그레이드 수행
    erc20ImplV2Instance = await ERC20ImplV2.deploy();
    // await erc20ImplV2Instance.deployTransaction.wait();

    // Upgrading using ERC20Proxy
    const upgradeTx = await erc20Proxy
      .connect(admin)
      .upgradeTo(erc20ImplV2Instance.address);
    await upgradeTx.wait();

    erc20ImplV2Instance = ERC20ImplV2.attach(erc20Proxy.address);

    // 3. 업그레이드 후 기존 토큰 및 상태 검증
    expect(await erc20ImplV2Instance.totalSupply()).to.equal(1000000);
    expect(await erc20ImplV2Instance.balanceOf(owner.address)).to.equal(500);
    expect(await erc20ImplV2Instance.balanceOf(recipient.address)).to.equal(
      500
    );
  });

  it("New functions should work properly after upgrade", async function () {
    // 1. 업그레이드 수행
    erc20ImplV2Instance = await ERC20ImplV2.deploy();
    // await erc20ImplV2Instance.deployTransaction.wait();

    // Upgrading using ERC20Proxy
    const upgradeTx = await erc20Proxy
      .connect(admin)
      .upgradeTo(erc20ImplV2Instance.address);
    await upgradeTx.wait();

    erc20ImplV2Instance = ERC20ImplV2.attach(erc20Proxy.address);

    // 2. 업그레이드 후 새로운 기능 테스트
    await erc20ImplV2Instance.connect(admin).mint(owner.address, 1000);
    expect(await erc20ImplV2Instance.balanceOf(owner.address)).to.equal(
      1001000
    );

    await erc20ImplV2Instance.pause();
    await expect(
      erc20ImplV2Instance.transfer(recipient.address, 500)
    ).to.be.revertedWith("Pausable: paused");

    await erc20ImplV2Instance.unpause();
    await erc20ImplV2Instance.transfer(recipient.address, 500);
    expect(await erc20ImplV2Instance.balanceOf(recipient.address)).to.equal(
      500
    );
  });
});
