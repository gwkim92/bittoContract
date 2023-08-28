const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function getSigners() {
  const [owner, minter, recipient, admin] = await ethers.getSigners();
  return { owner, minter, recipient, admin };
}

async function deployFixture() {
  const { owner, minter, recipient, admin } = await getSigners();
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
  // console.log("Proxy contract : ", await erc20Proxy.getAddress());
  const proxyAddress = await erc20Proxy.getAddress();

  const transparentUpgradeableInstance = await ethers.getContractAt(
    "ITransparentUpgradeableProxy",
    proxyAddress,
    admin
  );
  const erc20ImplInstance = erc20Impl.attach(proxyAddress);

  //mint 권환 학인//
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  let hasAdminRole = await erc20ImplInstance.hasRole(
    MINTER_ROLE,
    minter.address
  );

  // console.log(hasAdminRole); // true or false

  const erc20ImplV2 = await ethers.deployContract("ERC20ImplV2");
  await erc20ImplV2.waitForDeployment();
  const erc20ImplV2Address = await erc20ImplV2.getAddress();
  const erc20ImplV2Instance = erc20ImplV2.attach(proxyAddress);
  return {
    erc20Impl,
    erc20V1Address,
    erc20Proxy,
    erc20ImplInstance,
    proxyAddress,
    erc20ImplV2,
    erc20ImplV2Instance,
    erc20ImplV2Address,
    transparentUpgradeableInstance,
  };
}

describe("Proxy Upgrade Test", function () {
  describe("ERC20Impl Upgrade Test using ERC20Proxy", function () {
    // Initial Deployment Tests
    describe("Initial Deployment", function () {
      it("should set the token details after deployment", async function () {
        const { erc20ImplInstance } = await loadFixture(deployFixture);
        expect(await erc20ImplInstance.name()).to.equal("BittoToken");
        expect(await erc20ImplInstance.symbol()).to.equal("BITTO");
        expect((await erc20ImplInstance.totalSupply()).toString()).to.equal(
          ethers.parseUnits("10000", 18)
        );
      });
    });

    // Role-Based Access Control Tests
    describe("Role-Based Access Control", function () {
      it("should revert minting when sender does not have MINTER_ROLE", async function () {
        const { owner, minter, recipient, admin } = await getSigners();
        const { erc20ImplInstance } = await loadFixture(deployFixture);
        const MINTER_ROLE = await erc20ImplInstance.MINTER_ROLE();
        const mintAmount = ethers.parseEther("1000");

        const expectedErrorMessage =
          `AccessControl: account ${owner.address.toLowerCase()} is missing role ${MINTER_ROLE.toLowerCase()}`.toLowerCase();

        await expect(
          erc20ImplInstance.connect(owner).mint(recipient.address, mintAmount)
        ).to.be.revertedWith(new RegExp(expectedErrorMessage, "i"));
      });

      it("should revert pausing and unpausing when sender is not the owner", async () => {
        const { minter } = await getSigners();
        const { erc20ImplInstance } = await loadFixture(deployFixture);

        // Try to pause the contract by non-owner
        await expect(
          erc20ImplInstance.connect(minter).pause()
        ).to.be.revertedWith("Ownable: caller is not the owner");

        // Try to unpause the contract by non-owner
        await expect(
          erc20ImplInstance.connect(minter).unpause()
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should revert token transfer when paused", async () => {
        const { owner, recipient } = await getSigners();
        const { erc20ImplInstance } = await loadFixture(deployFixture);

        let transferAmount = ethers.parseEther("500");

        // Pause Contract
        await erc20ImplInstance.pause();

        // Attempt Transfer and expect it to be reverted.
        await expect(
          erc20ImplInstance.transfer(recipient.address, transferAmount)
        ).to.be.reverted;
      });

      it("should revert when transfer is called with invalid parameters", async () => {
        const { erc20ImplInstance } = await loadFixture(deployFixture);

        // Try to call a function with invalid parameters
        await expect(
          erc20ImplInstance.transfer(
            "0x0000000000000000000000000000000000000000",
            ethers.parseEther("10")
          )
        ).to.be.reverted;
      });
    });

    // Proxy Upgrade Tests
    describe("Proxy Upgrade Functionality ", function () {
      it("Upgrade should not affect balance and state", async () => {
        const { owner, minter, recipient } = await getSigners();
        const {
          erc20ImplInstance,
          erc20ImplV2Address,
          transparentUpgradeableInstance,
        } = await loadFixture(deployFixture);

        // Mint tokens to minter
        const mintAmount = ethers.parseEther("1000");
        await erc20ImplInstance
          .connect(minter)
          .mint(recipient.address, mintAmount);

        // Check minter balance before upgrade
        const minterBalanceBeforeUpgrade = await erc20ImplInstance.balanceOf(
          recipient.address
        );

        expect(minterBalanceBeforeUpgrade).to.equal(mintAmount);

        // Upgrade the proxy to V2 implementation
        await transparentUpgradeableInstance.upgradeTo(erc20ImplV2Address);
      });

      it("should point to correct implementation after upgrade", async () => {
        const {
          transparentUpgradeableInstance,
          erc20ImplV2Address,
          erc20Proxy,
        } = await loadFixture(deployFixture);

        await transparentUpgradeableInstance.upgradeTo(erc20ImplV2Address);

        // Check the implementation address after upgrade
        const currentImplementation = await erc20Proxy.getImplementation();

        expect(currentImplementation).to.equal(erc20ImplV2Address);
      });
    });

    describe("New Functionality in V2 ", () => {
      it("should burn tokens correctly", async () => {
        const { owner } = await getSigners();
        const {
          transparentUpgradeableInstance,
          erc20ImplV2Instance,
          erc20ImplV2Address,
        } = await loadFixture(deployFixture);

        await transparentUpgradeableInstance.upgradeTo(erc20ImplV2Address);

        let initialBalance = await erc20ImplV2Instance.balanceOf(owner.address);
        let burnAmount = ethers.parseEther("100");

        await erc20ImplV2Instance.burn(burnAmount);
        let finalBalance = await erc20ImplV2Instance.balanceOf(owner.address);
        // BigInt 타입으로 변환해서 계산
        let initialBalanceBigInt = BigInt(initialBalance.toString());
        let burnAmountBigInt = BigInt(burnAmount.toString());
        let finalBalanceBigInt = BigInt(finalBalance.toString());
        let expectedFinalBalanceBigInt =
          initialBalanceBigInt - burnAmountBigInt;

        expect(finalBalanceBigInt).to.equal(expectedFinalBalanceBigInt);
      });
      it("should handle high gas prices", async () => {
        const {
          transparentUpgradeableInstance,
          erc20ImplV2Instance,
          erc20ImplV2Address,
        } = await loadFixture(deployFixture);
        await transparentUpgradeableInstance.upgradeTo(erc20ImplV2Address);
        let burnAmount = ethers.parseEther("100");

        // High gas price simulation
        const overrides = {
          gasPrice: ethers.parseUnits("100", "gwei"),
        };

        // Attempt to burn tokens with high gas price
        await expect(erc20ImplV2Instance.burn(burnAmount, overrides)).to.not.be
          .reverted;
      });

      // Edge Case Testing
      it("should handle small mint amounts", async () => {
        const { minter, recipient } = await getSigners();
        const {
          transparentUpgradeableInstance,
          erc20ImplV2Instance,
          erc20ImplV2Address,
        } = await loadFixture(deployFixture);
        await transparentUpgradeableInstance.upgradeTo(erc20ImplV2Address);

        let mintAmount = ethers.parseUnits("0.0000000001", "ether");

        // Attempt to mint a very small amount of tokens
        await expect(
          erc20ImplV2Instance
            .connect(minter)
            .mint(recipient.address, mintAmount)
        ).to.not.be.reverted;
      });

      // Stress Testing
      it("should handle many mint operations", async () => {
        const { minter, recipient } = await getSigners();
        const {
          transparentUpgradeableInstance,
          erc20ImplV2Instance,
          erc20ImplV2Address,
        } = await loadFixture(deployFixture);
        await transparentUpgradeableInstance.upgradeTo(erc20ImplV2Address);

        let mintAmount = ethers.parseUnits("1", "ether");

        // Attempt to mint tokens many times in a loop
        for (let i = 0; i < 100; i++) {
          await expect(
            erc20ImplV2Instance
              .connect(minter)
              .mint(recipient.address, mintAmount)
          ).to.not.be.reverted;
        }
      });

      it("should handle maximum token supply", async () => {
        const { minter, recipient } = await getSigners();
        const {
          transparentUpgradeableInstance,
          erc20ImplV2Instance,
          erc20ImplV2Address,
        } = await loadFixture(deployFixture);
        await transparentUpgradeableInstance.upgradeTo(erc20ImplV2Address);

        //2의 256승에서 1을 뺀 결과. 이 값은 uint256에서 가능한 최대값
        let maxSupplyAmount = ethers.parseUnits(
          "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          "wei"
        );

        // Attempt to mint the maximum possible amount of tokens
        await expect(
          erc20ImplV2Instance
            .connect(minter)
            .mint(recipient.address, maxSupplyAmount)
        ).to.be.reverted;
      });
    });
  });
});
