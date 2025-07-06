const hre = require("hardhat");
const { parseUnits, formatUnits } = require("ethers");

// Contract addresses
const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const DEPLOYED_POLL_ADDRESS = "0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc";

// Private keys (DO NOT EXPOSE IN PRODUCTION)
const PRIVATE_KEYS = [
  "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766", // Main deployer
  "8f281b5c8358a53aa016a40eebec7ad62eda86a50a7523f0e1cb21d05ec6d0cc", // Voter 1
  "d186bc8c337f78c3ec9e357e44a05d69851f9490d8460e283695bc6d1651a7c1", // Voter 2
  "3fe69de7f7e48b78a2e8ffe44fce37cfbf90a414f522c0652614816d67d4b42d"  // Voter 3
];

async function main() {
  console.log("=== Comprehensive Testing of Stakedriven Contracts on Base Sepolia ===\n");

  // Setup wallets
  const wallets = PRIVATE_KEYS.map(pk => new hre.ethers.Wallet(pk, hre.ethers.provider));
  const [deployer, voter1, voter2, voter3] = wallets;

  console.log("Wallet addresses:");
  wallets.forEach((wallet, i) => {
    console.log(`Wallet ${i} (${i === 0 ? 'Deployer' : `Voter ${i}`}):`, wallet.address);
  });
  console.log();

  // Get contracts
  const pollFactory = await hre.ethers.getContractAt("PollFactory", POLL_FACTORY_ADDRESS, deployer);
  const usdc = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);

  // Test 1: Comprehensive PollFactory Testing
  console.log("=== Test 1: PollFactory State and Configuration ===");
  const factoryState = {
    admin: await pollFactory.globalAdmin(),
    feePercentage: await pollFactory.feePercentage(),
    feeWallet: await pollFactory.feeWallet(),
    rescueWallet: await pollFactory.rescueWallet()
  };
  
  console.log("Current PollFactory State:");
  console.log("- Admin:", factoryState.admin);
  console.log("- Fee Percentage:", factoryState.feePercentage.toString(), `(${Number(factoryState.feePercentage) / 100}%)`);
  console.log("- Fee Wallet:", factoryState.feeWallet);
  console.log("- Rescue Wallet:", factoryState.rescueWallet);
  console.log();

  // Test 2: Analyze existing deployed poll
  console.log("=== Test 2: Analyzing Deployed Poll ===");
  console.log("Poll Address:", DEPLOYED_POLL_ADDRESS);
  
  const poll = await hre.ethers.getContractAt("Poll", DEPLOYED_POLL_ADDRESS, deployer);
  
  // Get all poll parameters
  const pollData = {
    pollCreator: await poll.pollCreator(),
    factory: await poll.factory(),
    startTime: await poll.startTime(),
    endTime: await poll.endTime(),
    tokensPerVote: await poll.tokensPerVote(),
    winningOptionsCount: await poll.winningOptionsCount(),
    totalOptionsCount: await poll.totalOptionsCount(),
    votingToken: await poll.votingToken()
  };

  console.log("\nPoll Configuration:");
  console.log("- Poll Creator:", pollData.pollCreator);
  console.log("- Factory:", pollData.factory);
  console.log("- Start Time:", new Date(Number(pollData.startTime) * 1000).toLocaleString());
  console.log("- End Time:", new Date(Number(pollData.endTime) * 1000).toLocaleString());
  console.log("- Duration:", (Number(pollData.endTime) - Number(pollData.startTime)) / 60, "minutes");
  console.log("- Tokens per Vote:", formatUnits(pollData.tokensPerVote, 6), "USDC");
  console.log("- Winning Options:", pollData.winningOptionsCount.toString());
  console.log("- Total Options:", pollData.totalOptionsCount.toString());
  console.log("- Token Address:", pollData.votingToken);
  
  // Calculate poll status
  const currentTime = Math.floor(Date.now() / 1000);
  const isActive = currentTime >= Number(pollData.startTime) && currentTime < Number(pollData.endTime);
  const hasEnded = currentTime >= Number(pollData.endTime);
  
  console.log("- Is Active:", isActive);
  console.log("- Has Ended:", hasEnded);

  // Check vote counts
  console.log("\nCurrent Vote Counts:");
  for (let i = 1; i <= pollData.totalOptionsCount; i++) {
    const votes = await poll.optionVotes(i);
    console.log(`- Option ${i}:`, votes.toString(), "votes");
  }

  // Check USDC balances
  console.log("\n=== Test 3: USDC Balance Check ===");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await usdc.balanceOf(wallets[i].address);
    console.log(`Wallet ${i} USDC:`, formatUnits(balance, 6));
  }
  
  const pollBalance = await usdc.balanceOf(DEPLOYED_POLL_ADDRESS);
  console.log("Poll Contract USDC:", formatUnits(pollBalance, 6));
  console.log();

  // Test 4: Deploy a new poll with proper duration
  console.log("=== Test 4: Deploying New Poll with Proper Duration ===");
  const now = Math.floor(Date.now() / 1000);
  const newStartTime = now + 600; // Start in 10 minutes
  const newEndTime = newStartTime + 86400; // 24 hour duration
  const tokensPerVote = parseUnits("10", 6); // 10 USDC per vote
  const winningOptions = 1;
  const totalOptions = 3;

  console.log("New Poll Parameters:");
  console.log("- Start:", new Date(newStartTime * 1000).toLocaleString());
  console.log("- End:", new Date(newEndTime * 1000).toLocaleString());
  console.log("- Duration:", (newEndTime - newStartTime) / 3600, "hours");
  console.log("- USDC per vote:", formatUnits(tokensPerVote, 6));
  console.log("- Options:", totalOptions, "(", winningOptions, "winner)");

  try {
    const tx = await pollFactory.deployPoll(
      newStartTime,
      newEndTime,
      tokensPerVote,
      winningOptions,
      totalOptions,
      USDC_ADDRESS
    );
    
    console.log("\nDeployment TX:", tx.hash);
    const receipt = await tx.wait();
    console.log("Gas Used:", receipt.gasUsed.toString());
    
    // Extract poll address from events
    const deployEvent = receipt.logs.find(log => {
      try {
        return pollFactory.interface.parseLog(log).name === "PollCreated";
      } catch {
        return false;
      }
    });
    
    if (deployEvent) {
      const newPollAddress = pollFactory.interface.parseLog(deployEvent).args.poll;
      console.log("✅ New Poll Deployed:", newPollAddress);
      console.log("View on Basescan:", `https://sepolia.basescan.org/address/${newPollAddress}`);
    }
  } catch (error) {
    console.log("❌ Error deploying poll:", error.message);
  }

  // Test 5: Test voting functionality if poll is active
  console.log("\n=== Test 5: Testing Voting Functionality ===");
  
  if (currentTime >= Number(pollData.startTime) && currentTime < Number(pollData.endTime)) {
    console.log("✅ Poll is currently active! Testing voting...");
    
    // Check if voter1 has USDC
    const voter1Balance = await usdc.balanceOf(voter1.address);
    if (voter1Balance >= pollData.tokensPerVote) {
      console.log("\nVoter 1 has sufficient USDC. Attempting to vote...");
      
      try {
        // First approve USDC spending
        const usdcWithVoter1 = usdc.connect(voter1);
        const pollWithVoter1 = poll.connect(voter1);
        
        console.log("Approving USDC spending...");
        const approveTx = await usdcWithVoter1.approve(DEPLOYED_POLL_ADDRESS, pollData.tokensPerVote);
        await approveTx.wait();
        console.log("✅ USDC approved");
        
        // Vote for option 1
        console.log("Casting vote for option 1...");
        const voteTx = await pollWithVoter1.vote(1);
        await voteTx.wait();
        console.log("✅ Vote cast successfully!");
        
        // Check updated vote count
        const newVoteCount = await poll.optionVotes(1);
        console.log("Updated vote count for option 1:", newVoteCount.toString());
        
      } catch (error) {
        console.log("❌ Voting error:", error.message);
      }
    } else {
      console.log("⚠️  Voter 1 has insufficient USDC for voting");
      console.log("Need:", formatUnits(pollData.tokensPerVote, 6), "USDC");
      console.log("Have:", formatUnits(voter1Balance, 6), "USDC");
    }
  } else if (currentTime < Number(pollData.startTime)) {
    const waitTime = Number(pollData.startTime) - currentTime;
    console.log(`⏳ Poll not started yet. Starts in ${Math.floor(waitTime / 60)} minutes`);
  } else {
    console.log("❌ Poll has already ended");
  }

  // Test 6: Test admin functions
  console.log("\n=== Test 6: Testing Admin Functions ===");
  
  // Test fee percentage change
  try {
    const currentFee = await pollFactory.feePercentage();
    console.log("Current fee:", currentFee.toString(), `(${Number(currentFee) / 100}%)`);
    console.log("Attempting to change fee to 3%...");
    const tx = await pollFactory.setFeePercentage(300);
    await tx.wait();
    const newFee = await pollFactory.feePercentage();
    console.log("✅ Fee changed to:", newFee.toString(), `(${Number(newFee) / 100}%)`);
  } catch (error) {
    console.log("❌ Error changing fee:", error.message);
  }

  // Test 7: Error condition testing
  console.log("\n=== Test 7: Testing Error Conditions ===");
  
  // Try to deploy poll with invalid parameters
  console.log("Testing invalid poll deployment (end time before start time)...");
  try {
    await pollFactory.deployPoll(
      now + 1000,
      now + 500, // End before start
      tokensPerVote,
      1,
      3,
      USDC_ADDRESS
    );
    console.log("❌ Should have failed but didn't!");
  } catch (error) {
    console.log("✅ Correctly rejected:", error.message.substring(0, 50) + "...");
  }

  // Try to vote on inactive poll
  if (currentTime < Number(pollData.startTime)) {
    console.log("\nTesting voting before poll starts...");
    try {
      const pollWithVoter2 = poll.connect(voter2);
      await pollWithVoter2.vote(1);
      console.log("❌ Should have failed but didn't!");
    } catch (error) {
      console.log("✅ Correctly rejected:", error.message.substring(0, 50) + "...");
    }
  }

  console.log("\n=== Testing Complete ===");
  console.log("\nSummary:");
  console.log("- PollFactory verified at:", POLL_FACTORY_ADDRESS);
  console.log("- Existing poll analyzed at:", DEPLOYED_POLL_ADDRESS);
  console.log("- Contract functionality tested");
  console.log("\nNext steps:");
  console.log("1. Get USDC from faucet for testing voting");
  console.log("2. Deploy polls with proper duration");
  console.log("3. Begin web app integration");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });