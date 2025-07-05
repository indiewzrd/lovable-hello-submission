const hre = require("hardhat");
const { parseUnits, formatUnits } = require("ethers");

async function main() {
  console.log("=== Local Testing with Mock USDC ===\n");

  // Get signers
  const [deployer, voter1, voter2, voter3] = await hre.ethers.getSigners();
  
  console.log("Accounts:");
  console.log("Deployer:", deployer.address);
  console.log("Voter 1:", voter1.address);
  console.log("Voter 2:", voter2.address);
  console.log("Voter 3:", voter3.address);
  console.log();

  // Deploy Mock USDC
  console.log("Deploying Mock USDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("Mock USDC deployed to:", await usdc.getAddress());

  // Mint USDC to all accounts
  console.log("\nMinting USDC to accounts...");
  const mintAmount = parseUnits("1000", 6); // 1000 USDC each
  
  for (const account of [deployer, voter1, voter2, voter3]) {
    await usdc.mint(account.address, mintAmount);
    const balance = await usdc.balanceOf(account.address);
    console.log(`${account.address}: ${formatUnits(balance, 6)} USDC`);
  }

  // Deploy PollFactory
  console.log("\nDeploying PollFactory...");
  const PollFactory = await hre.ethers.getContractFactory("PollFactory");
  const pollFactory = await PollFactory.deploy();
  await pollFactory.waitForDeployment();
  console.log("PollFactory deployed to:", await pollFactory.getAddress());

  // Check factory configuration
  console.log("\nPollFactory Configuration:");
  console.log("- Admin:", await pollFactory.globalAdmin());
  console.log("- Fee Percentage:", (await pollFactory.feePercentage()).toString(), "(5%)");
  console.log("- Fee Wallet:", await pollFactory.feeWallet());
  console.log("- Rescue Wallet:", await pollFactory.rescueWallet());

  // Deploy a test poll
  console.log("\n=== Deploying Test Poll ===");
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - 10; // Start immediately (in the past)
  const endTime = now + 300; // End in 5 minutes
  const tokensPerVote = parseUnits("10", 6); // 10 USDC per vote
  const winningOptionsCount = 2;
  const totalOptionsCount = 4;

  const tx = await pollFactory.deployPoll(
    startTime,
    endTime,
    tokensPerVote,
    winningOptionsCount,
    totalOptionsCount,
    await usdc.getAddress()
  );

  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      return pollFactory.interface.parseLog(log).name === "PollCreated";
    } catch {
      return false;
    }
  });

  const pollAddress = event ? pollFactory.interface.parseLog(event).args[0] : null;
  console.log("Poll deployed at:", pollAddress);

  // Get poll contract
  const Poll = await hre.ethers.getContractFactory("Poll");
  const poll = Poll.attach(pollAddress);

  // Test voting
  console.log("\n=== Testing Voting ===");
  
  // Voter 1 votes for option 1
  console.log("\nVoter 1 voting for option 1...");
  await usdc.connect(voter1).approve(pollAddress, tokensPerVote);
  await poll.connect(voter1).vote(1);
  console.log("✅ Vote successful");

  // Voter 2 votes for option 1
  console.log("\nVoter 2 voting for option 1...");
  await usdc.connect(voter2).approve(pollAddress, tokensPerVote);
  await poll.connect(voter2).vote(1);
  console.log("✅ Vote successful");

  // Voter 3 votes for option 2
  console.log("\nVoter 3 voting for option 2...");
  await usdc.connect(voter3).approve(pollAddress, tokensPerVote);
  await poll.connect(voter3).vote(2);
  console.log("✅ Vote successful");

  // Check voting results
  console.log("\n=== Voting Results ===");
  const results = await poll.getVotingResults();
  for (let i = 0; i < results[0].length; i++) {
    const votes = Number(results[1][i]) / Number(tokensPerVote);
    console.log(`Option ${results[0][i]}: ${formatUnits(results[1][i], 6)} USDC (${votes} votes)`);
  }

  // Test vote cancellation
  console.log("\n=== Testing Vote Cancellation ===");
  console.log("Voter 1 cancelling vote...");
  await poll.connect(voter1).cancelVote();
  console.log("✅ Vote cancelled");

  const balanceAfterCancel = await usdc.balanceOf(voter1.address);
  console.log("Voter 1 balance after cancel:", formatUnits(balanceAfterCancel, 6), "USDC");

  // Vote again
  console.log("\nVoter 1 voting for option 3...");
  await usdc.connect(voter1).approve(pollAddress, tokensPerVote);
  await poll.connect(voter1).vote(3);
  console.log("✅ Vote successful");

  // Final results
  console.log("\n=== Final Voting Results ===");
  const finalResults = await poll.getVotingResults();
  for (let i = 0; i < finalResults[0].length; i++) {
    const votes = Number(finalResults[1][i]) / Number(tokensPerVote);
    console.log(`Option ${finalResults[0][i]}: ${formatUnits(finalResults[1][i], 6)} USDC (${votes} votes)`);
  }

  // Fast forward to end the poll
  console.log("\n=== Ending Poll ===");
  await hre.network.provider.send("evm_increaseTime", [300]);
  await hre.network.provider.send("evm_mine");

  // Calculate winners
  console.log("\nCalculating winners...");
  await poll.calculateWinners();
  console.log("✅ Winners calculated");

  const winners = await poll.getWinningOptions();
  console.log("Winning options:", winners.map(w => w.toString()).join(", "));

  // Test claiming
  console.log("\n=== Testing Claims ===");

  // Creator claims
  console.log("\nCreator claiming winning funds...");
  const creatorBalanceBefore = await usdc.balanceOf(deployer.address);
  await poll.claimWinningFunds();
  const creatorBalanceAfter = await usdc.balanceOf(deployer.address);
  const creatorClaimed = Number(creatorBalanceAfter - creatorBalanceBefore) / 1e6;
  console.log(`✅ Creator claimed ${creatorClaimed} USDC`);

  // Non-winner claims refund
  console.log("\nNon-winning voter claiming refund...");
  // Determine who should claim refund based on winners
  const voter3Choice = await poll.voterChoice(voter3.address);
  const isVoter3Winner = winners.some(w => Number(w) === Number(voter3Choice));
  
  if (!isVoter3Winner) {
    const refundBalanceBefore = await usdc.balanceOf(voter3.address);
    await poll.connect(voter3).claimNonWinningRefund();
    const refundBalanceAfter = await usdc.balanceOf(voter3.address);
    const refundAmount = Number(refundBalanceAfter - refundBalanceBefore) / 1e6;
    console.log(`✅ Voter 3 claimed refund of ${refundAmount} USDC`);
  }

  // Fee claim
  console.log("\nFee wallet claiming fee...");
  const feeBalanceBefore = await usdc.balanceOf(deployer.address); // Fee wallet is deployer
  await poll.claimFee();
  const feeBalanceAfter = await usdc.balanceOf(deployer.address);
  const feeClaimed = Number(feeBalanceAfter - feeBalanceBefore) / 1e6;
  console.log(`✅ Fee wallet claimed ${feeClaimed} USDC`);

  // Final balances
  console.log("\n=== Final USDC Balances ===");
  for (const account of [deployer, voter1, voter2, voter3]) {
    const balance = await usdc.balanceOf(account.address);
    console.log(`${account.address}: ${formatUnits(balance, 6)} USDC`);
  }

  console.log("\n=== All Tests Passed! ===");
  console.log("✅ Mock USDC deployment and minting");
  console.log("✅ PollFactory deployment");
  console.log("✅ Poll deployment");
  console.log("✅ Voting functionality");
  console.log("✅ Vote cancellation");
  console.log("✅ Winner calculation");
  console.log("✅ Claiming mechanisms");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });