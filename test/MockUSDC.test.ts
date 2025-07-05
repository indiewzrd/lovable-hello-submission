import { expect } from "chai";
import hre from "hardhat";
import { MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockUSDC", function () {
  let mockUSDC: MockUSDC;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1] = await hre.ethers.getSigners();

    const MockUSDCFactory = await hre.ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await mockUSDC.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await mockUSDC.name()).to.equal("Mock USDC");
      expect(await mockUSDC.symbol()).to.equal("USDC");
    });

    it("Should have 6 decimals", async function () {
      expect(await mockUSDC.decimals()).to.equal(6);
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await mockUSDC.balanceOf(owner.address);
      expect(ownerBalance).to.equal(1_000_000n * 10n**6n);
    });
  });

  describe("Faucet", function () {
    it("Should allow users to mint tokens via faucet", async function () {
      const amount = 1000n * 10n**6n; // 1000 USDC
      await mockUSDC.connect(user1).faucet(amount);
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should reject faucet requests over limit", async function () {
      const amount = 10_001n * 10n**6n; // 10,001 USDC
      await expect(
        mockUSDC.connect(user1).faucet(amount)
      ).to.be.revertedWith("Amount too large");
    });
  });
});