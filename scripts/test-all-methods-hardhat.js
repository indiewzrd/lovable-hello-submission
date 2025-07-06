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
  console.log("🔧 Starting Comprehensive Contract Method Testing...\n");
  
  // Setup wallets
  const wallets = PRIVATE_KEYS.map(pk => new hre.ethers.Wallet(pk, hre.ethers.provider));
  const [deployer, voter1, voter2, voter3] = wallets;
  
  // Get contracts
  const pollFactory = await hre.ethers.getContractAt("PollFactory", POLL_FACTORY_ADDRESS, deployer);
  const usdc = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);
  
  // Check USDC balances
  console.log("💰 Checking USDC Balances:");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await usdc.balanceOf(wallets[i].address);
    console.log(`Wallet ${i}: ${wallets[i].address} - ${formatUnits(balance, 6)} USDC`);
  }
  
  try {
    // Test 1: Deploy a poll for testing
    console.log("\n📊 Test 1: Deploying Test Poll");
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 60; // Start in 1 minute
    const endTime = now + 300; // End in 5 minutes
    
    const tx = await pollFactory.deployPoll(
      startTime,
      endTime,
      parseUnits("1", 6), // 1 USDC per vote
      2, // 2 winning options
      4,  // 4 total options
      USDC_ADDRESS
    );
    
    console.log("Deploy TX:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Poll deployed successfully");
    
    // Extract poll address from events
    let pollAddress;
    for (const log of receipt.logs) {
      try {
        const parsed = pollFactory.interface.parseLog(log);
        if (parsed && parsed.name === "PollCreated") {
          pollAddress = parsed.args[0]; // First argument is the poll address
          break;
        }
      } catch (e) {
        // Continue to next log
      }
    }
    
    if (!pollAddress) {
      // Try alternative method - get from transaction
      console.log("Event parsing failed, checking transaction...");
      console.log("Transaction receipt logs:", receipt.logs.length);
      
      // Try to get from factory
      const deployedPolls = await pollFactory.getDeployedPolls();
      console.log("Total deployed polls:", deployedPolls.length);
      if (deployedPolls.length > 0) {
        pollAddress = deployedPolls[deployedPolls.length - 1];
      }
    }
    
    if (!pollAddress) {
      throw new Error("Could not determine poll address from transaction");
    }
    
    console.log("Poll Address:", pollAddress);
    console.log("View on Basescan:", `https://sepolia.basescan.org/address/${pollAddress}`);
    
    // Initialize poll contract
    const poll = await hre.ethers.getContractAt("Poll", pollAddress, deployer);
    
    // Test 2: Test all read methods
    console.log("\n📖 Test 2: Testing All Read Methods");
    
    const creator = await poll.pollCreator();
    console.log("✅ pollCreator:", creator);
    
    const pollStartTime = await poll.startTime();
    console.log("✅ startTime:", new Date(Number(pollStartTime) * 1000).toLocaleString());
    
    const pollEndTime = await poll.endTime();
    console.log("✅ endTime:", new Date(Number(pollEndTime) * 1000).toLocaleString());
    
    const votingToken = await poll.votingToken();
    console.log("✅ votingToken:", votingToken);
    
    const tokensPerVote = await poll.tokensPerVote();
    console.log("✅ tokensPerVote:", formatUnits(tokensPerVote, 6), "USDC");
    
    const numWinningOptions = await poll.winningOptionsCount();
    console.log("✅ winningOptionsCount:", numWinningOptions.toString());
    
    const totalOptions = await poll.totalOptionsCount();
    console.log("✅ totalOptionsCount:", totalOptions.toString());
    
    const votingResults = await poll.getVotingResults();
    console.log("✅ getVotingResults():", votingResults);
    
    const hasVoted0 = await poll.hasVoted(deployer.address);
    console.log("✅ hasVoted():", hasVoted0);
    
    const voterOption0 = await poll.voterChoice(deployer.address);
    console.log("✅ voterChoice():", voterOption0.toString());
    
    const winnersCalculated = await poll.winnersCalculated();
    console.log("✅ winnersCalculated:", winnersCalculated);
    
    const claimedCreator = await poll.creatorClaimed();
    console.log("✅ creatorClaimed:", claimedCreator);
    
    const claimedFee = await poll.feeClaimed();
    console.log("✅ feeClaimed:", claimedFee);
    
    const claimedRefund0 = await poll.hasClaimedRefund(deployer.address);
    console.log("✅ hasClaimedRefund():", claimedRefund0);
    
    // Wait for poll to start
    console.log("\n⏳ Waiting for poll to start...");
    const waitTime = Math.max(0, startTime * 1000 - Date.now() + 1000);
    if (waitTime > 0) {
      console.log(`Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Test 3: Vote with multiple wallets
    console.log("\n🗳️ Test 3: Testing Voting");
    
    // Deployer votes for option 1
    const approveTx0 = await usdc.approve(pollAddress, parseUnits("1", 6));
    await approveTx0.wait();
    console.log("✅ Deployer approved USDC");
    
    const voteTx0 = await poll.vote(1);
    await voteTx0.wait();
    console.log("✅ Deployer voted for option 1");
    
    // Voter1 votes for option 2
    const usdcVoter1 = usdc.connect(voter1);
    const pollVoter1 = poll.connect(voter1);
    const approveTx1 = await usdcVoter1.approve(pollAddress, parseUnits("1", 6));
    await approveTx1.wait();
    const voteTx1 = await pollVoter1.vote(2);
    await voteTx1.wait();
    console.log("✅ Voter1 voted for option 2");
    
    // Voter2 votes for option 2
    const usdcVoter2 = usdc.connect(voter2);
    const pollVoter2 = poll.connect(voter2);
    const approveTx2 = await usdcVoter2.approve(pollAddress, parseUnits("1", 6));
    await approveTx2.wait();
    const voteTx2 = await pollVoter2.vote(2);
    await voteTx2.wait();
    console.log("✅ Voter2 voted for option 2");
    
    // Voter3 votes for option 3
    const usdcVoter3 = usdc.connect(voter3);
    const pollVoter3 = poll.connect(voter3);
    const approveTx3 = await usdcVoter3.approve(pollAddress, parseUnits("1", 6));
    await approveTx3.wait();
    const voteTx3 = await pollVoter3.vote(3);
    await voteTx3.wait();
    console.log("✅ Voter3 voted for option 3");
    
    // Test 4: Test cancelVote
    console.log("\n🔄 Test 4: Testing Cancel Vote");
    const cancelTx = await pollVoter3.cancelVote();
    await cancelTx.wait();
    console.log("✅ Voter3 cancelled vote");
    
    // Re-vote with voter3 for option 4
    const reApproveTx = await usdcVoter3.approve(pollAddress, parseUnits("1", 6));
    await reApproveTx.wait();
    const reVoteTx = await pollVoter3.vote(4);
    await reVoteTx.wait();
    console.log("✅ Voter3 re-voted for option 4");
    
    // Check updated voting results
    const updatedResults = await poll.getVotingResults();
    console.log("\n📊 Current Voting Results:");
    console.log("Option 1:", formatUnits(updatedResults[1][0], 6), "USDC");
    console.log("Option 2:", formatUnits(updatedResults[1][1], 6), "USDC");
    console.log("Option 3:", formatUnits(updatedResults[1][2], 6), "USDC");
    console.log("Option 4:", formatUnits(updatedResults[1][3], 6), "USDC");
    
    // Test 5: Test rescueFunds (admin only)
    console.log("\n🚨 Test 5: Testing Rescue Funds");
    const admin = await pollFactory.admin();
    console.log("Admin address:", admin);
    console.log("Current wallet:", deployer.address);
    
    if (deployer.address.toLowerCase() === admin.toLowerCase()) {
      // Get poll balance before rescue
      const pollBalance = await usdc.balanceOf(pollAddress);
      console.log("Poll balance before rescue:", formatUnits(pollBalance, 6), "USDC");
      
      // Rescue 1 USDC
      const rescueAmount = parseUnits("1", 6);
      const rescueTx = await poll.rescueFunds(rescueAmount);
      await rescueTx.wait();
      console.log("✅ Rescued 1 USDC from poll");
      
      // Check poll balance after rescue
      const pollBalanceAfter = await usdc.balanceOf(pollAddress);
      console.log("Poll balance after rescue:", formatUnits(pollBalanceAfter, 6), "USDC");
    } else {
      console.log("⚠️  Skipping rescue test - current wallet is not admin");
    }
    
    // Wait for poll to end
    console.log("\n⏳ Waiting for poll to end...");
    const endWaitTime = Math.max(0, endTime * 1000 - Date.now() + 1000);
    if (endWaitTime > 0) {
      console.log(`Waiting ${Math.ceil(endWaitTime / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, endWaitTime));
    }
    
    // Test 6: Calculate winners
    console.log("\n🏆 Test 6: Testing Calculate Winners");
    const calculateTx = await poll.calculateWinners();
    await calculateTx.wait();
    console.log("✅ Winners calculated");
    
    // Get winning options
    const winningOptions = await poll.getWinningOptions();
    console.log("Winning options:", winningOptions.map(o => o.toString()));
    
    // Test 7: Test isWinningOption helper
    console.log("\n❓ Test 7: Testing isWinningOption Helper");
    for (let i = 1; i <= 4; i++) {
      const isWinner = await poll.isWinningOption(i);
      console.log(`Option ${i} is winning:`, isWinner);
    }
    
    // Test 8: Claim winning funds (creator)
    console.log("\n💰 Test 8: Testing Claim Winning Funds");
    const claimCreatorTx = await poll.claimWinningFunds();
    await claimCreatorTx.wait();
    console.log("✅ Creator claimed winning funds");
    
    // Test 9: Claim fee (fee wallet)
    console.log("\n💸 Test 9: Testing Claim Fee");
    const feeWallet = await pollFactory.feeWallet();
    console.log("Fee wallet:", feeWallet);
    
    // Find which wallet is the fee wallet
    let feeWalletSigner = null;
    for (const wallet of wallets) {
      if (wallet.address.toLowerCase() === feeWallet.toLowerCase()) {
        feeWalletSigner = wallet;
        break;
      }
    }
    
    if (feeWalletSigner) {
      const pollFeeWallet = poll.connect(feeWalletSigner);
      const claimFeeTx = await pollFeeWallet.claimFee();
      await claimFeeTx.wait();
      console.log("✅ Fee wallet claimed fee");
    } else {
      console.log("⚠️  Fee wallet not in test wallets, skipping fee claim");
    }
    
    // Test 10: Claim non-winning refunds
    console.log("\n💵 Test 10: Testing Claim Non-Winning Refunds");
    
    // Check which voters can claim refunds
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const hasVoted = await poll.hasVoted(wallet.address);
      
      if (hasVoted) {
        const votedOption = await poll.voterChoice(wallet.address);
        const isWinner = await poll.isWinningOption(votedOption);
        const hasClaimed = await poll.hasClaimedRefund(wallet.address);
        
        console.log(`\nWallet ${i} (${wallet.address.slice(0, 8)}...):`);
        console.log("- Voted for option:", votedOption.toString());
        console.log("- Is winning option:", isWinner);
        console.log("- Has claimed refund:", hasClaimed);
        
        if (!isWinner && !hasClaimed) {
          try {
            const pollWallet = poll.connect(wallet);
            const claimTx = await pollWallet.claimNonWinningRefund();
            await claimTx.wait();
            console.log("✅ Claimed non-winning refund");
          } catch (error) {
            console.log("❌ Failed to claim refund:", error.message);
          }
        }
      }
    }
    
    // Test 11: Test edge cases with new poll
    console.log("\n🔬 Test 11: Testing Edge Cases");
    
    // Deploy poll with 0% fee
    console.log("\nTesting 0% fee:");
    const currentFee = await pollFactory.feePercentage();
    console.log("Current fee:", currentFee.toString(), "/ 10000");
    
    if (deployer.address.toLowerCase() === admin.toLowerCase()) {
      // Set fee to 0%
      const setFee0Tx = await pollFactory.setFeePercentage(0);
      await setFee0Tx.wait();
      console.log("✅ Set fee to 0%");
      
      // Deploy poll with 0% fee
      const zeroFeePollTx = await pollFactory.deployPoll(
        Math.floor(Date.now() / 1000) + 60,
        Math.floor(Date.now() / 1000) + 180,
        parseUnits("1", 6),
        1,
        2,
        USDC_ADDRESS
      );
      const zeroFeeReceipt = await zeroFeePollTx.wait();
      console.log("✅ Deployed poll with 0% fee");
      
      // Set fee to 10% (max)
      const setFee10Tx = await pollFactory.setFeePercentage(1000); // 10%
      await setFee10Tx.wait();
      console.log("✅ Set fee to 10% (maximum)");
      
      // Deploy poll with 10% fee
      const maxFeePollTx = await pollFactory.deployPoll(
        Math.floor(Date.now() / 1000) + 60,
        Math.floor(Date.now() / 1000) + 180,
        parseUnits("1", 6),
        1,
        2,
        USDC_ADDRESS
      );
      const maxFeeReceipt = await maxFeePollTx.wait();
      console.log("✅ Deployed poll with 10% fee");
      
      // Restore original fee
      const restoreFeeTx = await pollFactory.setFeePercentage(currentFee);
      await restoreFeeTx.wait();
      console.log("✅ Restored original fee");
    } else {
      console.log("⚠️  Skipping fee edge case tests - not admin");
    }
    
    // Final USDC balances
    console.log("\n💰 Final USDC Balances:");
    for (let i = 0; i < wallets.length; i++) {
      const balance = await usdc.balanceOf(wallets[i].address);
      console.log(`Wallet ${i}: ${wallets[i].address} - ${formatUnits(balance, 6)} USDC`);
    }
    
    console.log("\n✅ All contract method tests completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.error("Error details:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });