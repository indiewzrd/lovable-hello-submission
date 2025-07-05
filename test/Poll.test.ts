import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { PollFactory, Poll, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Poll", function () {
  let pollFactory: PollFactory;
  let poll: Poll;
  let mockUSDC: MockUSDC;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let voter3: SignerWithAddress;
  let feeWallet: SignerWithAddress;
  let rescueWallet: SignerWithAddress;

  let startTime: number;
  let endTime: number;
  const tokensPerVote = hre.ethers.parseUnits("100", 6); // 100 USDC
  const winningOptions = 2;
  const totalOptions = 4;

  beforeEach(async function () {
    [owner, creator, voter1, voter2, voter3, feeWallet, rescueWallet] = await hre.ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await hre.ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy PollFactory
    const PollFactoryContract = await hre.ethers.getContractFactory("PollFactory");
    pollFactory = await PollFactoryContract.deploy();
    await pollFactory.waitForDeployment();

    // Set fee wallet and rescue wallet
    await pollFactory.setFeeWallet(feeWallet.address);
    await pollFactory.setRescueWallet(rescueWallet.address);

    // Deploy a poll
    const currentTime = await time.latest();
    startTime = currentTime + 3600; // 1 hour from now
    endTime = startTime + 86400; // 24 hours after start

    const tx = await pollFactory.connect(creator).deployPoll(
      startTime,
      endTime,
      tokensPerVote,
      winningOptions,
      totalOptions,
      await mockUSDC.getAddress()
    );

    const receipt = await tx.wait();
    const deployedPolls = await pollFactory.getDeployedPolls();
    const pollAddress = deployedPolls[0];
    
    poll = await hre.ethers.getContractAt("Poll", pollAddress);

    // Distribute USDC to voters
    await mockUSDC.mint(voter1.address, tokensPerVote * 10n);
    await mockUSDC.mint(voter2.address, tokensPerVote * 10n);
    await mockUSDC.mint(voter3.address, tokensPerVote * 10n);

    // Approve poll contract
    await mockUSDC.connect(voter1).approve(pollAddress, tokensPerVote * 10n);
    await mockUSDC.connect(voter2).approve(pollAddress, tokensPerVote * 10n);
    await mockUSDC.connect(voter3).approve(pollAddress, tokensPerVote * 10n);
  });

  describe("Poll Properties", function () {
    it("Should have correct initial values", async function () {
      expect(await poll.pollCreator()).to.equal(creator.address);
      expect(await poll.startTime()).to.equal(startTime);
      expect(await poll.endTime()).to.equal(endTime);
      expect(await poll.tokensPerVote()).to.equal(tokensPerVote);
      expect(await poll.winningOptionsCount()).to.equal(winningOptions);
      expect(await poll.totalOptionsCount()).to.equal(totalOptions);
      expect(await poll.votingToken()).to.equal(await mockUSDC.getAddress());
      expect(await poll.factory()).to.equal(await pollFactory.getAddress());
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Move to voting period
      await time.increaseTo(startTime);
    });

    it("Should allow voting for valid option", async function () {
      await expect(poll.connect(voter1).vote(1))
        .to.emit(poll, "Voted")
        .withArgs(voter1.address, 1, tokensPerVote);

      expect(await poll.hasVoted(voter1.address)).to.be.true;
      expect(await poll.voterChoice(voter1.address)).to.equal(1);
      expect(await poll.optionVotes(1)).to.equal(tokensPerVote);
      expect(await poll.totalVotes()).to.equal(tokensPerVote);
    });

    it("Should reject voting before start time", async function () {
      // Create a new poll with future start time
      const futureStart = (await time.latest()) + 7200; // 2 hours from now
      const futureEnd = futureStart + 86400;
      
      const tx = await pollFactory.connect(creator).deployPoll(
        futureStart,
        futureEnd,
        tokensPerVote,
        winningOptions,
        totalOptions,
        await mockUSDC.getAddress()
      );
      
      const receipt = await tx.wait();
      const deployedPolls = await pollFactory.getDeployedPolls();
      const newPollAddress = deployedPolls[deployedPolls.length - 1];
      const newPoll = await hre.ethers.getContractAt("Poll", newPollAddress);
      
      // Try to vote before start time
      await expect(
        newPoll.connect(voter1).vote(1)
      ).to.be.revertedWith("Voting not started");
    });

    it("Should reject voting after end time", async function () {
      await time.increaseTo(endTime);
      
      await expect(
        poll.connect(voter1).vote(1)
      ).to.be.revertedWith("Voting ended");
    });

    it("Should reject voting for invalid option", async function () {
      await expect(
        poll.connect(voter1).vote(0)
      ).to.be.revertedWith("Invalid option");

      await expect(
        poll.connect(voter1).vote(5)
      ).to.be.revertedWith("Invalid option");
    });

    it("Should reject double voting", async function () {
      await poll.connect(voter1).vote(1);
      
      await expect(
        poll.connect(voter1).vote(2)
      ).to.be.revertedWith("Already voted");
    });

    it("Should allow vote cancellation", async function () {
      await poll.connect(voter1).vote(1);
      
      await expect(poll.connect(voter1).cancelVote())
        .to.emit(poll, "VoteCancelled")
        .withArgs(voter1.address, 1, tokensPerVote);

      expect(await poll.hasVoted(voter1.address)).to.be.false;
      expect(await poll.voterChoice(voter1.address)).to.equal(0);
      expect(await poll.optionVotes(1)).to.equal(0);
      expect(await poll.totalVotes()).to.equal(0);
    });

    it("Should allow re-voting after cancellation", async function () {
      await poll.connect(voter1).vote(1);
      await poll.connect(voter1).cancelVote();
      
      await expect(poll.connect(voter1).vote(2))
        .to.emit(poll, "Voted")
        .withArgs(voter1.address, 2, tokensPerVote);

      expect(await poll.voterChoice(voter1.address)).to.equal(2);
    });
  });

  describe("Winner Calculation", function () {
    it("Should calculate winners correctly", async function () {
      await time.increaseTo(startTime);
      
      // Create voting scenario:
      // Option 1: 2 votes (voter1, voter2)
      // Option 2: 1 vote (voter3)
      // Option 3: 0 votes
      // Option 4: 0 votes
      await poll.connect(voter1).vote(1);
      await poll.connect(voter2).vote(1);
      await poll.connect(voter3).vote(2);
      
      await time.increaseTo(endTime);
      
      await expect(poll.calculateWinners())
        .to.emit(poll, "WinnersCalculated");

      const winners = await poll.getWinningOptions();
      expect(winners.length).to.equal(2);
      expect(winners[0]).to.equal(1); // Option 1 with most votes
      expect(winners[1]).to.equal(2); // Option 2 with second most votes

      expect(await poll.winnersCalculated()).to.be.true;
      expect(await poll.winningAmount()).to.equal(tokensPerVote * 3n);
      
      // With 5% fee
      const expectedFee = (tokensPerVote * 3n * 500n) / 10000n;
      expect(await poll.feeAmount()).to.equal(expectedFee);
    });

    it("Should reject calculating winners twice", async function () {
      await time.increaseTo(startTime);
      await poll.connect(voter1).vote(1);
      await time.increaseTo(endTime);
      
      await poll.calculateWinners();
      
      await expect(
        poll.calculateWinners()
      ).to.be.revertedWith("Winners already calculated");
    });

    it("Should reject calculating winners before end", async function () {
      await time.increaseTo(startTime);
      await poll.connect(voter1).vote(1);
      
      // Still in voting period
      await expect(
        poll.calculateWinners()
      ).to.be.revertedWith("Voting not ended");
    });
  });

  describe("Claiming", function () {
    beforeEach(async function () {
      await time.increaseTo(startTime);
      
      // Voting scenario:
      // Option 1: 2 votes (winner)
      // Option 2: 1 vote (winner)
      // Option 3: 0 votes
      // Option 4: 0 votes
      await poll.connect(voter1).vote(1);
      await poll.connect(voter2).vote(1);
      await poll.connect(voter3).vote(2);
      
      await time.increaseTo(endTime);
      await poll.calculateWinners();
    });

    it("Should allow creator to claim winning funds", async function () {
      const winningAmount = tokensPerVote * 3n;
      const feeAmount = await poll.feeAmount();
      const creatorAmount = winningAmount - feeAmount;

      const creatorBalanceBefore = await mockUSDC.balanceOf(creator.address);
      
      await expect(poll.connect(creator).claimWinningFunds())
        .to.emit(poll, "CreatorClaimed")
        .withArgs(creator.address, creatorAmount);

      const creatorBalanceAfter = await mockUSDC.balanceOf(creator.address);
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(creatorAmount);
      expect(await poll.creatorClaimed()).to.be.true;
    });

    it("Should allow fee wallet to claim fee", async function () {
      const feeAmount = await poll.feeAmount();
      const feeWalletBalanceBefore = await mockUSDC.balanceOf(feeWallet.address);
      
      await expect(poll.connect(feeWallet).claimFee())
        .to.emit(poll, "FeeClaimed")
        .withArgs(feeWallet.address, feeAmount);

      const feeWalletBalanceAfter = await mockUSDC.balanceOf(feeWallet.address);
      expect(feeWalletBalanceAfter - feeWalletBalanceBefore).to.equal(feeAmount);
      expect(await poll.feeClaimed()).to.be.true;
    });

    it("Should reject non-winning voter refund claims", async function () {
      // voter1 and voter2 voted for winning option 1
      await expect(
        poll.connect(voter1).claimNonWinningRefund()
      ).to.be.revertedWith("Cannot refund winning vote");
    });

    it("Should reject claims before winners calculated", async function () {
      // Deploy new poll for this test
      const currentTime = await time.latest();
      const newStartTime = currentTime + 7200;
      const newEndTime = newStartTime + 86400;
      
      const newPollTx = await pollFactory.connect(creator).deployPoll(
        newStartTime,
        newEndTime,
        tokensPerVote,
        winningOptions,
        totalOptions,
        await mockUSDC.getAddress()
      );
      
      const receipt = await newPollTx.wait();
      const deployedPolls = await pollFactory.getDeployedPolls();
      const newPollAddress = deployedPolls[deployedPolls.length - 1];
      const newPoll = await hre.ethers.getContractAt("Poll", newPollAddress);
      
      await time.increaseTo(newEndTime);
      
      await expect(
        newPoll.connect(creator).claimWinningFunds()
      ).to.be.revertedWith("Winners not calculated");
    });
  });

  describe("Rescue Funds", function () {
    it("Should allow global admin to rescue funds", async function () {
      await time.increaseTo(startTime);
      await poll.connect(voter1).vote(1);
      
      const pollBalance = await mockUSDC.balanceOf(await poll.getAddress());
      expect(pollBalance).to.equal(tokensPerVote);
      
      await expect(poll.connect(owner).rescueFunds())
        .to.emit(poll, "FundsRescued")
        .withArgs(rescueWallet.address, tokensPerVote);
      
      const rescueWalletBalance = await mockUSDC.balanceOf(rescueWallet.address);
      expect(rescueWalletBalance).to.equal(tokensPerVote);
    });

    it("Should reject rescue from non-admin", async function () {
      await time.increaseTo(startTime);
      
      await expect(
        poll.connect(voter1).rescueFunds()
      ).to.be.revertedWith("Only global admin");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await time.increaseTo(startTime);
      await poll.connect(voter1).vote(1);
      await poll.connect(voter2).vote(1);
      await poll.connect(voter3).vote(2);
    });

    it("Should return correct voting results", async function () {
      const [options, votes] = await poll.getVotingResults();
      
      expect(options.length).to.equal(totalOptions);
      expect(votes.length).to.equal(totalOptions);
      
      expect(options[0]).to.equal(1);
      expect(options[1]).to.equal(2);
      expect(options[2]).to.equal(3);
      expect(options[3]).to.equal(4);
      
      expect(votes[0]).to.equal(tokensPerVote * 2n); // Option 1
      expect(votes[1]).to.equal(tokensPerVote); // Option 2
      expect(votes[2]).to.equal(0); // Option 3
      expect(votes[3]).to.equal(0); // Option 4
    });

    it("Should correctly identify winning options", async function () {
      await time.increaseTo(endTime);
      await poll.calculateWinners();
      
      expect(await poll.isWinningOption(1)).to.be.true;
      expect(await poll.isWinningOption(2)).to.be.true;
      expect(await poll.isWinningOption(3)).to.be.false;
      expect(await poll.isWinningOption(4)).to.be.false;
    });
  });
});