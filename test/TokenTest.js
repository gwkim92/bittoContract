const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ERC20 토큰 구현 테스트
describe("ERC20Impl", function () {
  // 픽스처를 설정하여 ERC20Impl 배포
  async function deployERC20ImplFixture() {
    const [owner, minter, otherAccount] = await ethers.getSigners();
    const ERC20Impl = await ethers.getContractFactory("ERC20Impl");
    const erc20Impl = await ERC20Impl.deploy();

    await erc20Impl.initialize("MyToken", "MTK", 1000000, minter.address);

    return { erc20Impl, owner, minter, otherAccount };
  }

  // minter 롤 얻기 (토큰 발행)
  async function getMinterRole(erc20) {
    990;
    const MINTER_ROLE = await erc20.MINTER_ROLE();
    return MINTER_ROLE;
  }

  // 배포 테스트
  describe("Deployment", function () {
    // 주인을 사용하여 ERC20Impl 초기화
    it("Should initialize the ERC20Impl using the Owner", async function () {
      const { erc20Impl, owner } = await loadFixture(deployERC20ImplFixture);

      expect(await erc20Impl.owner()).to.equal(owner.address);
    });

    // 초기 공급 토큰 발행
    it("Should mint the initial token supply to the owner", async function () {
      const { erc20Impl, owner } = await loadFixture(deployERC20ImplFixture);

      expect(await erc20Impl.balanceOf(owner.address)).to.equal(1000000);
    });

    // 발행자 역할 할당 검사
    it("Should correctly assign the minter role", async function () {
      const { erc20Impl, minter } = await loadFixture(deployERC20ImplFixture);

      expect(await erc20Impl.hasRole(erc20Impl.MINTER_ROLE(), minter.address))
        .to.be.true;
    });
  });

  // 발행 테스트
  describe("Minting", function () {
    // 발행자가 새 토큰 발행을 허용하는지 확인
    it("Should allow minter to mint new tokens", async function () {
      const { erc20Impl, minter, otherAccount } = await loadFixture(
        deployERC20ImplFixture
      );

      await erc20Impl.connect(minter).mint(otherAccount.address, 1000);
      expect(await erc20Impl.balanceOf(otherAccount.address)).to.equal(1000);
    });

    // 비 발행자가 새 토큰 발행을 할 수 없게 하기
    it("Shouldn't allow non-minter to mint new tokens", async function () {
      const { erc20Impl, otherAccount } = await loadFixture(
        deployERC20ImplFixture
      );
      const MINTER_ROLE = await getMinterRole(erc20Impl);
      const expectedErrorMessage =
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${MINTER_ROLE}`.toLowerCase();
      await expect(
        erc20Impl.connect(otherAccount).mint(otherAccount.address, 1000)
      ).to.be.revertedWith(new RegExp(expectedErrorMessage, "i"));
    });
  });

  // 일시 중지 테스트
  describe("Pausing", function () {
    // 토큰 전송 일시 중지
    it("Should pause the token transfers", async function () {
      const { erc20Impl, owner, otherAccount } = await loadFixture(
        deployERC20ImplFixture
      );

      await erc20Impl.pause();
      await expect(
        erc20Impl.connect(owner).transfer(otherAccount.address, 100)
      ).to.be.revertedWith("Pausable: paused");
    });

    // 토큰 전송 재개
    it("Should resume the token transfers", async function () {
      const { erc20Impl, owner, otherAccount } = await loadFixture(
        deployERC20ImplFixture
      );

      await erc20Impl.pause();
      await erc20Impl.unpause();
      await expect(erc20Impl.connect(owner).transfer(otherAccount.address, 100))
        .not.to.be.reverted;
    });
  });
});
