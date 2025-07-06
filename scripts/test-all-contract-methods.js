const { ethers } = require("ethers");

// Private keys
const privateKeys = [
  "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766", // Main deployer
  "8f281b5c8358a53aa016a40eebec7ad62eda86a50a7523f0e1cb21d05ec6d0cc", // Voter 1
  "d186bc8c337f78c3ec9e357e44a05d69851f9490d8460e283695bc6d1651a7c1", // Voter 2
  "3fe69de7f7e48b78a2e8ffe44fce37cfbf90a414f522c0652614816d67d4b42d"  // Voter 3
];

// ABIs
const pollFactoryABI = require("../contracts/abi/PollFactory.json");
const pollABI = require("../contracts/abi/Poll.json");
const erc20ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// Contract addresses on Base Sepolia
const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Provider
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");

// Create wallets
const wallets = privateKeys.map(pk => new ethers.Wallet(pk, provider));

async function main() {
  console.log("🔧 Starting Comprehensive Contract Method Testing...\n");
  
  // Get current chain ID
  const chainId = (await provider.getNetwork()).chainId;
  console.log("Chain ID:", chainId);
  console.log("RPC URL:", provider._request.url);
  
  // Initialize contracts
  const pollFactory = new ethers.Contract(POLL_FACTORY_ADDRESS, pollFactoryABI, wallets[0]);
  const usdc = new ethers.Contract(USDC_ADDRESS, erc20ABI, wallets[0]);
  
  // Check USDC balances
  console.log("\n💰 Checking USDC Balances:");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await usdc.balanceOf(wallets[i].address);
    console.log(`Wallet ${i}: ${wallets[i].address} - ${ethers.formatUnits(balance, 6)} USDC`);
  }
  
  try {
    // Test 1: Deploy a poll for testing
    console.log("\n📊 Test 1: Deploying Test Poll");
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 60; // Start in 1 minute
    const endTime = now + 300; // End in 5 minutes
    
    const tx = await pollFactory.deployPoll(
      USDC_ADDRESS,
      startTime,
      endTime,
      ethers.parseUnits("1", 6), // 1 USDC per vote
      2, // 2 winning options
      4  // 4 total options
    );
    
    console.log("Deploy TX:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Poll deployed successfully");
    
    // Extract poll address from events
    const deployEvent = receipt.logs.find(log => {
      try {
        return pollFactory.interface.parseLog(log).name === "PollCreated";
      } catch {
        return false;
      }
    });
    
    if (!deployEvent) {
      throw new Error("PollCreated event not found");
    }
    
    const parsedEvent = pollFactory.interface.parseLog(deployEvent);
    const pollAddress = parsedEvent.args.poll || parsedEvent.args[0];
    console.log("Poll Address:", pollAddress);
    
    // Initialize poll contract
    const poll = new ethers.Contract(pollAddress, pollABI, wallets[0]);
    
    // Test 2: Test all read methods
    console.log("\n📖 Test 2: Testing All Read Methods");
    
    const creator = await poll.creator();
    console.log("✅ creator():", creator);
    
    const pollStartTime = await poll.startTime();
    console.log("✅ startTime():", new Date(Number(pollStartTime) * 1000).toLocaleString());
    
    const pollEndTime = await poll.endTime();
    console.log("✅ endTime():", new Date(Number(pollEndTime) * 1000).toLocaleString());
    
    const votingToken = await poll.votingToken();
    console.log("✅ votingToken():", votingToken);
    
    const tokensPerVote = await poll.tokensPerVote();
    console.log("✅ tokensPerVote():", ethers.formatUnits(tokensPerVote, 6), "USDC");
    
    const numWinningOptions = await poll.numWinningOptions();
    console.log("✅ numWinningOptions():", numWinningOptions.toString());
    
    const totalOptions = await poll.totalOptions();
    console.log("✅ totalOptions():", totalOptions.toString());
    
    const votingResults = await poll.getVotingResults();
    console.log("✅ getVotingResults():", votingResults);
    
    const hasVoted0 = await poll.hasVoted(wallets[0].address);
    console.log("✅ hasVoted():", hasVoted0);
    
    const voterOption0 = await poll.voterOption(wallets[0].address);
    console.log("✅ voterOption():", voterOption0.toString());
    
    const winnersCalculated = await poll.winnersCalculated();
    console.log("✅ winnersCalculated():", winnersCalculated);
    
    const claimedCreator = await poll.claimedCreator();
    console.log("✅ claimedCreator():", claimedCreator);
    
    const claimedFee = await poll.claimedFee();
    console.log("✅ claimedFee():", claimedFee);
    
    const claimedRefund0 = await poll.claimedRefund(wallets[0].address);
    console.log("✅ claimedRefund():", claimedRefund0);
    
    // Wait for poll to start
    console.log("\n⏳ Waiting for poll to start...");
    const waitTime = Math.max(0, startTime * 1000 - Date.now() + 1000);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Test 3: Vote with multiple wallets
    console.log("\n🗳️ Test 3: Testing Voting");
    
    // Wallet 0 votes for option 1
    const usdcWallet0 = usdc.connect(wallets[0]);
    const approveTx0 = await usdcWallet0.approve(pollAddress, ethers.parseUnits("1", 6));
    await approveTx0.wait();
    console.log("✅ Wallet 0 approved USDC");
    
    const pollWallet0 = poll.connect(wallets[0]);
    const voteTx0 = await pollWallet0.vote(1);
    await voteTx0.wait();
    console.log("✅ Wallet 0 voted for option 1");
    
    // Wallet 1 votes for option 2
    const usdcWallet1 = usdc.connect(wallets[1]);
    const approveTx1 = await usdcWallet1.approve(pollAddress, ethers.parseUnits("1", 6));
    await approveTx1.wait();
    
    const pollWallet1 = poll.connect(wallets[1]);
    const voteTx1 = await pollWallet1.vote(2);
    await voteTx1.wait();
    console.log("✅ Wallet 1 voted for option 2");
    
    // Wallet 2 votes for option 2
    const usdcWallet2 = usdc.connect(wallets[2]);
    const approveTx2 = await usdcWallet2.approve(pollAddress, ethers.parseUnits("1", 6));
    await approveTx2.wait();
    
    const pollWallet2 = poll.connect(wallets[2]);
    const voteTx2 = await pollWallet2.vote(2);
    await voteTx2.wait();
    console.log("✅ Wallet 2 voted for option 2");
    
    // Wallet 3 votes for option 3
    const usdcWallet3 = usdc.connect(wallets[3]);
    const approveTx3 = await usdcWallet3.approve(pollAddress, ethers.parseUnits("1", 6));
    await approveTx3.wait();
    
    const pollWallet3 = poll.connect(wallets[3]);
    const voteTx3 = await pollWallet3.vote(3);
    await voteTx3.wait();
    console.log("✅ Wallet 3 voted for option 3");
    
    // Test 4: Test cancelVote
    console.log("\n🔄 Test 4: Testing Cancel Vote");
    const cancelTx = await pollWallet3.cancelVote();
    await cancelTx.wait();
    console.log("✅ Wallet 3 cancelled vote");
    
    // Re-vote with wallet 3 for option 4
    const reApproveTx = await usdcWallet3.approve(pollAddress, ethers.parseUnits("1", 6));
    await reApproveTx.wait();
    const reVoteTx = await pollWallet3.vote(4);
    await reVoteTx.wait();
    console.log("✅ Wallet 3 re-voted for option 4");
    
    // Check updated voting results
    const updatedResults = await poll.getVotingResults();
    console.log("\n📊 Current Voting Results:");
    console.log("Option 1:", ethers.formatUnits(updatedResults[1][0], 6), "USDC");
    console.log("Option 2:", ethers.formatUnits(updatedResults[1][1], 6), "USDC");
    console.log("Option 3:", ethers.formatUnits(updatedResults[1][2], 6), "USDC");
    console.log("Option 4:", ethers.formatUnits(updatedResults[1][3], 6), "USDC");
    
    // Test 5: Test rescueFunds (admin only)
    console.log("\n🚨 Test 5: Testing Rescue Funds");
    const admin = await pollFactory.admin();
    console.log("Admin address:", admin);
    console.log("Current wallet:", wallets[0].address);
    
    if (wallets[0].address.toLowerCase() === admin.toLowerCase()) {
      // Get poll balance before rescue
      const pollBalance = await usdc.balanceOf(pollAddress);
      console.log("Poll balance before rescue:", ethers.formatUnits(pollBalance, 6), "USDC");
      
      // Rescue 1 USDC
      const rescueAmount = ethers.parseUnits("1", 6);
      const rescueTx = await pollWallet0.rescueFunds(rescueAmount);
      await rescueTx.wait();
      console.log("✅ Rescued 1 USDC from poll");
      
      // Check poll balance after rescue
      const pollBalanceAfter = await usdc.balanceOf(pollAddress);
      console.log("Poll balance after rescue:", ethers.formatUnits(pollBalanceAfter, 6), "USDC");
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
    const claimCreatorTx = await pollWallet0.claimWinningFunds();
    await claimCreatorTx.wait();
    console.log("✅ Creator claimed winning funds");
    
    // Test 9: Claim fee (fee wallet)
    console.log("\n💸 Test 9: Testing Claim Fee");
    const feeWallet = await pollFactory.feeWallet();
    console.log("Fee wallet:", feeWallet);
    
    // Find which wallet is the fee wallet
    let feeWalletIndex = -1;
    for (let i = 0; i < wallets.length; i++) {
      if (wallets[i].address.toLowerCase() === feeWallet.toLowerCase()) {
        feeWalletIndex = i;
        break;
      }
    }
    
    if (feeWalletIndex >= 0) {
      const pollFeeWallet = poll.connect(wallets[feeWalletIndex]);
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
      const hasVoted = await poll.hasVoted(wallets[i].address);
      if (hasVoted) {
        const votedOption = await poll.voterOption(wallets[i].address);
        const isWinner = await poll.isWinningOption(votedOption);
        const hasClaimed = await poll.claimedRefund(wallets[i].address);
        
        console.log(`\nWallet ${i}:`);
        console.log("- Voted for option:", votedOption.toString());
        console.log("- Is winning option:", isWinner);
        console.log("- Has claimed refund:", hasClaimed);
        
        if (!isWinner && !hasClaimed) {
          try {
            const pollWallet = poll.connect(wallets[i]);
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
    
    if (wallets[0].address.toLowerCase() === admin.toLowerCase()) {
      // Set fee to 0%
      const setFeeTx = await pollFactory.setFeePercentage(0);
      await setFeeTx.wait();
      console.log("✅ Set fee to 0%");
      
      // Deploy poll with 0% fee
      const zeroFeePollTx = await pollFactory.deployPoll(
        USDC_ADDRESS,
        Math.floor(Date.now() / 1000) + 60,
        Math.floor(Date.now() / 1000) + 180,
        ethers.parseUnits("1", 6),
        1,
        2
      );
      const zeroFeeReceipt = await zeroFeePollTx.wait();
      console.log("✅ Deployed poll with 0% fee");
      
      // Set fee to 10% (max)
      const maxFeeTx = await pollFactory.setFeePercentage(1000); // 10%
      await maxFeeTx.wait();
      console.log("✅ Set fee to 10% (maximum)");
      
      // Deploy poll with 10% fee
      const maxFeePollTx = await pollFactory.deployPoll(
        USDC_ADDRESS,
        Math.floor(Date.now() / 1000) + 60,
        Math.floor(Date.now() / 1000) + 180,
        ethers.parseUnits("1", 6),
        1,
        2
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
      console.log(`Wallet ${i}: ${wallets[i].address} - ${ethers.formatUnits(balance, 6)} USDC`);
    }
    
    console.log("\n✅ All contract method tests completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.error("Error details:", error.message);
  }
}

main().catch(console.error);