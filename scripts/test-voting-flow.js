const hre = require("hardhat");
const { parseUnits, formatUnits } = require("ethers");

// Contract addresses
const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Private keys
const PRIVATE_KEYS = [
  "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766", // Main deployer
  "8f281b5c8358a53aa016a40eebec7ad62eda86a50a7523f0e1cb21d05ec6d0cc", // Voter 1
  "d186bc8c337f78c3ec9e357e44a05d69851f9490d8460e283695bc6d1651a7c1", // Voter 2
  "3fe69de7f7e48b78a2e8ffe44fce37cfbf90a414f522c0652614816d67d4b42d"  // Voter 3
];

async function main() {
  console.log("=== Testing Complete Voting Flow with USDC ===\n");

  // Setup wallets
  const wallets = PRIVATE_KEYS.map(pk => new hre.ethers.Wallet(pk, hre.ethers.provider));
  const [deployer, voter1, voter2, voter3] = wallets;

  // Get contracts
  const pollFactory = await hre.ethers.getContractAt("PollFactory", POLL_FACTORY_ADDRESS, deployer);
  const usdc = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);

  // Check USDC balances
  console.log("=== USDC Balances ===");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await usdc.balanceOf(wallets[i].address);
    console.log(`Wallet ${i}: ${formatUnits(balance, 6)} USDC`);
  }
  console.log();

  // Deploy a new poll for testing
  console.log("=== Deploying Test Poll ===");
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 60; // Start in 1 minute
  const endTime = startTime + 3600; // 1 hour duration
  const tokensPerVote = parseUnits("5", 6); // 5 USDC per vote
  const winningOptionsCount = 2;
  const totalOptionsCount = 4;

  console.log("Poll parameters:");
  console.log("- Start:", new Date(startTime * 1000).toLocaleString());
  console.log("- End:", new Date(endTime * 1000).toLocaleString());
  console.log("- USDC per vote:", formatUnits(tokensPerVote, 6));
  console.log("- Winners:", winningOptionsCount, "out of", totalOptionsCount);

  const tx = await pollFactory.deployPoll(
    startTime,
    endTime,
    tokensPerVote,
    winningOptionsCount,
    totalOptionsCount,
    USDC_ADDRESS
  );

  console.log("\nDeployment TX:", tx.hash);
  const receipt = await tx.wait();
  
  // Extract poll address from event
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
  console.log("\nWaiting for poll to start...");
  const waitTime = startTime - Math.floor(Date.now() / 1000);
  if (waitTime > 0) {
    console.log(`Waiting ${waitTime} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000 + 2000)); // Add 2s buffer
  }

  // Test voting with each voter
  console.log("\n=== Testing Voting ===");
  const voters = [voter1, voter2, voter3];
  const voteOptions = [1, 1, 2]; // Two votes for option 1, one for option 2

  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i];
    const option = voteOptions[i];
    
    console.log(`\nVoter ${i + 1} voting for option ${option}:`);
    
    // Connect contracts with voter wallet
    const usdcWithVoter = usdc.connect(voter);
    const pollWithVoter = poll.connect(voter);
    
    // Check balance
    const balance = await usdc.balanceOf(voter.address);
    console.log("- Balance:", formatUnits(balance, 6), "USDC");
    
    // Approve USDC
    console.log("- Approving USDC...");
    const approveTx = await usdcWithVoter.approve(pollAddress, tokensPerVote);
    await approveTx.wait();
    console.log("  ✅ Approved");
    
    // Vote
    console.log("- Voting...");
    const voteTx = await pollWithVoter.vote(option);
    await voteTx.wait();
    console.log("  ✅ Voted successfully!");
    
    // Check new balance
    const newBalance = await usdc.balanceOf(voter.address);
    console.log("- New balance:", formatUnits(newBalance, 6), "USDC");
  }

  // Check voting results
  console.log("\n=== Current Voting Results ===");
  const results = await poll.getVotingResults();
  for (let i = 0; i < results[0].length; i++) {
    console.log(`Option ${results[0][i]}: ${formatUnits(results[1][i], 6)} USDC (${Number(results[1][i]) / Number(tokensPerVote)} votes)`);
  }

  // Test vote cancellation
  console.log("\n=== Testing Vote Cancellation ===");
  const pollWithVoter1 = poll.connect(voter1);
  console.log("Voter 1 cancelling vote...");
  const cancelTx = await pollWithVoter1.cancelVote();
  await cancelTx.wait();
  console.log("✅ Vote cancelled");
  
  // Check balance after cancellation
  const balanceAfterCancel = await usdc.balanceOf(voter1.address);
  console.log("Balance after cancel:", formatUnits(balanceAfterCancel, 6), "USDC");

  // Vote again with different option
  console.log("\nVoter 1 voting again for option 3...");
  const approveAgainTx = await usdc.connect(voter1).approve(pollAddress, tokensPerVote);
  await approveAgainTx.wait();
  const voteAgainTx = await pollWithVoter1.vote(3);
  await voteAgainTx.wait();
  console.log("✅ Voted for option 3");

  // Final results
  console.log("\n=== Final Voting Results ===");
  const finalResults = await poll.getVotingResults();
  for (let i = 0; i < finalResults[0].length; i++) {
    console.log(`Option ${finalResults[0][i]}: ${formatUnits(finalResults[1][i], 6)} USDC (${Number(finalResults[1][i]) / Number(tokensPerVote)} votes)`);
  }

  // Check poll contract balance
  const pollBalance = await usdc.balanceOf(pollAddress);
  console.log("\nPoll contract USDC balance:", formatUnits(pollBalance, 6));

  // Test ending the poll early for demonstration
  console.log("\n=== Fast-forward to Poll End ===");
  console.log("Note: In production, we would wait for the poll to end naturally");
  console.log("For testing, we'll deploy another poll that ends immediately");

  // Deploy a poll that ends soon for testing claims
  const quickPollTx = await pollFactory.deployPoll(
    now - 10, // Started 10 seconds ago
    now + 10, // Ends in 10 seconds
    tokensPerVote,
    1, // Only 1 winner
    3,
    USDC_ADDRESS
  );
  
  const quickReceipt = await quickPollTx.wait();
  const quickEvent = quickReceipt.logs.find(log => {
    try {
      return pollFactory.interface.parseLog(log).name === "PollCreated";
    } catch {
      return false;
    }
  });
  
  const quickPollAddress = quickEvent ? pollFactory.interface.parseLog(quickEvent).args[0] : null;
  console.log("Quick test poll deployed at:", quickPollAddress);

  // Vote on quick poll
  const quickPoll = await hre.ethers.getContractAt("Poll", quickPollAddress, deployer);
  
  // Voter 1 votes for option 1
  await usdc.connect(voter1).approve(quickPollAddress, tokensPerVote);
  await quickPoll.connect(voter1).vote(1);
  
  // Voter 2 votes for option 2
  await usdc.connect(voter2).approve(quickPollAddress, tokensPerVote);
  await quickPoll.connect(voter2).vote(2);
  
  console.log("Votes cast on quick poll. Waiting for it to end...");
  await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds

  // Calculate winners
  console.log("\n=== Testing Winner Calculation ===");
  const calculateTx = await quickPoll.calculateWinners();
  await calculateTx.wait();
  console.log("✅ Winners calculated");

  const winners = await quickPoll.getWinningOptions();
  console.log("Winning option(s):", winners.map(w => w.toString()).join(", "));

  // Test claiming
  console.log("\n=== Testing Claims ===");
  
  // Creator claims winning funds
  console.log("Creator claiming winning funds...");
  const claimTx = await quickPoll.claimWinningFunds();
  await claimTx.wait();
  console.log("✅ Creator claimed winning funds");

  // Non-winner claims refund
  console.log("\nNon-winning voter claiming refund...");
  const isOption1Winner = winners.includes(1n);
  const refundVoter = isOption1Winner ? voter2 : voter1;
  const refundTx = await quickPoll.connect(refundVoter).claimNonWinningRefund();
  await refundTx.wait();
  console.log("✅ Non-winning voter claimed refund");

  // Fee wallet claims fee
  console.log("\nFee wallet claiming fee...");
  const feeClaimTx = await quickPoll.claimFee();
  await feeClaimTx.wait();
  console.log("✅ Fee claimed");

  // Final balances
  console.log("\n=== Final USDC Balances ===");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await usdc.balanceOf(wallets[i].address);
    console.log(`Wallet ${i}: ${formatUnits(balance, 6)} USDC`);
  }

  console.log("\n=== Test Summary ===");
  console.log("✅ Poll deployment successful");
  console.log("✅ USDC approvals working");
  console.log("✅ Voting functionality working");
  console.log("✅ Vote cancellation working");
  console.log("✅ Re-voting working");
  console.log("✅ Winner calculation working");
  console.log("✅ Claiming mechanisms working");
  console.log("\nAll smart contract functions tested successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });