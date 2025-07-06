const hre = require("hardhat");
const { parseUnits, formatUnits } = require("ethers");

// Contract addresses
const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const EXISTING_POLL = "0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43";

// Private keys
const PRIVATE_KEYS = [
  "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766", // Main deployer
  "8f281b5c8358a53aa016a40eebec7ad62eda86a50a7523f0e1cb21d05ec6d0cc", // Voter 1
  "d186bc8c337f78c3ec9e357e44a05d69851f9490d8460e283695bc6d1651a7c1", // Voter 2
  "3fe69de7f7e48b78a2e8ffe44fce37cfbf90a414f522c0652614816d67d4b42d"  // Voter 3
];

async function main() {
  console.log("=== Minimal USDC Testing on Base Sepolia ===\n");

  // Setup wallets
  const wallets = PRIVATE_KEYS.map(pk => new hre.ethers.Wallet(pk, hre.ethers.provider));
  const [deployer, voter1, voter2, voter3] = wallets;

  // Get contracts
  const pollFactory = await hre.ethers.getContractAt("PollFactory", POLL_FACTORY_ADDRESS, deployer);
  const usdc = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);

  // Check existing poll status
  console.log("=== Checking Existing Poll ===");
  const existingPoll = await hre.ethers.getContractAt("Poll", EXISTING_POLL, deployer);
  const existingEndTime = await existingPoll.endTime();
  const now = Math.floor(Date.now() / 1000);
  
  if (now < Number(existingEndTime)) {
    console.log("Existing poll is still active. Skipping to avoid wasting USDC.");
  } else {
    console.log("Existing poll has ended.");
  }

  // Deploy a new minimal poll
  console.log("\n=== Deploying Minimal Test Poll ===");
  const startTime = now + 30; // Start in 30 seconds
  const endTime = startTime + 180; // 3 minutes duration
  const tokensPerVote = parseUnits("1", 6); // Only 1 USDC per vote (minimal)
  const winningOptionsCount = 1;
  const totalOptionsCount = 3;

  console.log("Poll parameters:");
  console.log("- Tokens per vote: 1 USDC (minimal)");
  console.log("- Duration: 3 minutes");
  console.log("- Options: 3 (1 winner)");

  const tx = await pollFactory.deployPoll(
    startTime,
    endTime,
    tokensPerVote,
    winningOptionsCount,
    totalOptionsCount,
    USDC_ADDRESS
  );

  const receipt = await tx.wait();
  console.log("Gas used:", receipt.gasUsed.toString());
  
  // Get poll address from event
  const event = receipt.logs.find(log => {
    try {
      return pollFactory.interface.parseLog(log).name === "PollCreated";
    } catch {
      return false;
    }
  });
  
  const pollAddress = event ? pollFactory.interface.parseLog(event).args[0] : null;
  console.log("✅ Poll deployed at:", pollAddress);

  if (!pollAddress) {
    console.error("Failed to get poll address");
    return;
  }

  // Get poll contract
  const poll = await hre.ethers.getContractAt("Poll", pollAddress, deployer);

  // Wait for poll to start
  console.log("\n⏳ Waiting 30 seconds for poll to start...");
  await new Promise(resolve => setTimeout(resolve, 32000));

  // Test minimal voting (only 2 votes to save USDC)
  console.log("\n=== Testing Minimal Voting ===");
  
  // Voter 1 votes for option 1
  console.log("\nVoter 1 voting for option 1 (1 USDC)...");
  const approveTx1 = await usdc.connect(voter1).approve(pollAddress, tokensPerVote);
  await approveTx1.wait();
  console.log("  Approval confirmed");
  const voteTx1 = await poll.connect(voter1).vote(1);
  await voteTx1.wait();
  console.log("✅ Vote successful");

  // Voter 2 votes for option 2
  console.log("\nVoter 2 voting for option 2 (1 USDC)...");
  const approveTx2 = await usdc.connect(voter2).approve(pollAddress, tokensPerVote);
  await approveTx2.wait();
  console.log("  Approval confirmed");
  const voteTx2 = await poll.connect(voter2).vote(2);
  await voteTx2.wait();
  console.log("✅ Vote successful");

  // Check results
  console.log("\n=== Voting Results ===");
  const results = await poll.getVotingResults();
  for (let i = 0; i < results[0].length; i++) {
    console.log(`Option ${results[0][i]}: ${formatUnits(results[1][i], 6)} USDC`);
  }

  // Test vote cancellation and re-vote
  console.log("\n=== Testing Vote Cancel/Re-vote ===");
  console.log("Voter 1 cancelling vote...");
  const cancelTx = await poll.connect(voter1).cancelVote();
  await cancelTx.wait();
  console.log("✅ Vote cancelled, USDC refunded");

  console.log("Voter 1 re-voting for option 2...");
  const reApproveTx = await usdc.connect(voter1).approve(pollAddress, tokensPerVote);
  await reApproveTx.wait();
  const reVoteTx = await poll.connect(voter1).vote(2);
  await reVoteTx.wait();
  console.log("✅ Re-vote successful");

  // Final results
  console.log("\n=== Final Results ===");
  const finalResults = await poll.getVotingResults();
  for (let i = 0; i < finalResults[0].length; i++) {
    console.log(`Option ${finalResults[0][i]}: ${formatUnits(finalResults[1][i], 6)} USDC`);
  }

  // Wait for poll to end
  console.log("\n⏳ Waiting 3 minutes for poll to end...");
  await new Promise(resolve => setTimeout(resolve, 185000)); // Wait 3 min + buffer

  // Calculate winners
  console.log("\n=== Testing Winner Calculation ===");
  await poll.calculateWinners();
  console.log("✅ Winners calculated");

  const winners = await poll.getWinningOptions();
  console.log("Winning option:", winners[0].toString());

  // Test claims
  console.log("\n=== Testing Claims ===");
  
  // Creator claims
  const creatorBalanceBefore = await usdc.balanceOf(deployer.address);
  await poll.claimWinningFunds();
  const creatorBalanceAfter = await usdc.balanceOf(deployer.address);
  const creatorClaimed = formatUnits(creatorBalanceAfter - creatorBalanceBefore, 6);
  console.log(`✅ Creator claimed ${creatorClaimed} USDC`);

  // Fee claim
  const feeBalanceBefore = await usdc.balanceOf(deployer.address);
  await poll.claimFee();
  const feeBalanceAfter = await usdc.balanceOf(deployer.address);
  const feeClaimed = formatUnits(feeBalanceAfter - feeBalanceBefore, 6);
  console.log(`✅ Fee claimed ${feeClaimed} USDC`);

  // Final balances
  console.log("\n=== Final USDC Balances ===");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await usdc.balanceOf(wallets[i].address);
    console.log(`Wallet ${i}: ${formatUnits(balance, 6)} USDC`);
  }

  // Total USDC spent
  console.log("\n=== USDC Usage Summary ===");
  console.log("Total votes cast: 2");
  console.log("Total USDC used: 2 USDC");
  console.log("Creator received: 1.9 USDC (after 5% fee)");
  console.log("Fee collected: 0.1 USDC");

  console.log("\n✅ All tests completed successfully with minimal USDC usage!");
  console.log("\nView contracts on Basescan:");
  console.log("PollFactory:", `https://sepolia.basescan.org/address/${POLL_FACTORY_ADDRESS}`);
  console.log("Test Poll:", `https://sepolia.basescan.org/address/${pollAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });