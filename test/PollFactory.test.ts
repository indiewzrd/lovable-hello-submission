import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { PollFactory, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PollFactory", function () {
  let pollFactory: PollFactory;
  let mockUSDC: MockUSDC;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let feeWallet: SignerWithAddress;
  let rescueWallet: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, feeWallet, rescueWallet] = await hre.ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await hre.ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy PollFactory
    const PollFactoryContract = await hre.ethers.getContractFactory("PollFactory");
    pollFactory = await PollFactoryContract.deploy();
    await pollFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set correct initial values", async function () {
      expect(await pollFactory.globalAdmin()).to.equal(owner.address);
      expect(await pollFactory.rescueWallet()).to.equal(owner.address);
      expect(await pollFactory.feeWallet()).to.equal(owner.address);
      expect(await pollFactory.feePercentage()).to.equal(500); // 5%
    });
  });

  describe("Admin Functions", function () {
    it("Should allow global admin to update global admin", async function () {
      await expect(pollFactory.setGlobalAdmin(user1.address))
        .to.emit(pollFactory, "GlobalAdminUpdated")
        .withArgs(owner.address, user1.address);
      
      expect(await pollFactory.globalAdmin()).to.equal(user1.address);
    });

    it("Should allow global admin to update rescue wallet", async function () {
      await expect(pollFactory.setRescueWallet(rescueWallet.address))
        .to.emit(pollFactory, "RescueWalletUpdated")
        .withArgs(owner.address, rescueWallet.address);
      
      expect(await pollFactory.rescueWallet()).to.equal(rescueWallet.address);
    });

    it("Should allow global admin to update fee wallet", async function () {
      await expect(pollFactory.setFeeWallet(feeWallet.address))
        .to.emit(pollFactory, "FeeWalletUpdated")
        .withArgs(owner.address, feeWallet.address);
      
      expect(await pollFactory.feeWallet()).to.equal(feeWallet.address);
    });

    it("Should allow global admin to update fee percentage", async function () {
      await expect(pollFactory.setFeePercentage(1000)) // 10%
        .to.emit(pollFactory, "FeePercentageUpdated")
        .withArgs(500, 1000);
      
      expect(await pollFactory.feePercentage()).to.equal(1000);
    });

    it("Should reject non-admin calls", async function () {
      await expect(
        pollFactory.connect(user1).setGlobalAdmin(user2.address)
      ).to.be.revertedWith("Only global admin");
    });

    it("Should reject fee percentage over 100%", async function () {
      await expect(
        pollFactory.setFeePercentage(10001)
      ).to.be.revertedWith("Fee cannot exceed 100%");
    });
  });

  describe("Poll Deployment", function () {
    let startTime: number;
    let endTime: number;

    beforeEach(async function () {
      const currentTime = await time.latest();
      startTime = currentTime + 3600; // 1 hour from now
      endTime = startTime + 86400; // 24 hours after start
    });

    it("Should deploy a poll with valid parameters", async function () {
      const tokensPerVote = hre.ethers.parseUnits("100", 6); // 100 USDC
      const winningOptions = 2;
      const totalOptions = 5;

      const tx = await pollFactory.connect(user1).deployPoll(
        startTime,
        endTime,
        tokensPerVote,
        winningOptions,
        totalOptions,
        await mockUSDC.getAddress()
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        log => log.topics[0] === pollFactory.interface.getEvent("PollCreated").topicHash
      );

      expect(event).to.not.be.undefined;

      const deployedPolls = await pollFactory.getDeployedPolls();
      expect(deployedPolls.length).to.equal(1);

      const pollsByCreator = await pollFactory.getPollsByCreator(user1.address);
      expect(pollsByCreator.length).to.equal(1);
      expect(pollsByCreator[0]).to.equal(deployedPolls[0]);
    });

    it("Should reject poll with start time in past", async function () {
      const pastTime = await time.latest() - 3600;
      
      await expect(
        pollFactory.deployPoll(
          pastTime,
          endTime,
          100,
          1,
          5,
          await mockUSDC.getAddress()
        )
      ).to.be.revertedWith("Start time must be in future");
    });

    it("Should reject poll with end time before start time", async function () {
      await expect(
        pollFactory.deployPoll(
          endTime,
          startTime,
          100,
          1,
          5,
          await mockUSDC.getAddress()
        )
      ).to.be.revertedWith("End time must be after start time");
    });

    it("Should reject poll with zero tokens per vote", async function () {
      await expect(
        pollFactory.deployPoll(
          startTime,
          endTime,
          0,
          1,
          5,
          await mockUSDC.getAddress()
        )
      ).to.be.revertedWith("Tokens per vote must be greater than 0");
    });

    it("Should reject poll with invalid winning options count", async function () {
      await expect(
        pollFactory.deployPoll(
          startTime,
          endTime,
          100,
          6,
          5,
          await mockUSDC.getAddress()
        )
      ).to.be.revertedWith("Invalid winning options count");
    });
  });

  describe("View Functions", function () {
    it("Should track multiple polls correctly", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 86400;

      // Deploy 3 polls
      for (let i = 0; i < 3; i++) {
        await pollFactory.connect(user1).deployPoll(
          startTime,
          endTime,
          100,
          1,
          3,
          await mockUSDC.getAddress()
        );
      }

      // Deploy 2 polls from another user
      for (let i = 0; i < 2; i++) {
        await pollFactory.connect(user2).deployPoll(
          startTime,
          endTime,
          100,
          1,
          3,
          await mockUSDC.getAddress()
        );
      }

      expect(await pollFactory.getTotalPolls()).to.equal(5);
      
      const user1Polls = await pollFactory.getPollsByCreator(user1.address);
      expect(user1Polls.length).to.equal(3);
      
      const user2Polls = await pollFactory.getPollsByCreator(user2.address);
      expect(user2Polls.length).to.equal(2);
    });
  });
});