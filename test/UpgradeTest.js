const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Impl Upgrade Test using ERC20Proxy", function () {
  let ERC20Impl,
    ERC20ImplV2,
    ERC20Proxy,
    erc20ImplInstance,
    erc20ImplV2Instance,
    erc20ProxyInstance;
  let owner, minter, recipient, admin;

  beforeEach(async () => {
    [owner, minter, recipient, admin] = await ethers.getSigners();

    ERC20Impl = await ethers.getContractFactory("ERC20Impl");
    ERC20ImplV2 = await ethers.getContractFactory("ERC20ImplV2");
    ERC20Proxy = await ethers.getContractFactory("ERC20Proxy");

    erc20ImplInstance = await ERC20Impl.deploy();
    await erc20ImplInstance.deployed();

    // Deploy ERC20Proxy using ERC20Impl as the logic contract.
    const deployData = ERC20Impl.interface.encodeConstructor([
      "BittoToken",
      "BITTO",
      1000000,
    ]);
    erc20ProxyInstance = await ERC20Proxy.deploy(
      erc20ImplInstance.address,
      admin.address,
      deployData
    );
    await erc20ProxyInstance.deployed();

    erc20ImplInstance = ERC20Impl.attach(erc20ProxyInstance.address);
  });

  it("Upgrade should not affect balance and state", async () => {
    // 1. 기존 버전에서의 토큰 전송
    await erc20ImplInstance.connect(admin).mint(owner.address, 1000);
    await erc20ImplInstance.transfer(recipient.address, 500);

    // 2. 업그레이드 수행
    erc20ImplV2Instance = await ERC20ImplV2.deploy();
    await erc20ImplV2Instance.deployed();

    // Upgrading using ERC20Proxy
    const upgradeTx = await erc20ProxyInstance
      .connect(admin)
      .upgradeTo(erc20ImplV2Instance.address);
    await upgradeTx.wait();

    erc20ImplV2Instance = ERC20ImplV2.attach(erc20ProxyInstance.address);

    // 3. 업그레이드 후 기존 토큰 및 상태 검증
    expect(await erc20ImplV2Instance.totalSupply()).to.equal(1000000);
    expect(await erc20ImplV2Instance.balanceOf(owner.address)).to.equal(500);
    expect(await erc20ImplV2Instance.balanceOf(recipient.address)).to.equal(
      500
    );
  });

  it("New functions should work properly after upgrade", async () => {
    // 1. 업그레이드 수행
    erc20ImplV2Instance = await ERC20ImplV2.deploy();
    await erc20ImplV2Instance.deployed();

    // Upgrading using ERC20Proxy
    const upgradeTx = await erc20ProxyInstance
      .connect(admin)
      .upgradeTo(erc20ImplV2Instance.address);
    await upgradeTx.wait();

    erc20ImplV2Instance = ERC20ImplV2.attach(erc20ProxyInstance.address);

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
